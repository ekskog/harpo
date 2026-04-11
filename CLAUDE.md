# Harpo — Project Guide for Claude Code

## Project Purpose

Harpo is a personal catalog app for a songwriter. The core model is simple: a **collection** is a group of songs (think album, EP, or any thematic grouping), and each **song** belongs to one collection with a title and track order. Beyond the basics, collections can have cover art and a Bandcamp URL, songs can have lyrics and artwork, and everything is behind JWT authentication so only the owner can make changes.

The app is a full-stack web application: a Vue 3 SPA for the UI and a Node.js/Express API backed by MariaDB, deployed on Kubernetes (k3s).

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend runtime | Node.js 22 |
| Backend framework | Express.js |
| Database | MariaDB |
| Frontend framework | Vue 3 (`<script setup>`) |
| Build tool | Vite 6 |
| Styling | Tailwind CSS |
| Web server (prod) | Nginx (serves SPA + proxies `/api/*` to harp-api in-cluster) |
| Containers | Docker (multi-stage builds) |
| Orchestration | Kubernetes (k3s), namespace `webapps` |
| Container registry | GitHub Container Registry (GHCR) |
| CI/CD | GitHub Actions |
| Package manager | npm |

---

## Folder Structure

```
harpo/
├── harp-api/                  # Express backend
│   ├── src/
│   │   ├── config/database.js # MariaDB connection pool
│   │   ├── middleware/auth.js  # JWT requireAuth middleware
│   │   ├── routes/            # collections.js, auth.js, health.js
│   │   ├── services/          # databaseService.js — DB query abstraction
│   │   └── server.js          # App entry point
│   ├── Dockerfile
│   └── package.json
│
├── harp-ui/                   # Vue 3 frontend
│   ├── src/
│   │   ├── components/        # PascalCase Vue SFCs (modals, views)
│   │   ├── composables/       # useAuth.js — auth state & JWT management
│   │   ├── services/api.js    # Centralized API client
│   │   ├── main.js
│   │   └── style.css          # Tailwind imports + global styles
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── nginx.conf             # Serves SPA + proxies /api/ to http://harp-api
│   ├── Dockerfile
│   └── package.json
│
├── k8s/                       # Kubernetes manifests
│   ├── deployment.yaml        # harp-api & harpo-ui deployments
│   ├── service.yaml           # harp-api: LoadBalancer:80; harpo-ui: LoadBalancer:80
│   └── secret.yaml            # DB credentials + JWT_SECRET (Base64 encoded)
│
└── .github/workflows/
    ├── harp-api.yml           # Build & deploy on push to harp-api/**
    └── harp-ui.yml            # Build & deploy on push to harp-ui/**
```

---

## Deployment Architecture

```
Browser → Cloudflare → nginx proxy (attic.local) → MetalLB → k8s pod
```

- **harp.ekskog.me** → nginx proxy → `harp-ui.attic.local` (192.168.1.202) → harpo-ui pod (nginx, port 80)
- **harp-api.ekskog.net** → nginx proxy → `harp-api.attic.local` → harp-api pod (Express, port 3000 via service port 80)
- The UI nginx proxies `/api/*` internally to `http://harp-api` (in-cluster service, same namespace)

**Important:** Never run `kubectl apply -f k8s/deployment.yaml` manually after a workflow deploy — it resets the image tag back to `latest` (stale cached image). Let the workflow's `kubectl set image` handle deploys.

---

## Build & Run Commands

### Backend (`harp-api`)

```bash
cd harp-api
npm install
npm run dev     # nodemon (hot-reload)
npm start       # node src/server.js (production)
```

### Frontend (`harp-ui`)

```bash
cd harp-ui
npm install
npm run dev     # Vite dev server (proxies /api/* → https://harp-api.ekskog.net)
npm run build   # Production build → dist/
```

**Note:** Local dev is slow because every API call goes out through Cloudflare and back. In-cluster it's instant.

### Docker

```bash
docker build -t ghcr.io/ekskog/harp-api:latest ./harp-api
docker build -t ghcr.io/ekskog/harpo-ui:latest  ./harp-ui
```

---

## API Reference

**Base path:** `/api/v1`

**Authentication:** `Authorization: Bearer <token>` header. All POST/PATCH/DELETE routes require auth.

**Auth:**
- `POST /auth/register` — create user (username + password)
- `POST /auth/login` — returns JWT token + user object

**Collections:**
- `GET /collections` — list all (no auth)
- `GET /collections/:id` — single collection with songs array embedded (no auth)
- `POST /collections` — create (auth)
- `PATCH /collections/:id` — update (auth)
- `DELETE /collections/:id` — delete + cascades to songs (auth)
- `GET /collections/:id/cover` — cover image file from NFS

**Songs** (nested under collections):
- `POST /collections/:id/songs` — create (auth)
- `PATCH /collections/:id/songs/:songId` — update (auth)
- `DELETE /collections/:id/songs/:songId` — delete (auth)
- `GET /collections/:id/songs/:songId/image` — song image from NFS
- `GET /collections/:id/songs/:songId/lyrics` — lyrics text from NFS

**NFS storage:** Cover images at `{NFS_ROOT}/{collection.source}/cover.{ext}`, song images at `{NFS_ROOT}/{collection.source}/{track_order}_image.{ext}`, lyrics at `{NFS_ROOT}/{collection.source}/{track_order}.txt`. Write endpoints (POST/PATCH for cover, image, lyrics) are disabled (501) until NFS write permissions are confirmed.

**Response envelope:**
```json
{ "success": true,  "data": {} }
{ "success": false, "error": "...", "message": "..." }
```

---

## Environment Variables

### Backend (`harp-api`)

| Variable | Description |
|----------|-------------|
| `DB_HOST` | MariaDB hostname |
| `DB_PORT` | MariaDB port (default 3306) |
| `DB_USER` | DB user |
| `DB_PASSWORD` | DB password |
| `DB_NAME` | Database name |
| `JWT_SECRET` | Secret for signing JWTs |
| `PORT` | Express listen port (default 3000) |

All come from the `harpo-secret` k8s Secret via `envFrom.secretRef`.

### Frontend (`harp-ui`)

- No build-time env vars required.
- Auth tokens stored in `localStorage` under keys `harp_auth_token` and `harp_user`.
- API base URL is `/api/v1` in both `src/services/api.js` and `src/composables/useAuth.js`.

---

## Conventions

### Backend
- **Module system:** CommonJS (`require` / `module.exports`)
- **Architecture:** Routes → Services → DB pool. Routes stay thin; DB logic lives in `databaseService.js`.
- **Auth:** `requireAuth` middleware in `src/middleware/auth.js` — add to any route that needs protection.
- **Error handling:** All routes wrap in try/catch and return the standard JSON envelope.
- **Container user:** Runs as `nobody` (uid 65534) to match NFS `all_squash` anonuid.

### Frontend
- **Component syntax:** `<script setup>` (Composition API) throughout — no Options API.
- **State management:** No Vuex/Pinia; local `ref()`/`computed()` plus the `useAuth` composable.
- **Component naming:** PascalCase SFCs (e.g., `CreateCollectionModal.vue`).
- **API calls:** Always go through `src/services/api.js` — never use `fetch`/`axios` directly in components.
- **Auth guards:** Currently removed (`v-if="isAuthenticated"` stripped) — all CRUD buttons visible. Add back when auth UX is finalised.
- **Styling:** Tailwind utility classes; scoped `<style>` blocks only for transitions not expressible in Tailwind.

### CI/CD
- Both workflows trigger on push to `main` affecting their respective directories.
- Images tagged `latest` and `<git-sha>`. Workflow deploys using SHA tag via `kubectl set image`.
- `no-cache: true` on API builds to avoid stale layer cache issues.
- UI build uses Vite 6 — do not upgrade to Vite 8, `@vitejs/plugin-vue` is not compatible yet.
