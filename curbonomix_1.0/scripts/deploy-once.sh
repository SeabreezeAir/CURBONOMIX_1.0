#!/usr/bin/env bash
# One-pass deployment script for Codespaces → Vercel
# Usage: ./scripts/deploy-once.sh --prod (or omit --prod for preview)

set -euo pipefail

if ! command -v vercel >/dev/null 2>&1; then
  echo "Installing Vercel CLI..." >&2
  npm install --global vercel >/dev/null
fi

REPO_ROOT=$(git rev-parse --show-toplevel)
cd "$REPO_ROOT"

if [[ -z "${VERCEL_TOKEN:-}" ]] || [[ -z "${VERCEL_ORG_ID:-}" ]] || [[ -z "${VERCEL_PROJECT_ID:-}" ]]; then
  echo "Missing Vercel credentials; export VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID" >&2
  exit 1
fi

npm install
npm run build

TARGET="preview"
if [[ "${1:-}" == "--prod" ]]; then
  TARGET="production"
fi

echo "Deploying to ${TARGET}..." >&2
V_DEPLOY_CMD=(vercel deploy --token "$VERCEL_TOKEN" --scope "$VERCEL_ORG_ID" --project "$VERCEL_PROJECT_ID")
[[ "$TARGET" == "production" ]] && V_DEPLOY_CMD+=(--prod)

${V_DEPLOY_CMD[@]}#!/usr/bin/env bash
# One-pass deployment script for Codespaces → Vercel
# Usage: ./scripts/deploy-once.sh --prod (or omit --prod for preview)

set -euo pipefail

if ! command -v vercel >/dev/null 2>&1; then
  echo "Installing Vercel CLI..." >&2
  npm install --global vercel >/dev/null
fi

REPO_ROOT=$(git rev-parse --show-toplevel)
cd "$REPO_ROOT"

if [[ -z "${VERCEL_TOKEN:-}" ]] || [[ -z "${VERCEL_ORG_ID:-}" ]] || [[ -z "${VERCEL_PROJECT_ID:-}" ]]; then
  echo "Missing Vercel credentials; export VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID" >&2
  exit 1
fi

npm install
npm run build

TARGET="preview"
if [[ "${1:-}" == "--prod" ]]; then
  TARGET="production"
fi

echo "Deploying to ${TARGET}..." >&2
V_DEPLOY_CMD=(vercel deploy --token " k1keO08BHGipKaSmu4GfMUzI " --scope "$VERCEL_ORG_ID" --project "$VERCEL_PROJECT_ID")
[[ "$TARGET" == "production" ]] && V_DEPLOY_CMD+=(--prod)
  
${V_DEPLOY_CMD[@]}
 export VERCEL_TOKEN=' k1keO08BHGipKaSmu4GfMUzI';  "scope "$VERCEL_ORG_ID" --project 
export VERCEL_ORG_ID =' ixYaZlBJi1b544wm97JRav0G'
export VERCEL_PROJECT_ID =' prj_R6qsa1A0QEpxhVDXoVSLX2YqUo5m
'
./scripts/deploy-once.sh   # add --prod for production