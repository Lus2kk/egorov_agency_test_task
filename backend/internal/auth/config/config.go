package config

import (
	"log/slog"
	"os"
	"github.com/ilyakaznacheev/cleanenv"
)

type Config struct {
	ServerAddress     string `env:"SERVER_ADDRESS"`
    ClientID          string `env:"GOOGLE_CLIENT_ID" `
    ClientSecret      string `env:"GOOGLE_CLIENT_SECRET" `
    GoogleRedirectURL string `env:"GOOGLE_REDIRECT_URL"`
    FrontendURL       string `env:"FRONTEND_URL"`
    GoogleUserInfoURL string `env:"GOOGLE_USER_INFO_URL"`
}


func MustLoad() *Config {
	var cfg Config
    
    if _, err := os.Stat(".env"); err == nil {
        err = cleanenv.ReadConfig(".env", &cfg)
        if err != nil {
            slog.Error("Failed to read config", "error", err)
			os.Exit(1)
        }
    } else {
        err = cleanenv.ReadEnv(&cfg)
        if err != nil {
            slog.Error("Failed to read environment variables", "error", err)
			os.Exit(1)
        }
    }
    return &cfg
}

