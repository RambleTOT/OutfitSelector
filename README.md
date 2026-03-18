
  # AI Outfit Selector App

  This is a code bundle for AI Outfit Selector App. The original project is available at https://www.figma.com/design/O6tCzx2eXl3pKZois1l881/AI-Outfit-Selector-App.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.
  

## Запуск (React + Vite)

1) Установите зависимости:
```bash
npm install
```

2) Запустите dev-сервер:
```bash
npm run dev
```

### Подключение реальных AI endpoint

По умолчанию приложение работает в демо-режиме:
- AI-стилист собирает образ локальным fallback-алгоритмом
- AI-оцифровка вещей использует локальный vision fallback

Чтобы подключить реальные сервисы, создайте `.env` на основе `.env.example`:

```bash
cp .env.example .env
```

Доступные переменные:
- `VITE_STYLIST_API_URL` — URL backend/edge endpoint для LLM-стилиста
- `VITE_STYLIST_API_TOKEN` — bearer token для stylist endpoint
- `VITE_VISION_API_URL` — URL endpoint для vision-модели оцифровки
- `VITE_VISION_API_TOKEN` — bearer token для vision endpoint

Оба endpoint ожидают JSON payload и могут быть OpenAI-compatible proxy или ваш собственный backend.

3) Сборка:
```bash
npm run build
```

> Проект написан на React (TypeScript) и собирается через Vite.
# OutfitSelector
