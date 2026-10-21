import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, CtaPlate, NavHeader, TextInput } from '../../ui'
import { useApp } from '../../store/app'
import { toast } from '../../store/ui'
import { Avatar } from './Profile'

/** Центрированная обрезка до квадрата 160 px: загрузка и кадрирование аватара в макете не нарисованы, решение прототипа */
async function squareAvatar(file: File): Promise<string> {
  const bmp = await createImageBitmap(file)
  const s = Math.min(bmp.width, bmp.height)
  const c = document.createElement('canvas')
  c.width = c.height = 160
  c.getContext('2d')!.drawImage(bmp, (bmp.width - s) / 2, (bmp.height - s) / 2, s, s, 0, 0, 160, 160)
  return c.toDataURL('image/jpeg', 0.85)
}

/** PRF-05 EditProfile: Мои данные */
export function EditProfile() {
  const navigate = useNavigate()
  const app = useApp()
  const [name, setName] = useState(app.name)
  const [city, setCity] = useState(app.quiz.city)
  const [height, setHeight] = useState(app.height)
  const [size, setSize] = useState(app.size)
  const [avatar, setAvatar] = useState(app.avatar)
  const file = useRef<HTMLInputElement>(null)

  const save = () => {
    app.patch({ name: name.trim() || app.name, height: height.replace(/\D/g, '').slice(0, 3), size: size.trim().toUpperCase().slice(0, 4), avatar })
    app.setQuiz({ city: city.trim() || 'Москва' })
    toast('Изменения сохранены')
    navigate(-1)
  }

  return (
    <>
      <input ref={file} type="file" accept="image/*" hidden onChange={async (e) => { const f = e.target.files?.[0]; if (f) { try { setAvatar(await squareAvatar(f)) } catch { toast('Не получилось открыть фото', 'error') } } e.target.value = '' }} />
      <div className="screen screen--push" style={{ gap: 18, paddingBottom: 128 }}>
        <NavHeader title="Мои данные" onBack={() => navigate(-1)} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Avatar src={avatar} letter={(name || 'А').charAt(0).toUpperCase()} size={72} />
          <Button variant="secondary" size="sm" icon="camera" onClick={() => file.current?.click()}>Сменить фото</Button>
        </div>
        <TextInput label="Имя" value={name} onChange={setName} maxLength={30} />
        <TextInput label="Город" value={city} onChange={setCity} icon="map-pin" maxLength={40} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
          <TextInput label="Рост, см" value={height} onChange={setHeight} inputMode="numeric" />
          <TextInput label="Размер" value={size} onChange={setSize} />
        </div>
        <TextInput label="Почта" value={app.email || 'Вход через Telegram'} onChange={() => {}} disabled icon="envelope-simple" hint="Сменить почту можно через поддержку" />
      </div>
      <CtaPlate><Button full onClick={save}>Сохранить</Button></CtaPlate>
    </>
  )
}
