package main

import (
	"egorov_agency_test_task/backend/internal/auth/config"
	"egorov_agency_test_task/backend/internal/auth/handler"
	"egorov_agency_test_task/backend/internal/auth/middleware"
	"egorov_agency_test_task/backend/internal/auth/routes"
	"egorov_agency_test_task/backend/internal/auth/service"
	"log/slog"

	"github.com/gin-gonic/gin"
)

func main() {
	cfg := config.MustLoad()
	slog.Info("The config was initialized")

	authService := service.NewAuthService(cfg)
	slog.Info("The auth service was initialized")

	authHandler := handler.NewAuthHandler(authService, cfg)
	slog.Info("The auth handler was initialized")

	router := gin.Default()
	router.Use(middleware.CORSMiddleware(cfg.FrontendURL))
	routes.AuthRoutes(router, authHandler)
	slog.Info("The router and middleware were initialized")
	slog.Info("Start server...")

	router.Run(cfg.ServerAddress)
}
