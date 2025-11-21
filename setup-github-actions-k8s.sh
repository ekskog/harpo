#!/bin/bash

# Script to set up GitHub Actions deployment to k8s
# Run this on your k8s cluster to generate the kubeconfig for GitHub Actions

set -e

echo "Setting up GitHub Actions deployment to k8s..."
echo "This script will:"
echo "1. Create a service account for GitHub Actions"
echo "2. Generate a kubeconfig for the service account"
echo "3. Output the base64-encoded kubeconfig to add to GitHub secrets"
echo ""

# Create namespace if it doesn't exist
kubectl create namespace harp --dry-run=client -o yaml | kubectl apply -f -

# Create service account
kubectl apply -f - <<EOF
apiVersion: v1
kind: ServiceAccount
metadata:
  name: github-actions
  namespace: harp
EOF

# Create role binding with limited permissions (only deployment operations)
kubectl apply -f - <<EOF
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: github-actions-deploy
  namespace: harp
rules:
- apiGroups: ["apps"]
  resources: ["deployments", "replicasets"]
  verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
- apiGroups: [""]
  resources: ["services", "configmaps", "secrets"]
  verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
- apiGroups: ["networking.k8s.io"]
  resources: ["ingresses"]
  verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
EOF

kubectl apply -f - <<EOF
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: github-actions-deploy-binding
  namespace: harp
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: github-actions-deploy
subjects:
- kind: ServiceAccount
  name: github-actions
  namespace: harp
EOF

# Create a secret for the service account (required for older k8s versions)
kubectl apply -f - <<EOF
apiVersion: v1
kind: Secret
metadata:
  name: github-actions-token
  namespace: harp
  annotations:
    kubernetes.io/service-account.name: github-actions
type: kubernetes.io/service-account-token
EOF

echo "Service account and role binding created."
echo ""

# Wait for the secret to be populated
echo "Waiting for service account token to be created..."
sleep 10

# Get the service account token
SA_SECRET="github-actions-token"
SA_TOKEN=$(kubectl get secret $SA_SECRET -n harp -o jsonpath='{.data.token}' | base64 -d)

if [ -z "$SA_TOKEN" ]; then
  echo "Error: Could not get service account token"
  echo "Trying alternative method..."
  
  # Alternative: Use token request (for newer k8s versions)
  SA_TOKEN=$(kubectl create token github-actions -n harp --duration=8760h)
  
  if [ -z "$SA_TOKEN" ]; then
    echo "Error: Could not create service account token"
    exit 1
  fi
fi

# Get cluster info
CLUSTER_NAME=$(kubectl config current-context)
CLUSTER_SERVER=$(kubectl config view -o jsonpath='{.clusters[0].cluster.server}')

# Get CA certificate from current context
CLUSTER_CA=$(kubectl config view --raw -o jsonpath='{.clusters[0].cluster.certificate-authority-data}')

if [ -z "$CLUSTER_CA" ]; then
  # Try to get it from the cluster info
  CLUSTER_CA=$(kubectl get configmap kube-root-ca.crt -n kube-public -o jsonpath='{.data.ca\.crt}' | base64 | tr -d '\n')
fi

if [ -z "$CLUSTER_CA" ]; then
  echo "Error: Could not get cluster CA certificate"
  exit 1
fi

# Create kubeconfig
cat > /tmp/github-kubeconfig <<EOF
apiVersion: v1
kind: Config
clusters:
- cluster:
    certificate-authority-data: $CLUSTER_CA
    server: $CLUSTER_SERVER
  name: $CLUSTER_NAME
contexts:
- context:
    cluster: $CLUSTER_NAME
    user: github-actions
  name: github-actions
current-context: github-actions
users:
- name: github-actions
  user:
    token: $SA_TOKEN
EOF

# Output the base64 encoded kubeconfig
echo "=========================================="
echo "GitHub Actions KUBECONFIG (base64 encoded)"
echo "=========================================="
echo ""
cat /tmp/github-kubeconfig | base64 -w 0
echo ""
echo ""
echo "=========================================="
echo "Instructions:"
echo "1. Copy the base64 string above"
echo "2. Go to your GitHub repository Settings > Secrets and variables > Actions"
echo "3. Create a new repository secret named 'KUBE_CONFIG'"
echo "4. Paste the base64 string as the secret value"
echo "5. Push changes to trigger automatic deployment!"
echo "=========================================="

# Clean up
rm /tmp/github-kubeconfig