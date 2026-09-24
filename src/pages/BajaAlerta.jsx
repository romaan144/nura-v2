// ── «Deja de avisarme» ──────────────────────────────────────────────────
// Aqui llega el enlace del correo de «ha llegado alguien». Sin cuenta y sin
// preguntar otra vez: quien pulsa el enlace quiere dejar de recibirlo, y se
// hace al entrar. El enlace solo sirve para borrar ESE aviso.

import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { BellOff } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import { Button } from '../components/ui'
import { quitarPorBaja } from '../utils/alertas'
import styles from './Siguiendo.module.css'

export default function BajaAlerta() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [estado, setEstado] = useState('cargando')   // cargando | hecho | ya | fallo

  useEffect(() => {
    let vivo = true
    quitarPorBaja(token).then(r => { if (vivo) setEstado(r.ok ? 'hecho' : r.yaNoExiste ? 'ya' : 'fallo') })
    return () => { vivo = false }
  }, [token])

  const texto = {
    cargando: ['Un momento…', ''],
    hecho: ['Ya no te avisaremos', 'Hemos borrado ese aviso. Si vuelves a necesitarlo, pídemelo cuando busques.'],
    ya: ['Este aviso ya no existe', 'Lo borraste antes o caducó a los 3 meses. No te llegará nada más.'],
    fallo: ['No hemos podido borrarlo ahora', 'Vuelve a abrir el enlace en un momento. Si sigue fallando, quítalo desde tu perfil en Nüra.'],
  }[estado]

  return (
    <div className={styles.page}>
      <PageHeader showBack />
      <main style={{ maxWidth: 420, margin: '0 auto', padding: 'var(--space-32) var(--space-20)', textAlign: 'center' }}>
        <div aria-hidden="true" style={{ width: 64, height: 64, borderRadius: '50%', margin: '0 auto var(--space-16)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--purple-05)', color: 'var(--purple)' }}>
          <BellOff size={28} />
        </div>
        <h1 role="status" style={{ fontSize: 'var(--text-heading)', fontWeight: 800, color: 'var(--ink-primary)', margin: '0 0 var(--space-8)', letterSpacing: '-0.4px' }}>{texto[0]}</h1>
        <p style={{ fontSize: 'var(--text-base)', color: 'var(--ink-secondary)', lineHeight: 1.5, margin: '0 0 var(--space-24)' }}>{texto[1]}</p>
        {estado !== 'cargando' && <Button variant="primary" full onClick={() => navigate('/')}>Ir a Nüra</Button>}
      </main>
    </div>
  )
}
