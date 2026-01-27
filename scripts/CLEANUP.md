# Repo cleanup: tags and Actions

## 1. Clear all tags (local + remote)

From repo root:

```bash
bash scripts/clear-tags.sh
```

Or manually:

```bash
# Fetch tags
git fetch --tags

# Delete each tag locally
git tag -l | xargs -I {} git tag -d {}

# Delete each tag on remote (replace origin if needed)
git tag -l | xargs -I {} git push origin :refs/tags/{}
```

## 2. Clear GitHub Actions run history

GitHub has no “delete all runs” button. Options:

- **Per workflow:** Repo → Actions → select workflow → “…” → “Delete workflow runs” → filter by branch/date and delete.
- **Bulk (API):** Use GitHub’s API to list and delete runs, or a third‑party tool.
- **Ignore old runs:** After clearing tags and pushing a new `v5.43.6`, new runs will stand out; old ones can be left to age out.

## 3. Fresh start at 5.43.6

Versions are already set to 5.43.6 in:

- `app/package.json`
- `client/package.json`
- `lerna.json`

Then:

```bash
git add .
git commit -m "chore: reset to 5.43.6, cleanup"
git push
git tag v5.43.6
git push origin v5.43.6
```

That push of `v5.43.6` will trigger a new Release Windows run.
