# PROGRESS

Кликабельный прототип Atelier. Порядок работы P1…P9 строго по порядку (см. CLAUDE.md).

## Статус
- [x] P1 Каркас, токены, компоненты, нижняя навигация, рамка iPhone, панель демо
- [ ] P2 Образ
- [ ] P3 Гардероб
- [ ] P4 Первый запуск
- [ ] P5 Добавление вещи
- [ ] P6 Избранное
- [ ] P7 Профиль и пейвол
- [ ] P8 Конструктор
- [ ] P9 Установка, подсказки, тосты, пустые состояния, тёмная тема

## Что сделано (P1)
- Vite + React 19 + TS, HashRouter, zustand persist (`atelier-demo-v1`), framer-motion подключён (пока не использован)
- `src/styles`: tokens.css (копия пакета), base.css (типографика, keyframes, reduced-motion), fonts.css (Onest и Cormorant локально из node_modules)
- `src/ui`: Button, IconButton, Chip, AnswerCard, BigTextField, TextInput, Switch, QuestionProgress, CodeInput, TabBar, TopBar, BottomSheet, CtaPlate, EmptyState, Coachmark, ToastHost, WeatherPill, LimitMeter, PlanBadge, StatTile, TickBars, SegmentedControl, PageDots, ItemTile, ItemArt, OutfitCard, SetupBanner, SettingsList/Row. Витрина всех компонентов: `#/kit`
- `src/data`: 19 SVG-силуэтов одежды (цвет и узор параметрами), 24 вещи, 6 повода, 6 заготовок образов, погода (Москва +8, облачно)
- `src/store`: тариф, подписка закончилась, тема, оффлайн, использование лимитов (неделя по Москве), `useLimits()`
- Оболочка: до 500 px на весь экран, шире рамка iPhone 390×844 (масштабируется по высоте окна), от 900 px справа панель демо
- PWA: manifest, иконки 192/512/maskable/apple-touch (буква A переведена в контуры скриптом `npm run pwa-icons`)
- Иконки Phosphor собираются `npm run icons` в `src/ui/icons.generated.ts`

## Принятые решения
- Рамка и оверлеи: внутри приложения только `position: absolute`; шторки и подсказки монтируются в `.overlay-root` внутри `.app` через `OverlayContext`
- HashRouter, чтобы прототип открывался с любого статического хостинга; `base: './'`
- Каждая секция экрана с `overflow` в flex-колонке получает `flex-shrink: 0` (`.screen > *`), иначе схлопывается
- Нет в пакете иконок thumbs-up/down, circle-notch, lightning, image, camera-rotate, sun: нарисованы вручную в `src/ui/icons.extra.ts` в стиле Phosphor
- Повода 6 (как в макете Образ): Каждый день, Работа, Учёба, Свидание, Прогулка, Вечеринка. По одной заготовке на повод; «Другой вариант» берёт следующую
- Заготовки образов задают слоты с предпочтительными id; при другом гардеробе (онбординг) вещи подбираются из имеющихся по категории, чего нет, уходит в `missing` (OUT-05)
- Вещи шаблона получают id вида `t-…`; для демо-гардероба (i01…i24) PNG из `public/items/{id}.png` подхватывается автоматически
- Подписка закончилась = `subEnded: true`, тариф остаётся в `plan`, но лимиты считаются как у Free (`effectivePlan`)
- «Лимит закончился» на Подписке+ включает потолок 300 образов в месяц (OUT-09), на остальных тарифах выбирает недельный лимит
- Временный шлюз в `Stage.tsx`: пока нет онбординга (до P4) демо-гардероб подставляется сразу. Удалить в P4

## Дальше
P2: экран Образ (OUT-01…OUT-06, OUT-08, OUT-09): до нажатия, ожидание 1,8 с, результат, лайк/дизлайк, Другой вариант, Заменить вещь, Сохранить, счётчик лимита, шторка пейвола при лимите 0

## Известные проблемы
- Нет
