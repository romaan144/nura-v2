const validId = id => (typeof id === 'string' && id.trim().length > 0)
  || (typeof id === 'number' && Number.isFinite(id))

export function hasFollowed(ids, id) {
  return validId(id) && ids.some(saved => String(saved) === String(id))
}

// Una lista vacía guardada es una elección; nunca se rellena con la demo.
// following tiene prioridad para no resucitar favoritos antiguos eliminados.
export function initialFollowing(stored, legacy, demoMode) {
  const source = Array.isArray(stored) ? stored
    : Array.isArray(legacy) ? legacy : demoMode ? [1, 5] : []
  return source.reduce((ids, id) => addFollowed(ids, id), [])
}

export function addFollowed(ids, id) {
  return !validId(id) || hasFollowed(ids, id) ? ids : [...ids, id]
}

export function removeFollowed(ids, id) {
  return ids.filter(saved => String(saved) !== String(id))
}
