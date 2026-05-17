package handler

import (
	"egorov_agency_test_task/backend/internal/auth/config"
	"egorov_agency_test_task/backend/internal/auth/service"
	"fmt"
	"net/http"
	"net/url"

	"github.com/gin-gonic/gin"
)


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

func (h *AuthHandler) GoogleLogin (ctx *gin.Context) {
	url, state, err := h.service.GetAuthURL()
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error" : "failed to generate url",})
		return
	}
	 ctx.SetCookie("oauth_state", state, 300, "/", "", false, true)
	 ctx.Redirect(http.StatusTemporaryRedirect, url)

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

	redirectquery := fmt.Sprintf("%s?name=%s&email=%s&picture=%s",
    h.cfg.FrontendURL,
    url.QueryEscape(user.Name),
    url.QueryEscape(user.Email),
    url.QueryEscape(user.Picture),
)
	ctx.Redirect(http.StatusPermanentRedirect, redirectquery)
}