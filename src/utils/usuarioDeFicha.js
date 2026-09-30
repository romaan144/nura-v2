// ── QUIÉN ES, CUANDO ENTRA CON SU CUENTA EN UN MÓVIL QUE NO LE CONOCE ────
// Lo usan «Entrar» y la vuelta del correo de confirmación (Perfil). Con su
// ficha (op `reclamar-ficha`) es la profesional; sin ficha, alguien que busca.

/** El usuario del móvil a partir de su ficha pública. */
export function usuarioDeFicha(h, email = '') {
  return {
    name: h.name || String(email).split('@')[0], isHelper: true, helperId: h.id, joined: new Date().toISOString(),
    helperProfile: { specialty: h.specialty || '', zone: h.zone || '', price: h.price || '', contacto: h.contacto || '',
      formation: h.bio || '', modality: h.online ? 'Las dos' : 'Presencial' },
  }
}

/** Sin ficha: quien busca ayuda, con el nombre de su correo. */
export function usuarioCliente(email = '') {
  return { name: String(email).trim().split('@')[0] || 'Hola', isHelper: false, joined: new Date().toISOString() }
}
