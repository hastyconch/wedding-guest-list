# Wedding guest list

Next.js (App Router) + **Route Handlers** + **Prisma 7** + **SQLite** (`file:./dev.db`) with the **`@prisma/adapter-better-sqlite3`** driver adapter (required for Prisma ORM 7).

**UI** is inspired by **Discord**: dark layered surfaces (`#1e1f22` / `#2b2d31` / `#313338`), blurple accent (`#5865F2`), left sidebar with channel-style nav, mobile bottom bar, and “online”-style green toggles for invited guests.

## Setup

```bash
cd wedding-guest-list
npm install
npx prisma migrate dev  # if you change schema
npx prisma db seed      # “Base List” scenario only (add guests via import or /guests)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
|--------|-------------|
| `npm run dev` | Dev server |
| `npm run build` | `prisma generate` + `next build` |
| `npm run start` | Production server |
| `npm run db:seed` | Run `prisma/seed.ts` |

## Environment

- `DATABASE_URL` — default `file:./dev.db` (SQLite file at project root). Prisma CLI and the app resolve paths from the project root.
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — for **Google Sheets import** (see below).
- `NEXT_PUBLIC_APP_URL` — optional; defaults to `http://localhost:3000`. Must match how you open the app if you change port or domain (OAuth redirect uses it).

## Google Sheets import

1. **Google Cloud Console** → enable **Google Sheets API** for your project.
2. **OAuth consent screen** — add scope `.../auth/spreadsheets.readonly` (or broader if you change code).
3. **Credentials** → your Web client → **Authorized redirect URIs** must include exactly:
   - `http://localhost:3000/api/google/callback`
4. Copy **Client ID** and **Client secret** into `.env.local` (see [`.env.example`](.env.example)).
5. Run `npx prisma migrate dev` (adds `OAuthCredential` table), then `npm run dev`.
6. On the **Dashboard**, click **Connect Google**, approve access, then paste a **Spreadsheet ID** (from the Google Sheet URL) and **Import rows**.

**API routes:** `GET /api/google/auth` (starts OAuth), `GET /api/google/callback`, `GET /api/google/status`, `POST /api/google/import`, `POST /api/google/disconnect`.

**Sheet format:** Row 1 = headers. Required columns: `first_name`, `last_name`. Optional: `category`, `side`, `manual_priority`, `notes` (see `src/lib/google-sheet-import.ts`).

If you ever pasted secrets into `package.json` or committed `.env.local`, **rotate the client secret** in Google Cloud.

## Data model (Prisma)

- **Guest** — name, category, side, `priorityScore`, `manualPriority`, optional `groupId`, `linkedGuestId`, `isPlusOne`, notes.
- **Group** — household label.
- **Scenario** — named list; `filterPreset` (JSON string, optional); `isLocked`, `isDefault`.
- **ScenarioGuest** — per-scenario `invited` flag (composite key `scenarioId` + `guestId`).

## API (Route Handlers)

- `GET/POST /api/guests` — list (query `scenarioId`) / create (requires `scenarioId` to attach `ScenarioGuest`).
- `PATCH/DELETE /api/guests/[id]`
- `GET/POST /api/scenarios`
- `GET/PATCH/DELETE /api/scenarios/[id]`
- `POST /api/scenarios/[id]/duplicate` — body `{ "name": "..." }`
- `POST /api/scenarios/[id]/auto-fill` — priority engine, cap **200**
- `PATCH /api/scenarios/[id]/guests` — body `{ guestId, invited }`
- Google: `GET /api/google/auth`, `GET /api/google/callback`, `GET /api/google/status`, `POST /api/google/import`, `POST /api/google/disconnect`

Shared logic lives under `src/lib/data/` so pages can call the same functions without an HTTP roundtrip.

## Deploying

SQLite on serverless hosts (e.g. Vercel) is not durable. For production, move to Postgres (e.g. Neon) and a matching Prisma adapter, or host on a VM with a persistent disk.
