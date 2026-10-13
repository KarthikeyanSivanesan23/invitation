import { access } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { chromium } from '@playwright/test'

await access('public/images')
const origin = process.argv[2] || 'http://127.0.0.1:5174'
let server
try { await fetch(origin, { signal: AbortSignal.timeout(1500) }) }
catch {
  const port = new URL(origin).port || '5174'
  server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', port, '--strictPort'], { stdio: 'ignore' })
  for (let i = 0; i < 35; i++) {
    try { if ((await fetch(origin, { signal: AbortSignal.timeout(1000) })).ok) break } catch { /* Wait for Vite's first response. */ }
    await new Promise(resolve => setTimeout(resolve, 300))
  }
}
const browser = await chromium.launch({ channel: 'chrome' })
try {
  const page = await browser.newPage({ viewport: { width: 1500, height: 1000 }, deviceScaleFactor: 1 })
  for (const shot of [
    { section: '#journey', canvas: '.journey-canvas', name: 'temple-day.jpg', progress: .07 },
    { section: '.closing-scene', canvas: '.closing-canvas', name: 'temple-night.jpg', progress: 0 },
    { section: '.mandapam-section', canvas: '.mandapam-visual', name: 'mandapam-scene.jpg', progress: 0 },
  ]) {
    await page.goto(origin)
    await page.locator('.loading-screen').waitFor({ state: 'detached', timeout: 15000 })
    const position = await page.locator(shot.section).evaluate(element => ({ top: element.getBoundingClientRect().top + window.scrollY, height: element.clientHeight }))
    await page.evaluate(({ y, progress, height }) => window.scrollTo({ top: y + Math.max(0, height - innerHeight) * progress, behavior: 'instant' }), { y: position.top, progress: shot.progress, height: position.height })
    await page.locator(`${shot.canvas} canvas`).waitFor({ timeout: 10000 })
    await page.addStyleTag({ content: '.site-header,.music-control,.scroll-thread,.journey-copy,.journey-vignette,.journey-arrival,.journey-bottom,.closing-copy,.closing-shade,.footer-bottom,.mandapam-copy{visibility:hidden!important}.mandapam-section::after{display:none!important}.closing-canvas{opacity:1!important}.mandapam-visual{inset:0!important}' })
    await page.waitForTimeout(2600)
    await page.locator(shot.canvas).screenshot({ path: `public/images/${shot.name}`, type: 'jpeg', quality: 83, animations: 'disabled' })
    console.log(`Generated public/images/${shot.name} from the original 3D scene.`)
    await page.waitForTimeout(500)
  }
} finally { await browser.close(); server?.kill() }
