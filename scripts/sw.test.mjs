import { readFile } from 'node:fs/promises'
import { strict as assert } from 'node:assert'
import test from 'node:test'
import vm from 'node:vm'

const serviceWorkerSource = await readFile(new URL('../public/sw.js', import.meta.url), 'utf8')

function createFetchHarness({ cachedResponse, networkError }) {
  let fetchHandler
  const cache = {
    match: async () => cachedResponse,
    put: async () => {},
  }
  const cacheStorage = {
    match: async () => cachedResponse,
    open: async () => cache,
    keys: async () => [],
    delete: async () => true,
  }
  const self = {
    addEventListener(type, handler) {
      if (type === 'fetch') fetchHandler = handler
    },
    clients: { claim: async () => {} },
    skipWaiting: async () => {},
  }

  vm.runInNewContext(serviceWorkerSource, {
    self,
    caches: cacheStorage,
    fetch: async () => {
      throw networkError
    },
    URL,
    location: { origin: 'https://example.test' },
    Request,
    Response,
    Promise,
    console,
  })

  return async (request) => {
    let responsePromise
    fetchHandler({
      request,
      respondWith(value) {
        responsePromise = Promise.resolve(value)
      },
    })
    return responsePromise
  }
}

test('returns a Response when an uncached asset fails offline', async () => {
  const handleFetch = createFetchHarness({ networkError: new Error('offline') })
  const response = await handleFetch(new Request('https://example.test/assets/missing.js'))

  assert.ok(response instanceof Response)
  assert.equal(response.status, 503)
})

test('returns a Response when an uncached navigation fails offline', async () => {
  const handleFetch = createFetchHarness({ networkError: new Error('offline') })
  const response = await handleFetch(new Request('https://example.test/wiki'))

  assert.ok(response instanceof Response)
  assert.equal(response.status, 503)
})
