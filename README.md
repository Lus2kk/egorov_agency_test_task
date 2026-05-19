# KAIROS — Online Banking & Crypto Dashboard

Проект представляет из себя лендинг с авторизацией через Google OAuth и реалтайм-дашбордом криптовалют. Цены обновляются через WebSocket ( каждые 3 секунды). Реализованы GET и DELETE ручки для работы с CoinDesk Data Streamer API.

**Тестовый сервер:** [https://testtaskegorovagency.duckdns.org](https://testtaskegorovagency.duckdns.org)

---

## Стек

- **Backend:** Go 1.25, Gin, Gorilla WebSocket
- **Frontend:** Vanilla JS, Vite, CSS
- **Инфраструктура:** Docker, Nginx

---

## API Endpoints

| Метод | Endpoint | Описание |
|-------|----------|----------|
| GET | `/crypto/prices?symbols=BTC,ETH,...` | Получить текущие цены криптовалют |
| GET | `/crypto/subscriptions` | Список подписок Data Streamer (требует API ключ) |
| DELETE | `/crypto/subscriptions/:id` | Удалить подписку Data Streamer (требует API ключ) |
| GET | `/crypto/ws?symbols=BTC,ETH,...` | WebSocket для реалтайм обновления цен |
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

GOOGLE_CLIENT_ID=<ваш-client-id>
GOOGLE_CLIENT_SECRET=<ващ-client-secret>
GOOGLE_REDIRECT_URL=http://<т-домен>/auth/callback
GOOGLE_USER_INFO_URL=https://www.googleapis.com/oauth2/v2/userinfo

FRONTEND_URL=http://<твой-домен>/#

COINDESK_API_KEY=<твой-ключ-или-пусто>
COINDESK_DATA_API_URL=https://data-api.coindesk.com
COINDESK_MIN_API_URL=https://min-api.cryptocompare.com
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
| `COINDESK_API_KEY` | API ключ CoinDesk (опционально) | `xxx` |
| `COINDESK_DATA_API_URL` | URL CoinDesk Data API | `https://data-api.coindesk.com` |
| `COINDESK_MIN_API_URL` | URL CryptoCompare API для цен | `https://min-api.cryptocompare.com` |

> `COINDESK_API_KEY` нужен только для операций с Data Streamer подписками (GET/DELETE `/crypto/subscriptions`). Цены криптовалют работают без ключа.

---

## Архитектура

```
Браузер → Nginx (:80) → Frontend (статика)
                        → Backend (:8060)
                            → /auth/*        — Google OAuth
                            → /crypto/*      — REST API
                            → /crypto/ws     — WebSocket
```

Nginx раздаёт статику фронтенда и проксирует API-запросы и WebSocket на Go-бэкенд. Бэкенд ходит во внешние API (CoinDesk, CryptoCompare, Google) и возвращает данные клиенту.