export function showToast(message: string, root: ParentNode = document.body): void {
  const toast = document.createElement('div')
  toast.className = 'toast'
  toast.textContent = message
  toast.setAttribute('role', 'status')
  toast.setAttribute('aria-live', 'polite')
  toast.setAttribute('aria-atomic', 'true')

  const host = root instanceof HTMLElement ? root : document.body
  host.appendChild(toast)
  window.setTimeout(() => toast.remove(), 2200)
}
