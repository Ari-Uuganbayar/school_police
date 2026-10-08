#!/usr/bin/env bash
# PostToolUse (Edit|Write) hook: засагдсан файлын аппаар нь linter ажиллуулж --fix хийнэ.
# Үлдсэн алдааг stderr-т бичиж exit 2 буцаана, ингэснээр Claude-д алдаа харагдана.
set -u
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
FILE="$(jq -r '.tool_input.file_path // .tool_response.filePath // empty')"
[ -z "$FILE" ] && exit 0
case "$FILE" in /*) ;; *) FILE="$ROOT/$FILE" ;; esac
[ -f "$FILE" ] || exit 0

run() {  # run <dir> <cmd...>: dir дотроос ажиллуулж, алдаа гарвал exit 2
  local dir="$1"; shift
  local out
  if ! out="$(cd "$dir" && "$@" 2>&1)"; then
    printf 'Lint алдаа (%s):\n%s\n' "${FILE#"$ROOT/"}" "$out" >&2
    exit 2
  fi
}

case "$FILE" in
  "$ROOT"/web/src/*.ts|"$ROOT"/web/src/*.tsx)
    run "$ROOT/web" ./node_modules/.bin/eslint --fix "$FILE" ;;
  "$ROOT"/mobile/src/*.ts|"$ROOT"/mobile/src/*.tsx)
    run "$ROOT/mobile" ./node_modules/.bin/eslint --fix "$FILE" ;;
  "$ROOT"/backend/*.py)
    run "$ROOT/backend" .venv/bin/ruff check --fix "$FILE"
    run "$ROOT/backend" .venv/bin/ruff format "$FILE" ;;
esac
exit 0
