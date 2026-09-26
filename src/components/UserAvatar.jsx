// La misma identidad en Inicio, Perfil y la barra lateral: foto real o iniciales.
export default function UserAvatar({ user, className, decorative = false }) {
  const name = user?.name || 'Nüra'
  const initials = name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase()
  if (user?.avatar) return <img className={className} src={user.avatar} alt={decorative ? '' : name} />
  return <span className={`${className || ''} nura-user-initials`} role={decorative ? undefined : 'img'}
    aria-label={decorative ? undefined : name} aria-hidden={decorative || undefined}>{initials}</span>
}
