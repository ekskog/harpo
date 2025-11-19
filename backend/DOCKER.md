Multi-arch build and push

This project contains a multi-architecture-friendly Dockerfile. Use Docker Buildx to build and optionally push images for multiple platforms.

Example: build and push for linux/amd64 and linux/arm64

```bash
cd backend
# create and use a buildx builder (only needed once)
docker buildx create --use --name harpo-builder
# build and push multi-arch image
docker buildx build --platform linux/amd64,linux/arm64 -t your-registry/ekskog/harpo-backend:latest --push .
```

If you want to test locally without pushing, omit `--push` and add `--load` (note: --load only supports single-platform images):

```bash
# build single-platform image and load into local docker
docker buildx build --platform linux/amd64 -t ekskog/harpo-backend:local --load .
```

Notes:
- Ensure you have a `package-lock.json` for reproducible builds.
- Provide runtime envs via Kubernetes `ConfigMap`/`Secret` or `--env-file` for local runs.
