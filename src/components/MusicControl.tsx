import { useState } from 'react'
import { Music2, Volume2, VolumeX, Square, X, SlidersHorizontal } from 'lucide-react'
import { useInvitation } from '../context/InvitationContext'
import type { WeddingAudio } from '../hooks/useWeddingAudio'

export default function MusicControl({ audio }: { audio: WeddingAudio }) {
  const { t } = useInvitation()
  const [expanded, setExpanded] = useState(false)
  return <div className="music-control">
    {expanded && <div className="music-panel" role="region" aria-label={t('music')}>
      <div className="music-panel-heading"><Music2 size={17} /><strong>{t('musicTitle')}</strong><button className="icon-button" aria-label={t('close')} onClick={() => setExpanded(false)}><X size={16} /></button></div>
      <p>{!audio.available ? t('audioUnavailable') : audio.fallback ? t('musicFallback') : t('musicTrack')}</p>
      <label htmlFor="music-volume">{t('volume')}<span>{Math.round(audio.volume * 100)}%</span></label><input id="music-volume" type="range" min="0" max="1" step=".05" value={audio.volume} onChange={event => audio.setVolume(Number(event.target.value))} />
      <button className="text-button" onClick={audio.stop} disabled={!audio.playing}><Square size={12} />{t('stop')}</button>
    </div>}
    <div className="music-pill"><button onClick={audio.toggleMute} aria-label={audio.playing && !audio.muted ? t('mute') : t('unmute')} aria-pressed={audio.playing && !audio.muted}>{audio.playing && !audio.muted ? <Volume2 size={17} /> : <VolumeX size={17} />}<span className={`equalizer ${audio.playing && !audio.muted ? 'is-playing' : ''}`} aria-hidden="true"><i /><i /><i /><i /></span></button><button aria-label={t('music')} aria-expanded={expanded} onClick={() => setExpanded(!expanded)}><SlidersHorizontal size={14} /></button></div>
  </div>
}
