/**
 * DeckLink Output Module
 * Main entry point for Key/Fill DeckLink output functionality
 */

const DeckLinkManager = require('./decklink-manager');
const OffscreenRenderer = require('./offscreen-renderer');
const FrameSynchronizer = require('./frame-synchronizer');
const { EventEmitter } = require('events');

/**
 * High-level controller for DeckLink Key/Fill output
 * Orchestrates OSR rendering, frame sync, and DeckLink playback
 */
class DeckLinkOutput extends EventEmitter {
  constructor() {
    super();

    this.manager = new DeckLinkManager();
    this.renderer = null;
    this.synchronizer = null;
    this.isRunning = false;
    this.baseUrl = 'http://localhost:5001';

    // Forward manager events
    this.manager.on('error', (err) => this.emit('error', err));
    this.manager.on('started', () => this.emit('playbackStarted'));
    this.manager.on('stopped', () => this.emit('playbackStopped'));
  }

  /**
   * Check if DeckLink is available
   */
  isAvailable() {
    return this.manager.isAvailable();
  }

  /**
   * Get available devices
   */
  async getDevices() {
    return await this.manager.enumerateDevices();
  }

  /**
   * Get supported display modes
   */
  getDisplayModes() {
    return this.manager.getDisplayModes();
  }

  /**
   * Configure output settings
   */
  configure(options) {
    this.manager.configure(options);

    if (options.baseUrl) {
      this.baseUrl = options.baseUrl;
    }
  }

  /**
   * Start the full output pipeline
   */
  async start() {
    if (this.isRunning) {
      console.log('[DeckLinkOutput] Already running');
      return;
    }

    try {
      console.log('[DeckLinkOutput] Starting output pipeline...');

      // Get dimensions from manager config
      const { width, height } = this.manager.getFrameDimensions();
      const frameRate = this.manager.getFrameRate();

      // Create frame synchronizer
      this.synchronizer = new FrameSynchronizer({ frameRate });

      // Handle synchronized frames
      this.synchronizer.on('sync', async (data) => {
        await this.handleSyncedFrames(data);
      });

      // Create OSR windows
      this.renderer = new OffscreenRenderer({
        width,
        height,
        frameRate,
        baseUrl: this.baseUrl
      });

      // Handle frames from OSR
      this.renderer.on('frame', (data) => {
        if (data.type === 'fill') {
          this.synchronizer.receiveFill(data.buffer, data.width, data.height);
        } else if (data.type === 'key') {
          this.synchronizer.receiveKey(data.buffer, data.width, data.height);
        }
      });

      // Wait for OSR windows to be ready
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('OSR windows failed to load within timeout'));
        }, 10000);

        this.renderer.once('ready', () => {
          clearTimeout(timeout);
          resolve();
        });

        this.renderer.create().catch(reject);
      });

      console.log('[DeckLinkOutput] OSR windows ready');

      // Start DeckLink playback
      await this.manager.start();

      // Start OSR capture
      this.renderer.startCapture();

      this.isRunning = true;
      this.emit('started');
      console.log('[DeckLinkOutput] Pipeline running');

    } catch (err) {
      console.error('[DeckLinkOutput] Failed to start:', err);
      await this.stop();
      throw err;
    }
  }

  /**
   * Handle synchronized Key/Fill frame pair
   */
  async handleSyncedFrames(data) {
    const { fill, key, frameTime } = data;

    try {
      // Schedule both frames to DeckLink
      await this.manager.scheduleFrame(
        fill.buffer,
        key.buffer,
        frameTime
      );
    } catch (err) {
      // Log but don't crash on individual frame errors
      if (!err.message?.includes('underrun')) {
        console.error('[DeckLinkOutput] Frame schedule error:', err.message);
      }
    }
  }

  /**
   * Stop the output pipeline
   */
  async stop() {
    console.log('[DeckLinkOutput] Stopping output pipeline...');

    // Stop capture
    if (this.renderer) {
      this.renderer.stopCapture();
      this.renderer.destroy();
      this.renderer = null;
    }

    // Stop DeckLink
    await this.manager.stop();

    // Clear synchronizer
    if (this.synchronizer) {
      this.synchronizer.reset();
      this.synchronizer = null;
    }

    this.isRunning = false;
    this.emit('stopped');
    console.log('[DeckLinkOutput] Pipeline stopped');
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      available: this.isAvailable(),
      running: this.isRunning,
      decklink: this.manager.getStatus(),
      renderer: this.renderer ? {
        ready: this.renderer.ready()
      } : null,
      synchronizer: this.synchronizer ? this.synchronizer.getStats() : null
    };
  }

  /**
   * Update CSS on OSR windows
   */
  updateCSS(cssData) {
    if (this.renderer) {
      this.renderer.updateCSS(cssData);
    }
  }

  /**
   * Update animation settings on OSR windows
   */
  updateAnimation(animData) {
    if (this.renderer) {
      this.renderer.updateAnimation(animData);
    }
  }

  /**
   * Show a lower third on OSR windows
   */
  showLowerThird(data) {
    if (this.renderer) {
      this.renderer.showLowerThird(data);
    }
  }

  /**
   * Hide the lower third on OSR windows
   */
  hideLowerThird() {
    if (this.renderer) {
      this.renderer.hideLowerThird();
    }
  }

  /**
   * Cancel (instant hide) on OSR windows
   */
  cancelLowerThird() {
    if (this.renderer) {
      this.renderer.cancelLowerThird();
    }
  }
}

// Export all modules
module.exports = {
  DeckLinkOutput,
  DeckLinkManager,
  OffscreenRenderer,
  FrameSynchronizer
};
