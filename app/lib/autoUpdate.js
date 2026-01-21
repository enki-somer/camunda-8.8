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
  broadcastToAllWindows('updater:status', lastUpdaterState);
}

/**
 * Initialize auto-updater
 */
function initAutoUpdate() {
  try {
    log.info('Initializing auto-updater');

    // Configure auto-updater
    autoUpdater.autoDownload = false;
    autoUpdater.allowPrerelease = false;
    autoUpdater.allowDowngrade = false;

    // Event handlers
    autoUpdater.on('error', (error) => {
      log.error('Auto-updater error:', error);
      updateStateAndBroadcast({
        state: 'error',
        info: { error: error.message || String(error) }
      });
    });

    autoUpdater.on('checking-for-update', () => {
      log.info('Checking for updates...');
      updateStateAndBroadcast({ state: 'idle' });
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
    autoUpdater.checkForUpdates().catch((error) => {
      log.error('Update check failed:', error);
      updateStateAndBroadcast({
        state: 'error',
        info: { error: error.message || String(error) }
      });
    });
  } catch (error) {
    log.error('Error in checkForUpdatesSafe:', error);

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
