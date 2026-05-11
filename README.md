# Film Inventory

Offline-first **film photography inventory** Progressive Web App. Track your film stocks, variants, inventory counts, cameras, loaded film, and finished rolls — all stored locally in your browser. No backend, no cloud, no account required.

Built for mobile (iOS/Android) with a clean monochromatic design.

## Features

- **Film inventory** — track rolls by stock, variant, format, and location (with you / in the fridge)
- **Camera management** — register cameras, load film, finish rolls
- **Shot log** — browse your finished rolls grouped by year and month
- **Filters & search** — filter by film type, format, ISO, location, and full-text search
- **Analytics** — breakdowns by type, ISO, brand, format, and location
- **Dark mode** — system, light, and dark theme support
- **Import/Export** — backup and restore your data as JSON
- **Fully offline** — works without internet, installable as a PWA

## Tech Stack

- **Preact** + **TypeScript**
- **@preact/signals** — reactive state management
- **Dexie.js** — IndexedDB wrapper
- **Tailwind CSS v4** — utility-first styling
- **Framer Motion** — animations
- **Vite** + **vite-plugin-pwa** — build tooling and PWA support

## Getting Started

```bash
npm install
npm run dev        # dev server at http://localhost:5173
npm run build      # production build
npm run preview    # preview production build
```

## Importing Sample Data

A sample dataset is included in `data.example.json`. To try it out:

1. Open the app
2. Go to **Settings** → **Import Database**
3. Select `data.example.json`

## Testing

```bash
npm test              # unit tests (Vitest)
npm run test:e2e      # E2E tests (Playwright)
npm run test:e2e:ui   # Playwright UI mode
```

## Data Privacy

All data is stored locally in your browser using IndexedDB. Nothing is sent to any server. Your inventory stays on your device.

## License

MIT
