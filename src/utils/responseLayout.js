// Texto completo en unidades pequeñas, sin cortar expresiones en negrita.
export function splitResponseText(text, limit = 160) {
  const words = String(text).match(/\*\*[^*]+\*\*|\S+/g) || []
  const chunks = []
  let chunk = ''
  for (const word of words) {
    if (chunk && chunk.length + word.length + 1 > limit) { chunks.push(chunk); chunk = '' }
    chunk += (chunk ? ' ' : '') + word
  }
  if (chunk) chunks.push(chunk)
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
