import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import styles from '../pages/Access.module.css'

// Solo presentación: conserva valor, validación y autocompletado del formulario.
export default function PasswordField(props) {
  const [visible, setVisible] = useState(false)
  return <div className={styles.passwordWrap}>
    <input {...props} type={visible ? 'text' : 'password'} className={styles.passwordInput} />
    <button type="button" className={styles.reveal} aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
      aria-pressed={visible} onClick={() => setVisible(v => !v)}>
      {visible ? <EyeOff size={19} aria-hidden="true" /> : <Eye size={19} aria-hidden="true" />}
    </button>
  </div>
}
