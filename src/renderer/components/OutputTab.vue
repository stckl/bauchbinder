<template>
  <div class="row" style="margin-top: 20px;">
    <div class="col">
      <h2>DeckLink Ausgabe</h2>

      <!-- Not available message -->
      <div v-if="!decklink.available" class="ui warning message">
        <div class="header">DeckLink nicht verfügbar</div>
        <p>
          Das DeckLink-Modul ist nicht installiert oder keine Karte gefunden.
        </p>
        <div class="ui bulleted list">
          <div class="item">Installiere <b>Blackmagic Desktop Video</b> von blackmagicdesign.com</div>
          <div class="item">Kopiere die SDK-Header nach <code>src/native/sdk/</code> (siehe README)</div>
          <div class="item">Führe <code>npm run build-decklink</code> aus</div>
          <div class="item">Führe <code>npm run rebuild-decklink</code> aus (für Electron)</div>
          <div class="item">Starte die App neu</div>
        </div>
      </div>

      <!-- Main configuration -->
      <div v-else class="ui inverted segment">
        <!-- Status -->
        <div class="ui message" :class="statusClass">
          <div class="header">{{ statusText }}</div>
          <p v-if="decklink.running">{{ runningModeText }}</p>
        </div>

        <!-- Mode Selection -->
        <div class="ui form inverted">
          <h3>Ausgabe-Modus</h3>
          <div class="grouped fields">
            <div class="field">
              <div class="ui radio checkbox inverted">
                <input type="radio" v-model="config.mode" value="externalkey" :disabled="decklink.running">
                <label>External Keyer (1 Gerät, z.B. UltraStudio HD Mini)</label>
              </div>
            </div>
            <div class="field">
              <div class="ui radio checkbox inverted">
                <input type="radio" v-model="config.mode" value="keyfill" :disabled="decklink.running">
                <label>Key/Fill (2 separate Ausgänge)</label>
              </div>
            </div>
            <div class="field">
              <div class="ui radio checkbox inverted">
                <input type="radio" v-model="config.mode" value="chromakey" :disabled="decklink.running">
                <label>Chromakey (1 Ausgang mit Farbhintergrund)</label>
              </div>
            </div>
          </div>

          <div class="ui divider inverted"></div>

          <!-- Device Selection -->
          <h3>Geräte-Auswahl</h3>

          <div :class="isSingleDeviceMode ? 'field' : 'two fields'">
            <div class="field">
              <label>{{ deviceLabel }}</label>
              <select v-model="config.fillDeviceIndex" class="ui dropdown inverted" :disabled="decklink.running">
                <option v-for="device in availableDevices" :key="'fill-' + device.index" :value="device.index">
                  {{ device.displayName }}{{ device.supportsKeyer ? ' (Keyer)' : '' }}
                </option>
              </select>
            </div>
            <div class="field" v-if="config.mode === 'keyfill'">
              <label>Key-Ausgang</label>
              <select v-model="config.keyDeviceIndex" class="ui dropdown inverted" :disabled="decklink.running">
                <option v-for="device in decklink.devices" :key="'key-' + device.index" :value="device.index">
                  {{ device.displayName }}
                </option>
              </select>
            </div>
          </div>

          <!-- Chromakey Color (only in chromakey mode) -->
          <div v-if="config.mode === 'chromakey'" class="field" style="margin-top: 15px;">
            <label>Hintergrundfarbe (Chromakey)</label>
            <div class="color-picker-row">
              <input type="color" v-model="chromakeyHex" :disabled="decklink.running" class="color-picker">
              <div class="color-inputs">
                <div class="color-input">
                  <label>R</label>
                  <input type="number" v-model.number="config.chromakeyColor.r" min="0" max="255" :disabled="decklink.running">
                </div>
                <div class="color-input">
                  <label>G</label>
                  <input type="number" v-model.number="config.chromakeyColor.g" min="0" max="255" :disabled="decklink.running">
                </div>
                <div class="color-input">
                  <label>B</label>
                  <input type="number" v-model.number="config.chromakeyColor.b" min="0" max="255" :disabled="decklink.running">
                </div>
              </div>
              <div class="color-preview" :style="{ backgroundColor: chromakeyHex }"></div>
            </div>
            <div class="color-presets">
              <button class="ui mini button" @click="setChromakeyPreset(0, 177, 64)" :disabled="decklink.running" title="Broadcast Green">Green</button>
              <button class="ui mini button" @click="setChromakeyPreset(0, 71, 187)" :disabled="decklink.running" title="Chroma Blue">Blue</button>
              <button class="ui mini button" @click="setChromakeyPreset(255, 0, 255)" :disabled="decklink.running" title="Magenta">Magenta</button>
            </div>
          </div>

          <div class="ui divider inverted"></div>

          <!-- Format Selection -->
          <h3>Ausgabe-Format</h3>
          <div class="field">
            <label>Video-Format</label>
            <select v-model="config.displayMode" class="ui dropdown inverted" :disabled="decklink.running">
              <option v-for="mode in displayModes" :key="mode.id" :value="mode.id">
                {{ mode.name }} ({{ mode.width }}x{{ mode.height }} @ {{ mode.frameRate }}fps)
              </option>
            </select>
          </div>

          <div class="ui divider inverted"></div>

          <!-- Controls -->
          <div class="field">
            <button v-if="!decklink.running" class="ui labeled icon green button" @click="startOutput" :disabled="!canStart">
              <i class="play icon"></i>
              Ausgabe starten
            </button>
            <button v-else class="ui labeled icon red button" @click="stopOutput">
              <i class="stop icon"></i>
              Ausgabe stoppen
            </button>

            <button class="ui labeled icon button" @click="refreshDevices" :disabled="decklink.running">
              <i class="refresh icon"></i>
              Geräte aktualisieren
            </button>
          </div>
        </div>

        <!-- Statistics (when running) -->
        <div v-if="decklink.running && stats" class="ui inverted segment" style="margin-top: 20px;">
          <h4>Statistik</h4>
          <div class="ui statistics mini inverted">
            <div class="statistic">
              <div class="value">{{ stats.framesSynced || 0 }}</div>
              <div class="label">Frames ausgegeben</div>
            </div>
            <div class="statistic" v-if="config.mode === 'keyfill'">
              <div class="value">{{ (stats.framesDropped?.fill || 0) + (stats.framesDropped?.key || 0) }}</div>
              <div class="label">Frames verworfen</div>
            </div>
          </div>
        </div>

        <!-- Info -->
        <div class="ui info message" style="margin-top: 20px;">
          <div class="header">Hinweis</div>
          <ul class="list" v-if="config.mode === 'externalkey'">
            <li>External Keyer nutzt die Hardware-Keying-Funktion des Geräts.</li>
            <li>SDI Out 1 = Fill (RGB), SDI Out 2 = Key (Alpha als Graustufen).</li>
            <li>Ideal für UltraStudio HD Mini, DeckLink Duo und ähnliche Karten.</li>
            <li>Das Gerät muss "Keyer" unterstützen (siehe Geräteliste).</li>
          </ul>
          <ul class="list" v-else-if="config.mode === 'keyfill'">
            <li>Für Key/Fill-Ausgabe benötigst du zwei separate SDI/HDMI-Ausgänge.</li>
            <li>Fill enthält das RGB-Bild, Key enthält den Alpha-Kanal (schwarz/weiß).</li>
            <li>Die Ausgabe verwendet GPU-beschleunigtes Offscreen-Rendering mit 60fps.</li>
          </ul>
          <ul class="list" v-else>
            <li>Chromakey-Modus benötigt nur einen SDI/HDMI-Ausgang.</li>
            <li>Der Hintergrund wird mit der gewählten Farbe gefüllt.</li>
            <li>Im Mischer kannst du diese Farbe als Chromakey auswählen.</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue';

const isElectron = typeof window !== 'undefined' && window.process && window.process.versions?.electron;
const ipc = isElectron ? window.require('electron').ipcRenderer : null;

// DeckLink state
const decklink = reactive({
  available: false,
  running: false,
  devices: []
});

// Display modes
const displayModes = ref([]);

// Configuration
const config = reactive({
  mode: 'externalkey', // 'externalkey', 'keyfill', or 'chromakey'
  fillDeviceIndex: 0,
  keyDeviceIndex: 1,
  displayMode: null,
  chromakeyColor: { r: 0, g: 177, b: 64 } // Default: broadcast green
});

// Statistics
const stats = ref(null);

// Computed: Convert RGB to hex for color picker
const chromakeyHex = computed({
  get: () => {
    const { r, g, b } = config.chromakeyColor;
    return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
  },
  set: (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result) {
      config.chromakeyColor.r = parseInt(result[1], 16);
      config.chromakeyColor.g = parseInt(result[2], 16);
      config.chromakeyColor.b = parseInt(result[3], 16);
    }
  }
});

// Computed
const isSingleDeviceMode = computed(() => {
  return config.mode === 'chromakey' || config.mode === 'externalkey';
});

const canStart = computed(() => {
  if (isSingleDeviceMode.value) {
    // Chromakey or External Keyer: only need one device
    if (config.mode === 'externalkey') {
      // For external keyer, device must support keying
      const device = decklink.devices.find(d => d.index === config.fillDeviceIndex);
      return device?.supportsKeyer && config.displayMode !== null;
    }
    return decklink.devices.length >= 1 && config.displayMode !== null;
  } else {
    // Key/Fill: need two different devices
    return decklink.devices.length >= 2 &&
           config.fillDeviceIndex !== config.keyDeviceIndex &&
           config.displayMode !== null;
  }
});

const deviceLabel = computed(() => {
  if (config.mode === 'externalkey') return 'Gerät (Key/Fill)';
  if (config.mode === 'chromakey') return 'Ausgang';
  return 'Fill-Ausgang';
});

const runningModeText = computed(() => {
  if (config.mode === 'externalkey') return 'Key/Fill-Signal wird über External Keyer ausgegeben.';
  if (config.mode === 'chromakey') return 'Chromakey-Signal wird ausgegeben.';
  return 'Key/Fill-Signale werden ausgegeben.';
});

const availableDevices = computed(() => {
  if (config.mode === 'externalkey') {
    // Show all devices but indicate which support keying
    return decklink.devices;
  }
  return decklink.devices;
});

const statusText = computed(() => {
  if (!decklink.available) return 'Nicht verfügbar';
  if (decklink.running) return 'Ausgabe läuft';
  return 'Bereit';
});

const statusClass = computed(() => {
  if (!decklink.available) return 'warning';
  if (decklink.running) return 'positive';
  return 'info';
});

// Methods
const refreshDevices = () => {
  if (ipc) {
    ipc.send('decklink-enumerate-devices');
  }
};

const setChromakeyPreset = (r, g, b) => {
  config.chromakeyColor.r = r;
  config.chromakeyColor.g = g;
  config.chromakeyColor.b = b;
};

const startOutput = () => {
  if (ipc) {
    ipc.send('decklink-configure', {
      mode: config.mode,
      fillDeviceIndex: config.fillDeviceIndex,
      keyDeviceIndex: config.keyDeviceIndex,
      displayMode: config.displayMode,
      chromakeyColor: { ...config.chromakeyColor }
    });
    ipc.send('decklink-start');
  }
};

const stopOutput = () => {
  if (ipc) {
    ipc.send('decklink-stop');
  }
};

// Status update interval
let statusInterval = null;

onMounted(() => {
  if (ipc) {
    // Handle device list updates
    ipc.on('decklink-devices', (event, devices) => {
      decklink.devices = devices;
      // Set default device indices if we have devices
      if (devices.length >= 2) {
        config.fillDeviceIndex = 0;
        config.keyDeviceIndex = 1;
      }
    });

    // Handle display modes
    ipc.on('decklink-display-modes', (event, modes) => {
      displayModes.value = modes;
      // Set default mode (1080p50)
      if (modes.length > 0 && config.displayMode === null) {
        config.displayMode = modes[0].id;
      }
    });

    // Handle status updates
    ipc.on('decklink-status', (event, status) => {
      decklink.available = status.available;
      decklink.running = status.running;
      if (status.synchronizer) {
        stats.value = status.synchronizer;
      }
    });

    // Handle errors
    ipc.on('decklink-error', (event, error) => {
      console.error('[OutputTab] DeckLink error:', error);
    });

    // Request initial state
    ipc.send('decklink-get-status');
    ipc.send('decklink-enumerate-devices');
    ipc.send('decklink-get-display-modes');

    // Poll status while running
    statusInterval = setInterval(() => {
      if (decklink.running) {
        ipc.send('decklink-get-status');
      }
    }, 1000);
  }
});

onUnmounted(() => {
  if (statusInterval) {
    clearInterval(statusInterval);
  }
  if (ipc) {
    ipc.removeAllListeners('decklink-devices');
    ipc.removeAllListeners('decklink-display-modes');
    ipc.removeAllListeners('decklink-status');
    ipc.removeAllListeners('decklink-error');
  }
});
</script>

<style scoped>
select.inverted {
  background: #1b1c1d;
  color: #ffffff;
  border: 1px solid rgba(255,255,255,.1);
  padding: 10px;
  border-radius: 4px;
  width: 100%;
}

select.inverted:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.ui.statistics.mini .statistic > .value {
  font-size: 1.5rem !important;
}

.ui.statistics.mini .statistic > .label {
  font-size: 0.8rem !important;
}

/* Radio button styling */
.ui.radio.checkbox.inverted label {
  color: #fff !important;
}

.ui.radio.checkbox.inverted label:before {
  border-color: rgba(255,255,255,.3);
}

/* Color picker styling */
.color-picker-row {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-top: 8px;
}

.color-picker {
  width: 60px;
  height: 40px;
  padding: 0;
  border: 2px solid rgba(255,255,255,.2);
  border-radius: 4px;
  cursor: pointer;
  background: transparent;
}

.color-picker:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.color-inputs {
  display: flex;
  gap: 10px;
}

.color-input {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.color-input label {
  font-size: 11px;
  color: rgba(255,255,255,.6);
  margin-bottom: 4px;
}

.color-input input {
  width: 55px;
  padding: 6px 8px;
  background: #1b1c1d;
  border: 1px solid rgba(255,255,255,.1);
  border-radius: 4px;
  color: #fff;
  text-align: center;
  font-size: 13px;
}

.color-input input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.color-preview {
  width: 80px;
  height: 40px;
  border-radius: 4px;
  border: 2px solid rgba(255,255,255,.2);
}

.color-presets {
  margin-top: 10px;
  display: flex;
  gap: 8px;
}

.color-presets .ui.button {
  background: #2d2d2d;
  color: #fff;
}

.color-presets .ui.button:hover:not(:disabled) {
  background: #3d3d3d;
}

.color-presets .ui.button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
