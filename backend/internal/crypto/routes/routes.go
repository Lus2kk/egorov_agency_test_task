package routes

import (
	"egorov_agency_test_task/backend/internal/crypto/handler"
	"github.com/gin-gonic/gin"
)

func CryptoRoutes(r *gin.Engine, cryptoHandler *handler.CryptoHandler) {
	crypto := r.Group("/crypto")
	{
		crypto.GET("/prices", cryptoHandler.GetPrices)
		crypto.GET("/subscriptions", cryptoHandler.GetSubscriptions)
		crypto.DELETE("/subscriptions/:id", cryptoHandler.DeleteSubscription)
		crypto.GET("/ws", cryptoHandler.HandleWebSocket)
	}
}