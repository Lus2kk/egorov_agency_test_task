package handler

import (
	"egorov_agency_test_task/backend/internal/auth/config"
	"egorov_agency_test_task/backend/internal/auth/service"
	"net/http"
	"net/url"

	"github.com/gin-gonic/gin"
)

const oauthCookieMaxAge = 300

type AuthHandler struct {
	service *service.AuthService
	cfg     *config.Config
}

func NewAuthHandler(service *service.AuthService, cfg *config.Config) *AuthHandler {
	return &AuthHandler{
		service: service,
		cfg:     cfg,
	}
}

func (h *AuthHandler) GoogleLogin(ctx *gin.Context) {
	redirect := ctx.Query("redirect")
	authURL, state, err := h.service.GetAuthURL()
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate url"})
		return
	}
	ctx.SetCookie("oauth_state", state, oauthCookieMaxAge, "/", "", false, true)
	ctx.SetCookie("oauth_redirect", redirect, oauthCookieMaxAge, "/", "", false, true)
	ctx.Redirect(http.StatusTemporaryRedirect, authURL)
}

func (h *AuthHandler) GoogleCallback(ctx *gin.Context) {
	cookieState, err := ctx.Cookie("oauth_state")
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "state cookie not found"})
		return
	}

	queryState := ctx.Query("state")
	if cookieState != queryState {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid state"})
		return
	}

	code := ctx.Query("code")
	if code == "" {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "code not found"})
		return
	}

	user, err := h.service.ExchangeCodeToUser(ctx.Request.Context(), code)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "failed to exchange code"})
		return
	}

	redirectTarget := h.cfg.FrontendURL
	if cookieRedirect, err := ctx.Cookie("oauth_redirect"); err == nil && cookieRedirect != "" {
		redirectTarget = cookieRedirect
	}
	ctx.SetCookie("oauth_state", "", -1, "/", "", false, true)
	ctx.SetCookie("oauth_redirect", "", -1, "/", "", false, true)

	parsed, err := url.Parse(redirectTarget)
	if err != nil || parsed.Scheme == "" || parsed.Host == "" {
		parsed, err = url.Parse(h.cfg.FrontendURL)
		if err != nil {
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "invalid redirect target"})
			return
		}
	}
	parsed.Fragment = ""

	q := parsed.Query()
	q.Set("name", user.Name)
	q.Set("email", user.Email)
	q.Set("picture", user.Picture)
	parsed.RawQuery = q.Encode()

	ctx.Redirect(http.StatusFound, parsed.String())
}