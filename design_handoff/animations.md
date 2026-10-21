# Animations

All durations come from the tokens. With `prefers-reduced-motion`, every movement is replaced by a 150 ms opacity fade.

| Element | Trigger | Property | Duration | Easing |
|---|---|---|---|---|
| Any Button, IconButton, Chip, tile | pointer down / up | scale 1 → 0.97 + brightness .96 | 180 ms | --ease-spring |
| Splash logo + phrase | app start | opacity 0→1, translateY 8→0 | 350 ms, then auto-advance ≤ 1 s | --ease-out |
| Screen push (forward) | navigation | translateX 24→0 + opacity | 350 ms | --ease-out |
| BottomSheet | open / close | translateY 100%→0, scrim opacity 0→.6 | 350 ms / 250 ms | --ease-spring / --ease-out |
| Toast | show / auto-hide after 3 s | translateY −16→0 + opacity | 350 ms in / 200 ms out | --ease-spring / --ease-out |
| Coachmark | first visit of tab | scrim fade, card translateY 12→0 | 350 ms | --ease-out |
| Photo processing placeholder | upload started | background-position shimmer, 200% width | 1.4 s loop | linear |
| Item reveal on mat | processing done | opacity 0→1, scale .92→1, blur 10→0 | 500–650 ms | --ease-out |
| Processing step list | each step done | icon circle → check-circle fill, colour → success | 180 ms | --ease-out |
| AI waiting: items shuffle | Собрать образ tapped | each tile drifts ±8 px, rotates ±4°, swaps slots every 600 ms | loop until response | --ease-spring |
| Outfit collage | result ready | each item translateY 24→0 + scale .9→1 + opacity, stagger 60 ms | 350 ms each | --ease-spring |
| Like / dislike | tap | icon scale 1→1.25→1, outline → fill | 350 ms | --ease-spring |
| LimitMeter segment | limit spent / refreshed | segment colour + width | 350 ms | --ease-out |
| TickBars | screen enter | bar heights grow from 0, stagger 40 ms | 350 ms | --ease-out |
| Tab switch | tap tab | icon regular → fill, label colour | 180 ms | --ease-out |
| Switch | toggle | thumb translateX, track colour | 180 ms | --ease-spring |
| Canvas item selected | tap item | frame + handles fade in | 180 ms | --ease-out |
| Canvas drop | drag from sheet | item scale 1.05→1 on drop | 350 ms | --ease-spring |
| Paywall checkbox | tap row | fill + check stroke draw | 180 ms | --ease-out |
| Pay button enable | consent checked | opacity .6→1, gradient appears | 180 ms | --ease-out |
