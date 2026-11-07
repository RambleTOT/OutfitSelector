import { useNavigate } from 'react-router-dom'
import { BottomSheet, Button, Icon } from '../../ui'
import { track } from '../../lib/analytics'

/** Мягкое предложение войти по почте для гостя: после первого сохранённого образа, когда уже понятна польза */
export function RegisterSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate()
  return (
    <BottomSheet open={open} onClose={onClose} title="Сохрани свой гардероб" subtitle="Вещи и образы не потеряются, даже если сменишь телефон или очистишь браузер">
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {['Гардероб и избранное на любом устройстве', 'Утренние идеи образов и напоминания о дожде', 'Тариф сохранится, если захочешь больше образов'].map((t) => (
          <li key={t} className="t-callout" style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <Icon name="check-circle" fill size={22} color="var(--success)" />{t}
          </li>
        ))}
      </ul>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Button full icon="envelope-simple" onClick={() => { track('register_prompt_accept'); onClose(); setTimeout(() => navigate('/login', { state: { next: '/outfit' } }), 200) }}>Войти по почте</Button>
        <Button variant="text" full onClick={() => { track('register_prompt_later'); onClose() }}>Позже</Button>
      </div>
    </BottomSheet>
  )
}
