#!/usr/bin/env bash
# Helper to create ghcr pull secret in namespace harp
# Usage: ./create-ghcr-secret.sh [--use-docker-config] [--username USER --password PAT]

set -euo pipefail
NAMESPACE=harp
SECRET_NAME=ghcr-pull-secret

if [[ "${1-}" == "--use-docker-config" ]]; then
  if [[ ! -f "$HOME/.docker/config.json" ]]; then
    echo "No docker config found at $HOME/.docker/config.json"
    exit 1
  fi
  kubectl -n "$NAMESPACE" create secret generic "$SECRET_NAME" \
    --from-file=.dockerconfigjson="$HOME/.docker/config.json" \
    --type=kubernetes.io/dockerconfigjson --dry-run=client -o yaml | kubectl apply -f -
  echo "Applied dockerconfigjson secret $SECRET_NAME in namespace $NAMESPACE"
  exit 0
fi

# Otherwise use provided username/password
while [[ "$#" -gt 0 ]]; do
  case "$1" in
    --username) USERNAME="$2"; shift 2;;
    --password) PASSWORD="$2"; shift 2;;
    *) shift ;;
  esac
done

if [[ -z "${USERNAME-}" || -z "${PASSWORD-}" ]]; then
  cat <<EOF
Usage: $0 --use-docker-config
   or: $0 --username <user> --password <pat>

This will create or update the secret named: $SECRET_NAME in namespace: $NAMESPACE
EOF
  exit 1
fi

kubectl -n "$NAMESPACE" create secret docker-registry "$SECRET_NAME" \
  --docker-server=ghcr.io --docker-username="$USERNAME" --docker-password="$PASSWORD" --docker-email=""

echo "Created secret $SECRET_NAME in namespace $NAMESPACE"
