/**
 * Frame Synchronizer
 * Synchronizes Key and Fill frames before sending to DeckLink
 * Ensures both frames are available within a tolerance window
 */

const { EventEmitter } = require('events');

class FrameSynchronizer extends EventEmitter {
  constructor(options = {}) {
    super();

    // Configuration
    this.toleranceMs = options.toleranceMs || 16; // ~1 frame at 60fps
    this.frameRate = options.frameRate || 60;
    this.dropOldFrames = options.dropOldFrames !== false;

    // Frame buffers
    this.pendingFill = null;
    this.pendingKey = null;

    // Timing
    this.fillTimestamp = 0;
    this.keyTimestamp = 0;

    // Statistics
    this.stats = {
      framesReceived: { fill: 0, key: 0 },
      framesSynced: 0,
      framesDropped: { fill: 0, key: 0 },
      lastSyncTime: 0
    };

    // Frame counter for DeckLink scheduling
    this.frameCount = 0;
  }

  /**
   * Receive a Fill frame
   */
  receiveFill(buffer, width, height) {
    const now = Date.now();
    this.stats.framesReceived.fill++;

    // Check if we should drop the old frame
    if (this.pendingFill && this.dropOldFrames) {
      this.stats.framesDropped.fill++;
    }

    this.pendingFill = { buffer, width, height };
    this.fillTimestamp = now;

    this.trySync();
  }

  /**
   * Receive a Key frame
   */
  receiveKey(buffer, width, height) {
    const now = Date.now();
    this.stats.framesReceived.key++;

    // Check if we should drop the old frame
    if (this.pendingKey && this.dropOldFrames) {
      this.stats.framesDropped.key++;
    }

    this.pendingKey = { buffer, width, height };
    this.keyTimestamp = now;

    this.trySync();
  }

  /**
   * Try to synchronize pending frames
   */
  trySync() {
    // Need both frames
    if (!this.pendingFill || !this.pendingKey) {
      return;
    }

    // Check if frames are within tolerance
    const timeDiff = Math.abs(this.fillTimestamp - this.keyTimestamp);

    if (timeDiff <= this.toleranceMs) {
      // Frames are synchronized, emit them
      this.emitSyncedFrames();
    } else if (this.dropOldFrames) {
      // Frames are too far apart, drop the older one
      if (this.fillTimestamp < this.keyTimestamp) {
        this.pendingFill = null;
        this.stats.framesDropped.fill++;
      } else {
        this.pendingKey = null;
        this.stats.framesDropped.key++;
      }
    }
  }

  /**
   * Emit synchronized frame pair
   */
  emitSyncedFrames() {
    const fill = this.pendingFill;
    const key = this.pendingKey;

    // Clear pending
    this.pendingFill = null;
    this.pendingKey = null;

    // Update stats
    this.stats.framesSynced++;
    this.stats.lastSyncTime = Date.now();

    // Get frame time for DeckLink scheduling
    const frameTime = this.frameCount++;

    // Emit synchronized pair
    this.emit('sync', {
      fill,
      key,
      frameTime,
      timestamp: this.stats.lastSyncTime
    });
  }

  /**
   * Force output of pending frames even if not synced
   * Useful for flushing on shutdown or format change
   */
  flush() {
    if (this.pendingFill || this.pendingKey) {
      const fill = this.pendingFill || this.createEmptyFrame();
      const key = this.pendingKey || this.createEmptyFrame();

      this.emit('sync', {
        fill,
        key,
        frameTime: this.frameCount++,
        timestamp: Date.now(),
        flushed: true
      });

      this.pendingFill = null;
      this.pendingKey = null;
    }
  }

  /**
   * Create an empty frame buffer (placeholder)
   */
  createEmptyFrame() {
    return {
      buffer: null,
      width: 0,
      height: 0
    };
  }

  /**
   * Reset synchronizer state
   */
  reset() {
    this.pendingFill = null;
    this.pendingKey = null;
    this.fillTimestamp = 0;
    this.keyTimestamp = 0;
    this.frameCount = 0;
    this.stats = {
      framesReceived: { fill: 0, key: 0 },
      framesSynced: 0,
      framesDropped: { fill: 0, key: 0 },
      lastSyncTime: 0
    };
  }

  /**
   * Set frame rate (affects tolerance calculation)
   */
  setFrameRate(fps) {
    this.frameRate = fps;
    // Adjust tolerance to ~1 frame at new rate
    this.toleranceMs = Math.ceil(1000 / fps);
  }

  /**
   * Set sync tolerance in milliseconds
   */
  setTolerance(ms) {
    this.toleranceMs = ms;
  }

  /**
   * Get synchronizer statistics
   */
  getStats() {
    const now = Date.now();
    return {
      ...this.stats,
      pending: {
        fill: !!this.pendingFill,
        key: !!this.pendingKey
      },
      frameCount: this.frameCount,
      timeSinceLastSync: this.stats.lastSyncTime ? now - this.stats.lastSyncTime : null
    };
  }

  /**
   * Check health of synchronization
   */
  isHealthy() {
    // Consider healthy if:
    // 1. Frames are being received on both channels
    // 2. Drop rate is below 10%

    const totalFill = this.stats.framesReceived.fill;
    const totalKey = this.stats.framesReceived.key;

    if (totalFill === 0 || totalKey === 0) {
      return false;
    }

    const fillDropRate = this.stats.framesDropped.fill / totalFill;
    const keyDropRate = this.stats.framesDropped.key / totalKey;

    return fillDropRate < 0.1 && keyDropRate < 0.1;
  }
}

module.exports = FrameSynchronizer;
