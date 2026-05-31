import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  preview: {
    // Allow Cloudflare quick-tunnel hosts so `vite preview` can be shared publicly
    allowedHosts: ['.trycloudflare.com'],
  },
  server: {
    // Allow Cloudflare quick-tunnel hosts so the dev server (with HMR) can be shared
    allowedHosts: ['.trycloudflare.com'],
    // HMR websocket travels over the https tunnel on 443
    hmr: { clientPort: 443 },
  },
})
