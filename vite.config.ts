import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'


import fs from 'fs'

function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

function localDbServerPlugin() {
  const dbPath = path.resolve(__dirname, 'data/server_db.json')

  function ensureDbFile() {
    if (!fs.existsSync(path.dirname(dbPath))) {
      fs.mkdirSync(path.dirname(dbPath), { recursive: true })
    }
    if (!fs.existsSync(dbPath)) {
      fs.writeFileSync(dbPath, JSON.stringify({}), 'utf-8')
    }
  }

  return {
    name: 'local-db-server',
    configureServer(server: any) {
      server.middlewares.use('/api/db', (req: any, res: any, next: any) => {
        ensureDbFile()

        if (req.method === 'GET') {
          try {
            const content = fs.readFileSync(dbPath, 'utf-8')
            res.setHeader('Content-Type', 'application/json')
            res.end(content || '{}')
          } catch (e) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: 'Failed to read DB' }))
          }
          return
        }

        if (req.method === 'POST') {
          let body = ''
          req.on('data', (chunk: any) => { body += chunk })
          req.on('end', () => {
            try {
              const incoming = JSON.parse(body)
              let existing: any = {}
              try {
                const currentStr = fs.readFileSync(dbPath, 'utf-8')
                existing = JSON.parse(currentStr || '{}')
              } catch {}

              const merged = { ...existing, ...incoming }
              fs.writeFileSync(dbPath, JSON.stringify(merged, null, 2), 'utf-8')
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ success: true, timestamp: Date.now() }))
            } catch (e) {
              res.statusCode = 500
              res.end(JSON.stringify({ error: 'Failed to write DB' }))
            }
          })
          return
        }

        next()
      })
    }
  }
}

export default defineConfig({
  base: './',
  plugins: [
    figmaAssetResolver(),
    localDbServerPlugin(),
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],
})
