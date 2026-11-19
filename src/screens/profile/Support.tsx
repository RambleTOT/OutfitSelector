import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button, CtaPlate, Icon, IconButton } from '../../ui'
import { loadSupport, sendSupport, type SupportMessage } from '../../lib/support'
import { SUPPORT_EMAIL, SUPPORT_TG } from '../../lib/config'
import { toast } from '../../store/ui'

const time = (t: number) => new Date(t).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

/** Поддержка: чат с командой внутри приложения. Ответ приходит сюда же, почта не нужна */
export function Support() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const topic = params.get('topic')
  const [messages, setMessages] = useState<SupportMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  const refresh = useCallback(async () => {
    try { setMessages((await loadSupport()).messages) } catch { /* без сети оставляем что есть */ } finally { setLoading(false) }
  }, [])
  useEffect(() => {
    void refresh()
    const t = setInterval(() => { if (document.visibilityState === 'visible') void refresh() }, 15000)
    return () => clearInterval(t)
  }, [refresh])
  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }) }, [messages.length])

  const send = async () => {
    const body = text.trim()
    if (body.length < 2 || busy) return
    setBusy(true)
    try {
      const th = await sendSupport(topic && messages.length === 0 ? `${topic}\n${body}` : body)
      setMessages(th.messages); setText('')
    } catch { toast('Не получилось отправить, проверь интернет и попробуй ещё раз', 'error') } finally { setBusy(false) }
  }

  return (
    <>
      <div className="flow" style={{ padding: '56px 20px 0', gap: 16 }}>
        <div className="nav-row">
          <IconButton icon="caret-left" label="Назад" variant="solid" onClick={() => navigate(-1)} />
          <span className="t-headline">Поддержка</span>
          <span style={{ width: 44 }} />
        </div>
        {!loading && messages.length === 0 && (
          <div className="notice" style={{ alignItems: 'flex-start' }}>
            <Icon name="chat-circle" size={24} color="var(--accent)" />
            <span className="t-callout" style={{ fontWeight: 400, textWrap: 'pretty' }}>
              {topic ? `Тема: ${topic}. ` : ''}Напиши, что случилось или чего не хватает. Ответим здесь, в этом экране, обычно в течение дня
            </span>
          </div>
        )}
        <div className="chat">
          {messages.map((m) => (
            <div key={m.id} className={`chat__msg chat__msg--${m.from}`}>
              <span className="t-body" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{m.text}</span>
              <span className="t-caption chat__time">{m.from === 'team' ? 'Atelier · ' : ''}{time(m.at)}</span>
            </div>
          ))}
          <div ref={endRef} />
        </div>
        {(SUPPORT_TG || SUPPORT_EMAIL) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {SUPPORT_TG && <a className="t-callout" href={`https://t.me/${SUPPORT_TG}`} target="_blank" rel="noopener" style={{ minHeight: 44, display: 'flex', alignItems: 'center' }}>Или написать в Telegram</a>}
            {SUPPORT_EMAIL && <a className="t-callout" href={`mailto:${SUPPORT_EMAIL}`} style={{ minHeight: 44, display: 'flex', alignItems: 'center' }}>Или на почту {SUPPORT_EMAIL}</a>}
          </div>
        )}
      </div>
      <CtaPlate>
        <textarea
          className="chat__input" rows={2} value={text} maxLength={1500} placeholder="Твоё сообщение"
          aria-label="Сообщение в поддержку" onChange={(e) => setText(e.target.value)}
        />
        <Button full icon="arrow-up" loading={busy} disabled={text.trim().length < 2} onClick={send}>Отправить</Button>
      </CtaPlate>
    </>
  )
}
