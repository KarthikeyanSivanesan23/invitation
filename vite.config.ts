import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { readdirSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

function publicAssets() {
  const virtualId = '\0virtual:public-assets'
  const root = resolve('public')
  const list = (dir: string, prefix = ''): string[] => existsSync(dir) ? readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? list(resolve(dir, entry.name), `${prefix}/${entry.name}`) : [`${prefix}/${entry.name}`]) : []
  return {
    name: 'public-asset-manifest',
    resolveId(id: string) { if (id === 'virtual:public-assets') return virtualId },
    load(id: string) { if (id === virtualId) return `export default ${JSON.stringify(list(root))}` },
    configureServer(server: import('vite').ViteDevServer) {
      const reload = (path: string) => {
        if (path.replaceAll('\\', '/').startsWith(root.replaceAll('\\', '/'))) {
          const module = server.moduleGraph.getModuleById(virtualId)
          if (module) server.moduleGraph.invalidateModule(module)
          server.ws.send({ type: 'full-reload' })
        }
      }
      server.watcher.on('add', reload).on('unlink', reload)
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), publicAssets()],
  build: {
    target: 'es2022',
    rollupOptions: {
      output: {
        onlyExplicitManualChunks: true,
        manualChunks(id) {
          const path = id.replaceAll('\\', '/')
          if (/\/node_modules\/(react|react-dom|scheduler)\//.test(path)) return 'react-vendor'
          if (path.includes('/node_modules/three/')) return 'three-engine'
          if (/\/node_modules\/(@react-three|three-stdlib|react-reconciler)\//.test(path)) return 'three-react'
          if (/\/node_modules\/(framer-motion|motion-dom|motion-utils)\//.test(path)) return 'motion'
        },
      },
    },
  },
})
