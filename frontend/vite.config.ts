import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      devOptions: {
        enabled: true,
      },
      includeAssets: ['/icons/icon.svg'],
      manifest: {
        name: 'Cuverie Pilotage',
        short_name: 'Cuverie',
        description: 'Supervision et pilotage des cuves de fermentation en temps réel.',
        theme_color: '#7C3AED',
        background_color: '#0F172A',
        start_url: '/',
        display: 'standalone',
        icons: [
          {
            src: '/icons/icon.svg',
            sizes: '128x128',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
  server: {
    host: true,
    port: 5173,
  },
  preview: {
    host: true,
    port: 4173,
  },
})

