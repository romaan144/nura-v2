// ── El aviso al profesional ──────────────────────────────────────────────
//
// La app YA le promete al usuario: "le aviso de que le has escrito". Esta es
// la pieza que hace verdad esa frase.
//
// **Agnostica del canal a proposito.** Produce el texto y el destino; quien
// lo envie —WhatsApp, correo, notificacion propia— es una decision de
// producto sin tomar (ver docs/lado-profesional.md). Escribir esto ahora no
// la adelanta: las tres salidas necesitan exactamente el mismo texto.
//
// Reutiliza `buildChatOpener`, que ya redacta la presentacion en las
// palabras del usuario y es de lo mejor que tiene Nüra: elimina la barrera
// del primer mensaje, que es donde se cae la mitad de los contactos de
// cualquier marketplace.

import { buildChatOpener } from './introLetter'
import { getFirstName } from './name'

/** ¿El contacto que dejo el profesional es un movil o un correo? */
export function tipoDeContacto(contacto) {
  const c = String(contacto || '').trim()
  if (!c) return null
  if (c.includes('@') && /\.[a-z]{2,}$/i.test(c)) return 'email'
  const digitos = c.replace(/[^\d]/g, '')
  if (digitos.length >= 9) return 'movil'
  return null
}

/**
 * El aviso completo, listo para enviar por cualquier canal.
 * Devuelve `null` si no hay forma de avisar — y entonces hay que decirlo,
 * no callarlo.
 */
export function construirAviso({ helper, analysis, userQuery, user }) {
  const contacto = helper?.contacto
  const via = tipoDeContacto(contacto)
  if (!via) return null

  const suNombre = getFirstName(helper?.name) || ''
  const dequien = getFirstName(user?.name)
  const presentacion = buildChatOpener({ helper, analysis, userQuery })

  // Sin datos de contacto del usuario en el aviso: el profesional responde
  // DENTRO de Nüra, que es donde queda el registro de lo que pasó. Dar el
  // telefono de una madre a alguien que aun no ha dicho que si es otra cosa.
  const cuerpo = [
    `Hola${suNombre ? ` ${suNombre}` : ''}, soy Nüra.`,
    dequien
      ? `${dequien} te ha escrito buscando ayuda:`
      : 'Alguien te ha escrito buscando ayuda:',
    '',
    presentacion ? `«${presentacion}»` : '',
    '',
    'Puedes responderle desde Nüra. Si no te viene bien, no pasa nada — dilo y buscamos a otra persona.',
  ].filter(l => l !== undefined).join('\n')

  return {
    via,
    destino: String(contacto).trim(),
    asunto: dequien ? `${dequien} te busca en Nüra` : 'Alguien te busca en Nüra',
    cuerpo,
  }
}

/**
 * Un enlace que abre el canal del profesional con el mensaje ya escrito.
 * Sirve para la salida A sin backend: lo abre quien avisa.
 */
export function enlaceDeAviso(aviso) {
  if (!aviso) return null
  if (aviso.via === 'movil') {
    const num = aviso.destino.replace(/[^\d+]/g, '').replace(/^00/, '+')
    const tel = num.startsWith('+') ? num.slice(1) : (num.length === 9 ? '34' + num : num)
    return `https://wa.me/${tel}?text=${encodeURIComponent(aviso.cuerpo)}`
  }
  return `mailto:${encodeURIComponent(aviso.destino)}?subject=${encodeURIComponent(aviso.asunto)}&body=${encodeURIComponent(aviso.cuerpo)}`
}
