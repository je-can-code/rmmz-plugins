#!/usr/bin/env bash
# normalize-file-modes.sh
#
# Undo a sweeping "make everything executable" chmod on a directory tree.
# Typical use: Plex troubleshooting on an external drive left thousands of
# files at mode 755; Git then reports every path as modified with zero diff.
#
# What it does (per directory root you pass):
#   - directories  -> 755 (traversable)
#   - regular files -> 644 (not executable)
#   - then re-applies 755 only where execute is normally expected
#
# Usage:
#   chmod +x tools/normalize-file-modes.sh
#   sudo ./tools/normalize-file-modes.sh --dry-run /path/to/dir [/another ...]
#   sudo ./tools/normalize-file-modes.sh /path/to/dir [/another ...]
#
# Copy anywhere (e.g. ~/.local/bin/normalize-file-modes.sh) if you prefer.
#
# Notes:
#   - Does not change file ownership or content.
#   - Skips symlinks (chmod on symlinks is confusing; targets are handled when visited).
#   - Git repos and non-git trees use the same rules.
#   - Optional: set GIT_CONFIG_COUNT / run `git config --local core.fileMode false` in repos
#     if you want Git to ignore future chmod-only noise.

set -euo pipefail

DRY_RUN=0
ASSUME_YES=0
ROOTS=()

print_usage()
{
  cat <<'EOF'
normalize-file-modes.sh — reset bulk +x back to normal Unix modes

Usage:
  normalize-file-modes.sh [--dry-run] [-y|--yes] <directory> [directory ...]

Options:
  --dry-run    Print what would run; do not chmod.
  -y, --yes    Skip confirmation prompt (useful from scripts).

Examples:
  sudo ./tools/normalize-file-modes.sh --dry-run /run/media/je/exdrive/dev/gaming
  sudo ./tools/normalize-file-modes.sh -y /run/media/je/exdrive/dev/gaming/rmmz-plugins
  sudo ./tools/normalize-file-modes.sh /path/to/plex/library /path/to/other/tree

Afterward (optional, per git repo):
  git config --local core.fileMode false
EOF
}

log()
{
  printf '%s\n' "$*"
}

run_chmod()
{
  if [[ "$DRY_RUN" -eq 1 ]]
  then
    log "[dry-run] $*"
    return 0
  fi
  "$@"
}

is_forbidden_root()
{
  local root="$1"
  local canonical
  canonical="$(readlink -f "$root" 2>/dev/null || true)"
  if [[ -z "$canonical" ]]
  then
    return 0
  fi
  case "$canonical" in
    /|/usr|/usr/*|/bin|/bin/*|/sbin|/sbin/*|/etc|/etc/*|/lib|/lib/*|/lib64|/lib64/*|/boot|/boot/*|/root|/root/*)
      return 0
      ;;
  esac
  return 1
}

confirm_roots()
{
  if [[ "$ASSUME_YES" -eq 1 ]]
  then
    return 0
  fi
  log ""
  log "Will normalize modes under these roots:"
  for root in "${ROOTS[@]}"
  do
    log "  - $(readlink -f "$root" 2>/dev/null || echo "$root")"
  done
  log ""
  if [[ "$DRY_RUN" -eq 1 ]]
  then
    log "Dry-run only — no changes."
    return 0
  fi
  read -r -p "Continue? [y/N] " reply
  case "$reply" in
    y|Y|yes|YES) ;;
    *) log "Aborted."; exit 1 ;;
  esac
}

normalize_root()
{
  local root="$1"
  local canonical
  canonical="$(readlink -f "$root")"

  log ""
  log "=== ${canonical} ==="

  # Directories must stay traversable (execute bit for "others" on dirs = enter).
  while IFS= read -r -d '' dir
  do
    run_chmod chmod 755 "$dir"
  done < <(find "$canonical" -xdev -type d -print0)

  # Regular files: not executable (fixes sweeping chmod +x on source, media sidecars, etc.).
  while IFS= read -r -d '' file
  do
    run_chmod chmod 644 "$file"
  done < <(find "$canonical" -xdev -type f -print0)

  # Re-mark paths that legitimately need execute.
  while IFS= read -r -d '' file
  do
    run_chmod chmod 755 "$file"
  done < <(find "$canonical" -xdev -type f \( \
    -name '*.sh' \
    -o -name '*.bash' \
    -o -name '*.zsh' \
    -o -path '*/node_modules/.bin/*' \
    -o -path '*/node_modules/*/bin/*' \
    -o -path '*/.git/hooks/*' \
    -o -path '*/.local/bin/*' \
    \) -print0 2>/dev/null)

  # If this tree is a git repo, align the index (optional but clears mode-only git diff).
  if [[ -d "${canonical}/.git" && "$DRY_RUN" -eq 0 ]]
  then
    log "Git repo detected — updating index chmod hints (tracked files only)."
    (
      cd "$canonical"
      if command -v git >/dev/null 2>&1
      then
        while IFS= read -r -d '' tracked
        do
          git update-index --chmod=-x "$tracked" 2>/dev/null || true
        done < <(git ls-files -z)
        while IFS= read -r -d '' tracked
        do
          git update-index --chmod=+x "$tracked" 2>/dev/null || true
        done < <(git ls-files -z -- '*.sh' '*.bash' 2>/dev/null || true)
      fi
    )
  fi

  log "Done: ${canonical}"
}

while [[ $# -gt 0 ]]
do
  case "$1" in
    --dry-run)
      DRY_RUN=1
      shift
      ;;
    -y|--yes)
      ASSUME_YES=1
      shift
      ;;
    -h|--help)
      print_usage
      exit 0
      ;;
    --)
      shift
      break
      ;;
    -*)
      log "Unknown option: $1"
      print_usage
      exit 1
      ;;
    *)
      ROOTS+=("$1")
      shift
      ;;
  esac
done

if [[ "${#ROOTS[@]}" -eq 0 ]]
then
  print_usage
  exit 1
fi

if [[ "$(id -u)" -ne 0 ]]
then
  log "Warning: not running as root. Some files may skip if you lack permission."
  log "Recommended: sudo $0 ..."
  log ""
fi

for root in "${ROOTS[@]}"
do
  if [[ ! -d "$root" ]]
  then
    log "Not a directory (skipping): $root"
    exit 1
  fi
  if is_forbidden_root "$root"
  then
    log "Refusing unsafe root: $root"
    exit 1
  fi
done

confirm_roots

for root in "${ROOTS[@]}"
do
  normalize_root "$root"
done

log ""
if [[ "$DRY_RUN" -eq 1 ]]
then
  log "Dry-run finished. Re-run without --dry-run to apply."
else
  log "All requested trees normalized."
fi
