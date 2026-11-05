#!/bin/bash
# SessionStart (solo nube): npm ci si falta node_modules o cambió package-lock.json.
# La base de datos la prepara la skill «retomar».
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-.}"

# Sin package-lock.json todavía (antes de F0) no hay nada que instalar
if [ ! -f package-lock.json ]; then
  exit 0
fi

hashes=node_modules/.session-start.sha256
if [ ! -d node_modules ] || ! sha256sum --check --status "$hashes" 2>/dev/null; then
  rm -f "$hashes"
  npm ci --no-audit --no-fund
  sha256sum .claude/hooks/session-start.sh package.json package-lock.json > "$hashes"
fi
