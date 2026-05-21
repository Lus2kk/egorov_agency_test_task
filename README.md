# KAIROS — Online Banking & Crypto Dashboard

Проект представляет из себя лендинг с авторизацией через Google OAuth и реалтайм-дашбордом криптовалют. Цены обновляются через Binance WebSocket API в реальном времени. Реализованы GET и DELETE ручки для работы с Binance API на фронтенде.

**Тестовый сервер:** [https://testtaskegorovagency.duckdns.org](https://testtaskegorovagency.duckdns.org)

---

## Стек

- **Backend:** Go 1.25, Gin
- **Frontend:** Vanilla JS, Vite, CSS
- **Инфраструктура:** Docker, Nginx
- **Крипто-API:** Binance REST API (`api.binance.com/api/v3`), Binance WebSocket (`stream.binance.com:9443`)

---

## Интеграция с Binance API

Фронтенд напрямую работает с двумя эндпоинтами Binance:

**REST API (GET):**
- `GET https://api.binance.com/api/v3/ticker/24hr` — получение списка всех криптовалют с ценами, объёмами и изменениями за 24 часа
- `GET https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT` — получение цены конкретной пары

**WebSocket (реалтайм):**
- `wss://stream.binance.com:9443/stream?streams=<symbol>@miniTicker` — подписка на мини-тикер для получения обновлений цен в реальном времени

**Управление подписками (DELETE):**
- Удаление подписки на символ — `CryptoService.DELETE(symbol)` — отписывается от WebSocket-стрима для указанной пары и пересоединяется без неё

**Файловая структура фронтенд-модуля:**
- `config.js` — конфигурация (URL-адреса Binance REST/WebSocket, CDN иконок)
- `service.js` — `CryptoService` — работа с Binance REST и WebSocket (GET, GET_PRICE, SUBSCRIBE, UNSUBSCRIBE, DELETE)
- `ui.js` — `CryptoUI` — модальное окно поиска/добавления монет, обновление цен на странице
- `main.js` — `CryptoMain` — инициализация модуля
- `crypto.js` — подписка на HTML-элементы с `data-crypto-symbol`, обновление цен

---

## API Endpoints (Backend)

| Метод | Endpoint | Описание |
|-------|----------|----------|
| GET | `/auth/google` | Авторизация через Google |
| GET | `/auth/callback` | Callback Google OAuth |

---

## Локальный запуск

### Требования

- Go 1.25+
- Node.js 22+
- npm

### Backend

```bash
cd backend
# Создай и заполни .env (см. раздел Переменные окружения)
go run ./cmd
```

Сервер запустится на `http://localhost:8060`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Фронтенд запустится на `http://localhost:5173`.

---

## Деплой через Docker

### Требования

- Сервер с Docker и Docker Compose
- Домен (рекомендуется [DuckDNS](https://www.duckdns.org/) — бесплатно)
- Google OAuth Client (https://console.cloud.google.com)

### Шаг 1 — Настрой Google OAuth

1. Зайди в [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials
2. Создай OAuth 2.0 Client ID (тип Web application)
3. В **Authorized redirect URIs** добавь: `http://<твой-домен>/auth/callback`
4. Скопируй Client ID и Client Secret

### Шаг 2 — Настрой сервер

```bash
# Установи Docker
curl -fsSL https://get.docker.com | sh

# Установи rsync (если нет)
apt install -y rsync
```

### Шаг 3 — Перенеси проект на сервер

На своём компе:

```bash
cd /путь/до/проекта
rsync -avz --exclude='.git' --exclude='node_modules' --exclude='.env' ./ root@<IP_СЕРВЕРА>:/opt/kairos/
```

### Шаг 4 — Настрой .env на сервере

На сервере:

```bash
ssh root@<IP_СЕРВЕРА>
cd /opt/kairos
cp .env.example .env
nano .env
```

Заполни `.env`:

```env
SERVER_ADDRESS=0.0.0.0:8060

GOOGLE_CLIENT_ID=<твой-client-id>
GOOGLE_CLIENT_SECRET=<твой-client-secret>
GOOGLE_REDIRECT_URL=http://<твой-домен>/auth/callback
GOOGLE_USER_INFO_URL=https://www.googleapis.com/oauth2/v2/userinfo

FRONTEND_URL=http://<твой-домен>/#
```

> **Важно:** `SERVER_ADDRESS` должен быть `0.0.0.0:8060`, не `localhost:8060`.

### Шаг 5 — Запусти

```bash
docker compose up -d --build
```

Приложение будет доступно на `http://<IP_СЕРВЕРА>:80`.

---

## Обновление на сервере

После изменений в коде:

```bash
# На своём компе
rsync -avz --exclude='.git' --exclude='node_modules' --exclude='.env' ./ root@<IP_СЕРВЕРА>:/opt/kairos/

# На сервере
cd /opt/kairos
docker compose down
docker compose up -d --build
```

---

## Переменные окружения

| Переменная | Описание | Пример |
|------------|----------|--------|
| `SERVER_ADDRESS` | Адрес backend сервера | `0.0.0.0:8060` |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | `xxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | `GOCSPX-xxx` |
| `GOOGLE_REDIRECT_URL` | Redirect URI для Google OAuth | `http://example.com/auth/callback` |
| `GOOGLE_USER_INFO_URL` | URL для получения инфо о пользователе | `https://www.googleapis.com/oauth2/v2/userinfo` |
| `FRONTEND_URL` | URL фронтенда для редиректа после авторизации | `http://example.com/#` |

> Для криптовалют API ключ не нужен — Binance REST и WebSocket API доступны без авторизации.

---

## Архитектура

```
Браузер → Nginx (:80) → Frontend (статика)
                        → Backend (:8060)
                            → /auth/*        — Google OAuth

Браузер ← прямое соединение → Binance API
                            → api.binance.com/api/v3        — REST (цены, тикеры)
                            → stream.binance.com:9443/stream — WebSocket (реалтайм)
```

Nginx раздаёт статику фронтенда и проксирует auth-запросы на Go-бэкенд. Крипто-модуль на фронтенде напрямую подключается к Binance REST и WebSocket API.