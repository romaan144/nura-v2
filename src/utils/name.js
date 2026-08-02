// ── Name utilities ───────────────────────────────────────────────────────
// 'DJ' entra por medicion: de los 122 nombres del dataset, era el UNICO en
// que esta funcion y la copia de introLetter.js discrepaban — y la copia
// tenia razon. A "DJ Marc Mas" le llamabamos "DJ".
const TITLE_PREFIXES = new Set(['Dra.','Dr.','Prof.','Lic.','D.','Dña.','Don','Sr.','Sra.','Mr.','Ms.','Mrs.','DJ'])

export function getFirstName(fullName) {
  if (!fullName) return ''
  const parts = fullName.trim().split(/\s+/)
  for (const part of parts) {
    if (!TITLE_PREFIXES.has(part) && part.length > 1) return part
  }
  return parts[0] || ''
}
