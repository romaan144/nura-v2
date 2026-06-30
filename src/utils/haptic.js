
// iOS Haptic Feedback
export function haptic(type = 'light') {
  if (window.navigator?.vibrate) {
    const patterns = { light: [10], medium: [20], heavy: [30], success: [10,50,10] }
    window.navigator.vibrate(patterns[type] || [10])
  }
}
