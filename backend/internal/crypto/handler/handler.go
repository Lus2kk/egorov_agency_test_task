package handler

import (
	"encoding/json"
	"egorov_agency_test_task/backend/internal/auth/config"
	"egorov_agency_test_task/backend/internal/crypto/service"
	"log/slog"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

var defaultSymbols = []string{"BTC", "ETH", "SOL", "XRP", "USDC", "BNB", "DOGE", "SUI", "USDT", "MIDNIGHT"}

type CryptoHandler struct {
	service *service.CryptoService
	cfg     *config.Config
}

func NewCryptoHandler(svc *service.CryptoService, cfg *config.Config) *CryptoHandler {
	return &CryptoHandler{
		service: svc,
		cfg:     cfg,
	}
}

func (h *CryptoHandler) GetPrices(ctx *gin.Context) {
	symbolsParam := ctx.DefaultQuery("symbols", strings.Join(defaultSymbols, ","))
	symbols := parseSymbols(symbolsParam)

	prices, err := h.service.GetPrices(symbols)
	if err != nil {
		slog.Error("failed to get prices", "error", err)
		ctx.JSON(http.StatusBadGateway, gin.H{"error": "failed to fetch prices", "details": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"data": prices,
	})
}

func (h *CryptoHandler) GetSubscriptions(ctx *gin.Context) {
	subs, err := h.service.GetSubscriptions()
	if err != nil {
		slog.Error("failed to get subscriptions", "error", err)
		ctx.JSON(http.StatusBadGateway, gin.H{"error": "failed to fetch subscriptions", "details": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"data": subs,
	})
}

func (h *CryptoHandler) DeleteSubscription(ctx *gin.Context) {
	streamID := ctx.Param("id")
	if streamID == "" {
		streamID = ctx.Query("stream_id")
	}
	if streamID == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "stream_id is required"})
		return
	}

	if err := h.service.DeleteSubscription(streamID); err != nil {
		slog.Error("failed to delete subscription", "error", err, "stream_id", streamID)
		ctx.JSON(http.StatusBadGateway, gin.H{"error": "failed to delete subscription", "details": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message":   "subscription deleted",
		"stream_id": streamID,
	})
}

func (h *CryptoHandler) HandleWebSocket(ctx *gin.Context) {
	conn, err := upgrader.Upgrade(ctx.Writer, ctx.Request, nil)
	if err != nil {
		slog.Error("websocket upgrade failed", "error", err)
		return
	}
	defer conn.Close()

	slog.Info("websocket client connected", "remote_addr", conn.RemoteAddr().String())

	symbolsParam := ctx.DefaultQuery("symbols", strings.Join(defaultSymbols, ","))
	symbols := parseSymbols(symbolsParam)

	defer func() {
		slog.Info("websocket client disconnected", "remote_addr", conn.RemoteAddr().String())
	}()

	prices, err := h.service.GetPrices(symbols)
	if err == nil {
		msg, _ := json.Marshal(gin.H{"type": "prices", "data": prices})
		conn.WriteMessage(websocket.TextMessage, msg)
	}

	ticker := time.NewTicker(3 * time.Second)
	defer ticker.Stop()

	done := make(chan struct{})

	go func() {
		defer close(done)
		for {
			_, _, err := conn.ReadMessage()
			if err != nil {
				return
			}
		}
	}()

	for {
		select {
		case <-done:
			return
		case <-ticker.C:
			prices, err := h.service.GetPrices(symbols)
			if err != nil {
				slog.Error("websocket price fetch failed", "error", err)
				continue
			}
			msg, err := json.Marshal(gin.H{"type": "prices", "data": prices})
			if err != nil {
				continue
			}
			if err := conn.WriteMessage(websocket.TextMessage, msg); err != nil {
				return
			}
		}
	}
}

func parseSymbols(symbolsParam string) []string {
	parts := strings.Split(symbolsParam, ",")
	symbols := make([]string, 0, len(parts))
	for _, s := range parts {
		s = strings.TrimSpace(s)
		if s != "" {
			symbols = append(symbols, s)
		}
	}
	if len(symbols) == 0 {
		return defaultSymbols
	}
	return symbols
}