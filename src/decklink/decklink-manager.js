/**
 * DeckLink Manager
 * Handles device enumeration and scheduled playback for Key/Fill output
 * Uses native addon for DeckLink communication
 */

const { EventEmitter } = require('events');

let decklink = null;
let decklinkAvailable = false;

// Try to load native DeckLink addon
try {
  decklink = require('../native');
  decklinkAvailable = decklink.isAvailable();
  console.log('[DeckLink] Native addon loaded, available:', decklinkAvailable);
} catch (err) {
  console.log('[DeckLink] Native addon not available:', err.message);
}

class DeckLinkManager extends EventEmitter {
  constructor() {
    super();
    this.devices = [];
    this.outputFillId = -1;
    this.outputKeyId = -1;
    this.isRunning = false;
    this.config = {
      mode: 'keyfill', // 'keyfill' or 'chromakey'
      fillDeviceIndex: 0,
      keyDeviceIndex: 1,
      displayMode: 0x48703530, // bmdModeHD1080p50
      width: 1920,
      height: 1080,
      frameRate: 50,
      chromakeyColor: { r: 0, g: 177, b: 64 } // Default: broadcast green
    };
  }

  /**
   * Check if DeckLink functionality is available
   */
  isAvailable() {
    return decklinkAvailable;
  }

  /**
   * Enumerate all available DeckLink devices
   */
  async enumerateDevices() {
    if (!decklinkAvailable) {
      return [];
    }

    try {
      this.devices = decklink.getDevices().filter(d => d.supportsOutput);
      console.log(`[DeckLink] Found ${this.devices.length} output device(s):`,
        this.devices.map(d => d.displayName).join(', '));
      return this.devices;
    } catch (err) {
      console.error('[DeckLink] Error enumerating devices:', err);
      this.emit('error', { type: 'enumeration', error: err.message });
      return [];
    }
  }

  /**
   * Get supported display modes
   */
  getDisplayModes() {
    if (!decklinkAvailable) return [];
    return decklink.getDisplayModes();
  }

  /**
   * Configure output settings
   */
  configure(options) {
    if (options.mode !== undefined) {
      this.config.mode = options.mode;
    }
    if (options.fillDeviceIndex !== undefined) {
      this.config.fillDeviceIndex = options.fillDeviceIndex;
    }
    if (options.keyDeviceIndex !== undefined) {
      this.config.keyDeviceIndex = options.keyDeviceIndex;
    }
    if (options.displayMode !== undefined) {
      this.config.displayMode = options.displayMode;
      const modes = this.getDisplayModes();
      const mode = modes.find(m => m.id === options.displayMode);
      if (mode) {
        this.config.width = mode.width;
        this.config.height = mode.height;
        this.config.frameRate = mode.frameRate;
      }
    }
    if (options.chromakeyColor !== undefined) {
      this.config.chromakeyColor = options.chromakeyColor;
    }
    console.log('[DeckLink] Configuration updated:', this.config);
  }

  /**
   * Start scheduled playback
   * In Key/Fill mode: uses two devices
   * In Chromakey mode: uses one device
   */
  async start() {
    if (!decklinkAvailable) {
      throw new Error('DeckLink not available');
    }

    if (this.isRunning) {
      console.log('[DeckLink] Already running');
      return;
    }

    const outputOptions = {
      displayMode: this.config.displayMode,
      width: this.config.width,
      height: this.config.height,
      frameRate: this.config.frameRate
    };

    const isChromakey = this.config.mode === 'chromakey';

    try {
      // Create Fill output (used in both modes)
      console.log(`[DeckLink] Creating ${isChromakey ? 'Chromakey' : 'Fill'} output on device ${this.config.fillDeviceIndex}`);
      this.outputFillId = decklink.createOutput(this.config.fillDeviceIndex, outputOptions);
      if (this.outputFillId < 0) {
        throw new Error('Failed to create output');
      }

      // Create Key output (only in Key/Fill mode)
      if (!isChromakey) {
        console.log(`[DeckLink] Creating Key output on device ${this.config.keyDeviceIndex}`);
        this.outputKeyId = decklink.createOutput(this.config.keyDeviceIndex, outputOptions);
        if (this.outputKeyId < 0) {
          decklink.destroyOutput(this.outputFillId);
          this.outputFillId = -1;
          throw new Error('Failed to create Key output');
        }
      }

      // Start Fill/Chromakey output
      if (!decklink.startOutput(this.outputFillId)) {
        throw new Error('Failed to start output');
      }

      // Start Key output (only in Key/Fill mode)
      if (!isChromakey && this.outputKeyId >= 0) {
        if (!decklink.startOutput(this.outputKeyId)) {
          decklink.stopOutput(this.outputFillId);
          throw new Error('Failed to start Key output');
        }
      }

      this.isRunning = true;
      this.emit('started', { mode: this.config.mode });
      console.log(`[DeckLink] Playback started in ${isChromakey ? 'Chromakey' : 'Key/Fill'} mode`);

    } catch (err) {
      console.error('[DeckLink] Error starting playback:', err);
      await this.stop();
      throw err;
    }
  }

  /**
   * Stop playback on both devices
   */
  async stop() {
    console.log('[DeckLink] Stopping playback');

    if (this.outputFillId >= 0) {
      decklink.stopOutput(this.outputFillId);
      decklink.destroyOutput(this.outputFillId);
      this.outputFillId = -1;
    }

    if (this.outputKeyId >= 0) {
      decklink.stopOutput(this.outputKeyId);
      decklink.destroyOutput(this.outputKeyId);
      this.outputKeyId = -1;
    }

    this.isRunning = false;
    this.emit('stopped');
  }

  /**
   * Schedule a frame for output
   * @param {Buffer} fillFrame - BGRA frame buffer for Fill/Chromakey output
   * @param {Buffer} keyFrame - BGRA frame buffer for Key output (ignored in chromakey mode)
   */
  scheduleFrame(fillFrame, keyFrame) {
    if (!this.isRunning) {
      return false;
    }

    let success = true;
    const isChromakey = this.config.mode === 'chromakey';

    if (fillFrame && this.outputFillId >= 0) {
      success = decklink.scheduleFrame(this.outputFillId, fillFrame) && success;
    }

    // Only schedule key frame in Key/Fill mode
    if (!isChromakey && keyFrame && this.outputKeyId >= 0) {
      success = decklink.scheduleFrame(this.outputKeyId, keyFrame) && success;
    }

    return success;
  }

  /**
   * Get chromakey background color
   */
  getChromakeyColor() {
    return this.config.chromakeyColor;
  }

  /**
   * Check if running in chromakey mode
   */
  isChromakeyMode() {
    return this.config.mode === 'chromakey';
  }

  /**
   * Get current playback status
   */
  getStatus() {
    const isChromakey = this.config.mode === 'chromakey';
    return {
      available: decklinkAvailable,
      running: this.isRunning,
      mode: this.config.mode,
      devices: this.devices,
      config: this.config,
      stats: {
        fillFrames: this.outputFillId >= 0 ? decklink.getFrameCount(this.outputFillId) : 0,
        keyFrames: !isChromakey && this.outputKeyId >= 0 ? decklink.getFrameCount(this.outputKeyId) : 0
      }
    };
  }

  /**
   * Get frame dimensions
   */
  getFrameDimensions() {
    return {
      width: this.config.width,
      height: this.config.height
    };
  }

  /**
   * Get frame rate
   */
  getFrameRate() {
    return this.config.frameRate;
  }

  /**
   * Create an empty BGRA frame buffer
   */
  createEmptyFrame() {
    const frameSize = this.config.width * this.config.height * 4;
    return Buffer.alloc(frameSize, 0);
  }
}

module.exports = DeckLinkManager;
