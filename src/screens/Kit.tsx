import { useState } from 'react'
import { MOCK_ITEMS, OCCASIONS } from '../data/items'
import {
  AnswerCard, BigTextField, BottomSheet, Button, Chip, CodeInput, CtaPlate, IconButton, ItemTile, LimitMeter, OutfitCard,
  PageDots, PlanBadge, QuestionProgress, SegmentedControl, SettingsList, SettingsRow, SetupBanner, StatTile, Switch, TextInput,
  TickBars, TopBar, WeatherPill,
} from '../ui'
import { toast } from '../store/ui'

/** Витрина компонентов для проверки обеих тем. Маршрут /kit, из интерфейса не доступен */
export function Kit() {
  const [occ, setOcc] = useState('work')
  const [sheet, setSheet] = useState(false)
  const [on, setOn] = useState(true)
  const [wish, setWish] = useState('')
  const [code, setCode] = useState('11')
  const [seg, setSeg] = useState<'a' | 'b'>('a')
  const items = MOCK_ITEMS
  const by = (ids: string[]) => ids.map((id) => items.find((i) => i.id === id)!)
  return (
    <div className="screen screen--flow" style={{ gap: 24 }}>
      <TopBar left={<IconButton icon="caret-left" label="Назад" />} title="Компоненты" right={<IconButton icon="share-network" label="Поделиться" />} />
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><WeatherPill temp="+8°" city="Москва" /><PlanBadge plan="free" /><PlanBadge plan="sub" /><PlanBadge plan="plus" /></div>
      <div className="scroll-hide" style={{ display: 'flex', gap: 8, overflowX: 'auto', margin: '0 -20px', padding: '0 20px' }}>
        {OCCASIONS.map((o) => <Chip key={o.id} label={o.label} emoji={o.emoji} selected={occ === o.id} onClick={() => setOcc(o.id)} />)}
      </div>
      <BigTextField value={wish} onChange={setWish} placeholder="Пожелание, если есть" suggestions={['Что-то яркое', 'Удобно']} />
      <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <LimitMeter remaining={3} total={5} />
        <LimitMeter remaining={1} total={5} />
        <LimitMeter remaining={0} total={5} onMore={() => setSheet(true)} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Button icon="sparkle" full>Собрать образ</Button>
        <Button variant="primary" full disabled>Собрать образ</Button>
        <Button variant="secondary" full>Собрать самому</Button>
        <Button variant="text" full icon="plus">Добавить обувь</Button>
        <Button variant="danger" full>Удалить аккаунт</Button>
        <Button loading full>Загрузка</Button>
      </div>
      <OutfitCard items={by(['i08', 'i02', 'i13', 'i19', 'i21'])} liked={true} onLike={() => {}} onDislike={() => {}} explanation="Тренч закроет от ветра, светлая рубашка освежит, лоферы держат образ деловым" />
      <OutfitCard items={by(['i17', 'i11', 'i19', 'i21'])} explanation="Платье с пальто" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {items.slice(0, 12).map((i, k) => <ItemTile key={i.id} item={i} selected={k === 1} unavailable={k === 2} />)}
        <ItemTile loading label="Загрузка" />
        <ItemTile queued label="Ждёт сеть" />
        <ItemTile item={items[3]} error="Не вышло" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 4 }}>
        {items.slice(12).map((i) => <div key={i.id} style={{ aspectRatio: '1', background: 'var(--item-mat)', borderRadius: 12, gridColumn: 'span 3', padding: 8 }}><ItemTile item={i} label="" /></div>)}
      </div>
      <SetupBanner count={2} hint="Добавь обувь и ещё пару вещей" onClick={() => toast('Нажали баннер')} />
      <AnswerCard title="Для себя" subtitle="Женская одежда" icon="user" selected />
      <AnswerCard title="Для мужа" subtitle="Мужская одежда" icon="user" />
      <QuestionProgress step={2} total={5} onBack={() => {}} onSkip={() => {}} />
      <TextInput label="Почта" value="" onChange={() => {}} placeholder="you@mail.ru" icon="envelope-simple" />
      <TextInput label="Почта" value="abc" onChange={() => {}} error="Проверь адрес" />
      <CodeInput value={code} onChange={setCode} />
      <Switch checked={on} onChange={setOn} label="Недоступна сейчас" description="Например, в стирке" />
      <SegmentedControl value={seg} onChange={setSeg} options={[{ value: 'a', label: 'Месяц' }, { value: 'b', label: 'Год' }]} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <StatTile value="12" unit="шт" label="вещей" icon="coat-hanger" />
        <StatTile value="3" label="образа" icon="sparkle" tone="soft" />
      </div>
      <TickBars value={3} max={5} height={10} />
      <PageDots count={5} active={2} />
      <SettingsList>
        <SettingsRow icon="user" label="Мои данные" />
        <SettingsRow icon="bell" label="Уведомления" value="Вкл" />
        <SettingsRow label="Светлая" trailing="radio" radio />
        <SettingsRow icon="trash" label="Удалить аккаунт" danger />
      </SettingsList>
      <div style={{ display: 'flex', gap: 8 }}>
        <Button variant="secondary" size="sm" onClick={() => toast('Образ сохранён')}>Тост</Button>
        <Button variant="secondary" size="sm" onClick={() => toast('Нет интернета', 'offline')}>Оффлайн</Button>
        <Button variant="secondary" size="sm" onClick={() => toast('Вещь добавлена', 'success', { action: 'Вернуть', onAction: () => {} })}>Действие</Button>
        <Button variant="secondary" size="sm" onClick={() => setSheet(true)}>Шторка</Button>
      </div>
      <CtaPlate><Button full icon="sparkle">Главное действие</Button></CtaPlate>
      <BottomSheet open={sheet} onClose={() => setSheet(false)} title="Заменить образ" subtitle="Выбери, какой образ убрать из избранного" footer={<Button full onClick={() => setSheet(false)}>Готово</Button>}>
        <p className="t-body muted">Содержимое шторки</p>
      </BottomSheet>
    </div>
  )
}
