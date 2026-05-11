import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/film-inventory/',
  plugins: [
    preact({
      prefreshEnabled: true,
    }),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['icon-192.svg', 'icon-512.svg', 'apple-touch-icon.svg'],
      manifest: {
        name: 'Film Inventory',
        short_name: 'Films',
        description: 'Manage your film photography inventory',
        theme_color: '#000000',
        background_color: '#000000',
        display: 'standalone',
        orientation: 'portrait-primary',
        icons: [
          { src: 'icon-192.svg', sizes: '192x192', type: 'image/svg+xml' },
          { src: 'icon-512.svg', sizes: '512x512', type: 'image/svg+xml' },
          {
            src: 'icon-512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'maskable',
          },
        ],
        shortcuts: [
          {
            name: 'Add Roll',
            short_name: 'Add',
            description: 'Add film to inventory',
            url: '/?action=add',
          },
          {
            name: 'View Fridge',
            short_name: 'Fridge',
            description: 'View films in fridge',
            url: '/?filter=fridge',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      react: 'preact/compat',
      'react-dom': 'preact/compat',
    },
  },
})
