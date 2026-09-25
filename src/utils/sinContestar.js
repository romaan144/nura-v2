// ── Cuántos mensajes tiene la profesional sin contestar ──────────────────
//
// Un solo recuento compartido por la barra, el menú lateral y el inicio: se
// pide a Nüra (op `mis-avisos`, con su sesión) al abrir, al volver a la app
// y cada 2 minutos mientras está abierta. Fuera de la demo y solo para
// profesionales con cuenta; si no, siempre 0.

import { useEffect, useState } from 'react'
import { DEMO_MODE } from '../config'
import { misAvisos, porLaFuncion } from './escrituras'

let cuenta = 0
let pidiendo = null
const oyentes = new Set()

export async function refrescarSinContestar() {
  if (pidiendo) return pidiendo
  pidiendo = (async () => {
    try {
      const { sesionActual } = await import('./cuenta')
      const lista = await misAvisos((await sesionActual())?.access_token)
      if (Array.isArray(lista)) cuenta = lista.filter(a => !a.respuesta).length
    } catch { /* sin red: se queda el último recuento */ }
    oyentes.forEach(fn => fn(cuenta))
    pidiendo = null
    return cuenta
  })()
  return pidiendo
}

export function useSinContestar(user) {
  const activo = Boolean(user?.isHelper) && !DEMO_MODE && porLaFuncion()
  const [n, setN] = useState(activo ? cuenta : 0)
  useEffect(() => {
    if (!activo) return
    oyentes.add(setN)
    refrescarSinContestar()
    const alVolver = () => document.visibilityState === 'visible' && refrescarSinContestar()
    document.addEventListener('visibilitychange', alVolver)
    const cada = setInterval(() => document.visibilityState === 'visible' && refrescarSinContestar(), 120000)
    return () => { oyentes.delete(setN); document.removeEventListener('visibilitychange', alVolver); clearInterval(cada) }
  }, [activo])
  return activo ? n : 0
}
