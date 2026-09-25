// ── ¿Me han contestado? — para quien busca ──────────────────────────────
//
// Antes la respuesta de un profesional solo aparecia al ABRIR ese chat: ni
// la lista de Chats ni la barra lo decian. Aqui se pregunta por todas las
// conversaciones de este movil a la vez (con sus llaves de lectura) y se
// cuentan las respuestas que aun no ha visto. «Vista» = ha abierto el chat
// donde esta (Chat.jsx llama a `marcarVistas`). Se guarda en este movil.

import { useEffect, useState } from 'react'
import { DEMO_MODE } from '../config'
import { respuestasTodas, porLaFuncion } from './escrituras'

const VISTAS = 'nura_respuestas_vistas'
const leerVistas = () => { try { return new Set(JSON.parse(localStorage.getItem(VISTAS) || '[]')) } catch { return new Set() } }

let nuevas = []            // [{ llave, helperId, respondido_en }] sin ver
let pidiendo = null
const oyentes = new Set()
const avisar = () => oyentes.forEach(fn => fn(nuevas))

export async function refrescarRespuestas() {
  if (pidiendo) return pidiendo
  pidiendo = (async () => {
    const vistas = leerVistas()
    const rs = await respuestasTodas()
    nuevas = rs.filter(r => r.respuesta && r.helperId && !vistas.has(r.llave))
    avisar()
    pidiendo = null
  })()
  return pidiendo
}

/** Ha abierto el chat: sus respuestas ya estan vistas. */
export function marcarVistas(llaves) {
  if (!llaves?.length) return
  const vistas = leerVistas()
  llaves.forEach(l => vistas.add(l))
  try { localStorage.setItem(VISTAS, JSON.stringify([...vistas].slice(-200))) } catch { /* sin memoria */ }
  nuevas = nuevas.filter(r => !vistas.has(r.llave))
  avisar()
}

/** { total, porHelper: { [helperId]: n } } de respuestas sin ver. */
export function useRespuestasNuevas() {
  const activo = !DEMO_MODE && porLaFuncion()
  const [lista, setLista] = useState(activo ? nuevas : [])
  useEffect(() => {
    if (!activo) return
    oyentes.add(setLista)
    refrescarRespuestas()
    const alVolver = () => document.visibilityState === 'visible' && refrescarRespuestas()
    document.addEventListener('visibilitychange', alVolver)
    const cada = setInterval(() => document.visibilityState === 'visible' && refrescarRespuestas(), 120000)
    return () => { oyentes.delete(setLista); document.removeEventListener('visibilitychange', alVolver); clearInterval(cada) }
  }, [activo])
  const porHelper = {}
  for (const r of activo ? lista : []) porHelper[r.helperId] = (porHelper[r.helperId] || 0) + 1
  return { total: activo ? lista.length : 0, porHelper, lista: activo ? lista : [] }
}
