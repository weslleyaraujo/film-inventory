# Plan: Camera Refactor + UX Redesign

## Context

The user wants to address fundamental data structure issues around cameras and a significant UX redesign around how film inventory actions are performed. Currently:

1. **Cameras** use a flat `formats: FilmFormat[]` array but have no concept of camera type. 120 **is** medium format — a 35mm camera will never take 120. A medium-format camera takes 120 (always) and optionally 220.
2. **`checked` field** lingers in `data.json` inventory items but doesn't exist in the TypeScript type — dead data.
3. **DX Coded** toggle is a "Yes"/"No" button — user wants a proper checkbox.
4. **Inventory actions** (increment/decrement/move) are done from the home page via Stepper components on each variant row. The user wants all film actions moved to the roll detail (StockDetailScreen), and the home page to become a read-only overview showing "carried / total" counts.
5. **No backward compatibility needed** — this app has no users yet. `data.json` becomes `data.example.json`. No migration code required.

---

## Approach

### 1. Camera Data Model Change

Replace `Camera.formats: FilmFormat[]` with a **discriminated union** on a `config` field:

```typescript
export type CameraConfig =
  | { type: '35mm' }
  | { type: '120'; supports220?: boolean }

export interface Camera {
  id: string
  name: string
  config: CameraConfig
  notes?: string
  createdAt: Date
}
```

**Derived `formats`** from `config`:
- `{ type: '35mm' }` → `['35mm']`
- `{ type: '120' }` → `['120']`
- `{ type: '120', supports220: true }` → `['120', '220']`

Expose a `getCameraFormats(camera: Camera): FilmFormat[]` helper used everywhere `camera.formats` was previously read.

### 2. Clean `data.json` → `data.example.json`

- Rename `data.json` to `data.example.json` (this is an example file, no real users)
- Remove all `checked` fields from `inventoryItems`
- Keep `version: 1` (no need to bump — not production yet)

### 3. DX Coded → Checkbox

Replace the "Yes"/"No" toggle button with a proper custom-styled checkbox component in:
- `AddFilmSheet.tsx` (line with DX Coded label)
- `StockDetailScreen.tsx` (Add Variant and Edit Variant sheets)

### 4. UX Redesign: Move Actions to Stock Detail

**Home page (InventoryScreen) changes:**
- Remove the `Stepper` from each `VariantRow`
- Show "carried / total" format: e.g., `1 / 4` where `1` is the "with-me" count and `4` is total for that variant. The "carried" number rendered in cyan accent.
- Tapping a variant row navigates to StockDetailScreen (already partially works via stock name tap)
- Location pills at top still work as filters
- Stats cards (Total, 35mm, 120) remain — these are now tappable to quickly set format filters

**StockDetailScreen (roll details) changes:**
- Each variant row now includes action controls:
  - **Stepper** to adjust quantity (buy more / remove)
  - **Move button** to toggle location (with-me ↔ fridge), with partial-qty move sheet
  - "Carried / Total" display for each variant
- Add a "Take One Out" / "Put Back" quick-action button per variant (single-roll move between locations)
- "In Cameras" section and "Finished Rolls" section remain as-is

**Stats cards interaction:**
- Tapping the "35mm" or "120" hero cards on the home page toggles the corresponding format filter. This is a natural interaction that makes the big numbers actionable.

### 5. No Export/Import Version Bump

- Keep `ExportData.version` at `1` — app is not in production, no need for migration compatibility
- No retroactive compatibility code needed

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/db/types.ts` | Add `CameraConfig` discriminated union, change `Camera` interface (replace `formats` with `config`), no export version bump |
| `src/db/db.ts` | Schema stays at v2 (indexes unchanged); no Dexie version bump needed |
| `src/db/export.ts` | No changes (version stays `1`) |
| `src/db/import.ts` | No changes (version stays `1`) |
| `data.json` → `data.example.json` | Rename file, remove all `checked` fields, keep version `1` |
| `src/store/cameras.ts` | Update `addCamera` signature; add `getCameraFormats(camera)` helper/computed; update `loadFilm` if needed |
| `src/components/cameras/AddCameraModal.tsx` | Camera type picker (35mm / 120) via SegmentedControl; if 120 selected, show "Supports 220" checkbox |
| `src/components/cameras/LoadFilmModal.tsx` | Use helper to derive camera formats from camera type |
| `src/components/cameras/FinishRollModal.tsx` | No functional changes, but verify format derivation |
| `src/screens/CameraDetailScreen.tsx` | Display camera type and medium-format types |
| `src/screens/CameraListScreen.tsx` | Display camera type badge instead of format list |
| `src/screens/InventoryScreen.tsx` | Remove Stepper from VariantRow; add "carried/total" display; make stat cards tappable for format filters; variant row tap → stock detail; **replace DX Yes/No with checkbox in EditVariantSheet** |
| `src/screens/StockDetailScreen.tsx` | Add Stepper + move actions per variant; show carried/total; enhance variant rows with action controls; **replace DX Yes/No with checkbox in Add/Edit Variant sheets** |
| `src/components/inventory/AddFilmSheet.tsx` | DX Coded: replace Yes/No button with custom checkbox |
| `src/components/ui/Stepper.tsx` | Integrate `AnimatedNumber` for the quantity display (pulse on change) |
| `src/__tests__/store.test.ts` | Update camera tests to new shape; add tests for `getCameraFormats`; add tests for new inventory move-from-detail flow |
| `e2e/app.spec.ts` | Add E2E tests for: camera creation (35mm + 120+220), home page carried/total display, detail page stepper + move actions, stat card filter toggling |
| `e2e/crud-flows.spec.ts` | Update camera-related flow tests for new camera shape |

---

## Reuse

- **`Stepper`** component (`src/components/ui/Stepper.tsx`) — already exists, reusable for variant qty in StockDetailScreen
- **`moveInventory()`** function (`src/store/inventory.ts`) — already supports partial-qty moves, to be called from StockDetailScreen
- **`MoveQuantitySheet`** — already in InventoryScreen.tsx, can be extracted or duplicated for StockDetailScreen
- **`incrementQuantity` / `decrementQuantity`** — already in inventory store, reusable
- **`SegmentedControl`** (`src/components/ui/SegmentedControl.tsx`) — reusable for camera type picker
- **`Modal`** (`src/components/ui/Modal.tsx`) — all sheets continue using this
- **Filter system** — `setFilter({ format: ... })` already exists for making stat cards tappable
- **Haptics** — existing `navigator.vibrate` pattern in Stepper, keep same pattern

---

## Steps

### Step 1: Update TypeScript types
- [ ] Add `CameraConfig` discriminated union to `src/db/types.ts`:
  ```typescript
  export type CameraConfig =
    | { type: '35mm' }
    | { type: '120'; supports220?: boolean }
  ```
- [ ] Replace `Camera.formats: FilmFormat[]` with `config: CameraConfig`
- [ ] Keep `ExportData.version` at `1` (no bump)
- [ ] Add a `getCameraFormats(camera: Camera): FilmFormat[]` helper function

### Step 2: Update database layer
- [ ] No Dexie schema bump needed (indexes unchanged)
- [ ] Export/import stay at version `1` — no changes needed

### Step 3: Update sample data
- [ ] Rename `data.json` → `data.example.json`
- [ ] Remove all `checked` fields from `inventoryItems`
- [ ] Keep `version: 1`

### Step 4: Refactor camera store & components
- [ ] Add `CameraConfig` discriminated union and update `Camera` interface in `src/db/types.ts`
- [ ] Update `addCamera` in `src/store/cameras.ts` to accept `config` instead of `formats`
- [ ] Add and export `getCameraFormats(camera: Camera): FilmFormat[]` helper in cameras store
- [ ] Update `AddCameraModal.tsx`: SegmentedControl for type (35mm / 120); if 120, show "Supports 220" checkbox
- [ ] Update `LoadFilmModal.tsx`: use `getCameraFormats()` to derive compatible formats
- [ ] Update `CameraDetailScreen.tsx`: display camera config (e.g. "35mm" or "120 · 220")
- [ ] Update `CameraListScreen.tsx`: show config badge instead of format list

### Step 5: DX Coded → Checkbox
- [ ] Replace "Yes"/"No" button in `AddFilmSheet.tsx` with custom-styled checkbox
- [ ] Replace "Yes"/"No" button in `StockDetailScreen.tsx` (Add Variant + Edit Variant sheets) with custom-styled checkbox
- [ ] Replace "Yes"/"No" button in `InventoryScreen.tsx` EditVariantSheet with custom-styled checkbox

### Step 6: UX Redesign — Home Page
- [ ] Remove `Stepper` from `VariantRow` in `InventoryScreen.tsx`
- [ ] Add "carried / total" display per variant row (carried in cyan, e.g. `1 / 4`)
- [ ] Make variant row tappable → navigates to StockDetailScreen for that stock
- [ ] Make hero stat cards (Total, 35mm, 120) tappable → toggle format filters

### Step 7: UX Redesign — Stock Detail (Roll Actions)
- [ ] Add per-variant `Stepper` for quantity adjustment
- [ ] Add per-variant location toggle / move sheet for moving between with-me and fridge
- [ ] Add "carried / total" display per variant
- [ ] Add quick "Take One" / "Put Back" single-roll move action per variant

### Step 8: Integrate AnimatedNumber in Stepper
- [ ] Update `src/components/ui/Stepper.tsx` to use `AnimatedNumber` for the count display
- [ ] Keep the existing `count-pulse` CSS animation for the visual pulse

### Step 9: Write & Run All Tests
- [ ] Update `src/__tests__/store.test.ts` camera tests to use new Camera shape (`config` instead of `formats`)
- [ ] Add unit tests for `getCameraFormats()` helper
- [ ] Add unit tests for inventory move actions triggered from detail context
- [ ] Add E2E tests in `e2e/app.spec.ts`:
  - [ ] Create a 35mm camera and verify it appears with correct badge
  - [ ] Create a 120 camera with 220 support and verify formats
  - [ ] Home page shows "carried / total" (e.g. `1 / 4`) per variant row
  - [ ] Tapping hero stat cards toggles format filter
  - [ ] Tapping variant row navigates to StockDetailScreen
  - [ ] StockDetailScreen stepper adjusts quantity
  - [ ] StockDetailScreen move action toggles location
- [ ] Update `e2e/crud-flows.spec.ts` camera flow tests for new camera shape
- [ ] Run `npm test` — all tests must pass
- [ ] Run `npm run test:e2e` — all E2E tests must pass

---

## Verification

1. **Unit tests**: `npm test` — all tests pass (including new tests for camera config, `getCameraFormats`, inventory moves from detail)
2. **E2E tests**: `npm run test:e2e` — all tests pass (including new tests for camera creation, carried/total display, stepper on detail, stat card filter toggle, variant row navigation)
3. **Manual smoke test**:
   - `npm run dev`
   - Import `data.example.json` from Settings
   - Home page shows carried/total counts per variant row (no steppers)
   - Tap a variant row → navigates to StockDetailScreen
   - In StockDetailScreen: stepper adjusts qty, move button toggles location
   - Tap hero stat cards → toggles format filter
   - Add a camera: pick 35mm or 120; if 120, optionally enable 220
   - Load film into camera: only compatible formats shown
   - DX Coded shows as checkbox everywhere
