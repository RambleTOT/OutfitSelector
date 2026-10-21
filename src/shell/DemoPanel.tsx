import { useNavigate } from 'react-router-dom'
import { Button, Chip, Icon, PlanBadge, SegmentedControl } from '../ui'
import type { PlatformPref } from '../lib/platform'
import { effectivePlan, useApp, type Plan } from '../store/app'
import { toast } from '../store/ui'
import { useOutfitFlow } from '../store/outfit'
import { useTheme } from './hooks'

/** Панель демо справа от рамки, только на десктопе */
export function DemoPanel() {
  const navigate = useNavigate()
  const { plan, subEnded, offline, payFail, platform } = useApp()
  const patch = useApp((s) => s.patch)
  const setPlan = useApp((s) => s.setPlan)
  const setTheme = useApp((s) => s.setTheme)
  const toggleOffline = useApp((s) => s.toggleOffline)
  const exhaustLimit = useApp((s) => s.exhaustLimit)
  const endSubscription = useApp((s) => s.endSubscription)
  const skipOnboarding = useApp((s) => s.skipOnboarding)
  const resetDemo = useApp((s) => s.resetDemo)
  const resolved = useTheme()
  const eff = effectivePlan({ plan, subEnded })

  return (
    <aside className="demo" aria-label="Панель демо">
      <div className="demo__card">
        <div className="demo__title">
          <Icon name="sparkle" fill size={20} color="var(--accent)" />
          <span className="t-headline">Демо Atelier</span>
          <PlanBadge plan={eff} />
        </div>
        <p className="t-caption demo__hint">Всё моковое: ни бэкенда, ни AI, ни оплаты. Состояние хранится в браузере</p>
      </div>

      <div className="demo__card">
        <span className="t-micro demo__hint">Тариф</span>
        <SegmentedControl<Plan>
          glass={false}
          value={subEnded ? ('' as Plan) : plan}
          onChange={setPlan}
          options={[{ value: 'free', label: 'Free' }, { value: 'sub', label: 'Подписка' }, { value: 'plus', label: 'Подписка+' }]}
        />
        <span className="t-micro demo__hint">Тема</span>
        <SegmentedControl<'light' | 'dark'>
          glass={false}
          value={resolved}
          onChange={setTheme}
          options={[{ value: 'light', label: 'Светлая', icon: 'sun' }, { value: 'dark', label: 'Тёмная' }]}
        />
      </div>

      <div className="demo__card">
        <span className="t-micro demo__hint">Состояния</span>
        <div className="demo__btns">
          <Button variant="secondary" size="sm" icon="sparkle" onClick={() => { exhaustLimit(); toast('Лимит образов закончился', 'neutral') }}>Лимит закончился</Button>
          <Button variant="secondary" size="sm" icon="wifi-slash" onClick={() => { toggleOffline(); toast(offline ? 'Интернет вернулся' : 'Нет интернета', offline ? 'success' : 'offline') }}>{offline ? 'Вернуть интернет' : 'Нет интернета'}</Button>
          <Button variant="secondary" size="sm" icon="crown-simple" onClick={() => { endSubscription(); navigate('/profile') }}>Подписка закончилась</Button>
          <Button variant="secondary" size="sm" icon="credit-card" onClick={() => { patch({ payFail: !payFail }); toast(payFail ? 'Оплата снова проходит' : 'Следующая оплата вернётся с ошибкой', 'neutral') }}>{payFail ? 'Оплата пройдёт' : 'Ошибка оплаты'}</Button>
        </div>
      </div>

      <div className="demo__card">
        <span className="t-micro demo__hint">Где открыт сайт</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {([['auto', 'Авто'], ['ios', 'iPhone'], ['android', 'Android'], ['telegram', 'Telegram'], ['instagram', 'Instagram'], ['vk', 'VK'], ['tiktok', 'TikTok']] as [PlatformPref, string][]).map(([v, label]) => (
            <Chip key={v} label={label} selected={platform === v} onClick={() => patch({ platform: v })} />
          ))}
        </div>
        <span className="t-caption demo__hint">Влияет на экраны установки и уведомлений после первого сохранения образа. Открыть вручную: Профиль → Как установить на экран</span>
      </div>

      <div className="demo__card">
        <div className="demo__btns">
          <Button variant="secondary" size="sm" icon="arrow-clockwise" onClick={() => { useOutfitFlow.getState().back(); resetDemo(); navigate('/splash') }}>Сбросить демо</Button>
          <Button variant="secondary" size="sm" icon="caret-right" onClick={() => { skipOnboarding(); navigate('/outfit') }}>Пропустить онбординг</Button>
        </div>
      </div>
    </aside>
  )
}
