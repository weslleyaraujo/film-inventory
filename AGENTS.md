# AGENTS.md — Film Inventory PWA

## Project Overview

Offline-first **film photography inventory** Progressive Web App. Manage film stocks, variants, inventory counts, cameras, loaded film, and finished rolls. No backend, no cloud — all data in IndexedDB. Built for mobile (iOS/Android) with a sleek B&W monochromatic design.

- **Stack**: Preact + TypeScript + @preact/signals + Dexie.js + Tailwind CSS v4 + Vite + framer-motion + number-flow
- **Database**: IndexedDB via Dexie (6 tables with `liveQuery` → signal reactivity)
- **PWA**: vite-plugin-pwa (Workbox), installable, fully offline
- **Testing**: Vitest (30 unit tests) + Playwright (E2E)

---

## 🚀 Quick Start

```bash
npm install
npm run dev          # dev server at http://localhost:5173
npm run build        # production build
npm run preview      # preview production build
npm test             # run unit tests (vitest)
npm run test:e2e     # run Playwright E2E tests
npm run test:e2e:ui  # Playwright UI mode
```

---

## 🧱 Architecture

### State Management — **SIGNALS ONLY, NO useState**

This is the #1 rule. All application state lives in `@preact/signals`. **Zero `useState` imports** anywhere in the codebase (the only exception: `Stepper.tsx` uses a transient 150ms animation flag for the count-pulse — purely local UI micro-state).

```typescript
// ✅ CORRECT — signals
import { signal, computed } from "@preact/signals";
const count = signal(0);

// ❌ WRONG — never do this
import { useState } from "preact/hooks";
const [count, setCount] = useState(0);
```

### Store Layer (`src/store/`)

Each domain has its own store file. All expose reactive signals populated via Dexie `liveQuery`:

| File           | Signals                                                                                                    | Purpose                                          |
| -------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| `stocks.ts`    | `stocks`, `loading`                                                                                        | FilmStock CRUD, lookups by brand/type/ISO        |
| `variants.ts`  | `variants`, `loading`, `variantsWithStock`, `variantsByStock`                                              | FilmVariant CRUD, joined with stock              |
| `inventory.ts` | `inventoryItems`, `loading`, `inventoryWithDetails`, `filtered*`, breakdowns                               | Inventory counts, filtering, analytics           |
| `cameras.ts`   | `cameras`, `loadedFilms`, `loading`, `loadedFilmsWithDetails`                                              | Camera CRUD, load/finish/unload film             |
| `rolls.ts`     | `finishedRolls`, `loading`, `finishedRollsWithDetails`, `rollsByMonth`                                     | Finished roll history, stats                     |
| `ui.ts`        | `activeTab`, `filterState`, `expandedStockIds`, `themeMode`, `isDark`, `selectedCameraId`, `activeStockId` | UI-only state (tabs, filters, theme, navigation) |

**Pattern**: `liveQuery` subscribes to Dexie → pushes to signal → computed signals derive from those.

```typescript
// Pattern for every store
const observable = liveQuery(() => db.table.toArray());
observable.subscribe({
  next: (data) => {
    signal.value = data;
    loading.value = false;
  },
  error: (err) => {
    console.error(err);
    loading.value = false;
  },
});
```

### Filter System

Filters are **reactive computed signals**. `filterState` (in `ui.ts`) drives `filteredInventory` (in `inventory.ts`), which drives `filteredTotalRolls`, `filteredTotal35mm`, etc. When filters change, stats cards and the inventory list update instantly without re-renders.

The filter bar has:

- **Type chips**: Color Neg, Color Pos, B&W
- **Format chips**: 35mm, 120, 220
- **Location chips**: With me, Fridge
- **ISO chips**: 50, 100, 200, 250, 400, 500, 800
- **Search input**: full-text search across variant name, stock name, brand, and format

```
filterState (ui.ts) + search text
    ↓
filteredInventory (inventory.ts)
    ↓
filteredTotalRolls, filtered35mm, filtered120, filteredWithMe, filteredFridge
    ↓
InventoryScreen stats cards + grouped list
```

### Navigation

Tab-based navigation via `activeTab` signal in `ui.ts`. No router. Detail screens (stock, camera) are driven by `activeStockId` / `selectedCameraId` signals.

```
activeTab values:
  'inventory' | 'cameras' | 'log' | 'settings' | 'stock-detail' | 'camera-detail'
```

### Database (Dexie — Version 2)

```
filmStocks:      id, brand, type, iso
filmVariants:    id, stockId, format, dxCoded
inventoryItems:  id, variantId, location
cameras:         id, config (CameraConfig)
loadedFilms:     id, cameraId, variantId
finishedRolls:   id, variantId, cameraId, finishedAt
```

- **Hooks**: auto-set `createdAt` and `updatedAt` timestamps

### Types (`src/db/types.ts`)

```typescript
FilmType = "bw" | "color-negative" | "color-positive";
FilmFormat = "35mm" | "120" | "220";
Location = "with-me" | "fridge"; // NOT 'taken'
CameraConfig = { type: '35mm' } | { type: '120'; supports220?: boolean };
```

Joined types for display: `VariantWithStock`, `InventoryWithDetails`, `LoadedFilmWithDetails`, `FinishedRollWithDetails`.

Utility: `getCameraFormats(config)` derives supported formats from a `CameraConfig`.

Export/import uses `ExportData` interface with all 6 tables. The `version` field must be `1`.

---

## 🎨 Design Guidelines — B&W Monochromatic with Cyan Accent

### Color Palette

The app is **almost entirely grayscale** with a **single cyan accent** (`#00B4D8`).

| Role              | Light                  | Dark                     |
| ----------------- | ---------------------- | ------------------------ |
| App bg            | `#FFFFFF`              | `#000000`                |
| Card bg           | `#F5F5F5`              | `#111111`                |
| Elevated          | `#FFFFFF`              | `#1A1A1A`                |
| Text primary      | `#000000`              | `#FFFFFF`                |
| Text secondary    | `#666666`              | `#999999`                |
| Text tertiary     | `#999999`              | `#555555`                |
| **Accent (cyan)** | `#00B4D8`              | `#00B4D8`                |
| Accent muted      | `rgba(0,180,216,0.08)` | `rgba(0,180,216,0.12)`   |
| Accent pressed    | `#0098B8`              | `#0098B8`                |
| Destructive       | `#CC0000`              | `#CC0000`                |
| Separator         | `rgba(0,0,0,0.08)`     | `rgba(255,255,255,0.08)` |
| Border            | `rgba(0,0,0,0.12)`     | `rgba(255,255,255,0.10)` |

### Film Type Dots (only colored elements in the UI)

Small dots for film type keep subtle color:

- **Color Negative**: `#E67E22` (warm amber)
- **Color Positive**: `#00B4D8` (deep cyan — same as accent)
- **B&W**: `#999999` (gray)

Use `TypeDot` component from `src/components/ui/Badge.tsx`.

### Cards

- Flat with `border border-[var(--color-border)]` in light mode
- Subtle `shadow-[var(--shadow-card)]` in dark mode
- `border-radius: 20px` (`--radius-card`)
- Stock cards are stacked, brands appear as **separate `<h2>` headlines above** them (not embedded inside cards)

### Typography

System font stack with SF Pro Display priority. CSS utility classes:

| Class                | Size | Weight | Usage                                                         |
| -------------------- | ---- | ------ | ------------------------------------------------------------- |
| `text-hero`          | 48px | 800    | Dashboard total count (tabular-nums)                          |
| `text-screen-title`  | 28px | 700    | Page headings, year headings in log                           |
| `text-section-title` | 17px | 600    | Stock names, card titles                                      |
| `text-body`          | 15px | 400    | Variant names, camera names                                   |
| `text-caption`       | 12px | 500    | Badges, labels, meta                                          |
| `text-mono`          | 14px | 500    | Counts, dates, ISO (tabular-nums)                             |
| `text-brand`         | 10px | 600    | Uppercase tracked-out brand labels (`letter-spacing: 0.12em`) |

### Icons

- **Lucide** (`lucide-preact`), size 20px, stroke-width 1.5
- Always render in `text-[var(--text-secondary)]` or `text-[var(--text-tertiary)]` — never colored (except the accent-colored active tab, cyan-active filter chips, and cyan format badges)

### Format Badges

Format badges (35mm/120/220) use cyan accent: `text-[var(--color-accent)]` on `bg-[var(--color-accent-muted)]` with a subtle cyan border. This is one of the few places accent color is used outside of interactive elements.

### No-No's

- ❌ No colored location badges — location uses icon + text in secondary color
- ❌ No film strip sprocket-hole CSS decorations
- ❌ No SVG arc ISO gauge — use `ISOBar` (horizontal monochrome progress bar, 2px tall)
- ❌ No shadows in light mode cards (flat + border only)
- ❌ No star ratings anywhere — user explicitly doesn't want them

---

## ✨ Motion & Haptics (framer-motion)

Motion is driven by **framer-motion** (installed, working with Preact via `preact/compat` alias):

| Element                  | Animation                                                                                          |
| ------------------------ | -------------------------------------------------------------------------------------------------- |
| **Modal**                | Spring slide-up from bottom (`type: 'spring', damping: 25, stiffness: 300`), overlay fade-in 200ms |
| **Card expand/collapse** | `AnimatePresence` + `motion.div` height animation, 250ms `ease: [0.32, 0.72, 0, 1]`                |
| **FAB press**            | CSS `active:scale-95` with `transition-transform`                                                  |
| **Count pulse**          | CSS keyframe `count-pulse` — scales to 1.15x and back in 120ms                                     |

**Haptics**: `navigator.vibrate(10)` on all stepper +/- actions, `navigator.vibrate([10, 50, 10])` on finish-roll confirmation. Always guard with `typeof navigator !== 'undefined' && 'vibrate' in navigator`.

---

## 🧩 Component Organization

```
src/components/
├── ui/            # Reusable primitives
│   ├── Button.tsx        # primary | secondary | destructive | ghost
│   ├── Badge.tsx         # Badge + TypeDot (film type colored dot)
│   ├── Card.tsx          # Standard card with border
│   ├── Modal.tsx         # Sheet/center variants, framer-motion spring animations
│   ├── Stepper.tsx       # +/- quantity with haptic + count-pulse
│   ├── ISOBar.tsx        # Horizontal monochrome progress bar
│   ├── StarRating.tsx    # EXISTS but UNUSED (user rejected ratings)
│   ├── EmptyState.tsx    # Icon + title + description + optional CTA
│   ├── FAB.tsx           # Fixed floating action button
│   ├── SegmentedControl.tsx  # iOS-style segmented picker
│   └── SearchInput.tsx   # Search field with clear button
├── inventory/
│   ├── FilterBar.tsx     # Filter chips + search (now integrated in InventoryScreen)
│   └── AddFilmSheet.tsx  # Bottom sheet: stock autocomplete, inline creation, format, quantity, location
└── cameras/
    ├── AddCameraModal.tsx    # Name, format multi-select, notes
    ├── LoadFilmModal.tsx     # Search variants, frame count, optional inventory decrement
    └── FinishRollModal.tsx   # Push/pull stops stepper (-6 to +6), notes, optional decrement. NO rating.
```

### Key Component Details

- **Modal**: Uses framer-motion `AnimatePresence` for enter/exit. `variant="sheet"` slides from bottom, `variant="center"` scales from 0.95. Overlay tap-to-close.
- **Stepper**: +/- buttons with `min`/`max` props. Haptic on every change. Quantity pulses (`animate-count-pulse`) on change.
- **ISOBar**: Renders as `<div>` bar, not SVG. Width proportional to ISO / maxISO (default 800). Monochrome, 2px tall, rounded.
- **AddFilmSheet**: Type a stock name → if it matches an existing stock, auto-fills brand/type/ISO. If new, inline fields appear for brand, type (segmented control), and ISO (stepper). Variant name, format, quantity, location, and notes follow.
- **FinishRollModal**: No rating. Instead: **push/pull stops** stepper from -6 to +6. Positive values shown in cyan, negative in amber, zero in primary text. Notes field. "Remove from inventory" checkbox.
- **EditStockSheet / EditVariantSheet**: Both live inside `InventoryScreen.tsx`. Pencil icons on stock headers and variant rows open these. Full edit of name/brand/type/ISO/notes. Delete with confirmation.

---

## 🖥 Screen Details

### InventoryScreen

- **Stats**: 3 hero cards (Total, 35mm, 120) — numbers update reactively with filters
- **Search**: Full-width text input on its own row above filter chips. Uses `text-body` font size.
- **Filter chips**: Single horizontally scrollable row with all filters: location pills (With me / Stored with counts), type chips, format chips, ISO chips. Separated by vertical dividers. Gradient fade mask on the right edge. Active count + clear button below.
- **Brand headlines**: Brands appear as separate `text-brand` `<h2>` elements between card groups, NOT inside cards
- **Stock cards**: Expandable (framer-motion). Pencil icon opens EditStockSheet. Tap stock name → StockDetailScreen
- **Variant rows**: Cyan format badge, location (tappable to move between with-me/fridge), pencil icon for EditVariantSheet, Stepper for quantity
- **FAB**: Opens AddFilmSheet
- **Analytics**: BarChart3 icon in header opens AnalyticsModal

### StockDetailScreen

- ISO bar + type dot + brand label
- Total counts (overall, 35mm, 120, with-me, fridge)
- Variants list with format badge and notes
- "In Cameras" section — which cameras have this stock loaded, with load dates
- "Finished Rolls" section — recent history for this stock (no star ratings)

### CameraListScreen

- 2-column grid of camera cards
- Each card: camera icon, format badge, camera name
- If loaded: type dot + variant name
- If empty: camera icon + "No film" text
- FAB opens AddCameraModal

### CameraDetailScreen

- Camera info card (name, formats, notes)
- Loaded film card (type dot, variant name, stock, ISO, format, load date, frame count, notes) — "Finish Roll" button
- OR empty state with "Load Film" button
- Recent rolls section (no star ratings)
- LoadFilmModal + FinishRollModal

### LogScreen

- Stats card: total rolls finished, most-shot stock, most-used camera
- **Grouped by year → month**: e.g. "2026" heading → "April" sub-heading → roll cards
- Each roll card: type dot, variant name, camera, format, frame count, notes, date
- NO star ratings anywhere

### SettingsScreen

- Dark mode toggle: System / Light / Dark (3-button segmented style)
- Export Database (downloads JSON)
- Import Database (file picker → validate → confirm → replace)
- Clear All Data (double confirmation)
- About section

---

## 🧪 Testing

### Unit Tests (Vitest)

```bash
npm test                # run all (30 tests)
npm run test:watch      # watch mode
```

- **Test setup**: `src/test/setup.ts` mocks `window.matchMedia` for jsdom + `fake-indexeddb/auto`
- Tests in `src/__tests__/store.test.ts`
- Coverage: stocks CRUD, variants CRUD, inventory CRUD (merge, move, increment/decrement), camera load/finish/unload flows, finished roll CRUD, export/import round-trip
- All tests hit Dexie directly (no database mocking)

### E2E Tests (Playwright)

```bash
npm run test:e2e        # headless
npm run test:e2e:ui     # UI mode
```

- **Config**: `playwright.config.ts` — auto-builds + serves, runs Chromium
- Test files in `e2e/`: `app.spec.ts` (shell, nav, empty states, filters, CRUD), `crud-flows.spec.ts` (import/export, camera flows, stock detail)

---

## 📁 Project Structure

```
film-inventory/
├── data.example.json          # Sample import data
├── AGENTS.md                  # This file
├── PLAN.md                    # Full build plan with all batches
├── playwright.config.ts
├── vitest.config.ts
├── vite.config.ts             # Preact + Tailwind + PWA plugins
├── index.html                 # Meta tags, PWA icons, apple-mobile-web-app-title
├── src/
│   ├── app.tsx                # Tab shell, screen routing via activeTab signal
│   ├── main.tsx               # Entry point
│   ├── index.css              # Design tokens, typography, animations, scroll utilities
│   ├── db/
│   │   ├── db.ts              # Dexie schema (version 2), hooks
│   │   ├── types.ts           # All TypeScript interfaces + getCameraFormats() utility
│   │   ├── export.ts          # exportDatabase(), downloadJSON()
│   │   └── import.ts          # validateExportData(), importDatabase()
│   ├── lib/
│   │   └── date.ts            # formatRelative(), formatDateFull()
│   ├── store/
│   │   ├── ui.ts              # Tabs, filters, theme, expanded IDs, camera/stock selection
│   │   ├── stocks.ts          # FilmStock signals + CRUD
│   │   ├── variants.ts        # FilmVariant signals + CRUD
│   │   ├── inventory.ts       # Inventory signals, filtered signals, breakdowns
│   │   ├── cameras.ts         # Camera + LoadedFilm signals + CRUD
│   │   └── rolls.ts           # FinishedRoll signals + CRUD
│   ├── components/
│   │   ├── ui/                # 11 reusable components (StarRating unused)
│   │   │   ├── AnimatedNumber.tsx  # number-flow wrapper for animated count transitions
│   │   ├── inventory/         # AddFilmSheet
│   │   └── cameras/           # AddCameraModal, LoadFilmModal, FinishRollModal
│   ├── screens/
│   │   ├── InventoryScreen.tsx     # Stats, search, filter chips, brand headers, stock cards,
│   │   │                            # variant rows with steppers, EditStockSheet, EditVariantSheet
│   │   ├── StockDetailScreen.tsx   # ISO bar, variants, in-cameras, finished rolls
│   │   ├── CameraListScreen.tsx    # 2-column grid, loaded/empty indicators
│   │   ├── CameraDetailScreen.tsx  # Camera info, load/finish, recent rolls
│   │   ├── LogScreen.tsx           # Year→month grouped rolls, stats summary
│   │   ├── SettingsScreen.tsx      # Theme, export, import, clear
│   │   └── AnalyticsModal.tsx      # Bar charts: type, ISO, brand, format, location
│   ├── __tests__/
│   │   └── store.test.ts      # 26 unit tests
│   └── test/
│       └── setup.ts           # jsdom + fake-indexeddb + matchMedia mock
│   └── lib/
│       └── date.ts
├── e2e/
│   ├── app.spec.ts             # App shell, filters, empty states, basic CRUD
│   └── crud-flows.spec.ts      # Import/export, camera flows, stock detail
├── public/
│   ├── icon-192.svg
│   ├── icon-512.svg
│   ├── apple-touch-icon.svg
│   └── favicon.svg
├── .gitignore
├── README.md
└── data.example.json          # Sample import data
```

---

## 🔑 Key Conventions

1. **No `useState`** — signals for everything. `Stepper.tsx` animation flag is the sole exception.
2. **Import types with `import type`** — type-only exports (`Tab`, `ThemeMode`, `FilterState`) must use `import type` or builds will fail.
3. **CSS variables only** — never hardcode colors. Use `var(--text-primary)`, `var(--bg-card)`, `var(--color-accent)`, etc.
4. **Tailwind for layout, CSS vars for theming** — utility classes for spacing/grid, custom properties for color/radius/shadow.
5. **Location is `'with-me' | 'fridge'`** — never `'taken'`.
6. **Dark mode** — `themeMode` signal ('system' | 'light' | 'dark'), persisted in localStorage, `isDark` computed toggles `.dark` on `<html>`.
7. **Data import/export** — only JSON (`ExportData` interface). No TSV/CSV. `data.example.json` at root is the sample dataset.
8. **Haptics** — `vibrate(10)` on stepper, `vibrate([10,50,10])` on finish. Always guard with feature detection.
9. **No star ratings** — user explicitly rejected them. `StarRating.tsx` component exists but is not used anywhere.
10. **framer-motion for all transitions** — Modals, card expand/collapse. Not CSS keyframes (those are only for the count-pulse micro-animation).
11. **Filter scroll bars** — filter chips scroll horizontally with `scrollbar-none` (hides scrollbar) + `mask-r` (gradient fade on right edge) for edge-to-edge feel.
12. **Brands are headlines, not card elements** — separate `<h2 class="text-brand">` between card groups.

---

## 🐛 Known Issues & Gotchas

- **Dexie schema version**: Bump the version in `db.ts` if you change indexes.
- **liveQuery timing**: Signals update asynchronously after Dexie writes. Tests may need a `setTimeout(100)` for propagation.
- **Modal stacking**: Only one modal open at a time. Each screen manages its own modal signals.
- **Tab values**: `'stock-detail'` and `'camera-detail'` aren't in the tab bar — pushed via `activeTab.value`.
- **Edit sheets**: `EditStockSheet` and `EditVariantSheet` are defined inside `InventoryScreen.tsx` (not separate files). They read/write `editingStock` and `editingVariant` signals.
- **framer-motion `height: 'auto'`**: Works with `AnimatePresence` but can cause a brief flash on first expand. This is a known framer-motion limitation.
- **Import types for build**: The production build (rolldown) requires `import type` for type-only exports. `tsc` alone won't catch this.

---

## 📝 Scripts

```json
{
  "dev": "vite",
  "build": "tsc -b && vite build",
  "preview": "vite preview",
  "test": "vitest run",
  "test:watch": "vitest",
  "test:e2e": "playwright test",
  "test:e2e:ui": "playwright test --ui"
}
```
