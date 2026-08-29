/** Tiny DOM helpers. No framework, keeping the bundle small. */

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, string | boolean | null | undefined> = {},
  ...children: (string | Node | null | undefined)[]
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag)
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue
    if (v === true) node.setAttribute(k, '')
    else if (k === 'class' || k === 'className') node.className = v as string
    else node.setAttribute(k === 'className' ? 'class' : k, v as string)
  }
  for (const c of children) {
    if (c == null) continue
    node.append(typeof c === 'string' ? document.createTextNode(c) : c)
  }
  return node
}

export function htmlToFragment(html: string): DocumentFragment {
  const tpl = document.createElement('template')
  tpl.innerHTML = html.trim()
  return tpl.content
}

export function clear(node: Element): void {
  while (node.firstChild) node.removeChild(node.firstChild)
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
