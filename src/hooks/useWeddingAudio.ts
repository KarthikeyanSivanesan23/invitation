import { useCallback, useEffect, useRef, useState } from 'react'
import { wedding } from '../data/wedding'
import { hasAsset } from '../lib/assets'

interface Synth { context: AudioContext; master: GainNode; timer: number | null; note: number; voices: Set<OscillatorNode> }
const notes = [261.63, 293.66, 329.63, 392, 440, 392, 329.63, 293.66]

function playTone(synth: Synth, frequency: number, duration: number, gain: number, delay = 0) {
  const start = synth.context.currentTime + delay
  const oscillator = synth.context.createOscillator()
  const envelope = synth.context.createGain()
  oscillator.type = 'sine'; oscillator.frequency.value = frequency
  envelope.gain.setValueAtTime(.0001, start)
  envelope.gain.exponentialRampToValueAtTime(gain, start + .08)
  envelope.gain.exponentialRampToValueAtTime(.0001, start + duration)
  oscillator.connect(envelope); envelope.connect(synth.master)
  oscillator.start(start); oscillator.stop(start + duration + .1)
  synth.voices.add(oscillator)
  oscillator.onended = () => { oscillator.disconnect(); envelope.disconnect(); synth.voices.delete(oscillator) }
}

export function useWeddingAudio() {
  const [muted, setMuted] = useState(() => { try { return sessionStorage.getItem('wedding-muted') === 'true' } catch { return false } })
  const [playing, setPlaying] = useState(false)
  const [volume, setVolumeState] = useState(.35)
  const [available, setAvailable] = useState(true)
  const [fallback, setFallback] = useState(!hasAsset(wedding.audio))
  const synth = useRef<Synth | null>(null)
  const audio = useRef<HTMLAudioElement | null>(null)
  const playingRef = useRef(false)
  const mutedRef = useRef(muted)
  const volumeRef = useRef(volume)
  const bellPlayed = useRef(false)

  const initializeSynth = useCallback(() => {
    if (!synth.current) {
      if (!window.AudioContext) { setAvailable(false); return null }
      const context = new AudioContext()
      const master = context.createGain()
      master.gain.value = mutedRef.current ? 0 : volumeRef.current
      master.connect(context.destination)
      synth.current = { context, master, timer: null, note: 0, voices: new Set() }
    }
    void synth.current.context.resume().catch(() => setAvailable(false))
    return synth.current
  }, [])

  const startAmbient = useCallback(() => {
    const s = initializeSynth()
    if (!s || s.timer !== null) return
    const tick = () => {
      if (document.hidden || mutedRef.current) return
      const note = notes[s.note++ % notes.length]
      playTone(s, note, 4.5, .09)
      playTone(s, note * 2, 3, .018, .08)
      if (s.note % 4 === 1) { playTone(s, 130.81, 9, .035); playTone(s, 196, 9, .02) }
    }
    tick(); s.timer = window.setInterval(tick, 2400)
  }, [initializeSynth])

  const start = useCallback((bell = false) => {
    playingRef.current = true; setPlaying(true)
    if (hasAsset(wedding.audio) && !fallback) {
      if (!audio.current) { audio.current = new Audio(wedding.audio); audio.current.loop = true; audio.current.volume = volumeRef.current; audio.current.muted = mutedRef.current }
      void audio.current.play().catch(() => { setFallback(true); startAmbient() })
    } else startAmbient()
    if (bell && !bellPlayed.current && !mutedRef.current) {
      bellPlayed.current = true
      const s = initializeSynth()
      if (s) [523.25, 1046.5, 1569.75, 2117].forEach((frequency, i) => playTone(s, frequency, 4 - i * .55, .12 / (i + 1)))
    }
  }, [fallback, initializeSynth, startAmbient])

  const toggleMute = () => {
    const next = playing ? !muted : false
    mutedRef.current = next; setMuted(next)
    try { sessionStorage.setItem('wedding-muted', String(next)) } catch { /* The control remains usable in private mode. */ }
    if (audio.current) audio.current.muted = next
    if (synth.current) synth.current.master.gain.setTargetAtTime(next ? 0 : volumeRef.current, synth.current.context.currentTime, .15)
    if (!playing) start()
  }
  const setVolume = (value: number) => {
    setVolumeState(value); volumeRef.current = value
    if (audio.current) audio.current.volume = value
    if (synth.current && !mutedRef.current) synth.current.master.gain.setTargetAtTime(value, synth.current.context.currentTime, .1)
  }
  const stop = () => {
    setPlaying(false); playingRef.current = false
    if (audio.current) { audio.current.pause(); audio.current.currentTime = 0 }
    if (synth.current) {
      if (synth.current.timer !== null) window.clearInterval(synth.current.timer)
      synth.current.timer = null
      synth.current.voices.forEach(voice => { try { voice.stop() } catch { /* Already finished. */ } })
      synth.current.voices.clear()
      void synth.current.context.suspend()
    }
  }
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) { audio.current?.pause(); if (synth.current) void synth.current.context.suspend() }
      else if (playingRef.current) { if (audio.current) void audio.current.play().catch(() => {}); if (synth.current) void synth.current.context.resume().catch(() => {}) }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      audio.current?.pause()
      if (synth.current) { if (synth.current.timer !== null) window.clearInterval(synth.current.timer); synth.current.voices.forEach(voice => { try { voice.stop() } catch { /* An already-finished voice needs no cleanup. */ } }); void synth.current.context.close() }
    }
  }, [])
  return { muted, playing, volume, available, fallback, start, toggleMute, setVolume, stop }
}

export type WeddingAudio = ReturnType<typeof useWeddingAudio>
