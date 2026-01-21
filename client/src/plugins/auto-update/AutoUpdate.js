/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { PureComponent } from 'react';

import Modal from '../../shared/ui/modal/Modal';

const log = require('debug')('AutoUpdate');

export default class AutoUpdate extends PureComponent {

  constructor(props) {
    super(props);

    this.state = {
      showModal: false,
      type: null, // 'available' | 'downloaded'
      version: null,
      progress: 0
    };

    this.backend = null;
    this.statusListener = null;
  }

  componentDidMount() {
    const { _getGlobal } = this.props;
    this.backend = _getGlobal('backend');

    if (!this.backend) {
      log.error('Backend not available');
      return;
    }

    // Send handshake to get current state
    this.backend.send('updater:rendererReady').catch(err => {
      log.error('Error sending rendererReady:', err);
    });

    // Listen for update status events
    this.statusListener = this.backend.on('updater:status', (state) => {
      this.handleUpdateStatus(state);
    });
  }

  componentWillUnmount() {
    if (this.statusListener) {
      this.statusListener.cancel();
    }
  }

  handleUpdateStatus(state) {
    log('Update status received:', state);

    if (state.state === 'available') {
      this.setState({
        showModal: true,
        type: 'available',
        version: state.info?.version || 'unknown',
        progress: 0
      });
    } else if (state.state === 'downloading') {
      this.setState({
        showModal: true,
        type: 'available', // Keep showing download modal
        progress: state.progress || 0
      });
    } else if (state.state === 'downloaded') {
      this.setState({
        showModal: true,
        type: 'downloaded',
        version: state.info?.version || 'unknown',
        progress: 100
      });
    } else if (state.state === 'error') {
      // Log error but don't show UI (non-intrusive)
      log.error('Update error:', state.info?.error);
      this.setState({
        showModal: false
      });
    } else if (state.state === 'idle') {
      // No update available, close modal if open
      if (this.state.type === 'available' && this.state.progress === 0) {
        this.setState({ showModal: false });
      }
    }
  }

  handleDownload = () => {
    if (this.backend) {
      this.backend.send('updater:download').catch(err => {
        log.error('Error starting download:', err);
      });
    }
  };

  handleInstall = () => {
    if (this.backend) {
      this.backend.send('updater:install').catch(err => {
        log.error('Error installing update:', err);
      });
    }
  };

  handleLater = () => {
    this.setState({ showModal: false });
  };

  render() {
    const { showModal, type, version, progress } = this.state;

    if (!showModal) {
      return null;
    }

    return (
      <Modal onClose={ this.handleLater }>
        <Modal.Title>
          { type === 'available' ? 'Update Available' : 'Update Ready to Install' }
        </Modal.Title>
        <Modal.Body>
          { type === 'available' && (
            <div>
              <p>
                Version <strong>{ version }</strong> is available for download.
              </p>
              { progress > 0 && progress < 100 && (
                <div style={ { marginTop: '15px' } }>
                  <div style={ {
                    width: '100%',
                    height: '20px',
                    backgroundColor: '#f0f0f0',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  } }>
                    <div style={ {
                      width: `${progress}%`,
                      height: '100%',
                      backgroundColor: '#4CAF50',
                      transition: 'width 0.3s ease'
                    } } />
                  </div>
                  <p style={ { marginTop: '8px', fontSize: '12px', color: '#666' } }>
                    Downloading... { progress }%
                  </p>
                </div>
              ) }
            </div>
          ) }
          { type === 'downloaded' && (
            <div>
              <p>
                Update <strong>{ version }</strong> has been downloaded and is ready to install.
              </p>
              <p>
                The application will restart to apply the update.
              </p>
            </div>
          ) }
        </Modal.Body>
        <Modal.Footer>
          { type === 'available' && progress === 0 && (
            <>
              <button
                className="btn btn-primary"
                onClick={ this.handleDownload }
              >
                Download & Install
              </button>
              <button
                className="btn btn-secondary"
                onClick={ this.handleLater }
                style={ { marginLeft: '10px' } }
              >
                Later
              </button>
            </>
          ) }
          { type === 'available' && progress > 0 && progress < 100 && (
            <button
              className="btn btn-secondary"
              onClick={ this.handleLater }
            >
              Close
            </button>
          ) }
          { type === 'downloaded' && (
            <>
              <button
                className="btn btn-primary"
                onClick={ this.handleInstall }
              >
                Restart Now
              </button>
              <button
                className="btn btn-secondary"
                onClick={ this.handleLater }
                style={ { marginLeft: '10px' } }
              >
                Later
              </button>
            </>
          ) }
        </Modal.Footer>
      </Modal>
    );
  }
}
