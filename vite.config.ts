import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'



export default defineConfig({
  plugins: [
    react(),
    // Desabilitado temporariamente para evitar cache agressivo no APK
    // VitePWA({ ... })
  ],
})
