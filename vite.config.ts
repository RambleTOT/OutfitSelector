import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { resolve } from 'node:path'

// Две страницы: лендинг (/) и приложение (/app/). base './' даёт относительные пути ресурсов
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    rollupOptions: {
      input: { landing: resolve(__dirname, 'index.html'), app: resolve(__dirname, 'app/index.html') },
    },
  },
})
