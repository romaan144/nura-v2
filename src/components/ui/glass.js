// Material compartido para los controles que aún usan estilos inline.
// Solo presentación: los estados, permisos y manejadores viven en cada pantalla.
const control = {
  background: 'var(--glass-control)', border: '1px solid var(--glass-edge)',
  borderRadius: 'var(--radius-full)', boxShadow: 'var(--glass-control-shadow)',
}
const panel = { ...control, background: 'var(--glass-panel)', borderRadius: 'var(--radius-glass)', boxShadow: 'var(--glass-panel-shadow)' }
const floating = { ...control, background: 'var(--glass-floating)', boxShadow: 'var(--glass-floating-shadow)', WebkitBackdropFilter: 'var(--glass-filter)', backdropFilter: 'var(--glass-filter)' }
export default {
  control, panel, floating,
  field: { ...control, borderRadius: 20, color: 'var(--ink-primary)' },
  circle: { ...floating, width: 44, height: 44, minHeight: 44, padding: 0, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' },
  selected: { ...control, background: 'var(--glass-selected)', borderColor: 'var(--glass-selected-edge)', color: 'var(--glass-selected-ink)' },
  primary: { ...control, background: 'var(--grad-main)', borderColor: '#FFFFFF40', color: 'white', boxShadow: 'var(--glass-primary-shadow)' },
  disabled: { ...control, background: 'var(--glass-control)', color: 'var(--ink-tertiary)', boxShadow: 'var(--glass-shine)' },
}
