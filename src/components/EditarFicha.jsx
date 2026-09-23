import { useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { useUser } from '../context/UserContext'

// ── EDITAR MI FICHA ────────────────────────────────────────────────────
//
// Etapa 2 de docs/estudio-perfil.md. Despues del alta, lo unico que un
// profesional podia cambiar era su cita personal. Si Marta subia la tarifa,
// cambiaba de barrio o terminaba un master, no habia manera de reflejarlo.
//
// Los campos son EXACTAMENTE los del alta (mismas claves en helperProfile),
// para que editar y darse de alta sean la misma ficha.
//
// LIMITE HONESTO: se guarda en el movil del profesional. Su ficha publica
// (la fila de Supabase) no cambia hasta que exista identidad del
// profesional — etapa 6 —, porque sin saber quien es, cualquiera podria
// editar la ficha de cualquiera. La hoja lo dice, en una linea, sin
// dramatizar.

const CAMPOS = [
  { k: 'specialty',      label: 'Tu especialidad',        ej: 'Logopeda infantil' },
  { k: 'formation',      label: 'Tu formación',           ej: 'Grado en Logopedia, UB', largo: true },
  { k: 'zone',           label: 'Dónde trabajas',         ej: 'Gràcia, Barcelona' },
  { k: 'price',          label: 'Tu tarifa',              ej: '45 € la sesión' },
  { k: 'differentiator', label: 'Qué te diferencia',      ej: 'Trabajo con juego, sin prisas', largo: true },
  { k: 'contacto',       label: 'Dónde te avisamos',      ej: 'Tu móvil o tu correo',
    ayuda: 'Cuando alguien te escriba, el aviso con su mensaje te llegará aquí.' },
]
const MODOS = ['Presencial', 'Online', 'Las dos']

export default function EditarFicha({ onClose }) {
  const { user, updateUser } = useUser()
  const hp = user?.helperProfile || {}
  const [v, setV] = useState(() => Object.fromEntries(
    [...CAMPOS.map(c => [c.k, hp[c.k] || '']), ['modality', hp.modality || '']]))
  const cambiado = Object.keys(v).some(k => (v[k] || '').trim() !== (hp[k] || '').trim())

  const vinculada = user?.helperId != null
  const [guardando, setGuardando] = useState(false)
  const [fallo, setFallo] = useState('')

  async function guardar() {
    const limpio = Object.fromEntries(Object.entries(v).map(([k, x]) => [k, (x || '').trim()]))
    updateUser({ helperProfile: { ...hp, ...limpio } })
    if (!vinculada) { onClose(); return }
    // ── A LA FICHA PUBLICA (etapa 6b) ──────────────────────────────────
    // Con la ficha vinculada, el cambio se escribe en Supabase con la sesion
    // de la profesional. La base de datos solo le deja tocar SU fila
    // (owner_id = su cuenta) y SOLO estas columnas: nunca verificada, nota
    // ni valoraciones (ver docs/lanzamiento-cuentas.md). Mismo mapeo que el
    // alta: la bio es formacion + lo que le diferencia.
    setGuardando(true); setFallo('')
    try {
      const { cuentas } = await import('../utils/cuenta')
      const cambios = {
        specialty: limpio.specialty || '',
        bio: [limpio.formation, limpio.differentiator].filter(Boolean).join('. '),
        zone: limpio.zone || 'Barcelona',
        price: limpio.price || null,
        online: /online|las dos/i.test(limpio.modality || ''),
        contacto: limpio.contacto || null,
      }
      const { data, error } = await cuentas.from('helpers').update(cambios).eq('id', user.helperId).select('id')
      if (error || !data?.length) throw error || new Error('ninguna fila')
      onClose()
    } catch {
      setFallo('Se ha guardado en tu móvil, pero no en tu ficha pública. Revisa tu conexión y vuelve a guardar.')
    } finally { setGuardando(false) }
  }

  const campo = {
    width: '100%', boxSizing: 'border-box', padding: 'var(--space-12) var(--space-14)',
    border: '1px solid var(--ink-border)', borderRadius: 'var(--radius-card)',
    fontSize: 'var(--text-base)', fontFamily: 'inherit', color: 'var(--ink-primary)',
    background: 'white', outline: 'none', resize: 'none', lineHeight: 1.45,
  }

  // PORTAL AL BODY: montada dentro del perfil, la hoja quedaba DEBAJO de la
  // barra de navegacion flotante (la pantalla del perfil crea su propia capa,
  // y ningun z-index sale de ella). La barra tapaba "Guardar cambios": el
  // toque caia en la pestaña "Perfil" y no se guardaba nada. Medido con
  // elementFromPoint.
  return createPortal(
    <div role="dialog" aria-modal="true" aria-labelledby="editar-ficha-titulo"
      style={{ position: 'fixed', inset: 0, zIndex: 900, background: 'var(--paper)',
        display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: 'max(env(safe-area-inset-top, 0px), var(--space-16)) var(--space-16) var(--space-8)' }}>
        <h2 id="editar-ficha-titulo" style={{ margin: 0, fontFamily: 'var(--font-voice)',
          fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--ink-primary)', letterSpacing: '-0.5px' }}>
          Tu ficha
        </h2>
        <button onClick={onClose} aria-label="Cerrar sin guardar"
          style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-secondary)' }}>
          <X size={22} />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 var(--space-16) var(--space-24)' }}>
        <p style={{ margin: '0 0 var(--space-20)', fontSize: 'var(--text-sm)', color: 'var(--ink-tertiary)', lineHeight: 1.5 }}>
          {vinculada ? 'Lo que cambies se publica en tu ficha.' : 'Por ahora, estos cambios se guardan en tu móvil.'}
        </p>

        {CAMPOS.map(c => (
          <div key={c.k} style={{ marginBottom: 'var(--space-16)' }}>
            <label htmlFor={'f-' + c.k} style={{ display: 'block', margin: '0 0 var(--space-6)',
              fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--ink-primary)' }}>{c.label}</label>
            {c.largo
              ? <textarea id={'f-' + c.k} rows={3} value={v[c.k]} placeholder={c.ej}
                  onChange={e => setV({ ...v, [c.k]: e.target.value })} style={campo} />
              : <input id={'f-' + c.k} value={v[c.k]} placeholder={c.ej}
                  onChange={e => setV({ ...v, [c.k]: e.target.value })} style={campo} />}
            {c.ayuda && <p style={{ margin: 'var(--space-6) 0 0', fontSize: 'var(--text-xs)',
              color: 'var(--ink-tertiary)', lineHeight: 1.45 }}>{c.ayuda}</p>}
          </div>
        ))}

        <div role="group" aria-labelledby="f-modo" style={{ marginBottom: 'var(--space-16)' }}>
          <p id="f-modo" style={{ margin: '0 0 var(--space-8)', fontSize: 'var(--text-sm)',
            fontWeight: 700, color: 'var(--ink-primary)' }}>Cómo atiendes</p>
          <div style={{ display: 'flex', gap: 'var(--space-8)' }}>
            {MODOS.map(m => {
              const on = (v.modality || '').toLowerCase() === m.toLowerCase()
              return (
                <button key={m} onClick={() => setV({ ...v, modality: m })} aria-pressed={on}
                  style={{ flex: 1, minHeight: 44, borderRadius: 'var(--radius-full)', cursor: 'pointer',
                    fontFamily: 'inherit', fontSize: 'var(--text-sm)', fontWeight: 600,
                    border: on ? 'none' : '1px solid var(--ink-border)',
                    background: on ? 'var(--purple)' : 'white',
                    color: on ? 'white' : 'var(--ink-secondary)' }}>{m}</button>
              )
            })}
          </div>
        </div>
      </div>

      {fallo && <p role="alert" style={{ margin: 0, padding: 'var(--space-10) var(--space-16) 0', fontSize: 'var(--text-sm)',
        color: 'var(--red-ink)', lineHeight: 1.45 }}>{fallo}</p>}
      <div style={{ display: 'flex', gap: 'var(--space-8)',
        padding: 'var(--space-12) var(--space-16) max(env(safe-area-inset-bottom, 0px), var(--space-16))',
        borderTop: '1px solid var(--ink-border)', background: 'var(--paper)' }}>
        <button onClick={onClose} style={{ flex: 1, minHeight: 48, background: 'none',
          border: '1px solid var(--ink-border)', borderRadius: 'var(--radius-full)', cursor: 'pointer',
          fontFamily: 'inherit', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--ink-secondary)' }}>
          Cancelar
        </button>
        <button onClick={guardar} disabled={!cambiado || guardando} style={{ flex: 2, minHeight: 48, border: 'none',
          borderRadius: 'var(--radius-full)', cursor: cambiado ? 'pointer' : 'default',
          fontFamily: 'inherit', fontSize: 'var(--text-sm)', fontWeight: 700,
          background: cambiado ? 'var(--purple)' : 'rgba(33,29,51,0.08)',
          color: cambiado ? 'white' : 'var(--ink-tertiary)' }}>
          {guardando ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </div>
    </div>,
    document.body
  )
}
