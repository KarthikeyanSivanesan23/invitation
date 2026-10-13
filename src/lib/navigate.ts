/** Client-side route navigation used by the public album pages. Pushes a new
 *  path onto history and re-renders the SPA without a full page load; the
 *  router in App.tsx listens for `popstate` (which back/forward also fire). */
export function pushRoute(path: string) {
  if (window.location.pathname === path) return
  window.history.pushState(null, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

export function goHome() {
  if (window.location.pathname !== '/') {
    window.history.pushState(null, '', '/')
    window.dispatchEvent(new PopStateEvent('popstate'))
  }
}