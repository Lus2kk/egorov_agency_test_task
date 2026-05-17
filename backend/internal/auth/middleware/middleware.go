package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
)


func CORSMiddleware(allowedOrigin string) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		ctx.Header("Access-Control-Allow-Origin", "*")
		ctx.Header("Access-Control-Allow-Methods", "GET, OPTIONS")
		ctx.Header("Access-Control-Allow-Headers", "Content-Type")

		if ctx.Request.Method == "OPTIONS" {
			ctx.AbortWithStatus(http.StatusNoContent)
			return
		}
		ctx.Next()
	}
}