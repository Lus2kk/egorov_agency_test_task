package routes

import (
	"egorov_agency_test_task/backend/internal/auth/handler"
	"github.com/gin-gonic/gin"
	
)


func AuthRoutes(r *gin.Engine, authHandler *handler.AuthHandler) {
	auth := r.Group("/auth")
	{
		auth.GET("/google", authHandler.GoogleLogin)
		auth.GET("/callback", authHandler.GoogleCallback)
	}
}