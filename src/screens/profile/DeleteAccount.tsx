import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BottomSheet, Button, CodeInput, CtaPlate, Icon, NavHeader } from '../../ui'
import { useApp } from '../../store/app'
import { useOutfitFlow } from '../../store/outfit'
import { dateLong, plural } from '../../lib/format'
import { toast } from '../../store/ui'

/** PRF-08 DeleteAccount, PRF-09 DeleteAccountConfirm (код из письма, в прототипе 1111) */
export function DeleteAccount() {
  const navigate = useNavigate()
  const app = useApp()
  const [confirm, setConfirm] = useState(false)
  const [code, setCode] = useState('')
  const [bad, setBad] = useState(false)
  const paid = app.plan !== 'free' && !app.subEnded
  const list = [
    { icon: 'coat-hanger', text: `${app.items.length} ${plural(app.items.length, 'вещь', 'вещи', 'вещей')} и все фото` },
    { icon: 'heart', text: `${app.saved.length} ${plural(app.saved.length, 'сохранённый образ', 'сохранённых образа', 'сохранённых образов')}` },
    { icon: 'sparkle', text: 'История образов и анкета' },
    { icon: 'telegram-logo', text: 'Связь с Telegram-ботом' },
  ]
  const remove = () => {
    if (code !== '1111') { setBad(true); return }
    useOutfitFlow.getState().back()
    app.resetDemo()
    toast('Аккаунт удалён', 'neutral')
    navigate('/login', { replace: true })
  }

  return (
    <>
      <div className="screen screen--push" style={{ gap: 20, paddingBottom: 200 }}>
        <NavHeader onBack={() => navigate(-1)} right={<span />} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <h2 className="t-title1" style={{ textWrap: 'pretty' }}>Удалить аккаунт</h2>
          <span className="t-body muted" style={{ textWrap: 'pretty' }}>Удалим навсегда, восстановить не получится</span>
        </div>
        <div className="list" style={{ padding: '4px 16px' }}>
          {list.map((d, i) => (
            <div key={d.text} style={{ minHeight: 52, display: 'flex', alignItems: 'center', gap: 12, borderTop: i ? '1px solid var(--line)' : 'none' }}>
              <Icon name={d.icon} size={22} color="var(--ink-secondary)" />
              <span className="t-callout" style={{ flex: 1 }}>{d.text}</span>
            </div>
          ))}
        </div>
        {paid && (
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: 16, borderRadius: 'var(--radius-tile)', background: 'var(--warning-soft)' }}>
            <Icon name="warning-circle" size={22} />
            <span className="t-callout" style={{ fontWeight: 400, textWrap: 'pretty' }}>Подписка активна до {dateLong(app.subEndsAt ?? Date.now() + 30 * 86400000)}. Автоплатёж отключим сразу, деньги за оставшиеся дни не вернутся</span>
          </div>
        )}
      </div>
      <CtaPlate>
        <Button variant="secondary" full onClick={() => { setCode(''); setBad(false); setConfirm(true) }}>Продолжить удаление</Button>
        <Button variant="text" full onClick={() => navigate(-1)}>Оставить аккаунт</Button>
      </CtaPlate>
      <BottomSheet open={confirm} onClose={() => setConfirm(false)} title="Точно удалить?" subtitle={`Введи код из письма на ${app.email || 'почту'}, чтобы подтвердить`}>
        <div style={{ position: 'relative' }}>
          <CodeInput value={code} onChange={(v) => { setCode(v); setBad(false) }} error={bad} />
          {bad && <p className="t-caption" style={{ color: 'var(--error-text)', textAlign: 'center', marginTop: 10 }}>Неверный код, попробуй ещё раз</p>}
          <p className="t-caption muted" style={{ textAlign: 'center', marginTop: 10 }}>Для демо подойдёт код 1111</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Button variant="danger" full icon="trash" disabled={code.length < 4} onClick={remove}>Удалить навсегда</Button>
          <Button variant="text" full onClick={() => setConfirm(false)}>Отмена</Button>
        </div>
      </BottomSheet>
    </>
  )
}
