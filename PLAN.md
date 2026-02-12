# LegoEater - Family LEGO Inventory App

## Overview
A family LEGO inventory management app running on a Mac that lets users scan/photograph/type LEGO set codes, track ownership and condition, update resale prices nightly, and view reports on collection value.

## Tech Stack
- **Runtime**: Bun
- **API**: Hono (TypeScript)
- **Database**: SQLite via `bun:sqlite` (WAL mode)
- **Frontend**: React 19 + Vite + Tailwind CSS + TanStack Router + TanStack Query
- **Charts**: Recharts
- **Scanning**: Quagga2 (barcode), Tesseract.js (OCR, server-side)
- **CLI**: Commander
- **Auth**: None (shared family app on local network)

## External APIs
| API | Purpose | Auth | Free? |
|-----|---------|------|-------|
| Rebrickable | Set metadata (name, theme, year, pieces, images) | API key | Yes |
| BrickLink | Current market/resale prices | OAuth 1.0 | Yes |
| UPCitemdb | Barcode-to-product lookup | None (trial) | 100 req/day |

## Project Structure
```
/Users/jay/lego/
├── package.json                 # Bun workspace root
├── tsconfig.base.json
├── .env                         # API keys
├── packages/
│   ├── shared/src/              # Types, constants, validators
│   │   ├── types/set.ts, inventory.ts, price.ts, api.ts
│   │   ├── constants.ts
│   │   └── validators.ts
│   ├── api/src/                 # Hono REST API
│   │   ├── index.ts             # Bun.serve() entry
│   │   ├── db/database.ts, schema.ts, migrations.ts
│   │   ├── routes/sets.ts, lookup.ts, prices.ts, reports.ts, members.ts, locations.ts
│   │   ├── services/rebrickable.ts, bricklink.ts, upc-lookup.ts, price-updater.ts
│   │   └── middleware/cors.ts, logger.ts
│   ├── web/src/                 # React SPA
│   │   ├── routes/__root.tsx, index.tsx, add/, inventory/, reports/, settings/
│   │   ├── components/scanner/, sets/, reports/, layout/, ui/
│   │   ├── hooks/useInventory.ts, useLookup.ts, usePrices.ts, useReports.ts
│   │   └── lib/api-client.ts, format.ts
│   └── cli/src/                 # CLI tool
│       ├── index.ts
│       └── commands/add.ts, list.ts, search.ts, update-prices.ts, report.ts, info.ts
├── scripts/nightly-prices.ts   # Standalone cron script
└── data/legoeater.db           # SQLite database (gitignored)
```

## Database Schema (7 tables)

### family_members
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | Auto-increment |
| name | TEXT NOT NULL | Unique |
| avatar_url | TEXT | Optional emoji or image |
| created_at | TEXT | ISO 8601 default now() |

### locations
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | Auto-increment |
| name | TEXT NOT NULL | Unique ("Jay's Shelf", "Basement") |
| description | TEXT | Optional |
| created_at | TEXT | ISO 8601 |

### set_catalog (cached from Rebrickable)
| Column | Type | Notes |
|--------|------|-------|
| set_num | TEXT PK | e.g. "75192-1" |
| name | TEXT NOT NULL | Set name |
| year | INTEGER | Release year |
| theme_name | TEXT | Denormalized theme name |
| theme_id | INTEGER | Rebrickable theme ID |
| num_parts | INTEGER | Piece count |
| set_img_url | TEXT | Image URL |
| last_modified_dt | TEXT | From Rebrickable |
| fetched_at | TEXT | When we cached it |

### inventory (core table)
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | Auto-increment |
| set_num | TEXT NOT NULL | FK -> set_catalog |
| owner_id | INTEGER | FK -> family_members |
| location_id | INTEGER | FK -> locations |
| condition | TEXT NOT NULL | new_sealed / opened_complete / opened_incomplete |
| quantity | INTEGER | Default 1 |
| purchase_price | REAL | What was paid, nullable |
| date_acquired | TEXT | ISO date |
| notes | TEXT | Free text |
| created_at | TEXT | ISO 8601 |
| updated_at | TEXT | ISO 8601 |

Indexes on: set_num, owner_id, location_id, condition

### price_history
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | Auto-increment |
| set_num | TEXT NOT NULL | FK -> set_catalog |
| date | TEXT NOT NULL | ISO date "2026-02-12" |
| source | TEXT NOT NULL | 'bricklink' or 'brickeconomy' |
| avg_price | REAL | Average sold/listed price |
| min_price | REAL | Minimum price |
| max_price | REAL | Maximum price |
| currency | TEXT | Default 'USD' |
| total_quantity | INTEGER | Number of listings/sales |
| fetched_at | TEXT | ISO 8601 |

UNIQUE constraint on (set_num, date, source). Index on (set_num, date).

### barcode_map
| Column | Type | Notes |
|--------|------|-------|
| barcode | TEXT PK | UPC or EAN string |
| set_num | TEXT NOT NULL | FK -> set_catalog |
| source | TEXT | Default 'upcitemdb' |
| fetched_at | TEXT | ISO 8601 |

### app_config
| Column | Type | Notes |
|--------|------|-------|
| key | TEXT PK | Config key |
| value | TEXT NOT NULL | Config value |
| updated_at | TEXT | ISO 8601 |

## API Endpoints

### Lookup / Set Identification
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/lookup/set/:setNum` | Rebrickable metadata (caches to set_catalog) |
| GET | `/api/lookup/barcode/:code` | UPC -> set_num -> set metadata |
| POST | `/api/lookup/ocr` | Image upload -> Tesseract OCR -> set number |
| GET | `/api/lookup/search?q=<query>` | Search Rebrickable by name |

### Inventory CRUD
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/sets` | List with filters: owner, theme, condition, location, search, sort, page |
| GET | `/api/sets/:id` | Detail with joined metadata + latest price |
| POST | `/api/sets` | Add to inventory (auto-fetches set_catalog) |
| PUT | `/api/sets/:id` | Update fields |
| DELETE | `/api/sets/:id` | Remove from inventory |

### Prices
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/prices/:setNum` | Latest price for a set |
| GET | `/api/prices/:setNum/history?days=90` | Price history array |
| POST | `/api/prices/update` | Trigger price refresh (all or specific set) |

### Reports
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/reports/summary` | Total sets, total value, total invested, ROI |
| GET | `/api/reports/by-member` | Value breakdown per family member |
| GET | `/api/reports/by-theme` | Value breakdown per LEGO theme |
| GET | `/api/reports/top-sets?limit=10` | Most valuable sets |
| GET | `/api/reports/trends?days=90` | Portfolio value over time |
| GET | `/api/reports/movers?days=30&limit=10` | Sets gaining/losing most value |
| GET | `/api/reports/recent?limit=10` | Recently added sets |

### Supporting
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check with DB status |
| GET/POST/PUT/DELETE | `/api/members` | Family member CRUD |
| GET/POST/PUT/DELETE | `/api/locations` | Storage location CRUD |

## CLI Commands
```
lego add <set-number> [options]
    --owner <name>           Family member name
    --location <name>        Storage location
    --condition <type>       new_sealed | opened_complete | opened_incomplete
    --quantity <n>           Default: 1
    --price <amount>         Purchase price
    --date <YYYY-MM-DD>      Date acquired
    --notes <text>           Notes

lego list [options]
    --owner <name>           Filter by owner
    --theme <name>           Filter by theme
    --condition <type>       Filter by condition
    --sort <field>           name | value | year | date_added
    --json                   Output as JSON

lego search <query>          Search Rebrickable for sets

lego info <set-number>       Quick lookup (does NOT add to inventory)

lego update-prices [set-num] Update prices for all or specific set

lego report <type> [options]
    Types: summary | by-member | by-theme | top-sets | movers
    --limit <n>              For top-sets and movers (default: 10)
    --days <n>               For movers (default: 30)
    --json                   Output as JSON
```

## Set Identification Pipeline

### Barcode Scan Flow
```
Phone camera -> Quagga2 (EAN/UPC decode) -> barcode string
  -> GET /api/lookup/barcode/:code
  -> Check barcode_map cache
  -> If miss: UPCitemdb API -> parse product title -> extract set number
  -> Rebrickable API -> cache to set_catalog + barcode_map
  -> Return set metadata
```

### Photo/Image OCR Flow
```
Phone camera capture / drag-drop image
  -> POST /api/lookup/ocr (multipart/form-data)
  -> Tesseract.js server-side OCR
  -> Regex match \d{4,6}(-\d)?
  -> Rebrickable API -> cache to set_catalog
  -> Return set metadata
```

### Manual Entry Flow
```
User types set number (e.g. "75192")
  -> GET /api/lookup/set/75192
  -> Try "75192-1" if bare number not found
  -> Rebrickable API -> cache to set_catalog
  -> Return set metadata
```

## Nightly Price Update Job

**Script**: `scripts/nightly-prices.ts`

### Algorithm
1. Open SQLite directly (not via API, for performance)
2. Query `SELECT DISTINCT set_num FROM inventory`
3. For each set:
   - Call BrickLink price guide API (sold prices, new + used)
   - UPSERT into price_history (set_num, date=today)
   - 200ms delay between calls (rate limiting)
4. Log failures, continue with next set
5. Update `app_config.last_price_update`
6. Print summary: "Updated N sets. M failures."

### Scheduling (macOS launchd)
Create `~/Library/LaunchAgents/com.legoeater.nightly-prices.plist`:
- Runs at 3:00 AM daily
- Logs to `data/nightly-prices.log`
- Uses `bun run scripts/nightly-prices.ts`

### BrickLink OAuth 1.0
- Two-legged OAuth (no user auth flow)
- Sign requests with HMAC-SHA1 using consumer_secret + token_secret
- Bun's built-in crypto handles signing (no external OAuth library)
- BrickLink uses bare set numbers (strip "-1" suffix)

## Frontend Routes & Key Components

### Routes
```
/                          Dashboard (summary cards, recent, top sets, movers)
/inventory                 Full inventory list with filters/search
/inventory/$setId          Set detail (info, price chart, edit/delete)
/add                       Add set (4-tab scanner/entry page)
/reports                   Reports (charts, tables)
/settings                  Family members & locations management
```

### Key Components
- **AppShell** - Root layout with mobile bottom nav (Home, Inventory, Add, Reports, Settings)
- **BarcodeScanner** - Quagga2 live camera feed, EAN/UPC detection
- **PhotoCapture** - getUserMedia back camera, canvas capture, upload
- **ImageDropzone** - react-dropzone for drag-and-drop images
- **SetForm** - Owner, location, condition, quantity, price, date, notes fields
- **SetCard** - Thumbnail, name, number, owner badge, condition badge, value
- **ValueSummary** - 4 stat cards (total value, invested, ROI, set count)
- **PriceTrendChart** - Recharts LineChart for portfolio value over time
- **ValueByMember/Theme** - Recharts BarChart breakdowns

### Design Theme
- LEGO Red (#E3000B) primary, Yellow (#FFD500) accent, Blue for info, Green for gains
- Brick-pattern subtle backgrounds
- Mobile-first with 44px touch targets, safe-area-inset for notch iPhones

---

## Implementation Phases

### Phase 1: Foundation
**Goal**: Monorepo, database, core API, basic web shell

**Build**:
- Root workspace config (`package.json`, `tsconfig.base.json`, `.env`, `.gitignore`)
- `@lego/shared` - TypeScript types, validators, constants
- `@lego/api` - Hono server, SQLite database init with WAL mode, schema creation, migration system
- API routes: `/api/health`, `/api/members` CRUD, `/api/locations` CRUD
- CORS and logger middleware
- `@lego/web` - Vite + React 19 + TanStack Router + TanStack Query + Tailwind
- Root layout with mobile bottom nav placeholder
- Dashboard placeholder, Settings page with members/locations CRUD
- `api-client.ts` fetch wrapper

**Key files**:
- `packages/api/src/index.ts`, `packages/api/src/db/database.ts`, `packages/api/src/db/schema.ts`
- `packages/web/src/main.tsx`, `packages/web/src/routes/__root.tsx`
- `packages/shared/src/types/*.ts`

**Verify**:
- `bun install` succeeds
- API on :3999, `curl /api/health` returns OK
- CRUD members/locations via curl works
- Web app loads on :5999, Settings page functional

---

### Phase 2: Set Identification & Lookup
**Goal**: All 4 input methods working, Rebrickable integration

**Build**:
- `services/rebrickable.ts` - getSet(), searchSets(), theme resolution, set_catalog caching
- `services/upc-lookup.ts` - UPCitemdb integration, barcode_map cache
- `routes/lookup.ts` - 4 lookup endpoints
- Tesseract.js OCR on API server for image uploads
- Add Set page with 4 tabs (Scan Barcode, Take Photo, Upload Image, Enter Number)
- BarcodeScanner, PhotoCapture, ImageDropzone, SetForm components
- Set preview card after identification

**Key files**:
- `packages/api/src/services/rebrickable.ts`, `packages/api/src/services/upc-lookup.ts`
- `packages/api/src/routes/lookup.ts`
- `packages/web/src/routes/add/index.tsx`
- `packages/web/src/components/scanner/*.tsx`

**Depends on**: Phase 1

**Verify**:
- `curl /api/lookup/set/75192` returns Millennium Falcon data
- Barcode scanning opens camera on iPhone
- OCR extracts set numbers from images
- Manual entry resolves sets

---

### Phase 3: Inventory CRUD & Management
**Goal**: Full add/view/edit/delete, inventory browsing

**Build**:
- `routes/sets.ts` - CRUD with JOINs, filtering, sorting, pagination
- Inventory list page (search, filters, sort, responsive grid of SetCards)
- SetCard component (image, name, badges, value)
- Set detail page (metadata, ownership, financials, edit/delete)
- Connect Add page form to `POST /api/sets`

**Key files**:
- `packages/api/src/routes/sets.ts`
- `packages/web/src/routes/inventory/index.tsx`, `packages/web/src/routes/inventory/$setId.tsx`
- `packages/web/src/components/sets/SetCard.tsx`
- `packages/web/src/hooks/useInventory.ts`

**Depends on**: Phase 1, Phase 2

**Verify**:
- Add set via web UI, see in inventory list
- Filter by owner/theme, sort by value
- View detail, edit condition, delete set

---

### Phase 4: Price Tracking & Nightly Job
**Goal**: BrickLink pricing, automated nightly updates

**Build**:
- `services/bricklink.ts` - OAuth 1.0 signing, price guide API
- `services/price-updater.ts` - shared update logic with rate limiting
- `routes/prices.ts` - latest price, history, manual trigger
- `scripts/nightly-prices.ts` - standalone cron script
- launchd plist template
- Update SetCard and detail page to show market value and gain/loss

**Key files**:
- `packages/api/src/services/bricklink.ts`, `packages/api/src/services/price-updater.ts`
- `packages/api/src/routes/prices.ts`
- `scripts/nightly-prices.ts`

**Depends on**: Phase 1, Phase 3

**Verify**:
- BrickLink returns price data for known sets
- Manual `POST /api/prices/update` works
- `bun run scripts/nightly-prices.ts` processes all inventory sets
- price_history table populated, UI shows values

---

### Phase 5: Reports & Dashboard
**Goal**: Charts, aggregations, polished dashboard

**Build**:
- `routes/reports.ts` - 7 report endpoints with SQL aggregations
- Dashboard: summary cards, recently added, top sets, price movers
- Reports page: value by member/theme (bar charts), portfolio trend (line chart), top sets table
- Recharts integration
- Price history line chart on set detail page
- Report query hooks with 5-min stale time

**Key files**:
- `packages/api/src/routes/reports.ts`
- `packages/web/src/routes/index.tsx` (dashboard rewrite)
- `packages/web/src/routes/reports/index.tsx`
- `packages/web/src/components/reports/*.tsx`

**Depends on**: Phase 4 (needs price data for meaningful reports)

**Verify**:
- Report endpoints return correct aggregated numbers
- Dashboard shows real stats
- Charts render with data
- Portfolio trend shows value changes over time

---

### Phase 6: Polish, Mobile & CLI
**Goal**: Production-ready family app

**Build**:
- Mobile optimization: fixed bottom nav, safe-area-inset, touch targets, permission handling
- LEGO-inspired UI polish: color palette, brick patterns, stud-dot buttons, loading animations
- Toast notifications, skeleton loading states, error boundaries
- `@lego/cli` - all 6 commands calling API over HTTP, formatted table output
- `bun link` for global `lego` command
- Production mode: API serves built web via serveStatic
- Root scripts: `dev`, `build`, `start`

**Key files**:
- `packages/cli/src/index.ts`, `packages/cli/src/commands/*.ts`
- `packages/web/src/styles/globals.css` (LEGO theme)
- `packages/web/src/components/layout/MobileNav.tsx`

**Depends on**: All previous phases

**Verify**:
- App works on iPhone Safari (scanning, forms, navigation)
- `lego add 75192 --owner Jay` works from terminal
- `lego report summary` matches web dashboard
- `bun run start` serves everything on single port

---

## Key Technical Decisions

| Decision | Rationale |
|----------|-----------|
| **Tesseract.js server-side** | Avoid 15MB WASM download on every phone visit |
| **No ORM** | Direct bun:sqlite with prepared statements; 7 tables don't justify ORM overhead |
| **Single process production** | One Bun process serves API + static web files |
| **Rebrickable "-1" suffix** | Most sets are version 1; try bare number then with "-1" |
| **BrickLink bare numbers** | Strip "-1" suffix for BrickLink API calls |
| **Two-legged OAuth 1.0** | BrickLink doesn't need user auth flow, just request signing |
| **UPC two-hop pipeline** | No LEGO API has barcode search; go through UPCitemdb first |
| **SQLite WAL mode** | Allows concurrent reads during nightly job writes |
| **Denormalized theme_name** | Avoid joins for a field that rarely changes |
| **No auth** | Family app on local network; simplicity over security |
