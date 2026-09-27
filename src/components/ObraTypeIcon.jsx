import { ClipboardList, Wrench, Lightbulb, TrendingUp, Newspaper, GraduationCap } from 'lucide-react'

const ICONS = { caso: ClipboardList, trabajo: Wrench, consejo: Lightbulb, evolucion: TrendingUp, actualidad: Newspaper, hito: GraduationCap }
export default function ObraTypeIcon({ type }) {
  const Icon = ICONS[type] || ClipboardList
  return <Icon size={14} aria-hidden="true" style={{ verticalAlign: 'middle', marginRight: 4 }} />
}
