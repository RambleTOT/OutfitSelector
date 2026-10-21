# Screen map

All screens in Новые экраны.dc.html exist in light (#l1–l15) and dark (#d1–d15) frames.

ID · English name · mock reference (file#frame) · comes from → goes to

## Onboarding (spec §2)
| ID | Name | Mock | From | To |
|---|---|---|---|---|
| ON-01 | Splash | Первый запуск#s1 | app launch | ON-02 after ≤1 s (or OUT-01 if signed in) |
| ON-02 | SignIn | #s2a | ON-01, sign-out | ON-03 (email) · ON-04 (Telegram, bot auto-linked) |
| ON-03 | EmailCode | #s2b | ON-02 | ON-04 (new user) · OUT-01 (returning) · back ON-02 |
| ON-04 | QuizWho | Прототип | ON-03 | ON-05 · Skip → ON-05 |
| ON-05 | QuizCity | #s3b | ON-04, PRF-01 | ON-06 |
| ON-06 | QuizOccasions | Прототип | ON-05 | ON-07 |
| ON-07 | QuizStyle | #s3a | ON-06, PRF-01 (retake) | ON-08 |
| ON-08 | QuizNoGo | Прототип | ON-07 | ON-09 |
| ON-09 | FirstItems | #s4 | ON-08, OUT-01 banner, WRD-01 banner | ADD-01 sheet · OUT-01 when 5 items incl. top/bottom/shoes · Skip/Later → OUT-01 with OUT-01b banner |
| ON-10 | InstallIOS | #s14a | first save (OUT-04 → Save) on iOS Safari | ON-13 |
| ON-11 | InstallAndroid | #s14b | first save on Android | system prompt → ON-13 |
| ON-12 | OpenInBrowser | Новые экраны#l15 (texts per app: Telegram, Instagram, VK, TikTok) | first save or launch inside an in-app browser | copy link · continue → ON-13 |
| ON-13 | NotificationsPrimer | Сквозные#p1 | after install (or Android) | system permission → OUT-01 |
| ON-14 | TelegramBotPrimer | Сквозные#p2 | iOS not installed / in-app browser | Telegram deep link → OUT-01 |

## Add item (spec §4)
| ID | Name | Mock | From | To |
|---|---|---|---|---|
| ADD-01 | AddItemSheet | #s4 sheet | ON-09, WRD-01 FAB | ADD-02 camera · ADD-05 template · PAY-01 if photo limit (Состояния#st5) |
| ADD-02 | Camera | Новые экраны#l8 (always dark) | ADD-01 | ADD-03 · gallery |
| ADD-03 | PhotoProcessing | #s5a | ADD-02 | ADD-06 when done · next photo · close (runs in background) |
| ADD-04 | PhotoNotClothing | #s5b | ADD-03 | ADD-02 retake · gallery |
| ADD-05 | TemplatePicker | Прототип «Вещь из шаблона» | ADD-01 | WRD-01 / ON-09 with toast «Вещь добавлена» |
| ADD-06 | ItemDetail | #s6 | ADD-03, WRD-01 tile | back · delete → WRD-01 |

## Outfit (spec §5)
| ID | Name | Mock | From | To |
|---|---|---|---|---|
| OUT-01 | OutfitHome | Новые экраны#l1 (Образ#s7a) | tab, launch | OUT-02 on Собрать образ (enabled when top+bottom or dress) · CON-02 on Собрать самому · ON-09 via banner |
| OUT-01b | OutfitHomeSetupIncomplete | Состояния#st1 | ON-09 skipped | ON-09 |
| OUT-01c | OutfitHomeOffline | Состояния#st3 | no network | — |
| OUT-02 | OutfitGenerating | Образ#s7b | OUT-01 | OUT-04 · OUT-05 on error · cancel → OUT-01 |
| OUT-03 | OutfitLimitReached | Образ#s7c | OUT-01 when limit 0 | PAY-01 inline sheet |
| OUT-04 | OutfitResult | Образ#s8a | OUT-02 | Save → FAV (or FAV-02 if full, FAV-05 if over limit, ON-10 on first save) · Другой вариант → OUT-02 · Заменить → OUT-08 · Редактировать → CON-01 · Поделиться → OUT-07 |
| OUT-05 | OutfitResultMissingSlots | Образ#s8b | OUT-02 | ADD-01 via Добавить обувь |
| OUT-06 | OutfitError | Образ#s8c | OUT-02 | OUT-02 retry (limit not charged) |
| OUT-08 | ReplaceItemSheet | Новые экраны#l7 | OUT-04 Заменить вещь | OUT-04 with item swapped (free) |
| OUT-09 | MonthlyCapReached | Новые экраны#l3 | OUT-01 on Подписка+ after 300 outfits/month | CON-02 · Telegram support |
| OUT-07 | ShareStory | Образ#s8d | OUT-04, CON-01, FAV-01 | system share |

## Wardrobe (spec §8)
| ID | Name | Mock | From | To |
|---|---|---|---|---|
| WRD-01 | Wardrobe | Гардероб#s9a | tab | ADD-06 · ADD-01 FAB · WRD-07 filters · long-press / Выбрать → WRD-08 |
| WRD-07 | WardrobeFiltersSheet | Новые экраны#l6 | WRD-01 filter buttons | WRD-03 |
| WRD-08 | WardrobeMultiSelect | Новые экраны#l2 | WRD-01 | CON-01 with selected items on canvas |
| WRD-02 | WardrobeEmpty | #s9b | first open with 0 items | ADD-01 |
| WRD-03 | WardrobeFiltered | #s9c | WRD-01 | reset → WRD-01 |
| WRD-04 | WardrobeUnavailable | #s9d | toggle in ADD-06 | Вернуть (toast action) |
| WRD-05 | WardrobeLoading | Состояния#st4 | cold start | WRD-01 |
| WRD-06 | WardrobeSetupIncomplete | Состояния#st2 | ON-09 skipped | ADD-01 |

## Constructor (spec §6)
| ID | Name | Mock | From | To |
|---|---|---|---|---|
| CON-01 | Constructor | #s10b | OUT-04 Редактировать, FAV-04 Редактировать, WRD-08 В конструктор | save → FAV · undo · share → OUT-07 |
| CON-02 | ConstructorEmpty | #s10a | OUT-01 Собрать самому, OUT-09 | CON-01 after first drop |

## Favourites (spec §7)
| ID | Name | Mock | From | To |
|---|---|---|---|---|
| FAV-01 | Favourites | Избранное#s11a | tab | FAV-04 |
| FAV-04 | SavedOutfitDetail | Новые экраны#l5 | FAV-01 card | Надеваю сегодня · CON-01 · rename · delete · OUT-07 |
| FAV-05 | FavouritesOverLimit | Новые экраны#l4 | Free with more saved than limit (after sub ends) | FAV-04 (open/edit/delete allowed) · PAY-01 · new saves blocked |
| FAV-02 | FavouritesFullSheet | #s11b | Save when full | replace → FAV-01 · PAY-01 |
| FAV-03 | FavouritesEmpty | Сквозные#e1 | 0 saved | OUT-01 |

## Profile (spec §9)
| ID | Name | Mock | From | To |
|---|---|---|---|---|
| PRF-01 | Profile | #s12a + Новые экраны#l9 | tab | PRF-02 · PAY-01 · ON-05/07 retake · ON-10 · theme (system/light/dark) · PRF-05 · PRF-06 · PRF-07 · PRF-08 |
| PRF-05 | EditProfile | Новые экраны#l10 | PRF-01 Мои данные | PRF-01 |
| PRF-06 | Documents | Новые экраны#l11 | PRF-01, PAY-01 links | web document |
| PRF-07 | SignOutSheet | Новые экраны#l12 | PRF-01 Выйти | ON-02 · stay |
| PRF-08 | DeleteAccount | Новые экраны#l13 | PRF-01 Удалить аккаунт | PRF-09 · back |
| PRF-09 | DeleteAccountConfirm | Новые экраны#l14 | PRF-08 | email code → account deleted → ON-02 |
| PRF-02 | Subscription | #s12b | PRF-01 | PRF-03 · PAY-01 change plan |
| PRF-03 | CancelSubscriptionSheet | #s12c | PRF-02 | keep → PRF-02 · confirm → PRF-01 (plan ends on date) |
| PRF-04 | SubscriptionEnded | Состояния#st6 | expiry | PAY-01 |

## Paywall (spec §10)
| ID | Name | Mock | From | To |
|---|---|---|---|---|
| PAY-01 | Paywall | #s13 | 4th photo on Free · AI limit · FAV-02 button · 30 photos on Sub | YooKassa → PAY-02 / PAY-03 |
| PAY-02 | PaymentSuccess | Состояния#st8 | YooKassa return | origin screen with limits lifted |
| PAY-03 | PaymentError | Состояния#st7 | YooKassa return | retry · support |

## Global
Coachmarks per tab (Сквозные#c1–c4) · Toasts: Образ сохранён / Вещь добавлена / Нет интернета (Сквозные) · Push & bot message templates (Сквозные#n1–n2)
