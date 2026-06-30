// ── Name utilities ───────────────────────────────────────────────────────
const TITLE_PREFIXES = new Set(['Dra.','Dr.','Prof.','Lic.','D.','Dña.','Don','Sr.','Sra.','Mr.','Ms.','Mrs.'])

export function getFirstName(fullName) {
  if (!fullName) return ''
  const parts = fullName.trim().split(/\s+/)
  for (const part of parts) {
    if (!TITLE_PREFIXES.has(part) && part.length > 1) return part
  }
  return parts[0] || ''
}
