/**
 * Lazy loader utilities for bad connections.
 * - Idle prefetch
 * - IntersectionObserver lazy image
 * - Save-Data aware
 */

export function isSaveData(): boolean {
  // navigator.connection.saveData. Respect data-saver mode.
  const conn = navigator as unknown as {
    connection?: { saveData?: boolean; effectiveType?: string }
  }
  return Boolean(conn.connection?.saveData)
}

export function isSlowConnection(): boolean {
  const conn = navigator as unknown as {
    connection?: { effectiveType?: string; saveData?: boolean }
  }
  const t = conn.connection?.effectiveType
  return t === 'slow-2g' || t === '2g' || Boolean(conn.connection?.saveData)
}

/** Lazy image: set data-src and call observe() */
export function observeLazyImages(root: ParentNode = document): void {
  const imgs = root.querySelectorAll<HTMLImageElement>('img[data-src]')
  if (imgs.length === 0) return

  // If save-data is enabled, load immediately at low priority.
  if (isSaveData()) {
    imgs.forEach((img) => {
      img.src = img.dataset.src ?? ''
      img.removeAttribute('data-src')
    })
    return
  }

  if (!('IntersectionObserver' in window)) {
    imgs.forEach((img) => {
      img.src = img.dataset.src ?? ''
      img.removeAttribute('data-src')
    })
    return
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue
        const img = e.target as HTMLImageElement
        const src = img.dataset.src
        if (src) {
          // Use decode() to avoid layout jank if supported
          img.src = src
          if (img.decode) {
            void img.decode().catch(() => {})
          }
        }
        img.removeAttribute('data-src')
        io.unobserve(img)
      }
    },
    { rootMargin: '200px', threshold: 0.01 },
  )

  imgs.forEach((img) => io.observe(img))
}

/** Wrap an async loader with retry and an offline-friendly error path. */
export async function withRetry<T>(fn: () => Promise<T>, retries = 1): Promise<T> {
  let lastErr: unknown
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn()
    } catch (e) {
      lastErr = e
      if (i < retries) await new Promise((r) => setTimeout(r, 400 * (i + 1)))
    }
  }
  throw lastErr
}

/** Prefetch on idle at minimal priority. */
export function onIdle(cb: () => void, timeout = 2000): void {
  const ric = (
    window as unknown as {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => void
    }
  ).requestIdleCallback
  if (ric) ric(cb, { timeout })
  else setTimeout(cb, 300)
}
