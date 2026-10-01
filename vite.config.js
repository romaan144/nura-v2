import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'node:child_process'
import process from 'node:process'

// El sello de versión que se ve en Perfil y al entrar: la fecha del build
// y el commit (Vercel da el suyo; en local, git). Antes estaba escrito a
// mano y llevaba desde julio diciendo «2026.07.09».
function sello() {
  const fecha = new Date().toISOString().slice(0, 10).replace(/-/g, '.')
  let commit = (process.env.VERCEL_GIT_COMMIT_SHA || '').slice(0, 7)
  if (!commit) { try { commit = execSync('git rev-parse --short=7 HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim() } catch { /* sin git */ } }
  return commit ? `${fecha}-${commit}` : fecha
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: { __NURA_BUILD__: JSON.stringify(sello()) },
})
