import { defineConfig } from 'vite'

export default defineConfig({
  // Hash router => no server rewrite needed, works on file:// and any static host
  base: './',
  build: {
    target: 'es2022',
    cssCodeSplit: true,
    // Keep chunks small for bad connections
    chunkSizeWarningLimit: 40,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Keep each article in its own chunk (lazy loaded)
          if (id.includes('/src/articles/')) return 'article-' + id.split('/articles/')[1].split('/')[0].split('.')[0]
          if (id.includes('/src/components/')) return 'components'
        },
        // Short hashed filenames + predictable
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    // No sourcemaps in prod for smaller payload (keep for dev)
    sourcemap: false
  },
  // Preload only critical; rest is lazy
  server: {
    headers: {
      // Hint for perf on dev
      'Cache-Control': 'no-store'
    }
  }
})
