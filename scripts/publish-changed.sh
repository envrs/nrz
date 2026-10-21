#!/usr/bin/env bash
# Publish every publishable workspace changed since a base commit.
#
# Mirrors the release workflow's "Publish" step so the same logic can be
# run locally or from CI. Private packages are skipped.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# Default to the source CLI so unpublished pack/publish changes are used.
# Set NRZ to run a different binary instead.
NRZ="${NRZ:-}"
BASE="HEAD~1"
DRY_RUN=false
ACCESS="public"
REGISTRY=""

usage() {
  cat <<'EOF'
Usage: scripts/publish-changed.sh [options]

Publish workspaces under src/ and infra/ that changed since <base>,
skipping private packages.

Options:
  --base <ref>       Git revision to diff against (default: HEAD~1)
  --dry-run          Pass --dry-run to nrz publish
  --access <level>   npm access level (default: public)
  --registry <url>   Registry to publish to (default: nrz config)
  -h, --help         Show this help
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --base)
      BASE="${2:?--base requires a git revision}"
      shift 2
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --access)
      ACCESS="${2:?--access requires a value}"
      shift 2
      ;;
    --registry)
      REGISTRY="${2:?--registry requires a URL}"
      shift 2
      ;;
    -h | --help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

if ! command -v node >/dev/null 2>&1; then
  echo "error: node is required" >&2
  exit 1
fi

if ! git -C "$ROOT_DIR" rev-parse --verify --quiet "$BASE" >/dev/null; then
  echo "error: base revision '$BASE' not found" >&2
  exit 1
fi

# Print "name@version" for a workspace, exiting non-zero when it is private
# or missing the fields required to publish.
read_package() {
  node -e '
    const { readFileSync } = require("node:fs")
    const pkg = JSON.parse(readFileSync(process.argv[1], "utf8"))
    if (pkg.private || !pkg.name || !pkg.version) process.exit(1)
    process.stdout.write(`${pkg.name}@${pkg.version}`)
  ' "$1/package.json"
}

changed_dirs() {
  git -C "$ROOT_DIR" diff --name-only --diff-filter=ACMRT "$BASE" HEAD \
    | grep -oE '^(src|infra)/[^/]+' \
    | sort -u
}

# Run the source CLI with the `.js` -> `.ts` resolver so a fresh checkout
# without compiled output still works.
nrz() {
  if [[ -n "$NRZ" ]]; then
    "$NRZ" "$@"
    return
  fi
  NODE_OPTIONS="--no-warnings --enable-source-maps --experimental-strip-types --import=$ROOT_DIR/scripts/ts-js-resolver.mjs" \
    __NRZ_INTERNAL_LIVE_RELOAD=1 \
    node "$ROOT_DIR/infra/build/src/bins/nrz.ts" "$@"
}

publish_args=(publish "--access=$ACCESS")
if [[ "$DRY_RUN" == true ]]; then
  publish_args+=(--dry-run)
fi
if [[ -n "$REGISTRY" ]]; then
  publish_args+=("--registry=$REGISTRY")
fi

failed=()
count=0

while IFS= read -r dir; do
  if [[ -z "$dir" || ! -f "$ROOT_DIR/$dir/package.json" ]]; then
    continue
  fi
  if ! pkg="$(read_package "$ROOT_DIR/$dir")"; then
    echo "Skipping private package in $dir"
    continue
  fi
  echo "Publishing $dir ($pkg)..."
  count=$((count + 1))
  if ! (
    cd "$ROOT_DIR/$dir" &&
      NPM_CONFIG_PROVENANCE="${NPM_CONFIG_PROVENANCE:-false}" \
        nrz "${publish_args[@]}"
  ); then
    failed+=("$pkg ($dir)")
  fi
done < <(changed_dirs)

if [[ ${#failed[@]} -gt 0 ]]; then
  echo >&2
  echo "Failed to publish:" >&2
  printf '  - %s\n' "${failed[@]}" >&2
  exit 1
fi

if [[ "$count" -eq 0 ]]; then
  echo "No publishable workspaces changed since $BASE"
elif [[ "$DRY_RUN" == true ]]; then
  echo "Dry run: would publish $count package(s)"
else
  echo "Published $count package(s)"
fi
