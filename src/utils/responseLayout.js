// Texto completo en unidades pequeñas, sin cortar expresiones en negrita.
export function splitResponseText(text, limit = 160) {
  // Una negrita y el signo pegado a ella («**Sergio**.») son UNA palabra:
  // separados, se unían con un espacio y salía «Sergio .».
  const words = String(text).match(/(?:\*\*[^*]+\*\*|[^\s*])+|\S+/g) || []
  // Se corta al final de una frase, no a mitad: antes, a los 160 caracteres,
  // la última palabra («madre".») caía sola en el trozo siguiente, en letra
  // pequeña bajo el titular. Solo si no hay ningún final de frase razonable
  // dentro del límite se corta entre palabras.
  const cierraFrase = w => /[.!?…][»"”')\]*]*$/.test(w)
  const largo = ws => ws.join(' ').length
  const chunks = []
  let chunk = []
  for (const word of words) {
    if (chunk.length && largo(chunk) + word.length + 1 > limit) {
      let corte = -1
      for (let k = chunk.length - 1; k > 0; k--) {
        if (cierraFrase(chunk[k - 1]) && largo(chunk.slice(0, k)) >= limit / 4) { corte = k; break }
      }
      if (corte > 0) { chunks.push(chunk.slice(0, corte).join(' ')); chunk = chunk.slice(corte) }
      else { chunks.push(chunk.join(' ')); chunk = [] }
      // Lo que se arrastra más la palabra nueva aún podría no caber.
      if (chunk.length && largo(chunk) + word.length + 1 > limit) { chunks.push(chunk.join(' ')); chunk = [] }
    }
    chunk.push(word)
  }
  if (chunk.length) chunks.push(chunk.join(' '))
  return chunks
}

export function paginateResponse(sizes, sections, capacity, gap = 12) {
  const pages = []
  let page = { items: [], height: 0 }
  let lastSection = ''
  sizes.forEach((height, index) => {
    if (height <= 0) return
    const top = page.items.length ? page.height + gap : 0
    if (page.items.length && (top + height > capacity || sections[index] !== lastSection)) {
      pages.push(page)
      page = { items: [], height: 0 }
    }
    const y = page.items.length ? page.height + gap : 0
    page.items.push({ index, top: y })
    page.height = y + height
    lastSection = sections[index]
  })
  if (page.items.length) pages.push(page)
  return pages
}
