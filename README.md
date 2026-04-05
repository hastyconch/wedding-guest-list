# Wedding guest list

Next.js (App Router) + **Route Handlers** + **Prisma 7** + **PostgreSQL** (via `@prisma/adapter-pg` + `pg`).

**UI** is inspired by **Discord**: dark layered surfaces (`#1e1f22` / `#2b2d31` / `#313338`), blurple accent (`#5865F2`), left sidebar with channel-style nav, mobile bottom bar, and “online”-style green toggles for invited guests.

## Setup (local)

1. Create a **Postgres** database. Easiest: [Neon](https://neon.tech) free tier → copy the connection string (`postgresql://…`).
2. Copy [`.env.example`](.env.example) to `.env.local` and set `DATABASE_URL` to that string.
3. Run migrations and seed:

```bash
cd wedding-guest-list
npm install
npx prisma migrate dev
npm run db:seed   # optional — the app also creates “Base List” on first dashboard load
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Why PostgreSQL?

The app used to support SQLite with a file on disk. **Serverless hosts (e.g. Vercel) cannot share a SQLite file across instances**, so each visitor could see an empty database or a different random “copy.” **One shared Postgres URL** fixes that: everyone with your link reads and writes the same guests and OAuth token (for Google Sheets).

## Deploying (Vercel)

1. Create a Neon (or other) Postgres DB. Use the **pooled** connection string if Neon offers it; add `?sslmode=require` if needed.
2. In **Vercel → Project → Settings → Environment Variables**, set:
   - `DATABASE_URL` — same Postgres URL as local (production branch).
   - `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — same OAuth app as local (add your Vercel URL to **Authorized redirect URIs**, e.g. `https://your-app.vercel.app/api/google/callback`).
   - `NEXT_PUBLIC_APP_URL` — `https://your-app.vercel.app` (matches how users open the site).
3. **Redeploy.** The build runs `prisma migrate deploy`, which applies migrations to that database.
4. Open the live URL once; the dashboard creates the default **Base List** scenario if needed. Connect Google and import your sheet — **all visitors** will see the same list.

Optional: `SEED_SECRET` + `POST /api/admin/seed` is only needed if you prefer API-based seeding instead of the automatic scenario creation.

## Scripts

| Command | Description |
|--------|-------------|
| `npm run dev` | Dev server |
| `npm run build` | `prisma generate` + `migrate deploy` + `next build` (needs `DATABASE_URL` at build time on Vercel) |
| `npm run start` | Production server |
| `npm run db:seed` | Run `prisma/seed.ts` |

## Environment

- `DATABASE_URL` — **required**; must be `postgres://` or `postgresql://`.
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — for **Google Sheets import**.
- `NEXT_PUBLIC_APP_URL` — optional locally; **set on Vercel** to your production URL for OAuth redirects.

## Google Sheets import

1. **Google Cloud Console** → enable **Google Sheets API** for your project.
2. **OAuth consent screen** — add scope `.../auth/spreadsheets.readonly` (or broader if you change code).
3. **Credentials** → Web client → **Authorized redirect URIs** must include:
   - `http://localhost:3000/api/google/callback`
   - `https://<your-vercel-domain>/api/google/callback`
4. Copy **Client ID** and **Client secret** into `.env.local` / Vercel (see [`.env.example`](.env.example)).
5. On the **Dashboard**, click **Connect Google**, then import.

**API routes:** `GET /api/google/auth`, `GET /api/google/callback`, `GET /api/google/status`, `POST /api/google/import`, `POST /api/google/disconnect`.

**Sheet format:** Row 1 = headers. Required: `first_name`, `last_name`. Optional: `category`, `side`, `manual_priority`, `notes` (see `src/lib/google-sheet-import.ts`).

## Data model (Prisma)

- **Guest** — name, category, side, `priorityScore`, `manualPriority`, optional `groupId`, `linkedGuestId`, `isPlusOne`, notes, tags.
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

## Migrating from SQLite

If you had an old `dev.db`, export guests from the app or copy data manually. New installs should use Postgres only; the SQLite schema and migrations were replaced by a single Postgres migration.
