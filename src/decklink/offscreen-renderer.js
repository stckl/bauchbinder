/**
 * Offscreen Renderer
 * Manages OSR BrowserWindows for Key and Fill rendering with GPU shared textures
 */

const { BrowserWindow } = require('electron');
const path = require('path');
const { EventEmitter } = require('events');

class OffscreenRenderer extends EventEmitter {
  constructor(options = {}) {
    super();
    this.winFill = null;
    this.winKey = null;
    this.width = options.width || 1920;
    this.height = options.height || 1080;
    this.frameRate = options.frameRate || 60;
    this.baseUrl = options.baseUrl || 'http://localhost:5001';
    this.isReady = false;
    this.fillReady = false;
    this.keyReady = false;

    // Chromakey mode settings
    this.mode = options.mode || 'keyfill'; // 'keyfill' or 'chromakey'
    this.chromakeyColor = options.chromakeyColor || { r: 0, g: 177, b: 64 };

    // Frame callbacks
    this.onFillFrame = null;
    this.onKeyFrame = null;
  }

  /**
   * Create OSR windows for Key and Fill (or single window for Chromakey)
   */
  async create() {
    const isChromakey = this.mode === 'chromakey';
    console.log(`[OSR] Creating offscreen windows (${this.width}x${this.height} @ ${this.frameRate}fps, mode: ${this.mode})`);

    const windowOptions = {
      width: this.width,
      height: this.height,
      show: false, // Hidden windows
      webPreferences: {
        offscreen: {
          useSharedTexture: true // GPU-accelerated rendering
        },
        nodeIntegration: true,
        contextIsolation: false,
        backgroundThrottling: false // Don't throttle when hidden
      }
    };

    // Create Fill/Chromakey window
    this.winFill = new BrowserWindow(windowOptions);
    this.winFill.webContents.setFrameRate(this.frameRate);

    // Create Key window (only in Key/Fill mode)
    if (!isChromakey) {
      this.winKey = new BrowserWindow(windowOptions);
      this.winKey.webContents.setFrameRate(this.frameRate);
    }

    // Setup paint event handlers for GPU texture capture
    this.setupPaintHandler(this.winFill, 'fill');
    if (!isChromakey && this.winKey) {
      this.setupPaintHandler(this.winKey, 'key');
    }

    // Load the playout HTML files
    await this.loadContent();

    return { fill: this.winFill, key: this.winKey };
  }

  /**
   * Setup paint event handler for frame capture
   */
  setupPaintHandler(win, type) {
    win.webContents.on('paint', (event, dirty, image, texture) => {
      // image is a NativeImage when not using shared textures
      // texture contains GPU texture info when using shared textures

      if (texture) {
        // GPU shared texture path
        this.handleSharedTexture(type, texture);
      } else if (image) {
        // Fallback: CPU-based NativeImage
        this.handleNativeImage(type, image);
      }
    });

    // Mark window as ready when page loads
    win.webContents.on('did-finish-load', () => {
      console.log(`[OSR] ${type} window loaded`);
      if (type === 'fill') {
        this.fillReady = true;
      } else {
        this.keyReady = true;
      }

      // In chromakey mode, only fill needs to be ready
      const isChromakey = this.mode === 'chromakey';
      const allReady = isChromakey ? this.fillReady : (this.fillReady && this.keyReady);

      if (allReady && !this.isReady) {
        this.isReady = true;
        this.emit('ready');
      }
    });
  }

  /**
   * Handle GPU shared texture (preferred path)
   */
  handleSharedTexture(type, texture) {
    // texture contains:
    // - textureInfo.sharedTextureHandle (platform-specific handle)
    // - textureInfo.widgetType
    // - textureInfo.pixelFormat
    // - textureInfo.codedSize

    // For DeckLink output, we need to read the texture back to CPU
    // This requires platform-specific code or falling back to NativeImage

    // Emit the texture info for processing
    this.emit('texture', { type, texture });
  }

  /**
   * Handle NativeImage (fallback path)
   */
  handleNativeImage(type, image) {
    try {
      // Get BGRA bitmap data from NativeImage
      const bitmap = image.toBitmap();
      const size = image.getSize();

      // Emit frame data
      this.emit('frame', {
        type,
        buffer: Buffer.from(bitmap),
        width: size.width,
        height: size.height
      });

      // Call registered callback
      if (type === 'fill' && this.onFillFrame) {
        this.onFillFrame(Buffer.from(bitmap), size.width, size.height);
      } else if (type === 'key' && this.onKeyFrame) {
        this.onKeyFrame(Buffer.from(bitmap), size.width, size.height);
      }
    } catch (err) {
      console.error(`[OSR] Error processing ${type} frame:`, err.message);
    }
  }

  /**
   * Load playout content into windows
   */
  async loadContent() {
    const isChromakey = this.mode === 'chromakey';

    // In chromakey mode, pass the background color as URL parameter
    let fillUrl = `${this.baseUrl}/bauchbinde_fill.html`;
    if (isChromakey) {
      const { r, g, b } = this.chromakeyColor;
      fillUrl += `?chromakey=1&r=${r}&g=${g}&b=${b}`;
    }

    console.log(`[OSR] Loading Fill: ${fillUrl}`);

    if (isChromakey) {
      // Chromakey mode: only load fill
      await this.winFill.loadURL(fillUrl);
    } else {
      // Key/Fill mode: load both
      const keyUrl = `${this.baseUrl}/bauchbinde_key.html`;
      console.log(`[OSR] Loading Key: ${keyUrl}`);
      await Promise.all([
        this.winFill.loadURL(fillUrl),
        this.winKey.loadURL(keyUrl)
      ]);
    }
  }

  /**
   * Start capturing frames at specified framerate
   * Note: OSR automatically captures at the set framerate via paint events
   */
  startCapture() {
    if (!this.isReady) {
      console.warn('[OSR] Windows not ready yet');
      return;
    }

    // OSR windows automatically emit paint events at the configured framerate
    // We just need to make sure they're painting

    // Force initial paints
    this.winFill.webContents.invalidate();
    if (this.winKey && !this.winKey.isDestroyed()) {
      this.winKey.webContents.invalidate();
    }

    console.log('[OSR] Capture started');
    this.emit('captureStarted');
  }

  /**
   * Stop capturing (optional - can leave windows running)
   */
  stopCapture() {
    console.log('[OSR] Capture stopped');
    this.emit('captureStopped');
  }

  /**
   * Send IPC message to both windows
   */
  sendToWindows(channel, data) {
    if (this.winFill && !this.winFill.isDestroyed()) {
      this.winFill.webContents.send(channel, data);
    }
    if (this.winKey && !this.winKey.isDestroyed()) {
      this.winKey.webContents.send(channel, data);
    }
  }

  /**
   * Update CSS on both windows
   */
  updateCSS(cssData) {
    this.sendToWindows('update-css', cssData);
  }

  /**
   * Update animation settings on both windows
   */
  updateAnimation(animData) {
    this.sendToWindows('update-js', animData);
  }

  /**
   * Show a lower third on both windows
   */
  showLowerThird(data) {
    this.sendToWindows('show-lowerthird', data);
  }

  /**
   * Hide the lower third on both windows
   */
  hideLowerThird() {
    this.sendToWindows('hide-lowerthird', {});
  }

  /**
   * Cancel (instant hide) on both windows
   */
  cancelLowerThird() {
    this.sendToWindows('cancel-lowerthird', {});
  }

  /**
   * Set frame rate for windows
   */
  setFrameRate(fps) {
    this.frameRate = fps;
    if (this.winFill && !this.winFill.isDestroyed()) {
      this.winFill.webContents.setFrameRate(fps);
    }
    if (this.winKey && !this.winKey.isDestroyed()) {
      this.winKey.webContents.setFrameRate(fps);
    }
    console.log(`[OSR] Frame rate set to ${fps}fps`);
  }

  /**
   * Set output mode
   */
  setMode(mode) {
    this.mode = mode;
  }

  /**
   * Set chromakey background color
   */
  setChromakeyColor(color) {
    this.chromakeyColor = color;
    // If already running, send the color update to the fill window
    if (this.winFill && !this.winFill.isDestroyed() && this.mode === 'chromakey') {
      this.winFill.webContents.send('set-chromakey-color', color);
    }
  }

  /**
   * Get current mode
   */
  getMode() {
    return this.mode;
  }

  /**
   * Resize windows
   */
  resize(width, height) {
    this.width = width;
    this.height = height;

    if (this.winFill) {
      this.winFill.setSize(width, height);
    }
    if (this.winKey) {
      this.winKey.setSize(width, height);
    }
    console.log(`[OSR] Resized to ${width}x${height}`);
  }

  /**
   * Destroy windows and cleanup
   */
  destroy() {
    console.log('[OSR] Destroying offscreen windows');

    if (this.winFill && !this.winFill.isDestroyed()) {
      this.winFill.destroy();
    }
    if (this.winKey && !this.winKey.isDestroyed()) {
      this.winKey.destroy();
    }

    this.winFill = null;
    this.winKey = null;
    this.isReady = false;
    this.fillReady = false;
    this.keyReady = false;
  }

  /**
   * Check if windows are ready
   */
  ready() {
    return this.isReady;
  }

  /**
   * Get window references
   */
  getWindows() {
    return {
      fill: this.winFill,
      key: this.winKey
    };
  }
}

module.exports = OffscreenRenderer;
