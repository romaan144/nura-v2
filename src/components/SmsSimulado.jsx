import { MessageSquare } from 'lucide-react'
import styles from '../pages/Access.module.css'

// El SMS de la demostración: no se paga un proveedor de SMS hasta el
// lanzamiento (Sergio, 2026-10-03), así que el mensaje «llega» aquí arriba,
// como la notificación del móvil. Al tocarlo se rellena el código.
export default function SmsSimulado({ codigo, onUsar }) {
  if (!codigo) return null
  return (
    <button type="button" className={styles.sms} onClick={() => onUsar(codigo)} aria-label={`SMS de Nüra: tu código es ${codigo}. Tócalo para escribirlo.`}>
      <span className={styles.smsIcono} aria-hidden="true"><MessageSquare size={19} /></span>
      <span>
        <span className={styles.smsDe}>Mensajes · ahora</span>
        <span className={styles.smsTexto}>Tu código de Nüra es {codigo}. No se lo digas a nadie.</span>
      </span>
    </button>
  )
}
