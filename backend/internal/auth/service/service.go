package service

import (
	"context"
	"egorov_agency_test_task/backend/internal/auth/config"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
	"io"
	"crypto/rand"
)

const (
	scopeEmail   = "https://www.googleapis.com/auth/userinfo.email"
	scopeProfile = "https://www.googleapis.com/auth/userinfo.profile"
	userInfoURL  = "https://www.googleapis.com/oauth2/v2/userinfo"
)

type User struct {
	Email   string `json:"email"`
	Picture string `json:"picture"`
	Name    string `json:"name"`
}

func generateState() (string, error) {
	stateBytes := make([]byte, 32)
	if _, err := rand.Read(stateBytes); err != nil {
		return "", fmt.Errorf("Error of generate state: %w", err)
	}
	return base64.URLEncoding.EncodeToString(stateBytes), nil
}

type AuthService struct {
	oauthConfig *oauth2.Config
}

func NewAuthService(cfg *config.Config) *AuthService {
	oauthcfg := &oauth2.Config{
		ClientID:     cfg.ClientID,
		ClientSecret: cfg.ClientSecret,
		RedirectURL:  cfg.GoogleRedirectURL,
		Scopes: []string{
			scopeEmail,
			scopeProfile,
		},
		Endpoint: google.Endpoint,
	}
	return &AuthService{oauthConfig: oauthcfg}
}

func (srvc *AuthService) GetAuthURL() (string, string, error) {
	state, err := generateState()
	if err != nil {
		return "","", fmt.Errorf("failed to get auth url: %w", err)
	}
	return srvc.oauthConfig.AuthCodeURL(state, oauth2.AccessTypeOnline), state, nil 
}

func (srvc *AuthService) ExchangeCodeToUser(ctx context.Context, code string) (*User, error) {
	token, err := srvc.oauthConfig.Exchange(ctx, code)
	if err != nil {
		return nil, fmt.Errorf("Problems with exchanging code %w", err)
	}
	client := srvc.oauthConfig.Client(ctx, token)
	rq, err := client.Get(userInfoURL)
	if err != nil {
		return nil, fmt.Errorf("Problems with reading responce %w", err)
	}
	defer rq.Body.Close()
	var user User
	response, err := io.ReadAll(rq.Body)
	if err != nil {
		return nil, fmt.Errorf("Problec with reading responce body %w ", err)
	}
	err = json.Unmarshal(response, &user)
	if err != nil {
		return nil, fmt.Errorf("Problem with unmarshal responce %w", err)
	}
	return &user, nil
}
