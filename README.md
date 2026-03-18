
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
- `VITE_STYLIST_MODEL` — optional model id для OpenAI-compatible stylist endpoint
- `VITE_VISION_API_URL` — URL endpoint для vision-модели оцифровки
- `VITE_VISION_API_TOKEN` — bearer token для vision endpoint
- `VITE_SEGMENTATION_API_URL` — URL endpoint для сегментации одежды
- `VITE_SEGMENTATION_API_TOKEN` — bearer token для segmentation endpoint
- `VITE_SEGMENTATION_MODEL` — имя модели сегментации, по умолчанию `BiRefNet`
- `VITE_SIMILAR_SEARCH_API_URL` — URL endpoint, который ищет похожие товары в интернете и возвращает clean product photo
- `VITE_SIMILAR_SEARCH_API_TOKEN` — bearer token для internet-search endpoint
- `VITE_SIMILAR_SEARCH_MODEL` — optional model label для search endpoint

Локально без backend приложение все равно работает:
- авторизация и сессия сохраняются в IndexedDB
- AI-стилист использует локальный fallback, если LLM endpoint не задан
- цифровизация сначала пытается взять clean product photo через endpoint, а без него использует локальный каталог реальных product photos

3) Сборка:
```bash
npm run build
```

> Проект написан на React (TypeScript) и собирается через Vite.
# OutfitSelector
