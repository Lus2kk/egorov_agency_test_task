package service

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"egorov_agency_test_task/backend/internal/auth/config"
)

type PriceData struct {
	Symbol    string  `json:"symbol"`
	Price     float64 `json:"price"`
	Change24h float64 `json:"change_24h"`
}

type Subscription struct {
	StreamID  string `json:"stream_id"`
	Exchange  string `json:"exchange"`
	FromSym   string `json:"from_symbol"`
	ToSym     string `json:"to_symbol"`
	StreamType string `json:"stream_type"`
}

type SubscriptionsResponse struct {
	Response string         `json:"Response"`
	Data     []Subscription `json:"Data"`
}

type CryptoService struct {
	cfg        *config.Config
	httpClient *http.Client
}

func NewCryptoService(cfg *config.Config) *CryptoService {
	return &CryptoService{
		cfg: cfg,
		httpClient: &http.Client{
			Timeout: 15 * time.Second,
		},
	}
}

func (s *CryptoService) GetPrices(symbols []string) (map[string]PriceData, error) {
	fsyms := strings.Join(symbols, ",")
	url := fmt.Sprintf("%s/data/pricemultifull?fsyms=%s&tsyms=USD", s.cfg.CoinDeskMinAPIURL, fsyms)

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	if s.cfg.CoinDeskAPIKey != "" {
		req.Header.Set("Authorization", "ApiKey "+s.cfg.CoinDeskAPIKey)
	}

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch prices: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("prices API returned status %d: %s", resp.StatusCode, string(body))
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %w", err)
	}

	var result map[string]interface{}
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("failed to parse prices response: %w", err)
	}

	prices := make(map[string]PriceData)

	raw, ok := result["RAW"].(map[string]interface{})
	if !ok {
		return nil, fmt.Errorf("unexpected prices response format")
	}

	for _, sym := range symbols {
		symData, exists := raw[sym]
		if !exists {
			continue
		}
		usdData, ok := symData.(map[string]interface{})["USD"].(map[string]interface{})
		if !ok {
			continue
		}
		price, _ := usdData["PRICE"].(float64)
		change, _ := usdData["CHANGEPCT24HOUR"].(float64)
		prices[sym] = PriceData{
			Symbol:    sym,
			Price:     price,
			Change24h: change,
		}
	}

	return prices, nil
}

func (s *CryptoService) GetSubscriptions() ([]Subscription, error) {
	if s.cfg.CoinDeskAPIKey == "" {
		return nil, fmt.Errorf("CoinDesk API key is required for Data Streamer")
	}

	url := fmt.Sprintf("%s/api/v3/subscriptions/list", s.cfg.CoinDeskDataAPIURL)

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}
	req.Header.Set("Authorization", "ApiKey "+s.cfg.CoinDeskAPIKey)

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch subscriptions: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("subscriptions API returned status %d: %s", resp.StatusCode, string(body))
	}

	var subResp SubscriptionsResponse
	if err := json.Unmarshal(body, &subResp); err != nil {
		return nil, fmt.Errorf("failed to parse subscriptions response: %w", err)
	}

	return subResp.Data, nil
}

func (s *CryptoService) DeleteSubscription(streamID string) error {
	if s.cfg.CoinDeskAPIKey == "" {
		return fmt.Errorf("CoinDesk API key is required for Data Streamer")
	}

	url := fmt.Sprintf("%s/api/v3/subscriptions/delete?stream_id=%s", s.cfg.CoinDeskDataAPIURL, streamID)

	req, err := http.NewRequest("DELETE", url, nil)
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}
	req.Header.Set("Authorization", "ApiKey "+s.cfg.CoinDeskAPIKey)

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to delete subscription: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("delete subscription API returned status %d: %s", resp.StatusCode, string(body))
	}

	return nil
}