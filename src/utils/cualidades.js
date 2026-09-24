// ── Lo que el cliente puede destacar al terminar (perfil vivo, pieza 1) ──
// Son toques, no texto: se cuentan sin IA y no se pueden malinterpretar.
// La lista cerrada vive TAMBIEN en el servidor (helpers-write, CUALIDADES):
// una clave que no este alli se descarta. Si se añade una, en los dos sitios.

export const ETIQUETA_CUALIDAD = {
  paciente: 'Paciente',
  puntual: 'Puntual',
  trato_cercano: 'Trato cercano',
  de_confianza: 'De confianza',
  resuelve_bien: 'Resuelve bien',
  explica_bien: 'Explica bien',
  motiva: 'Motiva',
  se_adapta: 'Se adapta',
  deja_limpio: 'Deja todo limpio',
  precio_claro: 'Precio claro',
  amable: 'Amable',
  cuidadoso: 'Cuidadoso con todo',
  rapido: 'Rápido',
  buen_consejo: 'Buen consejo',
  creativo: 'Creativo',
}

// Cinco por oficio: las que un cliente de ese oficio sabe juzgar.
const POR_CATEGORIA = {
  cuidado:    ['paciente', 'trato_cercano', 'puntual', 'de_confianza', 'resuelve_bien'],
  salud:      ['explica_bien', 'trato_cercano', 'puntual', 'de_confianza', 'paciente'],
  logopedia:  ['paciente', 'explica_bien', 'motiva', 'se_adapta', 'trato_cercano'],
  clases:     ['explica_bien', 'paciente', 'motiva', 'puntual', 'se_adapta'],
  idiomas:    ['explica_bien', 'motiva', 'se_adapta', 'puntual', 'paciente'],
  entrenador: ['motiva', 'se_adapta', 'explica_bien', 'puntual', 'buen_consejo'],
  tecnico:    ['puntual', 'deja_limpio', 'resuelve_bien', 'precio_claro', 'explica_bien'],
  hogar:      ['puntual', 'deja_limpio', 'cuidadoso', 'de_confianza', 'rapido'],
  mascotas:   ['cuidadoso', 'de_confianza', 'puntual', 'trato_cercano', 'buen_consejo'],
  legal:      ['explica_bien', 'resuelve_bien', 'precio_claro', 'rapido', 'de_confianza'],
  diseno:     ['creativo', 'se_adapta', 'rapido', 'precio_claro', 'explica_bien'],
  tecnologia: ['resuelve_bien', 'explica_bien', 'rapido', 'precio_claro', 'paciente'],
  eventos:    ['creativo', 'puntual', 'amable', 'se_adapta', 'precio_claro'],
  automocion: ['resuelve_bien', 'precio_claro', 'rapido', 'explica_bien', 'de_confianza'],
}
const POR_DEFECTO = ['puntual', 'amable', 'resuelve_bien', 'de_confianza', 'precio_claro']

// Las categorias de la base de datos que la app agrupa bajo una suya.
const ALIAS = { educacion: 'clases', matematicas: 'clases', limpieza: 'hogar' }

export function cualidadesPara(categoria) {
  const c = ALIAS[categoria] || categoria
  return POR_CATEGORIA[c] || POR_DEFECTO
}

export const MAX_CUALIDADES = 3
