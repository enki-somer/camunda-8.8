#!/usr/bin/env bash
# Clear all tags locally and on remote (origin)
# Run from repo root: bash scripts/clear-tags.sh

set -e
REMOTE="${1:-origin}"

echo "Fetching all tags from $REMOTE..."
git fetch --tags

echo "Listing tags to delete..."
TAGS=$(git tag -l)
if [ -z "$TAGS" ]; then
  echo "No tags found."
  exit 0
fi

echo "Deleting tags locally..."
for tag in $TAGS; do
  git tag -d "$tag" 2>/dev/null || true
done

echo "Deleting tags on $REMOTE..."
for tag in $TAGS; do
  git push "$REMOTE" ":refs/tags/$tag" 2>/dev/null || true
done

echo "Done. All tags cleared."
