import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// base './' so the built site also works when it's hosted in a sub-folder (GitHub Pages etc.)
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
})
