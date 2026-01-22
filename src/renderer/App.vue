<template>
  <!-- Editor Modus -->
  <div v-if="windowMode === 'entry'">
    <EntryEditor />
  </div>
  <div v-else-if="windowMode === 'step'">
    <StepEditor />
  </div>
  
  <!-- Hauptfenster Modus -->
  <div v-else id="app" class="ui fluid container inverted">
    <div class="row">
      <div class="col">
        <button class="ui right floated labeled icon red button" @click="stopLowerthird()">
          <i class="eye slash icon"></i>
          ausblenden
        </button>
        <h2>bauchbinder</h2>
      </div>
    </div>

    <div class="ui divider" style="clear:both; padding-top: 20px;"></div>
    
    <div class="ui pointing secondary menu inverted">
      <a class="item" :class="{ active: activeTab === 'items' }" @click="activeTab = 'items'">Bauchbinden</a>
      <a class="item" :class="{ active: activeTab === 'design' }" @click="activeTab = 'design'">Gestaltung</a>
      <a class="item" :class="{ active: activeTab === 'animation' }" @click="activeTab = 'animation'">Animation</a>
      <a class="item" :class="{ active: activeTab === 'info' }" @click="activeTab = 'info'">Info</a>
    </div>

    <div class="ui tab segment" :class="{ active: activeTab === 'items' }">
      <ItemsTab :is-active="activeTab === 'items'" />
    </div>

    <div class="ui tab segment" :class="{ active: activeTab === 'design' }">
      <DesignTab :is-active="activeTab === 'design'" />
    </div>

    <div class="ui tab segment" :class="{ active: activeTab === 'animation' }">
      <AnimationTab :is-active="activeTab === 'animation'" />
    </div>

    <div class="ui tab segment" :class="{ active: activeTab === 'info' }">
      <InfoTab />
    </div>

    <div class="row" style="margin-top: 50px;">
      <div class="col" style="clear: both; margin-top:20px;">
        <div class="ui divider"></div>

        <button class="ui right floated labeled icon inverted button" @click="openFile">
          <i class="folder open icon"></i>
          öffnen
        </button>
        <button class="ui right floated labeled icon inverted button" @click="saveFile">
          <i class="save icon"></i>
          speichern
        </button>
    
        <div class="ui floated buttons">
          <button class="ui labeled icon teal button" @click="openWinKey">
            <i class="window maximize outline icon"></i>
            key
          </button>
          <button class="ui icon teal button" title="Fullscreen Key" @click="toggleFullscreenKey">
            <i class="expand arrows alternate icon"></i>
          </button>
        </div>
        <div class="ui floated buttons" style="margin-left: 10px;">
          <button class="ui labeled icon teal button" @click="openWinFill">
            <i class="window maximize outline icon"></i>
            fill
          </button>
          <button class="ui icon teal button" title="Fullscreen Fill" @click="toggleFullscreenFill">
            <i class="expand arrows alternate icon"></i>
          </button>
        </div>
        <div style="clear:both; height: 30px;"></div>
      </div>
    </div>

    <div class="copy">2026 - with ❤️ from mstockle.de version: {{ appversion }}</div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue';
import ItemsTab from './components/ItemsTab.vue';
import DesignTab from './components/DesignTab.vue';
import AnimationTab from './components/AnimationTab.vue';
import InfoTab from './components/InfoTab.vue';
import EntryEditor from './components/EntryEditor.vue';
import StepEditor from './components/StepEditor.vue';
import { state, activeIndex, systemFonts } from './store.js'; 

// Browser-safe Electron access
const isElectron = typeof window !== 'undefined' && window.process && window.process.versions?.electron;
const ipc = isElectron ? window.require('electron').ipcRenderer : null;
const remote = isElectron ? window.require('@electron/remote') : null;
const dialog = remote ? remote.dialog : null;
const fs = isElectron ? window.require('fs') : null;
const fontList = isElectron ? window.require('font-list') : { getFonts: () => Promise.resolve([]) };

const activeTab = ref('items');
const appversion = ref('4.1.16');
const windowMode = ref(null);

const stopLowerthird = () => { 
    ipc.send('hide-lowerthird'); 
    activeIndex.value = -1; 
};

const openWinKey = () => ipc.send('openwinkey');
const openWinFill = () => ipc.send('openwinfill');
const toggleFullscreenKey = () => ipc.send('toggle-fullscreen-key');
const toggleFullscreenFill = () => ipc.send('toggle-fullscreen-fill');

const saveFile = () => {
    const fd = { lowerthirds: state.lowerthirds, design: state.design, animation: state.animation };
    const el = document.createElement("a");
    el.href = URL.createObjectURL(new Blob([JSON.stringify(fd)], { type: "text/json" }));
    el.download = "bauchbinder_project.json"; el.click();
};

const openFile = () => {
    dialog.showOpenDialog({ properties: ['openFile'] }).then(res => {
        if (!res.canceled && res.filePaths.length > 0) {
            fs.readFile(res.filePaths[0], 'utf8', (err, data) => {
                const ld = JSON.parse(data);
                if (ld.design && ld.design.unifiedCss) {
                    // Migrate old display values
                    ld.design.unifiedCss = ld.design.unifiedCss
                        .replace(/display:\s*inline-block/g, 'display: inline-flex')
                        .replace(/display:\s*block/g, 'display: flex');
                }
                if (ld.lowerthirds) state.lowerthirds = ld.lowerthirds;
                if (ld.design) {
                    if (!ld.design.container) {
                        // Legacy Migration:
                        // Old system had .bauchbinde at full width (left:0, right:0)
                        // and used white.bottom for the vertical position.
                        // white.divalign (0=left, 1=center, 2=right) is preserved and used via justify-content.
                        ld.design.container = {
                            left: { enabled: false, value: 0 },
                            right: { enabled: false, value: 0 },
                            top: { enabled: false, value: 0 },
                            bottom: { enabled: true, value: ld.design.white?.bottom || 7 },
                            width: { enabled: false, value: 100 },
                            height: { enabled: false, value: 100 }
                        };
                    }
                    Object.assign(state.design, ld.design);
                }
                if (ld.animation) Object.assign(state.animation, ld.animation);
                
                ipc.send('update-data', JSON.parse(JSON.stringify(state.lowerthirds)));
                ipc.send('update-css', JSON.parse(JSON.stringify(state.design)));
                ipc.send('update-js', JSON.parse(JSON.stringify(state.animation)));
            });
        }
    });
};

onMounted(() => {
    // Detect mode from URL
    const params = new URLSearchParams(window.location.search);
    windowMode.value = params.get('window');

    if (!windowMode.value) {
        ipc.on('status-update', (event, arg) => {
            if (arg && arg.activeId !== undefined) {
                activeIndex.value = arg.activeId !== null ? (arg.activeId - 1) : -1;
            }
        });
        ipc.on('update-data', (event, arg) => {
            state.lowerthirds = arg;
        });
        ipc.on('update-css', (event, arg) => {
            state.isInternalUpdate = true;
            Object.assign(state.design, arg);
            nextTick(() => { state.isInternalUpdate = false; });
        });
        ipc.on('update-js', (event, arg) => {
            Object.assign(state.animation, arg);
        });
        ipc.send('request-state');
        fontList.getFonts().then(ret => { systemFonts.value = ret; }).catch(err => console.log(err));
    }
});
</script>