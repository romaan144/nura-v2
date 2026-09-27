import assert from 'node:assert/strict'
import { installKeyboardViewport } from '../src/utils/keyboardViewport.js'
function setup() {
  const win = new EventTarget(), doc = new EventTarget(), vv = new EventTarget()
  const values = new Map()
  const root = { dataset: {}, style: { setProperty: (k,v) => values.set(k,v), removeProperty: k => values.delete(k) } }
  const host = { dataset: { screen: 'home' }, scrollTop: 0, scrollHeight: 844, clientHeight: 484, contains: () => true,
    getBoundingClientRect: () => ({top:0,bottom:484,height:484}) }
  const field = { matches: () => true, getBoundingClientRect: () => ({top:650,bottom:700,height:50}) }
  Object.assign(vv, {height:844,offsetTop:0,scale:1})
  let frame
  Object.assign(win, {innerWidth:390,innerHeight:844,visualViewport:vv,requestAnimationFrame:fn=>{frame=fn;return 1},cancelAnimationFrame:()=>{frame=null}})
  Object.assign(doc, {documentElement:root,activeElement:null,querySelector:()=>host,querySelectorAll:()=>[]})
  const stop = installKeyboardViewport(win,doc)
  return {win,doc,vv,host,field,root,values,stop,flush:()=>{const fn=frame;frame=null;fn?.()}}
}
const s=setup()
assert.equal(s.values.get('--app-layout-height'),'844px')
s.doc.activeElement=s.field
s.doc.dispatchEvent(new Event('focusin'))
s.vv.height=484;s.vv.dispatchEvent(new Event('resize'));s.flush()
assert.equal(s.values.get('--app-layout-height'),'844px')
assert.equal(s.values.get('--app-visible-height'),'484px')
assert.equal(s.host.scrollTop,360)
// El gesto de la persona manda: ni scroll del viewport ni offsetTop lo contrarrestan.
s.host.scrollTop=120;s.vv.offsetTop=90;s.vv.dispatchEvent(new Event('scroll'));s.flush()
assert.equal(s.host.scrollTop,120)
assert.equal(s.values.get('--app-layout-height'),'844px')
s.host.scrollTop=120;s.vv.dispatchEvent(new Event('scroll'))
assert.equal(s.host.scrollTop,120)
s.vv.height=844;s.vv.dispatchEvent(new Event('resize'));s.flush()
assert.equal(s.host.scrollTop,0);assert.equal(s.root.dataset.keyboardOpen,undefined)
// Cambiar a otro campo con el teclado abierto conserva el lienzo.
s.vv.height=484;s.vv.dispatchEvent(new Event('resize'));s.doc.dispatchEvent(new Event('focusin'));s.flush()
assert.equal(s.values.get('--app-layout-height'),'844px')
// Escritorio y zoom no reciben desplazamientos programados.
s.win.innerWidth=1280;s.win.dispatchEvent(new Event('resize'))
assert.equal(s.values.size,0)
s.stop()
s.vv.height=300;s.vv.dispatchEvent(new Event('resize'))
assert.equal(s.values.size,0)
// Navegador que reduce también innerHeight (teclado Android).
const a=setup();a.doc.activeElement=a.field;a.doc.dispatchEvent(new Event('focusin'))
a.win.innerHeight=484;a.vv.height=484;a.win.dispatchEvent(new Event('resize'));a.flush()
assert.equal(a.values.get('--app-layout-height'),'844px');assert.equal(a.host.scrollTop,360)
assert.equal(a.values.get('--app-keyboard-inset'),'0px')
a.stop()
// Un formulario deja espacio al menú; redimensionar no secuestra el scroll manual.
const f=setup();f.host.dataset.screen='intro';f.doc.activeElement=f.field
f.doc.querySelectorAll=()=>[{getBoundingClientRect:()=>({height:62,top:412})}]
f.doc.dispatchEvent(new Event('focusin'));f.vv.height=484;f.vv.dispatchEvent(new Event('resize'));f.flush()
assert.equal(f.host.scrollTop,304)
f.host.scrollTop=100;f.vv.height=480;f.vv.dispatchEvent(new Event('resize'));f.flush()
assert.equal(f.host.scrollTop,100)
f.stop()
console.log('Teclado: lienzo estable, iOS/Android, cierre, foco, scroll libre, escritorio y limpieza verificados.')
