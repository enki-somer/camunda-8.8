---
name: Auto-Update Implementation
overview: Replace Camunda's update server with electron-updater for GitHub Releases-based auto-updates with safe error handling and UI prompts
todos:
  - id: update-identity
    content: Update appId and productName in electron-builder.json to avoid conflicts
    status: completed
  - id: add-electron-updater
    content: Add electron-updater dependency to app/package.json
    status: completed
  - id: create-auto-update-module
    content: Create app/lib/autoUpdate.js with safe error handling and IPC communication
    status: completed
  - id: add-ipc-channels
    content: Add IPC handlers in app/lib/index.js and update preload.js allowedEvents
    status: completed
  - id: create-renderer-ui
    content: Create AutoUpdate React component with modal UI for update prompts
    status: completed
  - id: disable-camunda-updates
    content: Disable existing Camunda update checks in UpdateChecks.js
    status: completed
  - id: configure-electron-builder
    content: Configure electron-builder.json for GitHub publishing and NSIS installer
    status: completed
  - id: create-github-workflow
    content: Create GitHub Actions workflow for automated Windows releases
    status: completed
  - id: add-documentation
    content: Add publishing and updating documentation to README.md
    status: completed
---

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
- Import `BrowserWindow` from `electron` for multi-window support
- Configure:
  - `autoUpdater.autoDownload = false`
  - `autoUpdater.allowPrerelease = false` (NOT channel = 'latest')
  - `autoUpdater.allowDowngrade = false` (optional)
- Maintain `lastUpdaterState` object in memory:
  ```js
  {
    state: 'idle' | 'available' | 'downloading' | 'downloaded' | 'error',
    info: { version, releaseDate, etc },
    progress: 0-100
  }
  ```

- Implement `broadcastToAllWindows(channel, payload)` helper:
  - Iterate `BrowserWindow.getAllWindows()`
  - Check `!win.isDestroyed()` before sending
  - Send to all valid windows
- Event handlers (update lastUpdaterState + broadcast):
  - `error`: Log error, set state='error', broadcast, never throw
  - `update-available`: Update state, broadcast `updater:status` with `{ type: 'available', info }`
  - `update-not-available`: Log (optional), set state='idle'
  - `download-progress`: Update progress, broadcast `updater:status` with `{ type: 'progress', percent }`
  - `update-downloaded`: Update state, broadcast `updater:status` with `{ type: 'downloaded' }`
- Functions (ALL wrapped in try/catch):
  - `initAutoUpdate()`: Initialize after app ready, never throw
  - `checkForUpdatesSafe()`: Wrap `autoUpdater.checkForUpdates()` in try/catch, log errors
  - `downloadUpdateSafe()`: Wrap `autoUpdater.downloadUpdate()` in try/catch, log errors
  - `quitAndInstallSafe()`: Wrap `autoUpdater.quitAndInstall()` in try/catch, log errors
- Handle `updater:rendererReady` IPC:
  - When received, immediately send current `lastUpdaterState` via `updater:status` to that window

**Integration:**

- In `app/lib/index.js` `app.on('ready')`, call `initAutoUpdate()` (wrapped in try/catch)
- Set interval: `setInterval(() => { try { checkForUpdatesSafe(); } catch(e) { log.error(e); } }, 12 * 60 * 60 * 1000)`

### D) Add IPC Channels

**Files to modify:**

- `app/lib/index.js`: Register IPC handlers
- `app/lib/preload.js`: Add allowed events to `allowedEvents` array

**IPC Events:**

- `updater:rendererReady`: Handler sends current `lastUpdaterState` to that window
- `updater:check`: Handler calls `checkForUpdatesSafe()` (validate no args)
- `updater:download`: Handler calls `downloadUpdateSafe()` (validate no args)
- `updater:install`: Handler calls `quitAndInstallSafe()` (validate no args)
- `updater:status`: Main → Renderer (broadcast to all windows)

**Preload:**

- Add `'updater:rendererReady'`, `'updater:check'`, `'updater:download'`, `'updater:install'` to `allowedEvents`
- These will be callable via `backend.send('updater:check')` etc.
- Validate inputs on main side (no arbitrary args)

### E) Create Renderer UI Component

**New file:** `client/src/plugins/auto-update/AutoUpdate.js`

**Implement:**

- React component that listens to `backend.on('updater:status')`
- State: `{ showModal: false, type: null, version: null, progress: 0 }`
- On componentDidMount:
  - Call `backend.send('updater:rendererReady')` once to get current state
  - Set up listener for `backend.on('updater:status')`
- Modal UI using existing `Modal` component from `client/src/shared/ui/modal/Modal.js`
- Two modal states:

  1. **Update Available**: "Version X.X.X available" with buttons:

     - "Download & Install" → calls `backend.send('updater:download')`
     - "Later" → closes modal

  1. **Update Downloaded**: "Update ready to install" with buttons:

     - "Restart Now" → calls `backend.send('updater:install')`
     - "Later" → closes modal
- Show download progress bar when `type === 'progress'`
- Handle handshake: If `updater:rendererReady` response shows state !== 'idle', show appropriate modal

**Integration:**

- Register in `client/src/plugins/index.js` similar to other plugins
- Ensure it mounts on app startup

### F) Disable/Remove Camunda Update Checks

**Files to modify:**

- `client/src/plugins/update-checks/UpdateChecks.js`: Return `NoopComponent` immediately
- OR gate behind feature flag if preferred (but ensure only ONE update system runs)
- Do NOT delete files - use minimal, reversible approach
- Ensure plugin loading order doesn't break

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

- Change from `zip` to NSIS installer (x64 ONLY):
```json
"win": {
  "target": [
    {
      "target": "nsis",
      "arch": [ "x64" ]
    }
  ]
}
```

- NSIS automatically generates `latest.yml` and `*.blockmap` for electron-updater
- Do NOT build ia32 unless explicitly needed later

### H) Create GitHub Actions Workflow

**New file:** `.github/workflows/release-windows.yml`

**Implement:**

- Trigger: `on: push: tags: - 'v*.*.*'`
- Single job for Windows build:
  - Checkout code
  - Setup Node.js (version 24, matching existing workflow)
  - `npm ci`
  - Build: Use exact command from package.json scripts (inspect `build:distro` script)
  - Command: `npm run build:distro -- --win --publish` (verify this matches repo tooling)
  - Uses `GITHUB_TOKEN` (auto-provided) for publishing
- No signing secrets required (user can add later if needed)
- Publishes ALL electron-builder artifacts to GitHub Release:
  - NSIS installer exe
  - latest.yml
  - *.blockmap files
  - Any other generated metadata
- Do NOT cherry-pick artifacts - upload entire dist output set required by electron-updater

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

- ALL `autoUpdater` calls wrapped in try/catch (checkForUpdatesSafe, downloadUpdateSafe, quitAndInstallSafe)
- Errors logged to console + optional file logger (using existing log system)
- App NEVER crashes if:
  - Update server unreachable
  - Network errors
  - Invalid update metadata
  - Download failures
  - GitHub API errors
- Update check failures are silent (no UI errors, logs only)
- App launches normally even with no internet connection
- Zero UI disruption on any error

**Files to ensure safety:**

- `app/lib/autoUpdate.js`: All functions must catch and log errors, never throw
- `app/lib/index.js`: `initAutoUpdate()` must not throw (wrap in try/catch)
- Interval timer must not crash if check fails (wrap callback in try/catch)
- All IPC handlers must validate inputs and catch errors

### K) Manual Update Check Trigger

**Files to modify:**

- `app/lib/menu/menu-builder.js` or appropriate menu file: Add "Check for Updates" menu item
- OR integrate into existing help menu via plugin system

**Implement:**

- Add menu item (e.g., in Help menu) that calls `updater:check` IPC
- Non-intrusive, mainly for dev/testing/debugging
- If menu system supports it, add via plugin registration

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