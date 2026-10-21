# Exit on error
set -Eeuxo pipefail

# Function to safely remove files/directories
safe_remove() {
  if [ -e "$1" ]; then
    rm -rf "$1" || true
  fi
}

# Function to safely clean nrz cache
clean_nrz_cache() {
  echo "Cleaning nrz cache..."
  safe_remove ".nrz-cache"
}

# Function to clean lockfiles for all package managers
clean_lockfiles() {
  echo "Cleaning lockfiles..."
  safe_remove "nrz-lock.json"
}

# Function to clean node_modules directory
clean_node_modules() {
  echo "Cleaning node_modules directory..."
  safe_remove "node_modules"
}

# Function to clean caches for all package managers
clean_all_cache() {
  echo "Cleaning package manager caches..."
  clean_nrz_cache
}

clean_all() {
  clean_node_modules
  clean_lockfiles
  clean_all_cache
  echo "Cleanup completed successfully!"
}

# Wait for detached nrz-cache-* children (or node still starting one),
# so none runs into the next timed run or a cache removal. Logs the ms
# waited, also to $BENCH_CHILD_WAIT_LOG when set.
wait_nrz_children() (
  set +x
  start=$(date +%s%3N)
  while pgrep -u "$(id -u)" -f '^nrz-cache-|^[^ ]*node [^ ]*/(cache-unzip-src-unzip|registry-client-src-revalidate)\.js( |$)' >/dev/null; do
    if (( $(date +%s%3N) - start > 300000 )); then
      echo "warning: nrz-cache children still running after 300 s"
      break
    fi
    sleep 0.05
  done
  ms=$(( $(date +%s%3N) - start ))
  echo "nrz-cache children: waited $ms ms"
  if [ -n "${BENCH_CHILD_WAIT_LOG:-}" ]; then
    echo "$ms" >> "$BENCH_CHILD_WAIT_LOG"
  fi
)

# Function to display available functions
show_help() {
  echo "Available functions:"
  echo "  wait_nrz_children"
  echo "  clean_nrz_cache"
  echo "  clean_lockfiles"
  echo "  clean_node_modules"
  echo "  clean_all_cache"
  echo "  clean_all"
  echo ""
  echo "Usage: $0 [function_name1] [function_name2] ..."
  echo "Example: $0 clean_npm_cache clean_lockfiles"
}

# Main execution logic
if [ $# -eq 0 ]; then
  show_help
else
  for arg in "$@"; do
    case "$arg" in
      wait_nrz_children)
        wait_nrz_children
        ;;
      clean_nrz_cache)
        clean_nrz_cache
        ;;
      clean_lockfiles)
        clean_lockfiles
        ;;
      clean_node_modules)
        clean_node_modules
        ;;
      clean_all_cache)
        clean_all_cache
        ;;
      clean_all)
        clean_all
        ;;
      help|--help|-h)
        show_help
        exit 0
        ;;
      *)
        echo "Unknown function: $arg"
        echo "Use 'help' to see available functions."
        exit 1
        ;;
    esac
  done
fi

