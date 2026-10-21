import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AnswerCard, BigTextField, Button, Chip, CtaPlate, Icon, QuestionProgress } from '../../ui'
import { OCCASIONS } from '../../data/items'
import { useApp, type Quiz as QuizState } from '../../store/app'
import { useOutfitFlow } from '../../store/outfit'
import type { OccasionId } from '../../data/types'

type Q =
  | { key: 'who'; type: 'list'; title: string; hint: string; opts: [string, string, string][] }
  | { key: 'city'; type: 'city'; title: string; hint: string }
  | { key: 'occ' | 'no'; type: 'chips'; multi: true; optional?: boolean; title: string; hint: string; opts: [string, string?][] }
  | { key: 'style'; type: 'tiles'; multi: true; title: string; hint: string; opts: [string, string, string][] }

/** Пять вопросов анкеты (ON-04…ON-08), тексты из макета «Прототип первого запуска» */
export const QUIZ: Q[] = [
  { key: 'who', type: 'list', title: 'Для кого одежда', hint: 'Подберу фасоны и подсказки', opts: [['Женская', 'Платья, юбки, каблуки', 'gender-female'], ['Мужская', 'Рубашки, брюки, костюмы', 'gender-male'], ['Любая', 'Без разделения', 'circles-three']] },
  { key: 'city', type: 'city', title: 'В каком ты городе', hint: 'Чтобы подбирать образ по погоде' },
  { key: 'occ', type: 'chips', multi: true, title: 'Куда ты ходишь чаще всего', hint: 'Можно выбрать несколько', opts: [['Каждый день', '☀️'], ['Работа', '💼'], ['Учёба', '📚'], ['Свидание', '❤️'], ['Прогулка', '🌿'], ['Вечеринка', '🎉'], ['Спорт', '🏃']] },
  { key: 'style', type: 'tiles', multi: true, title: 'Какой стиль тебе ближе', hint: 'Можно выбрать несколько', opts: [['Минимализм', 'Чисто и спокойно', 'square'], ['Кэжуал', 'Удобно каждый день', 't-shirt'], ['Классика', 'Строго и точно', 'briefcase'], ['Спорт-шик', 'Кроссовки ко всему', 'sneaker'], ['Романтика', 'Мягко и легко', 'flower'], ['Стритстайл', 'Объём и смелость', 'baseball-cap']] },
  { key: 'no', type: 'chips', multi: true, optional: true, title: 'Что ты точно не носишь', hint: 'Не буду предлагать. Можно пропустить', opts: [['Каблуки'], ['Юбки'], ['Шорты'], ['Яркие цвета'], ['Обтягивающее'], ['Галстуки'], ['Принты']] },
]

const CITIES = ['Москва', 'Санкт-Петербург', 'Казань', 'Екатеринбург']

type Answers = { who: string | null; city: string; occ: string[]; style: string[]; no: string[] }

const toAnswers = (q: QuizState): Answers => ({ who: q.who, city: q.city, occ: q.occasions, style: q.styles, no: q.nogo })
const fromAnswers = (a: Answers): Partial<QuizState> => ({ who: a.who, city: a.city.trim() || 'Москва', occasions: a.occ, styles: a.style, nogo: a.no })

/** Повод по анкете: первый выбранный (Спорт → Прогулка), чтобы он сразу стоял на экране Образ */
function defaultOccasion(labels: string[]): OccasionId | null {
  for (const l of labels) {
    const o = OCCASIONS.find((x) => x.label === l)
    if (o) return o.id
    if (l === 'Спорт') return 'walk'
  }
  return null
}

/**
 * ON-04…ON-08 QuizWho, QuizCity, QuizOccasions, QuizStyle, QuizNoGo.
 * `?only=city|style` показывает один вопрос для повторного прохождения из профиля (ON-05, ON-07)
 */
export function Quiz() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const only = params.get('only')
  const stored = useApp((s) => s.quiz)
  const setQuiz = useApp((s) => s.setQuiz)
  const finishQuiz = useApp((s) => s.finishQuiz)
  const steps = only ? QUIZ.filter((q) => q.key === only) : QUIZ
  const [step, setStep] = useState(0)
  const [ans, setAns] = useState<Answers>(toAnswers(stored))
  const q = steps[step]
  const last = step === steps.length - 1

  const value = ans[q.key === 'occ' ? 'occ' : q.key]
  const empty = !(q.type === 'chips' && q.optional) && (Array.isArray(value) ? value.length === 0 : !String(value ?? '').trim())

  const commit = (a: Answers) => {
    setQuiz(fromAnswers(a))
    const occ = defaultOccasion(a.occ)
    if (occ) useOutfitFlow.getState().setOccasion(occ)
  }
  const next = (skip = false) => {
    const a = skip && q.type !== 'city' ? { ...ans, [q.key]: Array.isArray(ans[q.key]) ? [] : ans[q.key] } : ans
    if (!last) { setAns(a); setStep(step + 1); return }
    commit(a)
    if (only) { navigate(-1); return }
    finishQuiz()
    navigate('/onboarding/items', { replace: true })
  }
  const back = () => {
    if (step > 0) setStep(step - 1)
    else if (only) navigate(-1)
  }
  const pick = (v: string) => {
    if (q.type === 'list') setAns({ ...ans, who: v })
    else if (q.type === 'chips' || q.type === 'tiles') {
      const cur = ans[q.key] as string[]
      setAns({ ...ans, [q.key]: cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v] })
    }
  }
  const isSel = (v: string) => (q.type === 'list' ? ans.who === v : q.type === 'chips' || q.type === 'tiles' ? (ans[q.key] as string[]).includes(v) : false)

  return (
    <>
      <div className="flow" style={{ padding: '48px 20px 128px', gap: 24 }} key={q.key}>
        <div style={{ margin: '0 -4px 0 -12px' }}>
          <QuestionProgress step={step + 1} total={steps.length} onBack={step > 0 || only ? back : undefined} onSkip={() => next(true)} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <h2 className="t-title1" style={{ textWrap: 'pretty' }}>{q.title}</h2>
          <p className="t-body muted">{q.hint}</p>
        </div>
        {q.type === 'list' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {q.opts.map(([label, sub, icon]) => <AnswerCard key={label} title={label} subtitle={sub} icon={icon} selected={isSel(label)} onClick={() => pick(label)} />)}
          </div>
        )}
        {q.type === 'city' && (
          <BigTextField placeholder="Например, Казань" value={ans.city} onChange={(v) => setAns({ ...ans, city: v })} suggestions={CITIES} maxLength={40} />
        )}
        {q.type === 'chips' && (
          <div className="chips-wrap">
            {q.opts.map(([label, emoji]) => <Chip key={label} label={label} emoji={emoji} selected={isSel(label)} onClick={() => pick(label)} />)}
          </div>
        )}
        {q.type === 'tiles' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
            {q.opts.map(([label, sub, icon]) => (
              <AnswerCard key={label} layout="tile" title={label} subtitle={sub} image={<Icon name={icon} size={40} />} selected={isSel(label)} onClick={() => pick(label)} />
            ))}
          </div>
        )}
      </div>
      <CtaPlate>
        <Button full disabled={empty} onClick={() => next()}>{only && last ? 'Сохранить' : 'Дальше'}</Button>
      </CtaPlate>
    </>
  )
}
