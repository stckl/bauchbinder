/**
 * DeckLink Output - JavaScript wrapper for native addon
 */

let native = null;
let available = false;

// Try to load native module
try {
  native = require('./build/Release/decklink_output.node');
  native.initialize();
  available = true;
  console.log('[DeckLink Native] Module loaded successfully');
} catch (err) {
  console.log('[DeckLink Native] Module not available:', err.message);
}

/**
 * Check if DeckLink native module is available
 */
function isAvailable() {
  return available;
}

/**
 * Get list of available DeckLink devices
 */
function getDevices() {
  if (!available) return [];
  try {
    return native.getDevices();
  } catch (err) {
    console.error('[DeckLink Native] getDevices error:', err);
    return [];
  }
}

/**
 * Get supported display modes
 */
function getDisplayModes() {
  if (!available) return [];
  try {
    return native.getDisplayModes();
  } catch (err) {
    console.error('[DeckLink Native] getDisplayModes error:', err);
    return [];
  }
}

/**
 * Create an output instance for a device
 * @param {number} deviceIndex - Device index
 * @param {object} options - Options (displayMode, width, height, frameRate)
 * @returns {number} Output ID or -1 on error
 */
function createOutput(deviceIndex, options = {}) {
  if (!available) return -1;
  try {
    return native.createOutput(deviceIndex, options);
  } catch (err) {
    console.error('[DeckLink Native] createOutput error:', err);
    return -1;
  }
}

/**
 * Start playback on an output
 * @param {number} outputId - Output ID from createOutput
 * @returns {boolean} Success
 */
function startOutput(outputId) {
  if (!available) return false;
  try {
    return native.startOutput(outputId);
  } catch (err) {
    console.error('[DeckLink Native] startOutput error:', err);
    return false;
  }
}

/**
 * Stop playback on an output
 * @param {number} outputId - Output ID
 * @returns {boolean} Success
 */
function stopOutput(outputId) {
  if (!available) return false;
  try {
    return native.stopOutput(outputId);
    } catch (err) {
    console.error('[DeckLink Native] stopOutput error:', err);
    return false;
  }
}

/**
 * Destroy an output instance
 * @param {number} outputId - Output ID
 * @returns {boolean} Success
 */
function destroyOutput(outputId) {
  if (!available) return false;
  try {
    return native.destroyOutput(outputId);
  } catch (err) {
    console.error('[DeckLink Native] destroyOutput error:', err);
    return false;
  }
}

/**
 * Schedule a video frame for output
 * @param {number} outputId - Output ID
 * @param {Buffer} frameBuffer - BGRA frame data
 * @returns {boolean} Success
 */
function scheduleFrame(outputId, frameBuffer) {
  if (!available) return false;
  try {
    return native.scheduleFrame(outputId, frameBuffer);
  } catch (err) {
    // Don't spam console for scheduling errors
    return false;
  }
}

/**
 * Check if output is running
 * @param {number} outputId - Output ID
 * @returns {boolean} Running state
 */
function isRunning(outputId) {
  if (!available) return false;
  try {
    return native.isRunning(outputId);
  } catch (err) {
    return false;
  }
}

/**
 * Get scheduled frame count
 * @param {number} outputId - Output ID
 * @returns {number} Frame count
 */
function getFrameCount(outputId) {
  if (!available) return 0;
  try {
    return native.getFrameCount(outputId);
  } catch (err) {
    return 0;
  }
}

/**
 * Cleanup all resources
 */
function cleanup() {
  if (!available) return;
  try {
    native.cleanup();
  } catch (err) {
    console.error('[DeckLink Native] cleanup error:', err);
  }
}

module.exports = {
  isAvailable,
  getDevices,
  getDisplayModes,
  createOutput,
  startOutput,
  stopOutput,
  destroyOutput,
  scheduleFrame,
  isRunning,
  getFrameCount,
  cleanup
};
