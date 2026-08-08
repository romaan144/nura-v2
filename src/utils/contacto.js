import { registrar } from './analitica'
// ── Contactar a un profesional: UNA sola verdad ──────────────────────────
//
// `handleContact` estaba escrita CUATRO veces (HelperCard, HelperCardTall,
// HelperCarousel, HelperProfile) y ya habia divergido:
//
//   · tres tarjetas guardaban `nura_pending_helper` (el objeto entero)
//   · la ficha guardaba `nura_pending_chat` (otra clave, otra forma)
//   · y NADIE leia ninguna de las dos. Medido: cero lectores en todo `src`.
//
// Lo que hace funcionar el flujo de invitado es `nura_return_to`, la unica
// que `Login.jsx` lee de verdad. El resto era peso muerto viajando por
// sessionStorage — y, peor, una divergencia que parecia significar algo.
//
// Aqui vive lo comun. Lo que NO vive aqui, a proposito, es como se pide
// entrar: la tarjeta avisa y lleva al registro, la ficha abre una reja.
// Esa diferencia es una decision de pantalla, no un accidente, y se declara
// en el sitio que la toma.

/**
 * Deja escrito a donde volver despues de entrar. Es lo unico que Login lee.
 */
export function recordarDestino(helperId) {
  registrar('contacto', { helperId: String(helperId), invitado: true })
  // (El caso del invitado. El de quien ya tiene cuenta se registra en
  //  `contextoDeChat`, que es por donde pasan las cuatro vias de contacto.)
  try {
    sessionStorage.setItem('nura_return_to', `/chat/${helperId}`)
  } catch { /* almacenamiento bloqueado: el flujo sigue, solo pierde el regreso */ }
}

/**
 * El estado con el que se abre un chat para que no empiece en frio: quien
 * es, que pidio la persona y como lo entendio Nüra. Sin esto, La Carta no
 * puede redactar el primer mensaje en las palabras del usuario.
 */
export function contextoDeChat(helper, extra) {
  // El contacto de quien YA tiene cuenta — el camino principal. Estaba solo
  // en `recordarDestino`, que es la reja del invitado: se medía justo al
  // que no llega a hablar con nadie.
  if (helper?.id != null) registrar('contacto', { helperId: String(helper.id), invitado: false })
  // `extra || {}` y no un parametro por defecto: `location.state` llega
  // NULL cuando se entra por enlace directo, y el valor por defecto de un
  // parametro solo cubre `undefined`. Reventaba la ficha al contactar.
  const e = extra || {}
  return {
    helper,
    userQuery: e.userQuery ?? (typeof window !== 'undefined' ? window.__nuraLastQuery : undefined),
    analysis: e.analysis ?? (typeof window !== 'undefined' ? window.__nuraLastAnalysis : undefined),
  }
}

/**
 * ¿Hay contexto suficiente para pasar por la carta de presentacion en vez
 * de soltar a la persona en un chat vacio?
 */
export function hayContexto(extra) {
  const e = extra || {}
  const w = typeof window !== 'undefined' ? window : {}
  return Boolean(e.userQuery || e.analysis || w.__nuraLastQuery)
}
