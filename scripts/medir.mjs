// ── Nüra · instrumental de medición en navegador ─────────────────────────
//
//   npm run medir rutas   · toda ruta × todo rol: caídas y pantallas vacías
//   npm run medir a11y    · nombres accesibles, dianas táctiles, contraste
//   npm run medir botones · botones visibles que no hacen nada
//
// POR QUE EXISTE
// A lo largo de una sola jornada de auditoría, la medición se equivocó DOCE
// veces y el código solo unas pocas. Cada script se escribía a mano, se
// tropezaba con las mismas piedras y se tiraba. Aquí quedan las primitivas
// ya corregidas, con el error que las produjo escrito al lado, para que
// nadie —ni yo— vuelva a pisarlas.
//
// LAS DOCE PIEDRAS, RESUMIDAS
//   1 · Home queda MONTADO detrás de cada pantalla con `display:none`, y sus
//       botones miden 0×0. Sin filtro de visibilidad, aparecen "muertos" en
//       las cinco pantallas a la vez.
//   2 · `offsetParent !== null` NO sirve: da null con `position: fixed`.
//       Usar `checkVisibility()`.
//   3 · Filtrar etiquetas por longitud (<40) descarta las tarjetas reales de
//       Explorar, que son largas.
//   4 · Los botones de la barra inferior se cuelan como contenido. Excluir
//       lo que viva dentro de un antepasado `position: fixed`.
//   5 · Las filas de una lista no siempre son `<button>`: en Siguiendo son
//       `<div onClick>`. Buscar también por `role` y por manejador.
//   6 · Medir sin hacer scroll al fondo miente sobre el hueco final.
//   7 · Buscar el `.page` por clase encuentra el de Home, oculto detrás.
//       Buscar el que de verdad scrollea.
//   8 · `waitUntil:'domcontentloaded'` escribe en localStorage ANTES de que
//       arranque la app, y el efecto de UserContext lo sobrescribe: se
//       audita como invitado creyendo ser otro rol. Usar `networkidle0`.
//   9 · El umbral táctil de WCAG 2.2 AA es 24×24, no 44×44 (eso es AAA).
//       Medir contra 44 da una alarma inflada y no accionable.
//  10 · Un `error boundary` no dice "React error": dice lo que diga tu copy.
//       Detectar el texto REAL de la aplicación.
//  11 · Emparejar pantalla y ruta por el nombre del componente falla:
//       `HelperProfile` vive en `/helper/:id`.
//  12 · Las tildes rompen las clases de caracteres: `[a-z]{3} \d+` no
//       encuentra "sáb 8".

import puppeteer from 'puppeteer-core'

const CHROMIUM = process.env.NURA_CHROMIUM || '/tmp/chr/chromium'
const BASE = process.env.NURA_BASE || 'http://127.0.0.1:4173'

export const ROLES = {
  invitado: null,
  usuario: { name: 'Sergio', phone: '600123456', joined: '2026-07-01T10:00:00.000Z' },
  profesional: {
    name: 'Marta Ferrer', isHelper: true, joined: '2026-07-01T10:00:00.000Z',
    helperProfile: { name: 'Marta Ferrer', specialty: 'Logopeda infantil', formation: 'Grado UB',
      zone: 'Gràcia', price: '45€', differentiator: 'Juego' },
  },
}

export const RUTAS = ['/', '/explore', '/feed', '/chats', '/siguiendo', '/my-services',
  '/profile', '/login', '/onboarding', '/register-helper', '/helper/1', '/helper/2020',
  '/helper/9999', '/intro/1', '/intro/9999', '/chat/1', '/chat/2020', '/chat/9999', '/no-existe']

// Piedra 10: el texto REAL con el que esta app avisa de un fallo.
const ROTO = /Algo fue mal por mi lado|Error de la aplicación|Minified React error/i

export async function navegador() {
  return puppeteer.launch({
    executablePath: CHROMIUM,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--single-process', '--disable-gpu'],
    headless: true,
    defaultViewport: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  })
}

/**
 * Abre una ruta con un rol. Piedra 8: DOS navegaciones con `networkidle0`,
 * porque escribir en localStorage antes de que arranque la app no sirve de
 * nada — el contexto lo sobrescribe al montar.
 */
export async function abrir(b, ruta, rol = null) {
  const p = await b.newPage()
  const errores = []
  p.on('pageerror', e => errores.push(String(e.message).split('\n')[0].slice(0, 80)))
  await p.goto(BASE + '/', { waitUntil: 'networkidle0' })
  await p.evaluate(u => {
    localStorage.clear(); sessionStorage.clear()
    if (u) localStorage.setItem('nura_user', JSON.stringify(u))
  }, rol)
  await p.goto(BASE + ruta, { waitUntil: 'networkidle0' })
  await new Promise(r => setTimeout(r, 1700))
  p.__errores = errores
  return p
}

/** El texto visible, normalizado. */
export const texto = p => p.evaluate(() => (document.body.innerText || '').replace(/\s+/g, ' ').trim())

/**
 * Los elementos que un dedo puede tocar de verdad.
 * Piedras 1, 2, 4 y 5 juntas.
 */
export const interactivos = p => p.evaluate(() => {
  const dentroDeFijo = el => {
    let n = el
    while (n && n !== document.body) {
      if (getComputedStyle(n).position === 'fixed') return true
      n = n.parentElement
    }
    return false
  }
  return [...document.querySelectorAll('button, a, [role="button"], input, textarea, select')]
    .filter(e => {
      const r = e.getBoundingClientRect()
      return e.checkVisibility?.({ checkOpacity: true, checkVisibilityCSS: true })
        && r.width > 4 && r.height > 4 && !dentroDeFijo(e)
    })
    .map(e => {
      const r = e.getBoundingClientRect()
      return {
        etiqueta: (e.getAttribute('aria-label') || e.getAttribute('title') || e.textContent || '')
          .trim().replace(/\s+/g, ' ').slice(0, 40),
        tag: e.tagName, ancho: Math.round(r.width), alto: Math.round(r.height),
        y: Math.round(r.top),
        alcanzableConTeclado: e.tabIndex >= 0 || ['BUTTON', 'A', 'INPUT', 'TEXTAREA', 'SELECT'].includes(e.tagName),
      }
    })
})

/** El elemento que DE VERDAD scrollea (piedra 7), ya con scroll al fondo (piedra 6). */
export async function alFondo(p) {
  return p.evaluate(() => {
    const sc = [...document.querySelectorAll('*')].find(e => {
      const s = getComputedStyle(e)
      return /auto|scroll/.test(s.overflowY) && e.scrollHeight > e.clientHeight + 4
    })
    if (!sc) return null
    sc.scrollTop = sc.scrollHeight
    const cs = getComputedStyle(sc)
    return { clase: String(sc.className).slice(0, 30), paddingBottom: cs.paddingBottom, overscroll: cs.overscrollBehaviorY }
  })
}

// ── Modo: rutas × roles ──────────────────────────────────────────────────
async function medirRutas() {
  const b = await navegador()
  let fallos = 0
  for (const [rol, u] of Object.entries(ROLES)) {
    const malas = []
    for (const ruta of RUTAS) {
      const p = await abrir(b, ruta, u)
      const t = await texto(p)
      if (ROTO.test(t)) { malas.push(`${ruta}(roto)`); fallos++ }
      else if (t.length < 25) { malas.push(`${ruta}(vacío ${t.length})`); fallos++ }
      if (p.__errores.length) malas.push(`${ruta}(JS: ${p.__errores[0]})`)
      await p.close()
    }
    console.log(`${rol.padEnd(12)} ${RUTAS.length} rutas → ${malas.length ? '✗ ' + malas.join(' ') : 'todas bien ✓'}`)
  }
  await b.close()
  console.log(fallos === 0 ? '\n✅ RUTAS VERDES' : `\n❌ ${fallos} fallos`)
  return fallos
}

// ── Modo: accesibilidad ──────────────────────────────────────────────────
async function medirA11y() {
  const b = await navegador()
  const T = { sinNombre: 0, dianaAA: 0, sinTeclado: 0, contraste: 0 }
  for (const ruta of ['/', '/explore', '/feed', '/chats', '/profile', '/siguiendo', '/helper/1']) {
    const p = await abrir(b, ruta, ROLES.usuario)
    const els = await interactivos(p)
    const sinNombre = els.filter(e => !e.etiqueta)
    // Piedra 9: AA es 24×24. 44×44 es AAA y produce alarmas infladas.
    const dianaAA = els.filter(e => e.ancho < 24 || e.alto < 24)
    const sinTeclado = els.filter(e => !e.alcanzableConTeclado)
    const contraste = await p.evaluate(() => {
      const rgb = s => { const m = s.match(/[\d.]+/g); return m ? m.slice(0, 3).map(Number) : null }
      const lum = c => { const [r, g, bl] = c.map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4) }); return 0.2126 * r + 0.7152 * g + 0.0722 * bl }
      const ratio = (a, b) => { const l1 = lum(a), l2 = lum(b); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05) }
      const fondo = e => { let n = e; while (n && n !== document.documentElement) { const s = getComputedStyle(n), c = rgb(s.backgroundColor); const a = (s.backgroundColor.match(/[\d.]+/g) || [])[3]; if (c && (a === undefined || +a > 0.5)) return c; n = n.parentElement } return [255, 255, 255] }
      const malos = []
      for (const e of document.querySelectorAll('p,span,div,h1,h2,h3,button,a,label,strong')) {
        const r = e.getBoundingClientRect()
        if (!e.checkVisibility?.() || r.width < 2) continue
        if (![...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 1)) continue
        const s = getComputedStyle(e), fg = rgb(s.color); if (!fg) continue
        const px = parseFloat(s.fontSize)
        const grande = px >= 24 || (px >= 18.66 && +s.fontWeight >= 700)
        const rt = ratio(fg, fondo(e))
        if (rt < (grande ? 3 : 4.5)) malos.push({ t: e.textContent.trim().slice(0, 20), r: Math.round(rt * 100) / 100, px: Math.round(px) })
      }
      return malos
    })
    T.sinNombre += sinNombre.length; T.dianaAA += dianaAA.length
    T.sinTeclado += sinTeclado.length; T.contraste += contraste.length
    console.log(`${ruta.padEnd(12)} sin nombre ${sinNombre.length} · diana<24 ${dianaAA.length} · sin teclado ${sinTeclado.length} · contraste ${contraste.length}`)
    if (contraste.length) console.log(`             ${JSON.stringify(contraste.slice(0, 3))}`)
    await p.close()
  }
  await b.close()
  console.log('\n═══ TOTAL ═══', JSON.stringify(T))
  return T.sinNombre + T.dianaAA + T.sinTeclado
}

// ── Modo: botones que no hacen nada ──────────────────────────────────────
async function medirBotones() {
  const b = await navegador()
  for (const ruta of ['/explore', '/feed', '/chats', '/profile', '/my-services']) {
    const p0 = await abrir(b, ruta, ROLES.usuario)
    const etiquetas = (await interactivos(p0)).filter(e => e.tag === 'BUTTON').map(e => e.etiqueta)
    await p0.close()
    const mudos = []
    for (let i = 0; i < Math.min(etiquetas.length, 10); i++) {
      const p = await abrir(b, ruta, ROLES.usuario)
      const antes = { u: await p.evaluate(() => location.pathname), t: await texto(p) }
      await p.evaluate(idx => {
        const bs = [...document.querySelectorAll('button')].filter(e => {
          const r = e.getBoundingClientRect()
          return e.checkVisibility?.() && r.width > 4 && r.height > 4
        })
        if (bs[idx]) bs[idx].click()
      }, i)
      await new Promise(r => setTimeout(r, 1300))
      const d = { u: await p.evaluate(() => location.pathname), t: await texto(p) }
      if (d.u === antes.u && d.t === antes.t) mudos.push(etiquetas[i])
      await p.close()
    }
    console.log(`${ruta.padEnd(14)} mudos: ${mudos.length ? mudos.join(' | ') : '—'}`)
  }
  await b.close()
}

const modo = process.argv[2] || 'rutas'
const modos = { rutas: medirRutas, a11y: medirA11y, botones: medirBotones }
if (!modos[modo]) {
  console.log('Modos: rutas · a11y · botones')
  process.exit(1)
}
console.log(`▸ medir ${modo} · ${BASE}\n`)
const fallos = await modos[modo]()
process.exit(fallos ? 1 : 0)
