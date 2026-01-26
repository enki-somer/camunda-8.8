/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

'use strict';

const { autoUpdater } = require('electron-updater');
const { BrowserWindow } = require('electron');

const log = require('./log')('app:auto-update');

// In-memory state to handle renderer handshake
let lastUpdaterState = {
  state: 'idle', // 'idle' | 'available' | 'downloading' | 'downloaded' | 'error'
  info: null,
  progress: 0
};

let updateCheckInterval = null;

/**
 * Broadcast update status to all open windows
 * @param {string} channel - IPC channel name
 * @param {Object} payload - Data to send
 */
function broadcastToAllWindows(channel, payload) {
  try {
    const windows = BrowserWindow.getAllWindows();
    for (const win of windows) {
      if (win && !win.isDestroyed() && win.webContents) {
        win.webContents.send(channel, payload);
      }
    }
  } catch (error) {
    log.error('Error broadcasting to windows:', error);
  }
}

/**
 * Update lastUpdaterState and broadcast to all windows
 * @param {Object} newState - New state object
 */
function updateStateAndBroadcast(newState) {
  lastUpdaterState = { ...lastUpdaterState, ...newState };
  log.info('Broadcasting state:', JSON.stringify(lastUpdaterState, null, 2));
  broadcastToAllWindows('updater:status', lastUpdaterState);
}

/**
 * Initialize auto-updater
 */
function initAutoUpdate() {
  try {
    log.info('Initializing auto-updater');

    // Log repository configuration for verification
    const pkg = require('../package.json');
    log.info('Auto-updater repository:', pkg.repository);
    log.info('Auto-updater current version:', pkg.version);
    
    // Verify electron-updater can access the repository
    // electron-updater reads from package.json automatically, but we can verify
    if (pkg.repository && pkg.repository.url) {
      const repoUrl = pkg.repository.url;
      log.info('Repository URL for updates:', repoUrl);
      
      // Extract owner/repo from URL for verification
      const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/\.]+)/);
      if (match) {
        log.info('Detected GitHub owner:', match[1], 'repo:', match[2]);
      } else {
        log.warn('Could not parse GitHub repository URL:', repoUrl);
      }
    } else {
      log.error('Repository URL not found in package.json!');
    }

    // Configure auto-updater
    autoUpdater.autoDownload = false;
    autoUpdater.allowPrerelease = false;
    autoUpdater.allowDowngrade = false;
    
    // Use generic provider pointing directly to latest.yml to avoid Atom feed 404
    // GitHub provider tries to use /releases.atom which requires auth for private repos
    if (pkg.repository && pkg.repository.url) {
      const repoUrl = pkg.repository.url;
      const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/\.]+)/);
      if (match) {
        const owner = match[1];
        const repo = match[2];
        // Point directly to the directory containing latest.yml (bypasses Atom feed discovery)
        const updateServerUrl = `https://github.com/${owner}/${repo}/releases/latest/download/`;
        log.info('Setting update server URL (generic provider):', updateServerUrl);
        
        // Use generic provider to avoid GitHub Atom feed authentication issues
        // URL must point to directory containing latest.yml and installer files
        try {
          autoUpdater.setFeedURL(updateServerUrl);
          log.info('Successfully configured generic update provider');
        } catch (error) {
          log.error('Failed to set feed URL:', error);
        }
      }
    }
    
    // Log auto-updater configuration
    log.info('Auto-updater config - autoDownload:', autoUpdater.autoDownload);
    log.info('Auto-updater config - allowPrerelease:', autoUpdater.allowPrerelease);

    // Event handlers
    autoUpdater.on('error', (error) => {
      log.error('Auto-updater error:', error);
      log.error('Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
      log.error('Error details:', {
        message: error.message,
        stack: error.stack,
        code: error.code,
        name: error.name,
        statusCode: error.statusCode,
        url: error.url
      });
      updateStateAndBroadcast({
        state: 'error',
        info: { error: error.message || String(error) }
      });
    });

    autoUpdater.on('checking-for-update', () => {
      log.info('Checking for updates...');
      updateStateAndBroadcast({ state: 'checking' });
    });

    autoUpdater.on('update-available', (info) => {
      log.info('Update available:', info.version);
      updateStateAndBroadcast({
        state: 'available',
        info: {
          version: info.version,
          releaseDate: info.releaseDate,
          releaseNotes: info.releaseNotes
        }
      });
    });

    autoUpdater.on('update-not-available', (info) => {
      log.info('Update not available. Current version is latest.');
      log.info('Update check info:', info);
      updateStateAndBroadcast({ state: 'idle' });
    });

    autoUpdater.on('download-progress', (progressObj) => {
      const percent = Math.round(progressObj.percent || 0);
      log.info('Download progress:', percent + '%');
      updateStateAndBroadcast({
        state: 'downloading',
        progress: percent
      });
    });

    autoUpdater.on('update-downloaded', (info) => {
      log.info('Update downloaded:', info.version);
      updateStateAndBroadcast({
        state: 'downloaded',
        info: {
          version: info.version,
          releaseDate: info.releaseDate
        }
      });
    });

    // Check for updates on startup (with delay to not block app launch)
    setTimeout(() => {
      checkForUpdatesSafe();
    }, 5000);

    // Set up periodic checks (every 12 hours)
    updateCheckInterval = setInterval(() => {
      checkForUpdatesSafe();
    }, 12 * 60 * 60 * 1000);

    log.info('Auto-updater initialized');
  } catch (error) {
    log.error('Failed to initialize auto-updater:', error);

    // Never throw - app must continue normally
  }
}

/**
 * Safely check for updates
 */
function checkForUpdatesSafe() {
  try {
    log.info('Checking for updates...');
    
    // Log current configuration for debugging
    const pkg = require('../package.json');
    log.info('Checking against repository:', pkg.repository?.url || 'not set');
    log.info('Current app version:', pkg.version);
    
    // Log electron-updater internal config (if accessible)
    try {
      log.info('autoUpdater.channel:', autoUpdater.channel);
      log.info('autoUpdater.allowPrerelease:', autoUpdater.allowPrerelease);
      // Try to access the update server URL that electron-updater will use
      if (pkg.repository && pkg.repository.url) {
        const match = pkg.repository.url.match(/github\.com\/([^\/]+)\/([^\/\.]+)/);
        if (match) {
          const expectedUrl = `https://github.com/${match[1]}/${match[2]}/releases/latest/download/latest.yml`;
          log.info('Expected update URL:', expectedUrl);
        }
      }
    } catch (e) {
      log.warn('Could not log electron-updater internal config:', e);
    }
    
    const updateCheckResult = autoUpdater.checkForUpdates();
    
    if (updateCheckResult) {
      updateCheckResult.then((result) => {
        log.info('Update check completed:', result);
      }).catch((error) => {
        log.error('Update check failed:', error);
        log.error('Error details:', {
          message: error.message,
          stack: error.stack,
          code: error.code
        });
        updateStateAndBroadcast({
          state: 'error',
          info: { error: error.message || String(error) }
        });
      });
    } else {
      log.warn('checkForUpdates() returned undefined or null');
    }
  } catch (error) {
    log.error('Error in checkForUpdatesSafe:', error);
    log.error('Error details:', {
      message: error.message,
      stack: error.stack
    });

    // Never throw - app must continue normally
  }
}

/**
 * Safely start download
 */
function downloadUpdateSafe() {
  try {
    log.info('Starting update download...');
    updateStateAndBroadcast({ state: 'downloading', progress: 0 });
    autoUpdater.downloadUpdate().catch((error) => {
      log.error('Download failed:', error);
      updateStateAndBroadcast({
        state: 'error',
        info: { error: error.message || String(error) }
      });
    });
  } catch (error) {
    log.error('Error in downloadUpdateSafe:', error);
    updateStateAndBroadcast({
      state: 'error',
      info: { error: error.message || String(error) }
    });
  }
}

/**
 * Safely quit and install
 */
function quitAndInstallSafe() {
  try {
    log.info('Quitting and installing update...');
    autoUpdater.quitAndInstall(false, true);
  } catch (error) {
    log.error('Error in quitAndInstallSafe:', error);

    // Never throw - app must continue normally
  }
}

/**
 * Get current updater state (for renderer handshake)
 * @returns {Object} Current state
 */
function getLastUpdaterState() {
  return { ...lastUpdaterState };
}

/**
 * Cleanup on app quit
 */
function cleanup() {
  try {
    if (updateCheckInterval) {
      clearInterval(updateCheckInterval);
      updateCheckInterval = null;
    }
  } catch (error) {
    log.error('Error in cleanup:', error);
  }
}

module.exports = {
  initAutoUpdate,
  checkForUpdatesSafe,
  downloadUpdateSafe,
  quitAndInstallSafe,
  getLastUpdaterState,
  cleanup
};
