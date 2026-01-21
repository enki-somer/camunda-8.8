# Auto-Update Implementation Plan

## Overview

Replace Camunda's update server with electron-updater for GitHub Releases-based auto-updates. The implementation will:

- Change app identity to avoid conflicts with official Camunda Modeler
- Add electron-updater in main process with safe error handling
- Create IPC channels for renderer communication
- Build UI modal for update prompts
- Configure GitHub Actions for automated releases
- Ensure all update operations are non-blocking and safe

## Architecture

```
Main Process (app/lib/autoUpdate.js)
  └─ electron-updater hooks
      ├─ update-available → IPC → Renderer
      ├─ update-downloaded → IPC → Renderer
      └─ error → log only (never crash)

Renderer (client/src/plugins/auto-update/)
  └─ Modal UI
      ├─ "Update Available" → Download & Install / Later
      └─ "Update Downloaded" → Restart Now / Later
```

## Implementation Tasks

### A) Update Identity Configuration

**Files to modify:**

- `electron-builder.json`: Change `appId` and `productName`
- `app/package.json`: Update name/description if needed

**Changes:**

- Set `appId` to unique identifier (e.g., `"com.yourname.camunda-modeler-custom"`)
- Set `productName` to custom name (e.g., `"Your Custom Camunda Modeler"`)
- Add Windows NSIS target configuration for installer + latest.yml generation

### B) Add electron-updater Dependency

**Files to modify:**

- `app/package.json`: Add `electron-updater` dependency

**Add:**

- `"electron-updater": "^6.x.x"` to dependencies

### C) Create Auto-Update Module (Main Process)

**New file:** `app/lib/autoUpdate.js`

**Implement:**

- Import `{ autoUpdater }` from `electron-updater`
- Configure `autoUpdater.autoDownload = false`
- Set `autoUpdater.channel = 'latest'` (stable only, skip prereleases)
- Event handlers:
  - `error`: Log error, never throw
  - `update-available`: Send IPC `updater:status` with `{ type: 'available', info }`
  - `update-not-available`: Log (optional)
  - `download-progress`: Send IPC `updater:status` with `{ type: 'progress', percent }`
  - `update-downloaded`: Send IPC `updater:status` with `{ type: 'downloaded' }`
- Functions:
  - `initAutoUpdate()`: Initialize after app ready
  - `checkForUpdatesSafe()`: Wrap `autoUpdater.checkForUpdates()` in try/catch
  - `startDownload()`: Wrap `autoUpdater.downloadUpdate()` in try/catch
  - `quitAndInstall()`: Wrap `autoUpdater.quitAndInstall()` in try/catch

**Integration:**

- In `app/lib/index.js` `app.on('ready')`, call `initAutoUpdate()`
- Set interval: `setInterval(checkForUpdatesSafe, 12 * 60 * 60 * 1000)`

### D) Add IPC Channels

**Files to modify:**

- `app/lib/index.js`: Register IPC handlers
- `app/lib/preload.js`: Add allowed events to `allowedEvents` array

**IPC Events:**

- `updater:check`: Handler calls `checkForUpdatesSafe()`
- `updater:download`: Handler calls `startDownload()`
- `updater:install`: Handler calls `quitAndInstall()`
- `updater:status`: Main → Renderer (already supported via `renderer.send()`)

**Preload:**

- Add `'updater:check'`, `'updater:download'`, `'updater:install'` to `allowedEvents`
- These will be callable via `backend.send('updater:check')` etc.

### E) Create Renderer UI Component

**New file:** `client/src/plugins/auto-update/AutoUpdate.js`

**Implement:**

- React component that listens to `backend.on('updater:status')`
- State: `{ showModal: false, type: null, version: null, progress: 0 }`
- Modal UI using existing `Modal` component from `client/src/shared/ui/modal/Modal.js`
- Two modal states:

  1. **Update Available**: "Version X.X.X available" with buttons:

     - "Download & Install" → calls `backend.send('updater:download')`
     - "Later" → closes modal

  1. **Update Downloaded**: "Update ready to install" with buttons:

     - "Restart Now" → calls `backend.send('updater:install')`
     - "Later" → closes modal
- Show download progress bar when `type === 'progress'`

**Integration:**

- Register in `client/src/plugins/index.js` similar to other plugins
- Ensure it mounts on app startup

### F) Disable/Remove Camunda Update Checks

**Files to modify:**

- `client/src/plugins/update-checks/UpdateChecks.js`: Disable or remove component
- Or conditionally disable via feature flag if preferred

**Option:** Return `NoopComponent` when custom updater is enabled, or remove from plugin registry.

### G) Configure electron-builder for GitHub Publishing

**Files to modify:**

- `electron-builder.json`: Add `publish` configuration

**Add:**

```json
"publish": {
  "provider": "github",
  "owner": "YOUR_GITHUB_USERNAME",
  "repo": "YOUR_REPO_NAME",
  "releaseType": "release"
}
```

**Windows target update:**

- Change from `zip` to NSIS installer:
```json
"win": {
  "target": [
    {
      "target": "nsis",
      "arch": [ "x64", "ia32" ]
    }
  ]
}
```

- NSIS automatically generates `latest.yml` for electron-updater

### H) Create GitHub Actions Workflow

**New file:** `.github/workflows/release-windows.yml`

**Implement:**

- Trigger: `on: push: tags: - 'v*.*.*'`
- Single job for Windows build:
  - Checkout code
  - Setup Node.js (version 24, matching existing workflow)
  - `npm ci`
  - Build: `npm run build:distro -- --win --publish`
  - Uses `GITHUB_TOKEN` (auto-provided) for publishing
- No signing secrets required (user can add later if needed)
- Publishes NSIS installer + latest.yml to GitHub Release

**Note:** This workflow only builds Windows. User can extend later for other platforms.

### I) Versioning & Release Process

**Files to modify:**

- `README.md`: Add "Publishing Updates" section

**Documentation:**

1. **Publishing Updates:**

   - Bump version in `app/package.json` (semver)
   - Commit changes
   - Create git tag: `git tag vX.Y.Z`
   - Push tag: `git push --tags`
   - GitHub Actions automatically builds and publishes to Releases

2. **How Users Update:**

   - App checks for updates on startup and every 12 hours
   - If update available, user sees modal with "Download & Install" option
   - After download, user sees "Restart Now" prompt
   - Updates are automatic and non-intrusive

### J) Safety & Error Handling

**Implementation requirements:**

- All `autoUpdater` calls wrapped in try/catch
- Errors logged to console and file (using existing log system)
- App never crashes if:
  - Update server unreachable
  - Network errors
  - Invalid update metadata
  - Download failures
- Update check failures are silent (no UI errors)
- App launches normally even with no internet connection

**Files to ensure safety:**

- `app/lib/autoUpdate.js`: All functions must catch and log errors
- `app/lib/index.js`: `initAutoUpdate()` must not throw
- Interval timer must not crash if check fails

## File Summary

**New files:**

- `app/lib/autoUpdate.js` - Main process updater module
- `client/src/plugins/auto-update/AutoUpdate.js` - Renderer UI component
- `client/src/plugins/auto-update/index.js` - Plugin export
- `.github/workflows/release-windows.yml` - GitHub Actions workflow

**Modified files:**

- `electron-builder.json` - appId, productName, publish config, NSIS target
- `app/package.json` - Add electron-updater dependency
- `app/lib/index.js` - Initialize auto-update, add IPC handlers
- `app/lib/preload.js` - Add updater events to allowedEvents
- `client/src/plugins/index.js` - Register AutoUpdate plugin
- `client/src/plugins/update-checks/UpdateChecks.js` - Disable Camunda updates
- `README.md` - Add publishing/updating documentation

## Testing Checklist

- [ ] App launches without internet (no crashes)
- [ ] Update check fails gracefully (logs only, no UI)
- [ ] Update available modal appears correctly
- [ ] Download progress updates (if implemented)
- [ ] Update downloaded modal appears
- [ ] Restart installs update correctly
- [ ] NSIS installer generated with latest.yml
- [ ] GitHub Release contains correct artifacts
- [ ] App identity is unique (no conflicts with official)

## Notes

- Replace `YOUR_GITHUB_USERNAME` and `YOUR_REPO_NAME` in electron-builder.json
- Replace `com.yourname.camunda-modeler-custom` with actual appId
- Replace product name with custom name
- electron-updater version: Use latest stable (^6.1.0 or newer)
- NSIS target generates both installer and latest.yml automatically
- GitHub Actions uses GITHUB_TOKEN (no secrets needed for public repos)