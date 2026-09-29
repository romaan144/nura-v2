import { Fragment } from 'react'

// «**Paula** tiene…» → Paula en negrita, sin asteriscos a la vista.
// Solo para textos de Nüra (ver utils/texto.js).
export default function ConNegritas({ texto }) {
  const trozos = String(texto ?? '').split(/\*\*(.+?)\*\*/g)
  return trozos.map((t, i) => i % 2 ? <strong key={i}>{t}</strong> : <Fragment key={i}>{t}</Fragment>)
}
