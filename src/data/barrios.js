// ── Los barrios de Barcelona, para entender «cerca de Gràcia» ────────────
//
// Antes la busqueda no entendia la zona y las tarjetas enseñaban una
// distancia INVENTADA («a 0,8 km»): Nüra no sabe donde esta nadie. Ahora,
// si la persona nombra su barrio, se mide de verdad entre el centro de su
// barrio y el del profesional. Si no lo nombra, no se enseña ninguna
// distancia.
//
// Los centros son aproximados (el centro del barrio, no una direccion):
// sirven para ordenar por cercania y decir «a 1,2 km de Gràcia», nada mas.
// No se guarda el barrio de nadie en ningun sitio: vale para esa busqueda.

export const BARRIOS = [
  { nombre: 'Gràcia', lat: 41.4036, lng: 2.1560, alias: ['gracia', 'vila de gracia'] },
  { nombre: 'Vallcarca', lat: 41.4130, lng: 2.1440, alias: ['vallcarca'] },
  { nombre: 'El Putxet', lat: 41.4080, lng: 2.1420, alias: ['putxet', 'el putxet'] },
  { nombre: 'Eixample', lat: 41.3888, lng: 2.1590, alias: ['eixample', "l'eixample", 'ensanche'] },
  { nombre: 'Dreta de l\'Eixample', lat: 41.3950, lng: 2.1680, alias: ['dreta eixample', "dreta de l'eixample", 'derecha del ensanche'] },
  { nombre: 'Esquerra de l\'Eixample', lat: 41.3850, lng: 2.1520, alias: ['esquerra eixample', "esquerra de l'eixample", 'izquierda del ensanche'] },
  { nombre: 'Sagrada Família', lat: 41.4036, lng: 2.1744, alias: ['sagrada familia'] },
  { nombre: 'Fort Pienc', lat: 41.3960, lng: 2.1820, alias: ['fort pienc'] },
  { nombre: 'Sant Antoni', lat: 41.3780, lng: 2.1610, alias: ['sant antoni', 'san antonio'] },
  { nombre: 'Sarrià', lat: 41.4000, lng: 2.1220, alias: ['sarria'] },
  { nombre: 'Sant Gervasi', lat: 41.4010, lng: 2.1390, alias: ['sant gervasi', 'san gervasio', 'sarria sant gervasi', 'sarria-sant gervasi'] },
  { nombre: 'La Bonanova', lat: 41.4050, lng: 2.1300, alias: ['bonanova', 'la bonanova'] },
  { nombre: 'Pedralbes', lat: 41.3890, lng: 2.1120, alias: ['pedralbes'] },
  { nombre: 'Les Corts', lat: 41.3850, lng: 2.1300, alias: ['les corts', 'las corts'] },
  { nombre: 'Sants', lat: 41.3750, lng: 2.1370, alias: ['sants'] },
  { nombre: 'Hostafrancs', lat: 41.3750, lng: 2.1430, alias: ['hostafrancs'] },
  { nombre: 'Poble Sec', lat: 41.3730, lng: 2.1620, alias: ['poble sec', 'poble-sec', 'pueblo seco'] },
  { nombre: 'Montjuïc', lat: 41.3640, lng: 2.1580, alias: ['montjuic'] },
  { nombre: 'Raval', lat: 41.3800, lng: 2.1690, alias: ['raval', 'el raval'] },
  { nombre: 'Gòtic', lat: 41.3830, lng: 2.1770, alias: ['gotic', 'barri gotic', 'barrio gotico', 'gotico'] },
  { nombre: 'Born', lat: 41.3850, lng: 2.1830, alias: ['born', 'el born', 'la ribera', 'sant pere'] },
  { nombre: 'Ciutat Vella', lat: 41.3820, lng: 2.1760, alias: ['ciutat vella', 'ciudad vieja', 'centro de barcelona', 'casco antiguo'] },
  { nombre: 'Barceloneta', lat: 41.3800, lng: 2.1890, alias: ['barceloneta', 'la barceloneta'] },
  { nombre: 'Vila Olímpica', lat: 41.3890, lng: 2.1970, alias: ['vila olimpica', 'villa olimpica'] },
  { nombre: 'Poblenou', lat: 41.4000, lng: 2.2000, alias: ['poblenou', 'poble nou', 'pueblo nuevo'] },
  { nombre: 'Diagonal Mar', lat: 41.4090, lng: 2.2160, alias: ['diagonal mar'] },
  { nombre: 'Sant Martí', lat: 41.4180, lng: 2.1990, alias: ['sant marti', 'san marti', 'san martin'] },
  { nombre: 'Glòries', lat: 41.4030, lng: 2.1870, alias: ['glories'] },
  { nombre: 'Clot', lat: 41.4090, lng: 2.1870, alias: ['clot', 'el clot'] },
  { nombre: 'La Verneda', lat: 41.4240, lng: 2.2020, alias: ['verneda', 'la verneda'] },
  { nombre: 'La Sagrera', lat: 41.4230, lng: 2.1900, alias: ['sagrera', 'la sagrera'] },
  { nombre: 'Sant Andreu', lat: 41.4350, lng: 2.1900, alias: ['sant andreu', 'san andres'] },
  { nombre: 'Guinardó', lat: 41.4180, lng: 2.1700, alias: ['guinardo', 'el guinardo'] },
  { nombre: 'Horta', lat: 41.4300, lng: 2.1600, alias: ['horta'] },
  { nombre: 'Horta-Guinardó', lat: 41.4200, lng: 2.1650, alias: ['horta guinardo', 'horta-guinardo'] },
  { nombre: 'El Carmel', lat: 41.4230, lng: 2.1550, alias: ['carmel', 'el carmel', 'el carmelo'] },
  { nombre: 'Nou Barris', lat: 41.4420, lng: 2.1770, alias: ['nou barris'] },
  { nombre: 'Verdun', lat: 41.4430, lng: 2.1730, alias: ['verdun'] },
  { nombre: 'L\'Hospitalet', lat: 41.3597, lng: 2.0997, alias: ['hospitalet', "l'hospitalet", 'hospitalet de llobregat'] },
  { nombre: 'Badalona', lat: 41.4500, lng: 2.2474, alias: ['badalona'] },
  { nombre: 'Esplugues', lat: 41.3760, lng: 2.0880, alias: ['esplugues', 'esplugues de llobregat'] },
  { nombre: 'Santa Coloma', lat: 41.4520, lng: 2.2080, alias: ['santa coloma', 'santa coloma de gramenet'] },
]

const sinTildes = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’`]/g, "'")
const escapar = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// Los alias mas largos primero: «sarria sant gervasi» antes que «sarria».
const TODOS = BARRIOS.flatMap(b => b.alias.map(a => ({ a: sinTildes(a), b }))).sort((x, y) => y.a.length - x.a.length)

/** El barrio que nombra una frase («cerca de Gràcia», «vivo en Sants»), o null. */
export function barrioEnTexto(texto) {
  const t = ' ' + sinTildes(texto).replace(/[^a-z0-9' -]/g, ' ') + ' '
  for (const { a, b } of TODOS) {
    if (new RegExp(`[^a-z0-9']${escapar(a)}[^a-z0-9']`).test(t)) return b
  }
  return null
}

/** El barrio de la zona de un profesional («Gràcia», «Dreta Eixample»…), o null. */
export function barrioDeZona(zona) {
  if (!zona) return null
  const z = sinTildes(zona).trim()
  return BARRIOS.find(b => sinTildes(b.nombre) === z) || barrioEnTexto(zona)
}

/** Kilometros en linea recta entre dos barrios, con un decimal. */
export function kmEntre(a, b) {
  if (!a || !b) return null
  const R = 6371, rad = x => x * Math.PI / 180
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2
  return Math.round(2 * R * Math.asin(Math.sqrt(h)) * 10) / 10
}
