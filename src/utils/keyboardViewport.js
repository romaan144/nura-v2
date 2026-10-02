// El contenido conserva su altura. Safari puede además desplazar la ventana
// visual: se ancla su marco a offsetTop, sin modificar el scroll del contenido.
export function installKeyboardViewport(win = window, doc = document) {
  const viewport = win.visualViewport
  const root = doc.documentElement
  let baseline = viewport?.height || win.innerHeight
  let width = win.innerWidth
  let opened = false
  let previousHeight = baseline
  let frame
  const editable = () => {
    const el = doc.activeElement
    return el?.matches('textarea, input:not([type="checkbox"]):not([type="radio"]):not([type="button"]):not([type="submit"]), [contenteditable="true"]') && !el.readOnly ? el : null
  }
  const reveal = () => {
    if (!opened) return
    const host = doc.querySelector('.desktopMain')
    const field = editable()
    if (!host || !field || !host.contains(field)) return
    // Inicio no se desplaza: solo sube su cápsula (ver Home.module.css).
    if (host.dataset.screen === 'home') { host.scrollTop = 0; return }
    if (['chat', 'register-helper'].includes(host.dataset.screen)) {
      host.scrollTop = host.scrollHeight - host.clientHeight
      return
    }
    const box = field.getBoundingClientRect()
    const visible = host.getBoundingClientRect()
    const nav = [...doc.querySelectorAll('nav[aria-label="Navegación principal"]')]
      .map(el => el.getBoundingClientRect()).find(rect => rect.height > 0)
    const bottom = Math.min(visible.bottom - 24, nav ? nav.top - 16 : Infinity)
    if (box.height > bottom - visible.top - 16 || box.top < visible.top + 16) {
      host.scrollTop += box.top - visible.top - 16
    } else if (box.bottom > bottom) host.scrollTop += box.bottom - bottom
  }
  // offsetTop pertenece al viewport visual, no al scroll de desktopMain.
  // Actualizar SOLO el marco evita sumar el pan de Safari al scroll interno.
  const positionWindow = () => {
    if (win.innerWidth >= 768 || (viewport?.scale || 1) > 1.05) return
    const top = Math.max(0, viewport?.offsetTop || 0)
    const height = viewport?.height || win.innerHeight
    root.style.setProperty('--app-visible-top', `${top}px`)
    root.style.setProperty('--app-keyboard-inset', `${Math.max(0, win.innerHeight - height - top)}px`)
  }
  const clear = () => {
    delete root.dataset.keyboardOpen
    for (const key of ['--app-layout-height', '--app-visible-height', '--app-visible-top', '--app-keyboard-inset']) root.style.removeProperty(key)
  }
  const update = () => {
    if (win.innerWidth >= 768 || (viewport?.scale || 1) > 1.05) {
      opened = false
      clear()
      return
    }
    const height = viewport?.height || win.innerHeight
    if (Math.abs(win.innerWidth - width) > 40) {
      width = win.innerWidth
      baseline = Math.max(height, win.innerHeight)
    }
    const wasOpen = opened
    const host = doc.querySelector('.desktopMain')
    const atBottom = host && host.scrollHeight - host.clientHeight - host.scrollTop < 2
    const heightChanged = Math.abs(height - previousHeight) > 1
    previousHeight = height
    opened = baseline - height > 120 && Boolean(editable() || wasOpen)
    if (!opened) baseline = height
    root.style.setProperty('--app-layout-height', `${baseline}px`)
    root.style.setProperty('--app-visible-height', `${height}px`)
    positionWindow()
    if (opened) root.dataset.keyboardOpen = 'true'
    else {
      delete root.dataset.keyboardOpen
      if (wasOpen) {
        const host = doc.querySelector('.desktopMain')
        if (host) host.scrollTop = 0
      }
    }
    win.cancelAnimationFrame(frame)
    if (opened && (!wasOpen || (heightChanged && atBottom))) frame = win.requestAnimationFrame(reveal)
  }
  const focus = () => {
    if (!opened) baseline = viewport?.height || win.innerHeight
    update()
    if (opened) {
      win.cancelAnimationFrame(frame)
      frame = win.requestAnimationFrame(reveal)
    }
  }
  update()
  doc.addEventListener('focusin', focus)
  viewport?.addEventListener('resize', update)
  viewport?.addEventListener('scroll', positionWindow)
  win.addEventListener('resize', update)
  return () => {
    win.cancelAnimationFrame(frame)
    doc.removeEventListener('focusin', focus)
    viewport?.removeEventListener('resize', update)
    viewport?.removeEventListener('scroll', positionWindow)
    win.removeEventListener('resize', update)
    clear()
  }
}
