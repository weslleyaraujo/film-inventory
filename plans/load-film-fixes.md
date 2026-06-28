# Plan: Load Film Modal — Bug Fixes & UX Improvements

## Context

Three issues reported while using the Load Film modal:

1. **Bug: Wrong frame count options for 120/220 film.** The modal always shows [24, 36, None] frame-count presets regardless of format. For 120 film, frame count depends on the camera's frame size (6×4.5 → 16, 6×6 → 12, 6×7 → 10, 6×9 → 8). For 220, counts are double (24 for 6×6, 32 for 6×4.5, etc.). The preset buttons are incorrect for non-35mm formats.

2. **Bug: Duplicate entries in variant list.** When a film variant exists in both `with-me` and `fridge` locations, the `matchingVariants` computed shows two entries with the same variant name (one per inventory item). The user selected "Pro Image" and saw two identical-looking entries. The `loadFilm` action already correctly prefers `with-me` when decrementing — this is purely a display deduplication issue.

3. **Feature: "With-me" films should appear first.** When loading film, the user usually loads what they're carrying (`with-me`), not what's in the fridge. Inventory items from `with-me` should be grouped and shown at the top with a visual section header. Fridge items should appear below. This must not block loading from fridge — all films remain selectable.

---

## Approach

### Bug 1: Frame count per format

Replace the fixed [24, 36, None] button presets with **format-aware options**:

- **35mm**: keep [24, 36, None] (standard 35mm cassette sizes)
- **120**: show [8, 10, 12, 16, None] (common 120 frame counts for 6×9, 6×7, 6×6, 6×4.5)
- **220**: show [16, 20, 24, 32, None] (double the 120 counts)

The frame count section only appears after a variant is selected. Read the variant's format from the selected `InventoryWithDetails` entry to determine which presets to show.

We also need to know the **selected variant's format** to pick the right presets. Currently `selectedVariantId` is a plain string — we'll derive the format from the matching variant.

### Bug 2: Deduplicate by variantId

Currently `matchingVariants` iterates over `inventoryWithDetails`, which returns one entry per `InventoryItem` row. If variant X has rows in both `with-me` and `fridge`, two entries appear.

**Fix**: Deduplicate by `variantId`. For each unique variant, compute:
- `totalQuantity`: sum of all inventory item quantities for that variant
- `locations`: deduplicated list of locations (e.g. `"with-me, fridge"` if both)
- Keep the first inventory item's `id` as the key

The selection model (`selectedVariantId`) already works at the `variantId` level, so no change needed there. The `loadFilm` action already prefers `with-me` when decrementing.

### Feature: "With-me" section on top

After deduplication, sort the list so entries with any `with-me` quantity appear first, then a separator label, then fridge-only entries.

Add a section header (`<p class="text-brand...">With Me</p>`) above the first fridge-only entry. Items that have stock in both locations appear in the "With Me" section (since they're available to grab).

Show location info in each row's subtitle (e.g., `"3 rolls (2 with-me, 1 fridge)"`) so the user knows where their film is.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/cameras/LoadFilmModal.tsx` | All three changes happen here: format-aware frame count, deduplication, with-me section |

---

## Reuse

- **`inventoryWithDetails`** (`src/store/inventory.ts`) — already provides all inventory items with variant+stock joins; we'll group by `variantId` in-memory
- **`loadFilm`** (`src/store/cameras.ts`) — already prefers `with-me` when decrementing; no changes needed
- **`TypeDot`** (`src/components/ui/Badge.tsx`) — already used in each row

---

## Steps

- [x] **Step 1: Deduplicate matchingVariants by variantId**
  - Group `inventoryWithDetails` items by `variantId`
  - For each unique variant, compute: `totalQuantity` (sum), `locations` (deduplicated), `withMeQty` / `fridgeQty`
  - Use the first item's fields for display (name, stock, format, etc.)
  - Update the row subtitle to show combined location info

- [x] **Step 2: Sort with-me items first + add section header**
  - Sort deduplicated list: items with `withMeQty > 0` first, then fridge-only items
  - Insert a section divider label (`"Stored"` or `"Fridge"`) between the two groups when both are present
  - Fridge-only items remain fully selectable

- [x] **Step 3: Format-aware frame count presets**
  - Derive the selected variant's format from the matching variants list
  - Show different preset button arrays per format:
    - 35mm: `[24, 36, 0]` (0 = "None")
    - 120: `[8, 10, 12, 16, 0]`
    - 220: `[16, 20, 24, 32, 0]`
  - Reset `frameCount` to a sensible default when a variant with a different format is selected (e.g., 36 for 35mm, 12 for 120, 24 for 220)
  - Keep the "None" option (value 0) for all formats

---

## Verification

1. **Manual smoke test** (`npm run dev`):
   - Add a film variant to both `with-me` and `fridge` locations
   - Open Load Film modal → verify single entry per variant (no duplicates)
   - Verify rows show combined location info (e.g., "3 rolls · with-me, fridge")
   - Verify "With Me" items appear at top with section header, fridge items below
   - Verify all items are selectable, including fridge-only
   - Select a 35mm variant → frame count shows [24, 36, None]
   - Select a 120 variant → frame count shows [8, 10, 12, 16, None]
   - Select a 220 variant → frame count shows [16, 20, 24, 32, None]
   - Load film with decrement checked → inventory decrements correctly from with-me first

2. **Existing tests**: `npm test` — ensure no regressions in store tests

3. **E2E tests**: `npm run test:e2e` — ensure load-film flow still works
