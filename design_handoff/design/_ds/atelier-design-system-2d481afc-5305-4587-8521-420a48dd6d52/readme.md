# Atelier Design System

Atelier is a mobile PWA (Android + iOS) — an AI stylist that builds new outfits from clothes the user already owns. Screen 390×844, must fit 360×780. Light + dark theme. Interface language: Russian, informal ты.

## Sources
- `uploads/atelier_ui_system.md` — UI system, the primary authority on style
- `uploads/atelier_screen_references_1.pdf` — screen references (labels R0, G = GO Club, N = Numo, B = Beeline, W = Indyx/Acloset). Take only the composition listed under Берём; never colours, fonts or logos. R0 is still empty.
- `atelier_mvp_spec.md` was mentioned but not provided.

## Content fundamentals
- Ты, short, human. No bureaucratic wording: Не получилось, попробуй ещё раз, not Произошла ошибка
- No quotation marks, no em dashes, no full stop after short phrases
- Buttons are verbs: Собрать образ, Сохранить, Добавить вещь
- Examples: Новые образы из твоих вещей · Осталось 3 из 5 на этой неделе · Не похоже на одежду, попробуй ещё раз · Добавь обувь, чтобы образ был полным
- Emoji only as a tiny marker before occasion chip text

## Visual foundations
- Mood: calm confidence of a fashion atelier. Neutral cool-white background `#F4F4F6` (cream removed on request), ink `#111114`, coral accent `#F2665E`. The user’s clothes are the hero; UI recedes.
- One main thing and one main action per screen. Colour only where it matters: main button, active state, counter.
- Sunset gradient (135°, #FFB199 → #F2665E → #B5627F): only main CTA, pay button, splash, hero glow. Max one gradient element per screen.
- Glass (white 60%, blur 24 + saturate 180%, 1px white 70% border, shadow 0 8 32 / 8%) only on floating layers: tab bar, sheets, scrolled top bar, bottom CTA plate, toasts. Cards are plain white. Fallback: elevated 92%.
- Type: Onest (geometric grotesk, heavy weights) for all UI: Display 48/52 Black for big numbers, headings ExtraBold … Micro 11/13 caps. Replaced Manrope on request for a bolder GO Club-like feel. Cormorant Garamond only for logo, splash and paywall title. Sizes in rem.
- Spacing 4px grid (4–56), screen padding 20, hit areas ≥44.
- Radii: chips are full pills, input 16, item tile 24, card/hero 32, sheet 36, buttons full.
- Items: cut-out photos on neutral light mat `#EEEEF2`, shadow 0 6 16 / 10%, same scale. Mat stays light in dark theme. Collage: outer + top above, bottom below, shoes at the foot, accessories at the side, overlapping like on a bed.
- Motion: spring ~350ms; AI waiting = items shuffle softly; outfit items fly in with 60ms stagger; sheets slide up; photo processing = shimmer then reveal. Press = scale 0.96–0.98 + slight darken. Reduced motion → fades.
- Numbers: hero figure 96px ExtraBold with a small unit (77%, 12шт), optional Sunset glow behind it; info blocks are 2×2 tiles with number + icon label; tick bars instead of charts.
- Card shadow is near-zero (1px, 4%); depth comes from white-on-milk contrast.

## Iconography
Phosphor Icons via CDN (`tokens/icons.css`): regular for UI, fill for active tab/selected. 24px. Phosphor regular is ~1.5px stroke vs the 1.75px requested (substitution). No logo was provided — the brand name is set in Cormorant Garamond wherever a mark goes.

## Index
- `styles.css` → `tokens/` (fonts, icons, colors incl. dark scope `[data-theme="dark"]`, typography, spacing, effects, base utilities `.glass`, `.t-*`, keyframes)
- `components/` — React primitives with `.d.ts` + `.prompt.md` + one card per folder
- `guidelines/` — foundation specimen cards (colors, type, spacing, radii, glass, shadows)
- `ui_kits/app/` — click-through PWA: Образ → сборка → Образ готов, Гардероб, Избранное, Профиль

### Components
- core: Icon
- actions: Button, IconButton
- navigation: TabBar, TopBar
- forms: Chip, AnswerCard, BigTextField, TextInput, Switch, QuestionProgress
- status: WeatherPill, LimitCounter, PlanBadge, Toast
- wardrobe: ItemTile, OutfitHero, CanvasItem
- overlays: BottomSheet, CtaPlate, Coachmark, EmptyState
- stats: StatTile, BigStat, TickBars, SegmentedControl, PageDots (info blocks and number visuals, added on request)

### Intentional additions
- Icon — wrapper for the Phosphor glyph set
- Switch — needed for Недоступна сейчас and notifications
- TextInput — standard r16 field for email/code/item fields
- TopBar, CtaPlate — floating glass layers named in UI system §4

## Deviations from the UI system
- Background cream → neutral #F4F4F6, font Manrope → Onest, chip radius 12 → pill, bigger card/sheet radii (user request: closer to GO Club structure)
- Item photos: no real cut-out images available yet; tiles show a category glyph placeholder
- Empty-state illustrations: placeholder Sunset disc with icon until real illustrations arrive
- Icon stroke 1.5 (Phosphor) instead of 1.75
- Fonts loaded from Google Fonts, not self-hosted
- Added a 1px 4% card shadow (spec defines none)
