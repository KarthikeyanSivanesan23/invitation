import { useState } from 'react'
import { useReducedMotion } from './useReducedMotion'

interface DeviceNavigator extends Navigator { deviceMemory?: number; connection?: { saveData?: boolean } }

function detectDevice() {
  const nav = navigator as DeviceNavigator
  const mobile = window.matchMedia('(max-width: 767px)').matches
  const lowPower = Boolean(nav.connection?.saveData) || (nav.deviceMemory !== undefined && nav.deviceMemory <= 2) || (nav.hardwareConcurrency > 0 && nav.hardwareConcurrency <= 2)
  let webgl = false
  if (!lowPower) {
    try {
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('webgl2', { failIfMajorPerformanceCaveat: true })
      webgl = Boolean(context)
      context?.getExtension('WEBGL_lose_context')?.loseContext()
    } catch { webgl = false }
  }
  return { mobile, lowPower, webgl, dpr: Math.min(window.devicePixelRatio, mobile ? 1.25 : 1.5), particles: mobile ? 32 : 70 }
}

export function useDevicePerformance() {
  const reducedMotion = useReducedMotion()
  const [device] = useState(detectDevice)
  const [gentle, setGentle] = useState(false)
  return { ...device, reducedMotion, simple: gentle || reducedMotion || device.lowPower || !device.webgl, gentle, setGentle }
}

export type DevicePerformance = ReturnType<typeof useDevicePerformance>
