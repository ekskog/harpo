# Harpo - Music Collection Manager

A web application for managing music collections and songs. Built with **Vue.js** for the frontend and **Node.js + Express** for the backend. Deployed on a **k3s cluster**.

## Features
- Collection-based organization of songs
- Song lyrics with metadata (title, track order, timestamps)
- RESTful API for collections and songs
- Health checks and database connectivity
- Containerized deployment with Docker
- Automated CI/CD with GitHub Actions

## Architecture Overview

### Components
- **Frontend (harp-ui):** Vue.js SPA served by Nginx
- **Backend (harp-api):** Node.js + Express API with MariaDB
- **Database:** MariaDB for collections and songs
- **Deployment:** k3s cluster with automated CI/CD

## Repository Structure
```
harpo/
├── harp-ui/         # Vue.js frontend (Vite + Nginx)
├── harp-api/        # Node.js backend (Express + MariaDB)
├── k8s/             # Kubernetes manifests
├── .github/         # GitHub Actions workflows
└── README.md
```

## API Endpoints

### Collections
- `GET /collections` - List all collections
- `GET /collections/:id/songs` - Get songs for a specific collection

### Health
- `GET /health` - Health check with database status

## Local Development

### Prerequisites
- Node.js 18+
- MariaDB
- Docker (optional)

### Setup
```bash
# Backend
cd harp-api
npm install
npm run dev

# Frontend
cd harp-ui
npm install
npm run dev
```

## Deployment

### Automated CI/CD
The repository includes GitHub Actions workflows that automatically:
1. Build Docker images when code changes
2. Push images to GitHub Container Registry
3. Deploy to k8s cluster (requires setup)

### Manual Deployment
```bash
# Build and push images
docker build -t ghcr.io/ekskog/harp-ui:latest ./harp-ui
docker build -t ghcr.io/ekskog/harpo-backend:latest ./harp-api
docker push ghcr.io/ekskog/harp-ui:latest
docker push ghcr.io/ekskog/harpo-backend:latest

# Deploy to k8s
kubectl apply -f k8s/
```

### Setting up Automated Deployment

**⚠️ Security First**: The setup creates a service account with **limited permissions** - it can only deploy to the `harp` namespace, not destroy your entire cluster.

To enable automatic deployment to your k8s cluster:

1. **Run the setup script on your k8s cluster:**
   ```bash
   ./setup-github-actions-k8s.sh
   ```

2. **Copy the generated base64 kubeconfig**

3. **Add to GitHub Secrets:**
   - Go to Repository Settings → Secrets and variables → Actions
   - Create new secret: `KUBE_CONFIG`
   - Paste the base64 kubeconfig as the value

4. **Test with manual deployment first:**
   - Go to Actions tab → "Build and publish harp images"
   - Click "Run workflow" → Set "Deploy to k8s" to "true"
   - This tests deployment without automatic triggers

5. **Enable automatic deployment** by pushing changes to main branch

### Deployment Controls
- **Automatic**: Every push to `main` triggers deployment (unless commit message contains `[skip deploy]`)
- **Manual**: Use workflow dispatch to deploy on-demand
- **Safe**: Limited to `harp` namespace only - cannot affect other workloads
- **Rollback**: `kubectl rollout undo deployment/harp-ui -n harp` if needed

### What the Setup Does
✅ Creates `github-actions` service account in `harp` namespace  
✅ Grants **only deployment permissions** (create/update/delete deployments, services, ingresses)  
✅ Generates secure kubeconfig for GitHub Actions  
✅ **Cannot**: Delete namespaces, access other clusters, or perform destructive operations  

The script is safe and follows the principle of least privilege!
