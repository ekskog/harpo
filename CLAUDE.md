# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Purpose

Harpo is a personal catalog app for a songwriter. A **collection** is a group of songs (think album, EP, or any thematic grouping); each **song** belongs to one collection with a title and track order. Collections can have cover art and a Bandcamp URL; songs can have lyrics and artwork. Everything is behind JWT auth so only the owner can make changes.

Full-stack: Vue 3 SPA + Node.js/Express API + MariaDB, deployed on Kubernetes (k3s).

---

## Build & Run Commands

There is no test suite. There are no lint scripts. The only commands are:

### Backend (`harp-api`)
```bash
cd harp-api && npm run dev    # nodemon hot-reload
cd harp-api && npm start      # production (node src/server.js)
```

### Frontend (`harp-ui`)
```bash
cd harp-ui && npm run dev     # Vite dev server — proxies /api/* to https://harp-api.ekskog.net (Cloudflare, slow)
cd harp-ui && npm run build   # Production build → dist/
```

**Note:** Local dev API calls go out through Cloudflare and back. In-cluster it's instant.

---

## Architecture

### Backend: Routes → Services → DB

- **Routes** (`src/routes/`) are thin — parse params, call `databaseService`, return JSON envelope.
- **`databaseService.js`** is the sole DB abstraction: a singleton class wrapping all queries against the MariaDB pool.
- **`requireAuth` middleware** (`src/middleware/auth.js`) validates JWT Bearer tokens — add to any route that needs protection.
- **Module system:** CommonJS (`require`/`module.exports`) throughout.
- **Response envelope:** always `{ success: true, data: {} }` or `{ success: false, error: "...", message: "..." }`.

### Frontend: Single-page App

- **`App.vue`** — shell. Loads collections list, renders a `<select>` dropdown, mounts `<CollectionView>` for the selected collection.
- **`CollectionView.vue`** — the main hub. Renders songs list, lyrics panel, and orchestrates all edit/add modals. Fetches full collection (including songs) from the API whenever `collectionId` changes.
- **`src/services/api.js`** — centralized API client (`ApiService` class + named endpoint objects: `collectionsApi`, `authApi`, `healthApi`). All components should use this. **Exception:** `App.vue` uses raw `fetch` directly for the collections list — a known deviation.
- **`src/composables/useAuth.js`** — auth state + `getAuthHeaders()`. Tokens stored in `localStorage` under `harp_auth_token` / `harp_user`.
- **State management:** No Vuex/Pinia. Local `ref()`/`computed()` + `useAuth` composable.
- **Styling:** Tailwind utility classes; scoped `<style>` only for CSS transitions not expressible in Tailwind.

### NFS Media Storage

The `source` field on a collection is the NFS subdirectory name (e.g. `"my-album"`). All media files are derived from it:

| File | Path |
|------|------|
| Collection cover | `{NFS_ROOT}/{collection.source}/cover.{ext}` |
| Song image | `{NFS_ROOT}/{collection.source}/{track_order}.{ext}` |
| Song lyrics | `{NFS_ROOT}/{collection.source}/{track_order}.txt` |

**Song images and lyrics are keyed by `track_order`, not song ID.** A song without a `track_order` cannot have its lyrics served (API returns 422).

**All NFS write endpoints (cover upload, song image upload, lyrics save/update) return 501** — the routes exist but are disabled until NFS write permissions are confirmed. The UI shows upload affordances that will currently fail.

---

## API Reference

**Base path:** `/api/v1` | **Auth:** `Authorization: Bearer <token>` on all POST/PATCH/DELETE.

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/auth/login` | — | Returns JWT + user |
| POST | `/auth/register` | — | |
| GET | `/collections` | — | |
| GET | `/collections/:id` | — | Embeds `songs[]` in response |
| POST | `/collections` | ✓ | Requires `name`, `source` |
| PATCH | `/collections/:id` | ✓ | Uses `COALESCE` — omit fields to leave unchanged |
| DELETE | `/collections/:id` | ✓ | Cascades to songs via FK |
| GET | `/collections/:id/cover` | — | Serves file from NFS |
| POST | `/collections/:id/cover` | ✓ | **501 — disabled** |
| POST | `/collections/:id/songs` | ✓ | Accepts `track_order` or `trackOrder` |
| PATCH | `/collections/:id/songs/:songId` | ✓ | Accepts `track_order` or `trackOrder` |
| DELETE | `/collections/:id/songs/:songId` | ✓ | |
| GET | `/collections/:id/songs/:songId/image` | — | Serves file from NFS |
| POST | `/collections/:id/songs/:songId/image` | ✓ | **501 — disabled** |
| GET | `/collections/:id/songs/:songId/lyrics` | — | Returns `{ data: { lyrics: "..." } }` |
| POST | `/collections/:id/songs/:songId/lyrics` | ✓ | **501 — disabled** |
| PATCH | `/collections/:id/songs/:songId/lyrics` | ✓ | **501 — disabled** |

---

## Deployment Architecture

```
Browser → Cloudflare → nginx proxy (attic.local) → MetalLB → k8s pod
```

- **harp.ekskog.me** → harpo-ui pod (nginx, port 80); nginx proxies `/api/*` to `http://harp-api` (in-cluster service)
- **harp-api.ekskog.net** → harp-api pod (Express, port 3000 via service port 80)
- k8s namespace: `webapps`; secrets from `harpo-secret` via `envFrom.secretRef`
- Container user: `nobody` (uid 65534) to match NFS `all_squash` anonuid

**Never run `kubectl apply -f k8s/deployment.yaml` manually after a workflow deploy** — it resets the image tag to `latest` (stale cached image). Let the workflow's `kubectl set image` handle deploys.

### CI/CD
- GitHub Actions workflows in `.github/workflows/` trigger on push to `main` touching `harp-api/**` or `harp-ui/**` respectively.
- Images tagged `latest` + `<git-sha>`; workflow deploys via SHA tag.
- UI build uses Vite 6 — do not upgrade to Vite 8 (`@vitejs/plugin-vue` is not compatible yet).

---

## Environment Variables

### Backend (`harp-api`)
| Variable | Description |
|----------|-------------|
| `DB_HOST` / `DB_PORT` / `DB_USER` / `DB_PASSWORD` / `DB_NAME` | MariaDB connection |
| `JWT_SECRET` | JWT signing secret |
| `PORT` | Express listen port (default 3000) |

### Frontend (`harp-ui`)
No build-time env vars. API base URL is hardcoded to `/api/v1` in both `src/services/api.js` and `src/composables/useAuth.js`. Dev proxy target is in `vite.config.js`.
