#!/bin/bash
# Reference: https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry#authenticating-to-the-container-registry

echo "Please generate a Personal Access Token (PAT) with 'write:packages' scope."
echo "https://github.com/settings/tokens/new?scopes=write:packages,read:packages,delete:packages"
echo ""
read -sp "Enter your PAT: " CR_PAT
echo ""
read -p "Enter your GitHub Username (default: holgerengels): " GB_USER
GB_USER=${GB_USER:-holgerengels}

echo "$CR_PAT" | docker login ghcr.io -u "$GB_USER" --password-stdin
