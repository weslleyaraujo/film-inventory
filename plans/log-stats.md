# Log Stats Page

## Context

The Log screen (`LogScreen.tsx`) currently shows finished rolls grouped by year/month with a summary card (total rolls, most-shot stock, most-used camera). The user wants richer analytics for their shooting history, accessed via a top-right icon button — similar to the `BarChart3` button that opens `AnalyticsModal` on the Inventory screen. The existing Log screen stays as-is.

## Approach

1. **Add computed stats signals** to `src/store/rolls.ts` — breakdowns by type, format, brand, ISO, and rolls-per-month derived from `finishedRollsWithDetails`.
2. **Create `src/screens/LogStatsModal.tsx`** — a full-screen modal/overlay (variant "sheet") displaying the stats with the same `BarRow` pattern used in `AnalyticsModal`, plus a summary card with hero numbers at the top.
3. **Add a `BarChart3` icon button** to the Log screen header (top right), gating on `totalFinishedRolls > 0`.
4. **Wire it up** — import the new modal in `LogScreen.tsx`, add the button, and control open/close with a signal.

## Metrics

| Metric | Implementation |
|---|---|
| Total rolls, total frames | Computed from `finishedRollsWithDetails` |
| Rolls per month (last 12) | Bar chart — each bar = one month |
| By film type | Color Neg / Color Pos / B&W breakdown |
| By format | 35mm / 120 / 220 breakdown |
| By brand | Top brands sorted by count |
| By ISO | Breakdown by ISO speed |
| Most-shot stock | Top 5 stocks by count |


## Files to modify

- `src/store/rolls.ts` — add computed breakdown signals
- `src/screens/LogScreen.tsx` — add BarChart3 button in header, wire modal
- `src/screens/LogStatsModal.tsx` — **new file**, the stats sheet

## Reuse

- `AnimatedNumber` from `src/components/ui/AnimatedNumber.tsx` for hero numbers
- `Modal` from `src/components/ui/Modal.tsx` (variant="sheet") for the overlay
- `BarRow` pattern from `src/screens/AnalyticsModal.tsx` (will extract or duplicate; duplication is fine for two analytics modals since they serve different data domains)
- `TypeDot` from `src/components/ui/Badge.tsx` for film type dots
- `formatMonth` from `src/lib/date.ts` for month labels

## Steps

- [x] **Step 1: Add computed stats to `rolls.ts`** — breakdowns by type, format, brand, ISO, rolls per month (last 12), total frames, top stocks
- [x] **Step 2: Create `LogStatsModal.tsx`** — sheet modal with summary card (total rolls + frames) at top, then sections: Rolls per Month (bar chart), By Type, By Format, By Brand, By ISO, Top Stocks. Use the same `BarRow` inline component pattern from `AnalyticsModal`.
- [x] **Step 3: Add BarChart3 button to LogScreen header** — top-right, gated on `totalFinishedRolls > 0`, opens the new modal

## Verification

1. `npm run dev` — open the app, go to Log tab
2. If rolls exist: BarChart3 icon appears in top right
3. Tap it — sheet slides up showing hero stats at top (total rolls, total frames)
4. Scroll down through breakdown sections
5. Tap close / overlay to dismiss
6. If no rolls: icon hidden, no crash
7. Add/finish more rolls — verify stats update reactively
