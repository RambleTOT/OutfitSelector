# Components

The names on the left are proposed English names for code. The name in brackets is the name in the HTML mock-ups (AtelierDesignSystem namespace). Sizes are in px at a 390 px screen width. Type sizes are in rem through the tokens.

All interactive elements need a hit area of at least 44 × 44. Pressed state means `scale(0.96–0.98)` plus a slight darken, over `--dur-spring` with `--ease-spring`. Focus means a 2 px `--accent` ring with a 2 px offset.

## Actions

**Button** (Button)
- **Sizes:** default 56 h, pill, padding 0 24. `sm` 44 h. Optional full width. Icon 22 px on the left, gap 8.
- **Variants:**
  - `primary`: `--gradient-sunset-cta` (dark Закат), white label 4.8–5.6:1, `--shadow-cta`. One per screen. Light `--gradient-sunset` is never used under text.
  - `secondary`: `--bg-elevated` with a 1 px `--line` border.
  - `text`: transparent background, `--accent-text` label.
- **States:** default · pressed · disabled (`--bg-sunken` background, `--ink-tertiary` label, no shadow) · loading (spinner replaces the icon, label stays).
- **Label:** headline 17/22 700, no wrapping.

**IconButton** (IconButton)
- **Size:** 44 × 44 circle, 24 px icon.
- **Variants:** `glass` · `solid` (elevated with a `--line` border) · `plain`.
- **States:** default · pressed · selected (`--accent-soft` background, `--accent` icon, fill icon) · disabled.
- **Requirement:** `aria-label` is required.

**DangerButton** (built in the mocks, N14)
- **Size:** like Button primary, 56 h. Background `--error-text`, white label. Only for the final destructive step.

## Navigation

**TabBar** (TabBar)
- **Layout:** floating glass bar, 68 h, inset 16 from the sides and 20 + safe-bottom from the bottom, radius full.
- **Tabs:** 4 tabs: Образ · Гардероб · Избранное · Профиль.
- **Active tab:** fill icon, `--accent` colour, label caption 13/16 600.

**TopBar** (TopBar)
- **Layout:** 56 h pill, three-column grid: left actions · title (headline) · right actions.
- **Variants:** glass when floating over content or after scrolling. Transparent at the top of a page.

## Forms

**Chip** (Chip)
- **Size:** 40 visible height, with an invisible hit area extended to 44. Pill, padding 0 16. Optional emoji or icon before the label.
- **Variants:**
  - `occasion`: `--chip-bg` background. Selected is `--chip-bg-selected` with `--chip-fg-selected` text.
  - `suggestion`: `--accent-soft` background, `--accent-text` label.
- **States:** default · selected · disabled · pressed.

**AnswerCard** (AnswerCard)
- **Variants:**
  - `list`: min height 64, r24, icon 24, title headline + subtitle caption.
  - `tile`: 1:1 image on the mat, r24, title and subtitle below.
- **States:** default · selected (2 px `--accent` ring plus a check badge) · disabled (55 % opacity) · pressed.

**BigTextField** (BigTextField)
- **Layout:** borderless input, text 22 px 600, 2 px underline. Suggestion chips (Chip suggestion) sit below.
- **States:** empty (placeholder `--ink-tertiary`) · typing · focused (underline in `--accent`).

**TextInput** (TextInput)
- **Size:** 52 h, r16, `--bg-sunken` background, optional icon on the left, label above in caption.
- **States:** empty · focus (2 px `--accent` ring) · error (`--error` ring plus a caption message) · hint.

**Switch** (Switch)
- **Layout:** row of 56 min height with label + optional description. Track 51 × 31, `--accent` when on.
- **States:** on · off · disabled.

**QuestionProgress** (QuestionProgress)
- **Layout:** 44 h row with a back IconButton · segmented progress bar (N segments) · Пропустить (text Button).
- **States:** the back button acts as Close on step 1.

## Status

**WeatherPill** (WeatherPill)
- **Layout:** 44 h pill: icon · temperature · city.
- **States:** loading (shimmer) · offline (last known value + caption).

**LimitMeter** (LimitCounter)
- **Layout:** text Осталось N из M на этой неделе plus a bar of M segments.
- **States:** normal · last one (`--warning`) · empty (pale bar, Образы на неделю закончились, optional Ещё button) · unlimited (∞, no bar).
- **Fix:** the «из M» label must use `--ink-secondary`, not tertiary.

**PlanBadge** (PlanBadge)
- **Layout:** 22 h pill, micro uppercase label.
- **Variants:**
  - `free`: sunken background, secondary text.
  - `sub`: accent-soft background, accent text.
  - `plus`: sunset gradient, white text.

**Toast** (Toast)
- **Layout:** glass pill, 48 h, at the top under the safe area. Shrinks to its content, max width = screen − 32. The text never wraps.
- **Tones:** success · error · offline · neutral.
- **Behaviour:** optional action (text button). Hides automatically after `--dur-toast`.

## Wardrobe

**ItemTile** (ItemTile)
- **Layout:** 1:1 square, r24, cut-out photo on `--item-mat` with 12 % inset and `--shadow-item`. Caption 13/16 below, one line with ellipsis.
- **States:**
  - loading: shimmer
  - unavailable: photo at 40 % plus the badge в стирке
  - selected: accent ring + check
  - error: error ring + !
  - pressed
  - queued: shimmer + Ждёт сеть

**OutfitCard** (OutfitHero)
- **Layout:** r32 card on the mat, 4–6 items laid out like on a bed:
  - outerwear and top above
  - bottom below
  - shoes at the foot
  - accessories and bag at the side
- **Overlays:** like and dislike IconButtons. A 1–2 line explanation sits below. Optional hint row, for example Добавь обувь, чтобы образ был полным.
- **States:** waiting (items shuffle) · ready (items fly in with a stagger) · liked · disliked · missing slots.

**SavedOutfitCard** (built in the mocks)
- **Layout:** 3:4 mat with a mini collage, name in headline, `emoji · occasion · date` caption.
- **States:** default · вещь удалена badge · selected (in the replacement sheet).

**CanvasItem** (CanvasItem)
- **Layout:** item on the constructor canvas, with free x, y, scale and rotation.
- **Selected state:** 1.5 px accent frame, 4 corner handles, a rotation handle above, a resize handle bottom right. Each handle needs an invisible 44 px hit area.

**CanvasToolbar** (built in the mocks)
- **Layout:** glass pill under the selected item with 3 plain IconButtons: bring to front · send to back · remove.

## Overlays

**BottomSheet** (BottomSheet)
- **Layout:** glass, r36 top corners, padding 10 20 24 + safe-bottom. Grabber 36 × 4. Title in title2, subtitle in callout, gap 16. Scrim `--scrim` behind.
- **Behaviour:** height follows the content, max 90 % of the screen, then the content scrolls inside.

**CtaPlate** (CtaPlate)
- **Layout:** glass plate, inset 12 from the screen edges, holding one main Button. An optional second text Button or a 2-button row.

**Coachmark** (Coachmark)
- **Layout:** 60 % scrim with a cut-out matching the target radius, a white 3 px ring and a sunset glow. Glass card above or below the target with title, text and Понятно.
- **Behaviour:** one per tab, shown once.

**EmptyState** (EmptyState)
- **Layout:** 132 circle with an illustration (or icon on `--gradient-sunset-soft`), title2, body (max 300), one Button.
- **Note:** the mount stretches to full width so the button label never wraps.

**PaywallPlanColumn** (built in the mocks)
- **Layout:** one of 3 columns side by side, r24: name · price · per · 5 limit rows (value + label).
- **States:** selected (2 px accent ring) · recommended (Советуем badge above).
- **Checkbox:** a separate consent row, unchecked by default. The pay Button stays disabled until it is checked.

**FilterSheet** (N6)
- **Layout:** BottomSheet with groups: Цвет (swatches 30 px in 44 px hit areas, wrap), Сезон, Формальность (Chip occasion, multi), Switch Скрыть недоступные, footer Сбросить (secondary) + Показать N (primary).

**ReplaceItemSheet** (N7)
- **Layout:** BottomSheet over the outfit. Slot chips (horizontal scroll) choose which item to replace, grid of same-category ItemTiles, Заменить button. Subtitle states it is free.

**MultiSelectBar** (N2)
- **Layout:** top row: close · Выбрано N · Сбросить. ItemTile in selected state. CtaPlate with В конструктор.

**SetupBanner** (Состояния st1/st2, prototype)
- **Layout:** card with 2 px `--accent-soft` ring: micro label Первые вещи · N из 5, headline hint, TickBars 10 h, caret. Whole card is a button to ON-09.
- **Rule:** shown until 5 items incl. shoes. Собрать образ is enabled as soon as top + bottom or a dress exist.

**SettingsList / SettingsRow** (N9, N11)
- **Layout:** card r24, rows ≥ 56 h: icon 22 · label · trailing (caret, radio, check). Destructive rows use `--error-text`.
- **Theme picker:** 3 radio rows Как в системе (default) · Светлая · Тёмная.

**CameraView** (N8)
- **Layout:** always dark. Top: close · photo counter pill · flash. Dashed frame r32 with a category hint glyph. Hint text. Bottom: gallery 52 · shutter 80 · flip 52.

**CodeInput** (ON-03, N14)
- **Layout:** 4 cells 64–72 h, r16, `--bg-sunken`, active cell 2 px accent ring.

## Stats

**StatTile** (StatTile)
- **Layout:** number + unit + icon label.
- **Sizes:** sm · md · lg.
- **Tones:** elevated · soft · sunken · ink · plain.

**TickBars** (TickBars)
- **Variants:** `rising` (rounded bars, quota or progress) · `lines` (thin, weekly activity).
- **Usage:** replaces charts.

**SegmentedControl** (SegmentedControl)
- **Layout:** 44 h pill, glass or flat, with an active segment.

**PageDots** (PageDots)
- **Layout:** the active dot stretches into a pill.

**Icon** (Icon)
- **Set:** Phosphor, 24 px default. Regular for the UI, fill for the active tab and selected items. The SVGs are in `assets/icons/`.
