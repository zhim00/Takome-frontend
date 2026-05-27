import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import UnoCSS from 'unocss/vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  base: '/novel/',
  plugins: [
    UnoCSS(),
    vue(),
    vueDevTools(),
  ],
  server: {
    port: 5174,
    strictPort: true,
  },
  resolve: {
    alias: {
      '@takome/shared-auth': fileURLToPath(new URL('../../packages/shared-auth/src/index.ts', import.meta.url)),
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
})
