#!/bin/bash
set -e

# Change directory to project root (one level up from deploy/)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT_DIR"

REGISTRY="ghcr.io/holgerengels"
TARGET="${1:-all}"

build_and_push_server() {
  echo "==> Building kmap-server..."
  docker build -f deploy/server.docker -t "${REGISTRY}/kmap-server:latest" .
  echo "==> Pushing kmap-server to registry..."
  docker push "${REGISTRY}/kmap-server:latest"
}

build_and_push_frontend() {
  echo "==> Building kmap-frontend..."
  docker build -f deploy/frontend.docker -t "${REGISTRY}/kmap-frontend:latest" .
  echo "==> Pushing kmap-frontend to registry..."
  docker push "${REGISTRY}/kmap-frontend:latest"
}

build_and_push_snappy() {
  echo "==> Building kmap-snappy..."
  docker build -f deploy/snappy.docker -t "${REGISTRY}/kmap-snappy:latest" .
  echo "==> Pushing kmap-snappy to registry..."
  docker push "${REGISTRY}/kmap-snappy:latest"
}

build_and_push_couchdb() {
  echo "==> Building kmap-couchdb..."
  docker build -f deploy/couchdb.docker -t "${REGISTRY}/kmap-couchdb:latest" .
  echo "==> Pushing kmap-couchdb to registry..."
  docker push "${REGISTRY}/kmap-couchdb:latest"
}

case "$TARGET" in
  server)
    build_and_push_server
    ;;
  frontend)
    build_and_push_frontend
    ;;
  snappy)
    build_and_push_snappy
    ;;
  couchdb)
    build_and_push_couchdb
    ;;
  all)
    build_and_push_server
    build_and_push_frontend
    build_and_push_snappy
    build_and_push_couchdb
    ;;
  *)
    echo "Usage: $0 [all|server|frontend|snappy|couchdb]"
    exit 1
    ;;
esac

echo "Done."
