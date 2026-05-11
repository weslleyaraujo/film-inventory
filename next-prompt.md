this was the previous plan.

analyze the app. what did we implement wrong?

---

Copy
Done

Options
Contents
Archive

today — 2026-05-10

film inventory pwa build plan

film inventory pwa build plan
6d ago — 2026-05-04

plan settings import flow gall

plan settings import flow gall
1w ago — 2026-05-02

implementation plan photos fil
Approved
10 May 2026 17:11

Images

Global comment

Copy plan
Film Inventory PWA — Build Plan
Context
Managing a film photography inventory today means a spreadsheet with 18 columns. It works, but it’s fragile, hard to use on mobile, and doesn’t surface the interesting data — how much film do I have by brand, by ISO, by type? Which camera has what loaded? What did I shoot last month?

This PWA replaces that spreadsheet with a fast, offline-first app that is genuinely enjoyable to use. Dark, bold, iOS-inspired but with its own character. Built with Preact + signals + IndexedDB — no backend, no cloud dependency, fully offline.

Feature Map
Active Inventory
Dashboard with live totals: total rolls, breakdown by format (35mm / 120 / 220), breakdown by location (taken with me / in fridge)
Inventory list grouped by film stock (emulsion), expandable to show variants
Filter & sort: by brand, ISO, type (B&W / Color Negative / Color Positive), format, location
Quick-add / quick-remove: +/- stepper on any variant to adjust counts without leaving the list
Move rolls: tap to move a batch from fridge → taken (or vice versa)
Full CRUD: add/remove film stocks, add/remove variants, edit anything
Film Stocks & Variants
Film stock = the base emulsion (Kodak E100, Kodak Portra 400, Ilford HP5…) — has brand, type, ISO, notes
Film variant = a specific packaging or respool of that stock (Kodak E100 from Dubblelab, non-DX-coded, 35mm) — has format (35mm/120/220), DX-coded flag, notes
Multiple variants can share one stock (E100 Dubblelab 35mm + E100 factory 120)
Add a new variant by picking an existing stock or creating a new stock in one flow
Cameras
Camera list: grid of cameras with loaded-film indicator
Camera detail: name, supported formats, current loaded film (variant, date loaded, frame count)
Load film: pick from inventory (filtered to variants whose format matches the camera)
Finish roll: confirm finish → creates a finished-roll entry in the log, clears the camera’s loaded film, optionally auto-decrements inventory
CRUD: add/edit/delete cameras
Shooting Log (Finished Rolls)
Chronological list of every finished roll
Each entry records: film variant, camera, date loaded, date finished, frame count, star rating (1–5), free-text notes
Filters: by stock, brand, camera, date range
Stats section: total rolls finished, most-shot stock, most-used camera, format breakdown, rolls-per-month trend
Analytics & Breakdowns
By ISO: bar or list — how many rolls at ISO 50, 100, 200, 400, 800…
By brand: cards per brand with total roll count, formats represented, dominant type
By type: B&W vs Color Negative vs Color Positive — counts and percentages
By format: 35mm vs 120 vs 220 — counts and percentages
All breakdowns are live (signals → computed from inventory)
Stock Detail Drill-Down
Tap any film stock → see all its variants, total rolls per format, total by location
See which cameras are currently loaded with this stock
See finished-roll history for this stock
ISO “speed gauge” visual for the stock’s ISO value
Data Import & Export
Import from data.txt: on first run, parse the existing TSV file and populate the database
Export to JSON: one-tap backup of the entire database
Import from JSON: restore from a backup
PWA Essentials
Installable to home screen (iOS & Android)
Fully offline (all data in IndexedDB, service worker caches the app shell)
App manifest with shortcuts: “Add Roll”, “Finish Roll”, “View Fridge”
iOS-specific: apple-touch-icon, standalone mode, status bar style, splash screen
Haptic feedback on +/- buttons
Pull-to-refresh on list screens
Visual Design Language
Mood & Character
Dark, confident, with the tactile feel of film photography. Think: the label on a Portra 400 box meets a modern iOS app. Grain texture hints, bold numbers, rich accent colors tied to film type.

Color Palette
Backgrounds

Role Light mode Dark mode
App background #FAFAFA #0D0D0D
Card surface #FFFFFF #1A1A1A
Elevated surface (modal) #FFFFFF #242424
Film Type Accents (used for badges, highlights, ISO ring)

Film type Primary Muted Text on primary
Color Negative #E67E22 (warm amber) rgba(230,126,34,0.15) #FFFFFF
Color Positive (slide) #00B4D8 (deep cyan) rgba(0,180,216,0.15) #FFFFFF
Black & White #9E9E9E (silver gray) rgba(158,158,158,0.15) #0D0D0D
UI Chrome

Role Color
Tab bar background #0D0D0D (dark mode) / #FFFFFF with blur (light)
Active tab Accent based on current screen context
Inactive tab #666666
FAB (floating action button) #E67E22 (amber)
Destructive (delete) #E63946 (red)
Success (finish roll) #2A9D8F (teal green)
Separator lines rgba(255,255,255,0.08) dark / rgba(0,0,0,0.08) light
Location Badges

Location Color
Taken (with me) #4ECDC4 (mint) — warm, active
Fridge #74B9FF (cool blue) — cold storage
Typography
Scale (system font stack, SF Pro on iOS, Inter on Android)

Token Size / Weight Usage
Hero number 56px / 900 (Black) Dashboard total roll count
Screen title 34px / 700 (Bold) Top-of-screen headings
Section header 20px / 600 (SemiBold) Stock name in list, modal titles
Body 16px / 400 (Regular) Variant names, camera names
Caption 13px / 500 (Medium) Badges, ISO, format labels
Mono data 14px / 500 (Medium) tabular-nums Counts, dates, ISO values
Typography character:

Hero numbers use font-variant-numeric: tabular-nums so counts don’t jitter
ISO values displayed in a monospaced style
Stock names are always bold, variant names are regular weight
Brand names in uppercase tracked-out caption style (letter-spacing: 0.08em)
Shape Language
Corner radius: 16px for cards, 12px for buttons, 8px for badges, full-round for pills
ISO ring: a circular gauge rendered as an SVG arc — like a speedometer. The arc fills proportionally to the ISO value (0–800+). Color matches the film type accent.
Film strip motif: thin perforation dots along card edges on the inventory screen — subtle vertical rows of small circles, like sprocket holes
Format badge: a rounded pill with the format text (35mm / 120 / 220), outlined style
Motion
Card expand/collapse: ease-out spring, 250ms
Modal presentation: slide up from bottom, 300ms cubic-bezier(0.32, 0.72, 0, 1)
+/- counter change: the number briefly scales up (1.2x) and back, 150ms
Tab transitions: crossfade, 200ms
Pull-to-refresh: standard iOS-style spinner
Haptic: navigator.vibrate(10) on increment/decrement, navigator.vibrate([10, 50, 10]) on finish-roll confirmation
Iconography
Lucide icon set, 24px stroke-width 1.5. Key icons:

film — inventory tab & film-related
camera — cameras tab
clipboard-list — log tab
thermometer-snowflake — fridge badge
backpack — taken/with-me badge
plus-circle — add actions
check-circle — finish roll
aperture — ISO indicator
Screen-by-Screen Design

1. Dashboard / Inventory (Home screen, primary tab)

┌─────────────────────────────────┐
│ Inventory [?] [•••] │ ← nav bar: title, help, overflow menu
├─────────────────────────────────┤
│ │
│ ┌──────┐ ┌──────┐ ┌──────┐ │
│ │ 42 │ │ 35 │ │ 07 │ │ ← hero stat cards
│ │ TOTAL│ │ 35mm │ │ 120 │ │ large number, format label
│ └──────┘ └──────┘ └──────┘ │ tappable → filter by that format
│ │
│ ┌──────────┐ ┌──────────┐ │
│ │ 12 taken │ │ 30 fridge│ │ ← location breakdown
│ └──────────┘ └──────────┘ │
│ │
├─────────────────────────────────┤
│ [All] [Taken] [Fridge] [Brand] │ ← segmented filter control
├─────────────────────────────────┤
│ │
│ ┌───────────────────────────┐ │
│ │ KODAK │ │ ← brand label (tracked-out caps)
│ │ │ │
│ │ ● Kodak E100 100 │ │ ← type dot (cyan = slide), stock name, ISO
│ │ ┌───────────────────┐ │ │
│ │ │ E100 (Dubblelab) │ │ │ ← variant card (expandable)
│ │ │ 35mm ● 17 taken │ │ │ format badge, location, qty
│ │ │ [−] [+]│ │ │ +/- stepper
│ │ └───────────────────┘ │ │
│ │ ┌───────────────────┐ │ │
│ │ │ E100 (factory) │ │ │
│ │ │ 120 ● 2 fridge │ │ │
│ │ │ [−] [+]│ │ │
│ │ └───────────────────┘ │ │
│ └───────────────────────────┘ │
│ │
│ ┌───────────────────────────┐ │
│ │ FUJIFILM │ │
│ │ │ │
│ │ ● Fuji Provia 100F 100 │ │
│ │ ┌───────────────────┐ │ │
│ │ │ Provia 100F 35mm │ │ │
│ │ │ 35mm ● 2 taken │ │ │
│ │ └───────────────────┘ │ │
│ └───────────────────────────┘ │
│ │
│ [+] │ ← FAB: add film
└─────────────────────────────────┘
Interactions:

Tap a stock header → collapse/expand its variants
Tap a variant card → push to Stock Detail
Tap +/- on a variant → increment/decrement quantity (with haptic)
Long-press a variant → context menu: edit, move to fridge/taken, delete
Pull down → refresh (subtle animation, data is live anyway)
FAB → bottom sheet to add film 2. Add Film bottom sheet

┌─────────────────────────────────┐
│ (dimmed background) │
│ │
│ ┌───────────────────────────┐ │
│ │ New Film [✕] │ │ ← drag handle, close button
│ │ │ │
│ │ Stock │ │
│ │ ┌─────────────────────┐ │ │
│ │ │ Kodak E100 [>] │ │ │ ← select existing stock or type new
│ │ └─────────────────────┘ │ │
│ │ │ │
│ │ Variant name │ │
│ │ ┌─────────────────────┐ │ │
│ │ │ Dubblelab (respool) │ │ │ ← free text, auto-suggests
│ │ └─────────────────────┘ │ │
│ │ │ │
│ │ Format │ │
│ │ [35mm] [120] [220] │ │ ← segmented button
│ │ │ │
│ │ DX Coded? [✓ toggle] │ │
│ │ │ │
│ │ Quantity Location │ │
│ │ [−] 5 [+] [Taken ✓] │ │
│ │ │ │
│ │ Notes │ │
│ │ ┌─────────────────────┐ │ │
│ │ │ non-DX, respooled │ │ │
│ │ └─────────────────────┘ │ │
│ │ │ │
│ │ [ Add to Inventory ] │ │ ← primary CTA
│ └───────────────────────────┘ │
└─────────────────────────────────┘
Flow for creating a new stock inline:

Type a stock name that doesn’t exist → “Create ‘Kodak E100’” suggestion appears
On selection, extra fields appear: brand (select or type), type (segmented: B&W / Color Neg / Color Pos), ISO (stepper or type)
All in one sheet, no navigation away 3. Stock Detail screen

┌─────────────────────────────────┐
│ ← Back Kodak E100 [•••]│ ← nav: back, stock name, overflow
├─────────────────────────────────┤
│ │
│ ┌─────────────┐ │
│ │ ╭───╮ │ │ ← ISO speed gauge (SVG arc)
│ │ ╱ ╲ │ │ arc fills ~1/8 for ISO 100
│ │ │ 100 │ │ │ color: cyan (slide film)
│ │ ╲ ╱ │ │
│ │ ╰───╯ │ │
│ │ ISO 100 │ │
│ │ Color Positive │ │
│ │ Kodak │ │
│ └─────────────┘ │
│ │
│ Total: 19 rolls │
│ 35mm: 17 (17 taken) │
│ 120: 2 ( 2 fridge) │
│ │
│ Variants [+Add] │
│ ┌───────────────────────────┐ │
│ │ E100 (Dubblelab) │ │
│ │ 35mm · DX: No · 17 taken │ │
│ │ respooled, non-DX │ │
│ └───────────────────────────┘ │
│ ┌───────────────────────────┐ │
│ │ E100 (factory) │ │
│ │ 120 · DX: N/A · 2 fridge │ │
│ └───────────────────────────┘ │
│ │
│ In Cameras │
│ ┌───────────────────────────┐ │
│ │ Nikon F3 · loaded 3 days │ │
│ │ E100 (Dubblelab) 35mm │ │
│ └───────────────────────────┘ │
│ │
│ Finished Rolls: 5 │
│ ┌───────────────────────────┐ │
│ │ Dec 12 · Nikon F3 · ★★★★ │ │
│ │ E100 (Dubblelab) │ │
│ └───────────────────────────┘ │
│ ┌───────────────────────────┐ │
│ │ Nov 28 · Mamiya 645 · ★★★│ │
│ │ E100 (factory) 120 │ │
│ └───────────────────────────┘ │
│ ... see all │
└─────────────────────────────────┘ 4. Cameras screen

┌─────────────────────────────────┐
│ Cameras [•••] │
├─────────────────────────────────┤
│ │
│ ┌───────────┐ ┌───────────┐ │
│ │ │ │ │ │ ← 2-column camera grid
│ │ Nikon F3 │ │ Mamiya │ │
│ │ 35mm │ │ 645 │ │
│ │ │ │ 120/220 │ │
│ │ ━━━━━━━━━ │ │ │ │ ← loaded film indicator
│ │ E100(Dub) │ │ (empty) │ │ film strip visual
│ │ loaded │ │ │ │
│ │ 3 days ago│ │ │ │
│ └───────────┘ └───────────┘ │
│ │
│ ┌───────────┐ │
│ │ │ │
│ │ Olympus │ │
│ │ XA2 │ │
│ │ 35mm │ │
│ │ ━━━━━━━━━ │ │
│ │ Ultramax │ │
│ │ 400 │ │
│ │ loaded │ │
│ │ 1 week ago│ │
│ └───────────┘ │
│ │
│ [+] │ ← FAB: add camera
└─────────────────────────────────┘ 5. Camera Detail screen

┌─────────────────────────────────┐
│ ← Back Nikon F3 … │
├─────────────────────────────────┤
│ │
│ Camera │
│ Name: Nikon F3 │
│ Format: 35mm │
│ Notes: brassed, 1982 serial │
│ [Edit Camera] │
│ │
│ ───────────────────────────── │
│ │
│ LOADED FILM │
│ ┌───────────────────────────┐ │
│ │ │ │
│ │ Kodak E100 (Dubblelab) │ │ ← variant name
│ │ Color Positive · ISO 100│ │
│ │ 35mm · DX: No │ │
│ │ │ │
│ │ Loaded: Dec 14, 2024 │ │
│ │ Frame count: 36 exp │ │
│ │ │ │
│ │ [Finish Roll] │ │ ← prominent CTA
│ │ │ │
│ └───────────────────────────┘ │
│ │
│ or │
│ │
│ No film loaded │
│ ┌───────────────────────────┐ │
│ │ (film strip icon) │ │
│ │ │ │
│ │ Camera is empty │ │
│ │ │ │
│ │ [ Load Film ] │ │ ← CTA → variant picker
│ └───────────────────────────┘ │
│ │
│ ───────────────────────────── │
│ │
│ Recent Rolls (this camera) │
│ ┌───────────────────────────┐ │
│ │ Dec 10 · Portra 400 ★★★★ │ │
│ └───────────────────────────┘ │
│ ┌───────────────────────────┐ │
│ │ Dec 02 · TRI-X 400 ★★★★★ │ │
│ └───────────────────────────┘ │
│ │
└─────────────────────────────────┘ 6. Load Film flow (modal)

┌─────────────────────────────────┐
│ Load Film — Nikon F3 [✕] │
│ Format: 35mm │
├─────────────────────────────────┤
│ [ Search variants... 🔍] │
│ │
│ Matching 35mm variants: │
│ │
│ ┌───────────────────────────┐ │
│ │ ● Kodak E100 (Dubblelab) │ │ ← type dot, variant name
│ │ 17 rolls taken │ │ ← available inventory count
│ └───────────────────────────┘ │
│ ┌───────────────────────────┐ │
│ │ ● Kodak Portra 400 │ │
│ │ 2 rolls fridge │ │
│ └───────────────────────────┘ │
│ ┌───────────────────────────┐ │
│ │ ○ Kodak TRI-X 400 │ │ ← B&W dot
│ │ 1 roll taken │ │
│ └───────────────────────────┘ │
│ │
│ Frame count (optional) │
│ [24] [36] [Custom: __] │
│ │
│ Notes: │
│ ┌───────────────────────────┐ │
│ │ pushing +1 │ │
│ └───────────────────────────┘ │
│ │
│ [ Load in Nikon F3 ] │
└─────────────────────────────────┘
When loaded: variant’s inventory can optionally auto-decrement by 1 (prompt before).

7. Finish Roll flow (modal)

┌─────────────────────────────────┐
│ Finish Roll — Nikon F3 [✕] │
├─────────────────────────────────┤
│ │
│ Finishing: │
│ Kodak E100 (Dubblelab) │
│ Loaded Dec 14, 2024 │
│ Frame count: 36 │
│ │
│ Date finished: │
│ [ Today (Dec 21) ✓] │ ← defaults to today, editable
│ │
│ Rating: │
│ ☆ ☆ ☆ ☆ ☆ │ ← tappable stars
│ │
│ Notes: │
│ ┌───────────────────────────┐ │
│ │ great colors, slight │ │
│ │ underexposure at box spd │ │
│ └───────────────────────────┘ │
│ │
│ [ Confirm & Finish ] │
│ [ Cancel ] │
└─────────────────────────────────┘
On confirm:

Create a FinishedRoll entry with all data
Clear the camera’s loaded film
Optionally decrement inventory by 1 (toggle: “Remove from inventory? [✓]”)
Haptic success pulse
Return to camera detail (now empty state) 8. Log screen (Finished Rolls)

┌─────────────────────────────────┐
│ Log [Filter]│
├─────────────────────────────────┤
│ │
│ Stats │
│ ┌─────────────────────────┐ │
│ │ 12 rolls · this month │ │ ← hero stat
│ │ Most: Kodak E100 (4) │ │
│ │ Best rated: Portra 400 │ │
│ └─────────────────────────┘ │
│ │
│ ─── December 2024 ─── │ ← month separator
│ │
│ ┌───────────────────────────┐ │
│ │ Dec 21 · Nikon F3 │ │
│ │ Kodak E100 (Dubblelab) │ │
│ │ 35mm · 36 exp · ★★★★ │ │
│ │ great colors, slight │ │
│ │ underexposure at box spd │ │
│ └───────────────────────────┘ │
│ │
│ ┌───────────────────────────┐ │
│ │ Dec 18 · Mamiya 645 │ │
│ │ Kodak Portra 400 │ │
│ │ 120 · ★★★★★ │ │
│ └───────────────────────────┘ │
│ │
│ ─── November 2024 ─── │
│ │
│ ┌───────────────────────────┐ │
│ │ Nov 28 · Olympus XA2 │ │
│ │ Fuji Superia 200 │ │
│ │ 35mm · 24 exp · ★★★ │ │
│ └───────────────────────────┘ │
│ │
└─────────────────────────────────┘ 9. Analytics modal (from overflow menu on Inventory)

┌─────────────────────────────────┐
│ Breakdown [✕] │
├─────────────────────────────────┤
│ │
│ By ISO │
│ ┌─────────────────────────┐ │
│ │ 100 ████████████ 14 │ │ ← horizontal bar chart
│ │ 200 ██████ 6 │ │
│ │ 400 ██████████████ 16 │ │
│ │ 800 ██ 2 │ │
│ └─────────────────────────┘ │
│ │
│ By Brand │
│ ┌──────────┐ ┌──────────┐ │
│ │ KODAK │ │ FUJIFILM │ │ ← brand cards with counts
│ │ 22 rolls │ │ 8 rolls │ │
│ │ 35/120 │ │ 35mm │ │
│ └──────────┘ └──────────┘ │
│ ┌──────────┐ ┌──────────┐ │
│ │ ILFORD │ │CINESTILL │ │
│ │ 3 rolls │ │ 3 rolls │ │
│ └──────────┘ └──────────┘ │
│ │
│ By Type │
│ ┌─────────────────────────┐ │
│ │ Color Neg ██████ 24 │ │
│ │ Color Pos ████ 16 │ │
│ │ B&W ██ 2 │ │
│ └─────────────────────────┘ │
│ │
│ By Format │
│ ┌─────────────────────────┐ │
│ │ 35mm ██████████ 30│ │
│ │ 120 ████ 12 │ │
│ │ 220 █ 2 │ │
│ └─────────────────────────┘ │
│ │
│ By Location │
│ ┌─────────────────────────┐ │
│ │ Taken ██████ 18 │ │
│ │ Fridge ██████████ 24│ │
│ └─────────────────────────┘ │
└─────────────────────────────────┘
User Flows
Flow A: Adding film to inventory (most frequent action)

Inventory screen
→ tap FAB [+]
→ Add Film bottom sheet slides up
→ Type/select stock name (existing or create new)
→ If new stock: brand, type, ISO appear
→ Fill variant name, format, quantity, location, DX toggle
→ Tap "Add to Inventory"
→ Sheet dismisses with spring animation
→ Inventory list animates the new entry in
→ Hero counts update (number scales briefly)
Flow B: Loading a camera

Camera Detail (empty state)
→ tap "Load Film"
→ Load Film modal
→ See list of variants matching camera format
→ Search/filter if needed
→ Tap a variant
→ Set frame count (default 36 for 35mm, none for 120)
→ Tap "Load in [Camera Name]"
→ Modal dismisses
→ Camera detail shows loaded film card
→ Optional: inventory for that variant decremented by 1
Flow C: Finishing a roll

Camera Detail (loaded state)
→ tap "Finish Roll"
→ Finish Roll modal
→ Review: which film, loaded date, frame count
→ Set finish date (default today)
→ Set star rating (tap stars)
→ Add notes
→ Toggle: "Remove from inventory?"
→ Tap "Confirm & Finish"
→ Modal dismisses with success haptic
→ Camera shows empty state
→ New entry appears at top of Log tab
→ Inventory decremented if toggle was on
Flow D: Moving film from fridge to taken

Inventory screen
→ Find a variant in fridge (blue badge)
→ Long-press or swipe
→ Context menu: "Move to Taken"
→ Quantity picker: how many to move?
→ Confirm
→ Variant updates: quantity splits, location badge changes
→ Dashboard counts reflow
Flow E: First-run import

App first launch
→ Detects empty database
→ Welcome screen: "Import your existing inventory?"
→ Options: "Import from data.txt" / "Start fresh"
→ If import:
→ TSV parser reads data.txt
→ Creates FilmStocks (deduplicated from col8 stock name)
→ Creates FilmVariants from each row
→ Creates InventoryItems from col5/col6 counts
→ Shows success: "Imported 35 film variants across 22 stocks"
→ Navigates to Inventory
Data Model

FilmStock
├── id: string (nanoid)
├── name: string e.g. "Kodak E100"
├── brand: string e.g. "Kodak"
├── type: "bw" | "color-negative" | "color-positive"
├── iso: number 50 | 100 | 200 | 250 | 400 | 500 | 800
├── notes?: string
└── createdAt: Date

FilmVariant
├── id: string
├── stockId: string (FK → FilmStock)
├── name: string e.g. "Kodak E100 (Dubblelab)"
├── format: "35mm" | "120" | "220"
├── dxCoded: boolean
├── notes?: string e.g. "respooled, remjet removed"
└── createdAt: Date

InventoryItem
├── id: string
├── variantId: string (FK → FilmVariant)
├── quantity: number
├── location: "taken" | "fridge"
├── checked: boolean ← from col7 in spreadsheet
└── updatedAt: Date

Camera
├── id: string
├── name: string e.g. "Nikon F3"
├── formats: string[] ["35mm"] or ["120","220"]
├── notes?: string
└── createdAt: Date

LoadedFilm
├── id: string
├── cameraId: string (FK → Camera, unique — one loaded film per camera)
├── variantId: string (FK → FilmVariant)
├── loadedAt: Date
├── frameCount?: number 24 | 36 | custom
└── notes?: string e.g. "pushing +1"

FinishedRoll
├── id: string
├── variantId: string (FK → FilmVariant)
├── cameraId: string (FK → Camera)
├── loadedAt: Date
├── finishedAt: Date
├── frameCount?: number
├── rating?: number 1–5
├── notes?: string
└── createdAt: Date
Indexes (Dexie)
FilmStock: id, brand, type, iso
FilmVariant: id, stockId, format
InventoryItem: id, variantId, location
Camera: id
LoadedFilm: id, cameraId (unique)
FinishedRoll: id, variantId, cameraId, finishedAt
Tech Stack
Layer Choice Why
Framework Preact + TypeScript 3kB, React-compatible, fast TTI for PWA
State @preact/signals Fine-grained reactivity, computed values for stats
Build Vite Fast HMR, great PWA plugin ecosystem
Database Dexie.js IndexedDB wrapper with liveQuery() → direct signal integration
PWA vite-plugin-pwa (Workbox) Auto service worker, manifest, icons, shortcuts
Styling Tailwind CSS v4 + custom CSS Utility classes for layout, custom for character
Icons Lucide Clean, 24px, tree-shakeable
Font System font stack (-apple-system, ...) Native feel, zero overhead
Project Structure

film-inventory/
├── public/
│ ├── icon-192.png
│ ├── icon-512.png
│ └── apple-touch-icon.png
├── src/
│ ├── db/
│ │ ├── db.ts (Dexie schema, migrations)
│ │ ├── types.ts (TypeScript interfaces)
│ │ └── seed.ts (import from data.txt)
│ ├── store/
│ │ ├── stocks.ts (stock signals + CRUD actions)
│ │ ├── variants.ts (variant signals)
│ │ ├── inventory.ts (inventory signals + computed stats)
│ │ ├── cameras.ts (camera + loaded film signals)
│ │ └── rolls.ts (finished roll signals)
│ ├── components/
│ │ ├── ui/ (Button, Badge, Modal, Card, ISOgauge, Stepper)
│ │ ├── inventory/ (StockCard, VariantRow, AddFilmSheet, StatsBar)
│ │ ├── cameras/ (CameraCard, LoadFilmModal, FinishRollModal)
│ │ └── log/ (RollCard, StatsSummary, FilterBar)
│ ├── screens/
│ │ ├── InventoryScreen.tsx
│ │ ├── StockDetailScreen.tsx
│ │ ├── CameraListScreen.tsx
│ │ ├── CameraDetailScreen.tsx
│ │ └── LogScreen.tsx
│ ├── App.tsx
│ ├── main.tsx
│ └── index.css
├── data.txt (source data for migration)
├── PLAN.md (this file)
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.ts
Implementation Batches
Batch 0 — Visual reference & design tokens
Deliverable: A CSS variables file and Tailwind config that encodes the entire visual language.

Create index.css with CSS custom properties for the full palette, typography scale, radii, shadows, spacing
Configure Tailwind to extend with these tokens
Set up dark mode (class-based, defaults to system preference)
Create a /style-guide route (dev only) showing all tokens, type scale, color swatches, component samples — so the agent and user share a visual reference
Batch 1 — Project scaffold, data layer & store
Deliverable: Working app shell with typed database and reactive store.

npm create vite@latest with Preact + TypeScript
Install: dexie, @preact/signals, tailwindcss, vite-plugin-pwa, lucide-preact
Configure Vite with preact/compat alias and PWA plugin
types.ts — all interfaces
db.ts — Dexie schema with all tables + indexes
Signal stores: stocks.ts, variants.ts, inventory.ts, cameras.ts, rolls.ts
Each store exposes: reactive list signal, computed signals, async CRUD actions
inventory.ts computed signals: totalRolls, byFormat, byLocation, byType, byBrand, byISO
seed.ts — TSV parser for data.txt, populates DB on first run
App.tsx — bottom tab bar shell with three tabs (Inventory, Cameras, Log)
Verify: app starts, seed imports data, signals react
Batch 2 — Dashboard & Inventory list
Deliverable: The primary screen — hero stats, segmented filter, grouped stock list with expand/collapse and +/- steppers.

StatsBar component — three hero stat cards (Total, 35mm, 120), two location pills
SegmentedFilter — All / Taken / Fridge / Brand toggle
StockGroup — expandable card per brand+stock
VariantRow — variant card with format badge, location badge, quantity, +/- stepper
AddFilmSheet — bottom sheet with stock autocomplete, create-new inline, format picker, DX toggle, quantity + location
Wire everything to signals — list re-renders only on changed values
Long-press context menu on variant: Edit, Move to fridge/taken, Delete
Batch 3 — Stock Detail screen
Deliverable: Drill-down from inventory into a single stock.

ISOgauge SVG component — arc that fills proportionally to ISO, colored by film type
Stock detail: name, brand, type badge, ISO gauge, total counts
Variants list (reused VariantRow components)
“In Cameras” section — which cameras have this stock loaded
“Finished Rolls” section — recent history for this stock
Edit stock / delete stock actions
Batch 4 — Cameras & loaded film
Deliverable: Camera grid, detail, load/finish flows.

CameraListScreen — responsive grid of CameraCard components
Each card: camera name, format badge, loaded film strip visual or empty state
CameraDetailScreen — camera info, edit/delete, loaded film section
LoadFilmModal — variant list filtered by camera format, search, frame count picker
FinishRollModal — date, rating stars, notes, “remove from inventory” toggle
AddCameraModal — name, format multi-select, notes
Finish roll flow: create FinishedRoll → clear LoadedFilm → optional inventory decrement
Batch 5 — Log & Analytics
Deliverable: Finished roll history with stats and filters.

LogScreen — month-grouped chronological list of RollCard components
Each card: variant name, camera, dates, rating stars, notes snippet
FilterBar — filter by stock, brand, camera, date range
StatsSummary — total rolls, most-shot stock, most-used camera
AnalyticsModal — by ISO (bar chart), by brand (cards), by type (bars), by format (bars), by location (bars)
Simple bar chart component (pure CSS + signals, no chart library needed)
Batch 6 — PWA, offline & iOS optimization
Deliverable: Installable, fully offline, native-feeling on iOS.

manifest.json with display: standalone, theme color (#0D0D0D), icons
manifest.shortcuts: “Add Roll”, “View Fridge”, “Finish Roll”
vite-plugin-pwa Workbox config: precache app shell, runtime cache for assets
iOS meta tags: apple-mobile-web-app-capable, apple-mobile-web-app-status-bar-style (black-translucent), apple-touch-icon
iOS splash screen (via apple-touch-startup-image or PWA assets)
Offline indicator toast when connectivity changes
Pull-to-refresh on inventory and log screens
Haptic feedback: navigator.vibrate on stepper and finish-roll
Batch 7 — Polish, animation & character
Deliverable: The distinctive visual character that makes it feel special.

Film strip sprocket-hole motif on card edges (CSS radial-gradient or border-image)
Number scale animation on count changes (brief 1.2x scale)
Card expand/collapse spring animation
Modal slide-up with overlay fade
Empty states with film-themed illustrations (SVG)
Tab bar icon bounce on first visit to each tab
Monospace styling for ISO and count numbers
Brand name tracked-out uppercase style
Dark/light mode toggle in overflow menu
Confirmation dialogs for destructive actions (delete stock, delete camera)
Batch 8 — Data import/export & settings
Deliverable: Backup, restore, and first-run import.

First-run detection → welcome screen with import option
seed.ts TSV parser: create stocks (deduplicated by col8), variants, inventory items
Export to JSON: serialize all Dexie tables → download .json file
Import from JSON: parse → validate → replace all data (with confirmation)
Settings screen (accessible from overflow menu): import, export, about, clear all data
Verification
Offline: Enable airplane mode → app loads from service worker cache → add rolls, finish a roll, change quantities → all data persists in IndexedDB
Import: Fresh install → import from data.txt → all 35 rows become stocks + variants + inventory → counts match spreadsheet
Signals: Change a quantity on variant row → hero stats update instantly (no full re-render)
PWA: Install to iOS home screen → opens standalone (no browser chrome) → correct icon, splash, status bar
Camera flow: Load film into camera → variant appears in camera detail → finish roll → log entry created → camera empty
Edge cases: Delete a stock that has variants (cascade or block with message), delete a camera that has loaded film (clear loaded film first), move all rolls from taken to fridge (quantity reaches zero → variant can hide or show zero), empty states on every screen
Plan Feedback
I’ve reviewed this plan and have 3 pieces of feedback:

1. General feedback about the plan
   I want to make sure you start testing the app form scratch with vitest + react testing library

2. (line 63) Feedback on: “Data Import & Export
   Import from data.txt: on first run, parse the existing TSV file and populate the database Export to JSON: one-tap backup of the entire database Import from JSON: restore from a backup”

cool. but you can use my txt as an example now and lets build or own format. the app should be able to export a json (or whatever you like) and import into another app.

3. (line 143) Feedback on: “Motion
   Card expand/collapse: ease-out spring, 250ms Modal presentation: slide up from bottom, 300ms cubic-bezier(0.32, 0.72, 0, 1) +/- counter change: the number briefly scales up (1.2x) and back, 150ms Tab transitions: crossfade, 200ms Pull-to-refresh: standard iOS-style spinner Haptic: navigator.vibrate(“

nice. research framer-motion. used to be great for this.

Annotations
0
Select text or code lines to add annotations

Update available

v0.19.11 is available (you have 0.19.7)

Copy install command
Notes

---

I want a couple of things:

1. UX. typography not great. overall UX is okay. I want the font size to look fantastic on mobile retina (CSS can do that). better typography. more apple ish design. support light and dark mode based on system or custom preference
2. I want filters. be able to filter by type, iso, brand.. everything. the card that shows total should update based on that.
3. the app should use SIGNALS. not use state
4. the app should be fully tested unit
5. fridge is okay but the concept of "taken"... I dont know. can we use anything different?
6. do not import my data.tx in code. whats that? the app should have a flow to generate a json which is a dump of the database and be able to import it. there are a bunch of code looking at custon string to identify DX etc.. whats that? we should not do that at all. the JSON will have all the data. my data.txt is an example of my inventory in a spreadsheet. sure. create a data.json out of my data.txt but get my point.

PS: TRI-X is NOT kentmere

once the app is done. start working on implementing E2E tests for every possible CRUD flow of the app using playwring. I want full coverage.

divide the plan into batches. so we can work one by one.
