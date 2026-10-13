import { wedding, type Language } from '../data/wedding'
import { translations } from '../data/translations'
import { downloadBlob } from './assets'

export async function downloadInvitationImage(language: Language) {
  await document.fonts.ready
  const canvas = document.createElement('canvas')
  canvas.width = 1080; canvas.height = 1350
  const c = canvas.getContext('2d')
  if (!c) throw new Error('Canvas unavailable')
  const t = translations[language]
  c.fillStyle = '#f6f0e4'; c.fillRect(0, 0, 1080, 1350)
  const gradient = c.createRadialGradient(540, 500, 0, 540, 500, 780)
  gradient.addColorStop(0, '#fffaf0'); gradient.addColorStop(1, '#eae0cd')
  c.fillStyle = gradient; c.fillRect(0, 0, 1080, 1350)
  c.strokeStyle = '#ac8b50'; c.lineWidth = 2; c.strokeRect(40, 40, 1000, 1270); c.lineWidth = 1; c.strokeRect(53, 53, 974, 1244)
  for (const [x, y, rotation] of [[80, 80, 0], [1000, 80, Math.PI / 2], [1000, 1270, Math.PI], [80, 1270, Math.PI * 1.5]]) {
    c.save(); c.translate(x, y); c.rotate(rotation)
    for (let i = 0; i < 4; i++) { c.beginPath(); c.ellipse(20 + i * 15, 20 + i * 15, 14, 40, -.75, 0, Math.PI * 2); c.stroke() }
    c.restore()
  }
  const font = language === 'ta' ? 'Noto Serif Tamil' : 'Cormorant Garamond'
  c.textAlign = 'center'
  const line = (value: string, y: number, size: number, color = '#592330', italic = false) => {
    let actual = size
    do { c.font = `${italic ? 'italic ' : ''}${actual}px "${font}", serif`; if (c.measureText(value).width <= 880) break; actual -= 1 } while (actual > 15)
    c.fillStyle = color; c.fillText(value, 540, y)
  }
  c.save(); c.translate(540, 180)
  for (let i = -2; i <= 2; i++) { c.save(); c.rotate(i * .35); c.beginPath(); c.ellipse(0, -23, 17, 42, 0, 0, Math.PI * 2); c.stroke(); c.restore() }
  c.restore()
  line(t.blessingsIntro, 320, 27)
  line(wedding.groom.name[language], 477, 90)
  line('&', 560, 62, '#b18b4c', true)
  line(wedding.bride.name[language], 663, 90)
  c.strokeStyle = '#bfa267'; c.beginPath(); c.moveTo(438, 722); c.lineTo(642, 722); c.stroke()
  line(t.saveDate, 795, 23, '#94743e')
  line(wedding.date[language], 858, 44)
  line(wedding.muhurtham[language], 917, 28)
  line(wedding.venue.name[language], 1001, 30)
  line(wedding.venue.address[language], 1048, 25)
  line(wedding.hashtag, 1180, 25, '#967746')
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('Image export failed')), 'image/png'))
  downloadBlob(blob, wedding.invitationImageName)
}
