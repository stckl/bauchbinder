<template>
  <div id="app" class="ui fluid container inverted">
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

    <!-- Migration Alert -->
    <div v-if="pendingMigrationUrls.length > 0" class="ui message yellow" style="margin-top: 10px;">
      <div class="header">Externe Ressourcen gefunden</div>
      <p>Dieses Projekt enthält Links zu {{ pendingMigrationUrls.length }} externen Schriftarten. Möchtest du diese herunterladen und direkt im Projekt speichern?</p>
      <button class="ui button yellow" :class="{ loading: isMigrating }" @click="migrateExternalFonts">
        <i class="download icon"></i> Herunterladen und Einbetten
      </button>
      <button class="ui button basic" @click="pendingMigrationUrls = []">Ignorieren</button>
    </div>

    <div class="ui tab segment" :class="{ active: activeTab === 'items' }">
      <ItemsTab />
    </div>

    <div class="ui tab segment" :class="{ active: activeTab === 'design' }">
      <DesignTab />
    </div>

    <div class="ui tab segment" :class="{ active: activeTab === 'animation' }">
      <AnimationTab />
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
import { ref, onMounted } from 'vue';
import { ipcRenderer as ipc } from 'electron';
import ItemsTab from './components/ItemsTab.vue';
import DesignTab from './components/DesignTab.vue';
import AnimationTab from './components/AnimationTab.vue';
import InfoTab from './components/InfoTab.vue';
import { state, activeIndex, systemFonts } from './store.js'; // Import store
const { dialog } = require('@electron/remote');
const fs = require('fs');
const fontList = require('font-list');

const activeTab = ref('items');
const appversion = ref('4.1.0');
const pendingMigrationUrls = ref([]);
const isMigrating = ref(false);

const migrateExternalFonts = async () => {
    isMigrating.value = true;
    let css = state.design.unifiedCss;
    
    for (const item of pendingMigrationUrls.value) {
        const result = await ipc.invoke('download-to-base64', item.url);
        if (result) {
            // 1. In-place CSS replacement
            const escapedUrl = item.url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const urlRegex = new RegExp(escapedUrl, 'g');
            css = css.replace(urlRegex, `data:${result.type};base64,${result.data}`);
            
            // 2. Register in customFonts list for Dropdown/UI
            const name = item.name || `Migrated Font ${state.design.customFonts.length + 1}`;
            if (!state.design.customFonts.some(f => f.name === name)) {
                // Determine extension from URL or Content-Type
                let ext = 'woff2';
                if (result.type.includes('ttf')) ext = 'ttf';
                else if (result.type.includes('otf')) ext = 'otf';
                else if (item.url.includes('.ttf')) ext = 'ttf';
                
                state.design.customFonts.push({
                    name: name,
                    data: result.data,
                    type: ext
                });
            }
        }
    }
    
    state.design.unifiedCss = css;
    pendingMigrationUrls.value = [];
    isMigrating.value = false;
    ipc.send('update-css', JSON.parse(JSON.stringify(state.design)));
    alert("Migration abgeschlossen! Schriften wurden eingebettet und zur Liste hinzugefügt.");
};

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
                
                // --- FULL RESET ---
                state.lowerthirds = [];
                state.design.unifiedCss = '';
                state.design.logo = null;
                state.design.customFonts = [];
                // Reset to specific defaults
                state.design.white = { 
                    width: 10, left: 5, bottom: 7, height: 1, fixedWidth: false, fixedHeight: false,
                    color: 'rgba(255,255,255,0.8)', paddingh: 5, paddingv: 2.6, borderradius: 0, 
                    divalign: 0, textalign: 0, overflow: 'hidden', textOverflow: 'visible',
                    flexAlign: 'center', flexJustify: 'center', flexGap: 2, imageHeight: true, imageManualHeight: 10
                };
                state.design.h1 = { fontfamily: 'Helvetica, sans-serif', fontweight: 'normal', texttransform: 'none', fontvariant: 'normal', fontsize: 5, italic: false, color: '#000000' };
                state.design.h2 = { fontfamily: 'Helvetica, sans-serif', fontweight: 'normal', texttransform: 'none', fontvariant: 'normal', fontsize: 3.7, italic: false, color: '#000000' };
                state.animation = { type: 'structured', duration: 750, easing: 'easeInOutCirc', code: '', show: [{ selector: '.bb-box', properties: { opacity: [0, 1] }, duration: 750, delay: 0, easing: 'easeInOutCirc' }], hide: [{ selector: '.bb-box', properties: { opacity: [1, 0] }, duration: 500, delay: 0, easing: 'easeInOutCirc' }] };
                
                if (ld.lowerthirds) state.lowerthirds = ld.lowerthirds;
                
                if (ld.design) {
                    // Migration for older files: Convert customcss/css to unifiedCss
                    if (!ld.design.unifiedCss) {
                        let legacyCss = ld.design.customcss || ld.design.css || '';
                        if (legacyCss) {
                            // Globally replace .white with .bb-box for old custom styles
                            legacyCss = legacyCss.replace(/\.white/g, '.bb-box');
                            ld.design.unifiedCss = "/* GUI */\n/* CUSTOM */\n" + legacyCss;
                        }
                    }
                    Object.assign(state.design, ld.design);
                    
                    // Scan for external font URLs for migration
                    const urlRegex = /url\(['"]?(https?:\/\/[^'")]*)['"]?\)/g;
                    const urls = [];
                    let match;
                    while ((match = urlRegex.exec(state.design.unifiedCss)) !== null) {
                        // Try to find the font name in the surrounding block
                        const block = state.design.unifiedCss.substring(Math.max(0, match.index - 200), match.index);
                        const nameMatch = block.match(/font-family:\s*['"]?([^'"]*)['"]?/i);
                        urls.push({ url: match[1], name: nameMatch ? nameMatch[1] : null });
                    }
                    if (urls.length > 0) pendingMigrationUrls.value = urls;
                }
                
                if (ld.animation) {
                    // Handle legacy simple animation strings
                    if (typeof ld.animation === 'string') {
                        state.animation.type = ld.animation;
                    } else {
                        Object.assign(state.animation, ld.animation);
                    }
                }
                
                // Trigger sync to main process
                ipc.send('update-data', JSON.parse(JSON.stringify(state.lowerthirds)));
                ipc.send('update-css', JSON.parse(JSON.stringify(state.design)));
                ipc.send('update-js', JSON.parse(JSON.stringify(state.animation)));
            });
        }
    });
};

onMounted(() => {
    // Listen for status updates from server
    ipc.on('status-update', (event, arg) => {
        if (arg && arg.activeId !== undefined) {
            activeIndex.value = arg.activeId !== null ? (arg.activeId - 1) : -1;
        }
    });

    // Listen for state updates to keep the store in sync
    ipc.on('update-css', (event, arg) => {
        if (arg) {
            // Merge carefully
            Object.assign(state.design, arg);
        }
    });
    ipc.on('update-js', (event, arg) => {
        if (arg) {
            if (arg.type) state.animation.type = arg.type;
            if (arg.duration) state.animation.duration = arg.duration;
            if (arg.easing) state.animation.easing = arg.easing;
            if (arg.show) state.animation.show = arg.show;
            if (arg.hide) state.animation.hide = arg.hide;
            if (arg.code !== undefined) state.animation.code = arg.code;
        }
    });
    ipc.on('update-data', (event, arg) => {
        if (arg) state.lowerthirds = arg;
    });
    
    // Request initial state
    ipc.send('request-state');
    
    fontList.getFonts().then(ret => { systemFonts.value = ret; }).catch(err => console.log(err));
});
</script>
