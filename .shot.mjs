import puppeteer from 'puppeteer-core'
const out = process.argv[2]
const b = await puppeteer.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] })
const p = await b.newPage()
await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 })
await p.setRequestInterception(true)
const H = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'apikey, authorization, content-type', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' }
const d = (clave, valor) => ({ clave, fuente: 'declarado', valor, prueba: 'lo confirmó el 2026-09-24' })
const llamadas = []
p.on('request', r => {
  const u = r.url()
  if (u.includes('/rest/v1/perfil_atributos') || u.startsWith('https://funcion.ficticia.test')) {
    if (r.method() === 'OPTIONS') return r.respond({ status: 204, headers: H })
    if (u.startsWith('https://funcion')) { llamadas.push(r.postData()); return r.respond({ status: 200, headers: H, contentType: 'application/json', body: JSON.stringify({ ok: true, pulso: { busquedas: 14, apariciones: 6, recibidos: 2, respondidos: 1 } }) }) }
    return r.respond({ status: 200, headers: H, contentType: 'application/json', body: JSON.stringify([
      d('vehiculo', true), d('anos_experiencia', 9), d('idioma:catalán', true), d('especialidad:alzheimer', true),
      { clave: 'volveria', fuente: 'clientes', valor: { si: 4, total: 5 }, prueba: '4 de 5 clientes volverían a llamarle' },
      { clave: 'cualidad:paciente', fuente: 'clientes', valor: { n: 3, total: 5 }, prueba: 'lo dicen 3 clientes' },
      { clave: 'tiempo_respuesta', fuente: 'medido', valor: { mediana_minutos: 35, n: 4 }, prueba: 'medido en 4 mensajes' },
    ]) })
  }
  if (u.includes('supabase.co')) return r.respond({ status: 200, headers: H, contentType: 'application/json', body: '[]' })
  r.continue()
})
p.on('pageerror', e => console.log('PAGEERROR', e.message))
await p.goto('http://localhost:4174/', { waitUntil: 'networkidle0' })
await p.evaluate(() => {
  localStorage.setItem('nura_onboarded', '1')
  localStorage.setItem('nura_user', JSON.stringify({ name: 'Pilar Ficticia', isHelper: true, helperId: 5, joined: '2026-09-01', helperProfile: { specialty: 'Auxiliar de geriatría', price: '15€/h', zone: 'Gràcia' } }))
  localStorage.setItem('nura_sesion', JSON.stringify({ access_token: 'x', expires_at: 9999999999, user: { email: 'pilar@ficticio.test' } }))
})
await p.goto('http://localhost:4174/profile', { waitUntil: 'networkidle0' }); await new Promise(r => setTimeout(r, 1200)); await p.evaluate(() => { const h = [...document.querySelectorAll('h2')].find(e => e.textContent.includes('sabe de ti')); h?.scrollIntoView({ block: 'center' }) }); await new Promise(r => setTimeout(r, 400)); await p.screenshot({ path: out + '/sabe2.png' }); await p.goto('http://localhost:4174/', { waitUntil: 'networkidle0' }); await new Promise(r => setTimeout(r, 8000)); await p.screenshot({ path: out + '/pulso.png' }); console.log(llamadas.join(' | '))
await new Promise(r => setTimeout(r, 1500))
console.log(await p.evaluate(() => { const h = [...document.querySelectorAll('h2')].find(e => e.textContent.includes('sabe de ti')); h?.scrollIntoView({ block: 'start' }); return !!h }))
await new Promise(r => setTimeout(r, 500))
await p.screenshot({ path: out + '/sabe.png' })
await b.close()
