Harpo Backend

This is a small TypeScript + Express API used by the Harpo project.

Quick start (local)

1. Install deps

```bash
cd backend
npm install
```

2. Create `.env` from `.env.example` and fill DB credentials

```bash
cp .env.example .env
# edit .env to set DB_HOST, DB_USER, DB_PASS, DB_NAME
```

3. Run in development

```bash
npm run dev
```

4. Build and run production

```bash
npm run build
npm start
```

Environment variables

- `DB_HOST` (required unless `DB_ALLOW_DEFAULTS=true`)
- `DB_PORT` (default `3306`)
- `DB_USER` (required unless `DB_ALLOW_DEFAULTS=true`)
- `DB_PASS` (optional)
- `DB_NAME` (defaults to `harp_db`)
- `DB_ALLOW_DEFAULTS` (default `false`) — set to `true` for local convenience
- `DB_DEBUG` (default `false`) — logs DB connection errors to console

Docker (multi-arch)

See `DOCKER.md` for `docker buildx` examples. In short:

```bash
# build and push multi-arch
docker buildx build --platform linux/amd64,linux/arm64 -t your-registry/ekskog/harpo-backend:latest --push .
```

Kubernetes

Manifests are in `k8s/`. The `deployment.yaml` and `service.yaml` assume image `ekskog/harpo-backend:latest` and reference `ConfigMap` `harpo-config` and `Secret` `harpo-secret` for environment variables and secrets.

Security and next steps

- Do not commit real secrets. Use `kubectl create secret generic harpo-secret --from-literal=DB_PASS=...` or a secret manager.
- Consider adding readiness/liveness tuning for your environment and RBAC for the service account.
- Add CI to build and publish multi-arch images on push.
