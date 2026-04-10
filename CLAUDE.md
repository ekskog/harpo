# Harpo — Project Guide for Claude Code

## Project Purpose

Harpo is a personal catalog app for a songwriter. The core model is simple: a **collection** is a group of songs (think album, EP, or any thematic grouping), and each **song** belongs to one collection with a title and track order. Beyond the basics, collections can have cover art and a Bandcamp URL, songs can have lyrics and artwork, and everything is behind authentication so only the owner can make changes.

The app is a full-stack web application: a Vue 3 SPA for the UI and a Node.js/Express API backed by MariaDB, deployed on Kubernetes (k3s).

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend runtime | Node.js 22 |
| Backend framework | Express.js |
| Database | MariaDB |
| Frontend framework | Vue 3 (`<script setup>`) |
| Build tool | Vite |
| Styling | Tailwind CSS |
| Web server (prod) | Nginx (serves SPA + proxies `/api/*`) |
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
│   │   ├── routes/            # Express route handlers (collections, health)
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
│   ├── Dockerfile
│   └── nginx.conf
│
├── k8s/                       # Kubernetes manifests
│   ├── deployment.yaml        # harp-api & harpo-ui deployments
│   ├── service.yaml
│   └── secret.yaml            # DB credentials (Base64 encoded)
│
└── .github/workflows/
    ├── harp-api.yml           # Multi-arch image build & optional k8s deploy
    └── harp-ui.yml            # Image build on release
```

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
npm run dev     # Vite dev server (proxies /api/* → localhost:3000)
npm run build   # Production build → dist/
npm run preview # Preview built app locally
```

### Docker

```bash
docker build -t ghcr.io/ekskog/harp-api:latest ./harp-api
docker build -t ghcr.io/ekskog/harp-ui:latest  ./harp-ui
```

### Kubernetes

```bash
kubectl apply -f k8s/
kubectl rollout undo deployment/harp-ui -n webapps   # rollback UI
```

---

## API Reference

**Base path:** `/api/v1`

**Authentication:** `Authorization: Bearer <token>` header. Auth endpoints: `POST /auth/login`, `POST /auth/register`.

**Collections:**
- `GET /collections` — list all
- `POST /collections` — create (auth)
- `PATCH /collections/:id` — update (auth)
- `DELETE /collections/:id` — delete (auth)
- `GET/POST /collections/:id/cover` — cover image

**Songs** (nested under collections):
- `GET /collections/:id/songs` — list songs
- `POST /collections/:id/songs` — create (auth)
- `PATCH /collections/:id/songs/:songId` — update (auth)
- `DELETE /collections/:id/songs/:songId` — delete (auth)
- `GET/POST /collections/:id/songs/:songId/image` — song image
- `GET/POST/PATCH /collections/:id/songs/:songId/lyrics` — lyrics (POST/PATCH auth)

**Response envelope:**
```json
{ "success": true,  "data": {}, "count": 5,       "timestamp": "..." }
{ "success": false, "error": "...", "message": "...", "timestamp": "..." }
```

**Health:** `GET /health` — returns DB connection status.

---

## Environment Variables

### Backend (`harp-api`)

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_HOST` | `localhost` | MariaDB hostname |
| `DB_PORT` | `3306` | MariaDB port |
| `DB_USER` | `root` | DB user |
| `DB_PASSWORD` | — | DB password (required) |
| `DB_NAME` | — | Database name (required) |
| `PORT` | `3000` | Express listen port |

In Kubernetes, credentials come from the `harpo-secret` Secret in the `webapps` namespace via `envFrom.secretRef`.

### Frontend (`harp-ui`)

- No build-time env vars required.
- Auth tokens stored in `localStorage` under keys `harp_auth_token` and `harp_user`.
- API base URL defaults to `/api/v1` in `src/services/api.js`.

---

## Conventions

### Backend
- **Module system:** CommonJS (`require` / `module.exports`)
- **Architecture:** Routes → Services → DB pool. Routes stay thin; DB logic lives in `databaseService.js`.
- **File naming:** camelCase files, PascalCase class names.
- **Error handling:** All routes wrap in try/catch and return the standard JSON envelope.
- **Security:** Express runs as non-root user `harpo:nodejs` (uid 1001) inside the container. PID 1 is `dumb-init`.

### Frontend
- **Component syntax:** `<script setup>` (Composition API) throughout — no Options API.
- **State management:** No Vuex/Pinia; local `ref()`/`computed()` plus the `useAuth` composable.
- **Component naming:** PascalCase SFCs (e.g., `CreateCollectionModal.vue`).
- **API calls:** Always go through `src/services/api.js` — never use `fetch`/`axios` directly in components.
- **Styling:** Tailwind utility classes; scoped `<style>` blocks only for transitions and animations not expressible in Tailwind.

### CI/CD
- API images are multi-arch (`linux/amd64` + `linux/arm64`) to support the k3s cluster.
- Images are tagged `latest` and `<git-sha>`.
- Add `[skip deploy]` to a commit message to build the image without rolling out to k8s.
- UI images publish on GitHub Release events; API images publish on every push to `main` affecting `harp-api/`.
