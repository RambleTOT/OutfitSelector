# Handoff: Atelier MVP (мобильное PWA)

## Overview
Atelier is an AI stylist PWA for Android and iOS. It builds new outfits from clothes the user already owns. This package covers all MVP screens from `atelier_mvp_spec.md` §2–§11, in light and dark themes:
- onboarding
- adding items
- outfit generation
- wardrobe
- outfit constructor
- favourites
- profile and subscription
- paywall
- install to home screen
- notifications
- global states

Interface language: Russian, informal «ты».

## About the design files
The `.dc.html` files in `design/` are **design references built in HTML**. They show the intended look and behaviour and are not production code. Rebuild them in the target stack (PWA, for example React + Vite + Workbox) using its own patterns. The mocks are built on the Atelier component library (`design/_ds/_ds_bundle.js`). Treat it as a visual reference only.

Open any file in a browser. The mocks are canvases of 390 × 844 frames. Each frame has an id; the screen IDs and their mock frames are listed in `screens.md`.

## Fidelity
**High fidelity.**
- Final colours, typography, spacing, radii, copy and interactions.
- Item photos and empty-state illustrations are placeholders: category glyphs and a sunset disc.

## Files in this package
| File | What |
|---|---|
| `tokens.css` | All design tokens as CSS variables, light and dark, with glass helper and reduced-motion handling |
| `components.md` | Component list: English names, variants, states, sizes |
| `screens.md` | Screen map: ID, English name, mock reference, where users come from and go to |
| `animations.md` | Motion spec: element, trigger, property, duration, easing |
| `assets/icons/` | 77 Phosphor SVGs (regular) and 6 fill variants used in the mocks. MIT licence, phosphoricons.com |
| `assets/logo/` | Wordmark and app icon. **Placeholders**: text set in Cormorant Garamond, outline before release |
| `design/Прототип первого запуска.dc.html` | Clickable onboarding: splash → sign-in → code → 5-step quiz → first items (skippable) → first outfit → save → install → notifications. Tweaks: theme, 360 px width, platform |
| `design/Первый запуск.dc.html` | Static onboarding screens: splash, sign-in, quiz, first items, photo processing, item detail |
| `design/Образ.dc.html` | Outfit home, waiting, limit reached, result, missing shoes, error, story image |
| `design/Гардероб и конструктор.dc.html` | Wardrobe (default, empty, filtered, unavailable) and constructor (empty, 4 items) |
| `design/Избранное профиль пейвол.dc.html` | Favourites, full-favourites sheet, profile, subscription, cancel, paywall, install variants |
| `design/Сквозные элементы.dc.html` | Coachmarks, toasts, empty states, notification primer, push and bot message samples |
| `design/Новые экраны.dc.html` | N1–N15 in light and dark: Собрать самому, multi-select, 300 cap, favourites over limit, saved outfit, filters, replace item, camera, profile settings and theme, my data, documents, sign out, delete account (2 steps), in-app browser. Tweaks: width 390/360, in-app app, theme |
| `design/Состояния.dc.html` | Setup incomplete (outfit and wardrobe), offline, loading, photo limit, subscription ended, payment error and success |
| `design/Доступность и спецификация.dc.html` | Accessibility audit and token tables |

## Global rules
- **Screen size:** designed at 390 × 844. Checked at 360 px: no clipping or overlap after fixes (shorter sheet titles, compact filter buttons, shorter secondary labels). Screen padding is 20. Safe-area insets come from `env()`.
- **Main action:** one per screen. Only the main action uses `--gradient-sunset-cta`, and only one gradient element appears per screen.
- **Glass:** used only on floating layers: tab bar, sheets, top bar, CTA plate, toasts, coachmark card. Cards are plain `--bg-elevated`.
- **Item photos:** always sit on `--item-mat`, which stays light in dark theme so garment colours read true. Shadow is `--shadow-item`. All items are shown at the same scale.
- **Text:** at least 11 px. Use `--ink-secondary` or stronger for readable text; `--ink-tertiary` is only for disabled and decorative elements. Sizes are in rem.
- **Hit areas:** at least 44 × 44. Chips and canvas handles extend their hit areas invisibly.
- **Copy:** use the text as written in the mocks and the spec. No full stops after short phrases, no quotation marks, buttons are verbs.

## Key behaviour
- **Limits** (spec §1):
  - **Free:** 5 AI outfits a week, 3 photos in total, 3 favourites.
  - **Подписка 300 ₽/мес:** 10 a week, 30 photos a month, 10 favourites.
  - **Подписка+ 600 ₽/мес:** unlimited.
  - **Not limited:** templates and the constructor on every plan.
  - **Weekly reset:** Monday 00:00 Moscow time.
  - **What costs a generation:** Другой вариант costs one; Заменить вещь costs nothing; a failed generation is not charged.
- **Subscription ends:** nothing is deleted. Users cannot add anything beyond the limits (Состояния#st6).
- **First items (ON-09):** generation unlocks with top + bottom or a dress; the recommended goal is 5 items including shoes.
  - The user can skip, which shows Пропустить, or Позже once at least one item exists.
  - Until the goal is met, Образ shows a setup banner (Состояния#st1); Собрать образ stays disabled only until top + bottom or a dress exist. Гардероб shows a progress card (Состояния#st2).
  - Push «Незаконченный старт» goes out after 24 h.
- **Photo pipeline:** upload → background removal → centre on mat → light and colour correction → AI fills the description. It runs in the background, so the user can shoot the next photo. Not clothing → ADD-04.
- **Paywall:** opens on the 4th photo on Free, an empty AI limit, the button in the full-favourites sheet, or the 30th photo on Подписка.
  - The autopay consent checkbox is unchecked by default. Pay stays disabled until it is checked.
  - Payment goes through YooKassa. After returning, limits lift immediately (PAY-02).
- **Install prompt:** after the first save. The screen depends on the platform: iOS Safari (3 steps), Android (system prompt), or Telegram and Instagram webviews (open in browser).
- **Notification permission:** asked after install, or offer the Telegram bot on iOS when the app is not installed.
- **Notifications:**
  - At most one a day, except payment messages.
  - Quiet hours 22:00–8:00.
  - Every type can be turned off in the profile.
  - Texts are in spec §11.
- **Coachmarks:** one per tab, shown on the first visit.
- **Offline:** the wardrobe and favourites come from cache. Outfit generation is disabled with an explanation. New photos queue as «Ждёт сеть». Toast Нет интернета.

## State per screen
| Screen | Loading | Empty | Error | Limit | Sub ended | Offline |
|---|---|---|---|---|---|---|
| Outfit | 7b | setup banner st1 | 8c | 7c | st6 → limits as Free | st3 |
| Wardrobe | st4 | 9b · e2 | photo 5b | photo st5 | st6 | st4 queued + toast |
| Favourites | skeleton like st4 | e1 | toast | 11b | keeps >3 saved, new save → 11b | from cache |
| Constructor | — | 10a | toast | — | — | works locally, save queues |
| Profile | — | — | toast | quotas in 12a | st6 | cached values |
| Paywall | — | — | st7 | — | — | button disabled + toast |

## Accessibility
The audit is in `design/Доступность и спецификация.dc.html`. These changes go beyond the mocks and are already reflected in `tokens.css`:
- **New tokens:** `--accent-text` and `--error-text` for text-coloured accent and destructive labels in light theme.
- **Text on accent in dark:** `--ink-on-accent` is dark in dark theme.
- **Chips:** extend the hit area to 44 px.
- **LimitMeter:** the «из M» label uses `--ink-secondary`.
- **CTA gradient:** `--gradient-sunset-cta` adopted for all white-label surfaces.

## Assets still needed
- **Logo:** final wordmark and app icon, outlined SVG plus PWA icon set 192/512 and maskable.
- **Template items:** illustrations for every category × type in spec §3. Flat, single-colour fill recolourable to the 7+ palette colours, on a transparent background, same scale as photos, 512 px.
- **Empty states:** illustrations for Гардероб, Избранное, Ошибка генерации, Ошибка оплаты, Нет интернета. 264 px, warm, one accent.
- **iOS install screen:** real Safari screenshots for 3 steps, light and dark.
- **Quiz style tiles:** 6 style photos for the «Какой стиль тебе ближе» question.

## Decisions (October 2026)
1. **CTA gradient:** `--gradient-sunset-cta` (#C9443D → #B94A44 → #9E4F6B) on every surface with white text or icons. Light `--gradient-sunset` only in text-free areas: splash glow, hero glow, soft backdrops.
2. **Generation threshold:** Собрать образ is enabled when the wardrobe has a top and a bottom, or a dress. 5 items incl. shoes stay a recommended goal with progress (SetupBanner). Without shoes the outfit is built without them and OUT-05 shows Добавь обувь, чтобы образ был полным.
3. **Empty constructor:** from Образ (secondary button Собрать самому → CON-02) and from Гардероб (multi-select WRD-08 → В конструктор → CON-01 with items placed).
4. **Unlimited cap:** after 300 outfits a month on Подписка+ show OUT-09: Ты собрал 300 образов в этом месяце, новые будут доступны с [1st of next month], with a support link.
5. **Favourites over limit after the subscription ends:** saved outfits can be opened, edited and deleted. New saves are blocked while the count exceeds the plan limit (FAV-05).
6. **Free photos:** deleting an item does not return a slot; a failed processing does not spend one. Counter copy: Осталось N из 3 фото. Неудачные не считаются, удаление место не вернёт.
7. **Theme:** follows the system by default (`prefers-color-scheme`). Profile has Как в системе · Светлая · Тёмная; store the choice locally and set `data-theme` on <html>.
8. **In-app browsers:** one screen ON-12 with per-app copy:
   - Telegram: Внутри Telegram нельзя поставить приложение на экран и включить уведомления · Нажми ⋯ вверху справа → Открыть в браузере
   - Instagram: Внутри Instagram не работают камера, вход и установка на экран · Нажми ⋯ вверху справа → Открыть во внешнем браузере
   - VK: Внутри VK нельзя поставить приложение на экран и включить уведомления · Нажми ⋯ вверху справа → Открыть в браузере
   - TikTok: Внутри TikTok не работают камера, вход и установка на экран · Нажми ⋯ вверху справа → Открыть в браузере
   Detect by user agent (Telegram, Instagram, VKClient, musical_ly / BytedanceWebview).
9. **Missing slots contract:** the generation response includes

```json
{
  "items": ["item_id_1", "item_id_2", "item_id_3"],
  "explanation": "Тренч закроет от ветра, светлый верх освежит",
  "missing": [{ "category": "shoes", "hint": "светлые кеды или лоферы" }]
}
```

`category` is one of the item categories (top, bottom, dress, outer, shoes, bag, accessory). `hint` is shown in OUT-05 and stored for future partner recommendations. Empty array when nothing is missing.

## Open questions
1. **R0 reference screen:** never provided, so screens were checked against the UI system only.
2. **Profile avatar:** upload and crop flow is not drawn (N10 shows only the button).
3. **Account deletion:** confirm legal retention rules (payment records) with the lawyer; N13 copy assumes no refund for the remaining days.
4. **Final assets:** logo, template-item and empty-state illustrations, Safari screenshots and quiz style photos are still placeholders.
