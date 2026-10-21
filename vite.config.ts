import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// base './' чтобы собранный прототип открывался из любой папки и с любого хостинга
export default defineConfig({
  base: './',
  plugins: [react()],
})
