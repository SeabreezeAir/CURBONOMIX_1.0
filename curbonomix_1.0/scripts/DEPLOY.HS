#!/usr/bin/env bash
# Curbonomix one-pass deploy from Codespaces to Vercel
# Usage: ./deploy.hs --prod   → deploy to production
#        ./deploy.hs          → deploy to preview

set -euo pipefail

# 🧩 Ensure Vercel CLI is available
if ! command -v vercel >/dev/null 2>&1; then
  echo "🔧 Installing Vercel CLI..." >&2
  npm install --global vercel >/dev/null
fi

# 📁 Move to repo root
REPO_ROOT=$(git rev-parse --show-toplevel)
cd "$REPO_ROOT"

# 🔐 Inject Curbonomix credentials
export VERCEL_TOKEN='k1keO08BHGipKaSmu4GfMUzI'
export VERCEL_ORG_ID='ixYaZlBJi1b544wm97JRav0G'
export VERCEL_PROJECT_ID='prj_R6qsa1A0QEpxhVDXoVSLX2YqUo5m'

# 🛡 Validate credentials
if [[ -z "${VERCEL_TOKEN:-}" ]] || [[ -z "${VERCEL_ORG_ID:-}" ]] || [[ -z "${VERCEL_PROJECT_ID:-}" ]]; then
  echo "❌ Missing Vercel credentials. Please verify VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID" >&2
  exit 1
fi

# 🏗 Build Curbonomix frontend
npm install
npm run build

# 🚦 Determine deploy target
TARGET="preview"
if [[ "${1:-}" == "--prod" ]]; then
  TARGET="production"
fi

echo "🚀 Deploying Curbonomix to ${TARGET}..." >&2

# 🧵 Construct deploy command
V_DEPLOY_CMD=(
  vercel deploy
  --token "$VERCEL_TOKEN"
  --scope "$VERCEL_ORG_ID"
  --project "$VERCEL_PROJECT_ID"
)
[[ "$TARGET" == "production" ]] && V_DEPLOY_CMD+=(--prod)

# 🧨 Execute deploy
"${V_DEPLOY_CMD[@]}"
