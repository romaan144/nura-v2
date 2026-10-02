import puppeteer from 'puppeteer-core'
const w = ms => new Promise(r=>setTimeout(r,ms))
const b = await puppeteer.launch({ executablePath: '/opt/pw-browsers/chromium', args:['--no-sandbox'] })
const p = await b.newPage(); await p.setViewport({ width: 393, height: 760, isMobile: true, hasTouch: true, deviceScaleFactor: 2 })
await p.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle0' })
await p.evaluate(() => { localStorage.clear(); sessionStorage.clear(); localStorage.setItem('nura_user', JSON.stringify({ name: 'Babi', joined: new Date().toISOString() })) })
await p.goto('http://127.0.0.1:4173/chats', { waitUntil: 'networkidle0' }); await w(1500)
await p.screenshot({ path: '/tmp/claude-0/-home-user-nura-v2/75733e9b-3530-5c20-8204-89ad3ea47540/scratchpad/' + (process.argv[2] || 'c0') + '.png' })
await b.close()
