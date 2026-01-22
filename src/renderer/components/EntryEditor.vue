<template>
  <div class="ui fluid container inverted" style="padding: 20px; background: #1b1c1d; min-height: 100vh;">
    <h2 class="ui header inverted">
      <i class="edit icon"></i>
      <div class="content">
        {{ entryId !== null ? 'Bauchbinde Nr. ' + (entryId + 1) : 'Neue Bauchbinde' }}
      </div>
    </h2>
    
    <form class="ui inverted form" @submit.prevent="save(true)">
      <div class="two fields">
        <div class="field">
          <label>Name</label>
          <div class="ui input inverted fluid">
            <input type="text" v-model="entry.name" placeholder="Name" autofocus>
          </div>
        </div>
        <div class="field">
          <label>Titel</label>
          <div class="ui input inverted fluid">
            <input type="text" v-model="entry.title" placeholder="Titel">
          </div>
        </div>
      </div>

      <div class="field" style="margin-top: 20px;">
        <div class="ui toggle checkbox inverted">
          <input type="checkbox" v-model="entry.useLocalStyle">
          <label>Individuelles Styling für diese Bauchbinde verwenden</label>
        </div>
      </div>

      <!-- LOCAL STYLE SETTINGS -->
      <div v-if="entry.useLocalStyle" class="ui segment inverted secondary" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);">
        <h4 class="ui dividing header inverted">Layout & Position</h4>
        <div class="ui grid doubling four column">
          <div class="column field">
            <label>X-Position (vw)</label>
            <input type="number" step="0.1" v-model="entry.localStyle.x">
          </div>
          <div class="column field">
            <label>Y-Position (vh)</label>
            <input type="number" step="0.1" v-model="entry.localStyle.y">
          </div>
          <div class="column field">
            <label>Min-Breite (vw)</label>
            <input type="number" step="0.1" v-model="entry.localStyle.minWidth">
          </div>
          <div class="column field">
            <label>Min-Höhe (vh)</label>
            <input type="number" step="0.1" v-model="entry.localStyle.minHeight">
          </div>
          <div class="column field">
            <label>Padding (vh)</label>
            <input type="number" step="0.1" v-model="entry.localStyle.padding">
          </div>
        </div>

        <div class="two fields" style="margin-top: 15px;">
          <div class="field">
            <label>Horizontale Position</label>
            <select class="ui inverted dropdown fluid" v-model="entry.localStyle.position">
              <option value="left">Links</option>
              <option value="center">Mitte</option>
              <option value="right">Rechts</option>
            </select>
          </div>
          <div class="field">
            <label>Text Ausrichtung</label>
            <select class="ui inverted dropdown fluid" v-model="entry.localStyle.textalign">
              <option value="left">Links</option>
              <option value="center">Mitte</option>
              <option value="right">Rechts</option>
            </select>
          </div>
        </div>

        <div class="two fields" style="margin-top: 15px;">
          <div class="field">
            <label>Inhalt Ausrichtung (Horizontal)</label>
            <select class="ui inverted dropdown fluid" v-model="entry.localStyle.justifyContent">
              <option value="flex-start">Links</option>
              <option value="center">Mitte</option>
              <option value="flex-end">Rechts</option>
            </select>
          </div>
          <div class="field">
            <label>Inhalt Ausrichtung (Vertikal)</label>
            <select class="ui inverted dropdown fluid" v-model="entry.localStyle.alignItems">
              <option value="flex-start">Oben</option>
              <option value="center">Mitte</option>
              <option value="flex-end">Unten</option>
            </select>
          </div>
        </div>

        <h4 class="ui dividing header inverted" style="margin-top: 25px;">Design & Farben</h4>
        <div class="field">
          <color-picker v-model="entry.localStyle.bgColor" label="Hintergrundfarbe"></color-picker>
        </div>

        <div class="ui two column grid stackable" style="margin-top: 10px;">
          <div class="column">
            <h5 class="ui header inverted">Name (H1)</h5>
            <div class="field">
              <label>Schriftart</label>
              <fomantic-dropdown v-model="entry.localStyle.h1.fontfamily" :options="allFonts" :system-fonts="systemFonts"></fomantic-dropdown>
            </div>
            <div class="two fields">
              <div class="field">
                <label>Größe (vh)</label>
                <input type="number" step="0.1" v-model="entry.localStyle.h1.fontsize">
              </div>
              <div class="field">
                <color-picker v-model="entry.localStyle.h1.color" label="Farbe"></color-picker>
              </div>
            </div>
          </div>
          <div class="column">
            <h5 class="ui header inverted">Titel (H2)</h5>
            <div class="field">
              <label>Schriftart</label>
              <fomantic-dropdown v-model="entry.localStyle.h2.fontfamily" :options="allFonts" :system-fonts="systemFonts"></fomantic-dropdown>
            </div>
            <div class="two fields">
              <div class="field">
                <label>Größe (vh)</label>
                <input type="number" step="0.1" v-model="entry.localStyle.h2.fontsize">
              </div>
              <div class="field">
                <color-picker v-model="entry.localStyle.h2.color" label="Farbe"></color-picker>
              </div>
            </div>
          </div>
        </div>
        <p class="ui message info inverted mini"><i class="info circle icon"></i> Im individuellen Modus werden keine Bilder angezeigt.</p>
      </div>

      <!-- GLOBAL STYLE SETTINGS (only images for now) -->
      <div v-if="!entry.useLocalStyle" style="margin-top: 20px;">
        <div class="field">
          <label>Bild (Optional)</label>
          <div v-if="!entry.image" class="ui placeholder segment inverted" style="min-height: 150px; cursor: pointer;" @dragover.prevent @drop.prevent="handleImageDrop" @click="$refs.imgInput.click()">
            <div class="ui icon header">
              <i class="image outline icon"></i>
              Bild hierher ziehen oder klicken
            </div>
            <input type="file" ref="imgInput" style="display: none" accept="image/*" @change="handleImageDrop({ dataTransfer: { files: $event.target.files } })">
          </div>
          <div v-else class="ui segment inverted checkerboard" style="text-align: center; position: relative; padding: 0; min-height: 150px; height: 150px; display: flex; align-items: center; justify-content: center; overflow: hidden;">
            <img :src="entry.image" style="height: 150px; width: 100%; object-fit: contain; display: block; margin: 0 auto;">
            <div class="ui top right attached label red" style="cursor: pointer; z-index: 10;" @click="entry.image = null"><i class="trash icon"></i></div>
          </div>
        </div>

        <div class="field">
          <div class="ui toggle checkbox inverted">
            <input type="checkbox" v-model="entry.showGlobalLogo">
            <label>Globales Logo anzeigen</label>
          </div>
        </div>
      </div>

      <div style="margin-top: 30px; display: flex; flex-wrap: wrap; gap: 10px;">
        <template v-if="entryId === null">
          <button class="ui green labeled icon button" type="button" @click="save(false)">
            Speichern & Neu
            <i class="plus icon"></i>
          </button>
          <button class="ui positive right labeled icon button" type="submit">
            Speichern & Schließen
            <i class="checkmark icon"></i>
          </button>
        </template>
        <template v-else>
          <button class="ui positive right labeled icon button" type="submit">
            Speichern
            <i class="checkmark icon"></i>
          </button>
        </template>
        
        <button class="ui black button" type="button" @click="cancel">
          Abbrechen
        </button>
        <div style="flex-grow: 1;"></div>
        <button v-if="entryId !== null" class="ui red icon button" type="button" @click="remove" title="Löschen">
          <i class="trash icon"></i>
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import ColorPicker from './ColorPicker.vue';
import FomanticDropdown from './FomanticDropdown.vue';
import { systemFonts } from '../store.js';

const ipc = (typeof window !== 'undefined' && window.require) ? window.require('electron').ipcRenderer : null;

const WEB_FONTS = [
    'Arial, sans-serif', 'Helvetica, sans-serif', 'Verdana, sans-serif', 'Trebuchet MS, sans-serif',
    'Times New Roman, serif', 'Georgia, serif', 'Garamond, serif', 'Courier New, monospace'
];

const allFonts = computed(() => {
    return [...new Set([...WEB_FONTS, ...systemFonts.value])];
});

const createDefaultLocalStyle = (globalDesign = null) => ({
    x: 0, y: 25, minWidth: 60, minHeight: 0, padding: 2,
    yInverted: true, // Marker for new coordinate system
    position: 'center', // horizontal positioning of the box itself
    textalign: 'center', // text alignment inside the box
    justifyContent: 'center', alignItems: 'center', // flex container alignment
    bgColor: 'rgba(0,0,0,0.7)',
    h1: { 
        fontfamily: globalDesign?.h1?.fontfamily || 'Helvetica, sans-serif', 
        fontsize: globalDesign?.h1?.fontsize || 5, 
        color: '#ffffff' 
    },
    h2: { 
        fontfamily: globalDesign?.h2?.fontfamily || 'Helvetica, sans-serif', 
        fontsize: globalDesign?.h2?.fontsize || 3.7, 
        color: '#ffffff' 
    }
});

const entry = ref({ 
    name: '', title: '', image: null, showGlobalLogo: true, 
    useLocalStyle: false, localStyle: createDefaultLocalStyle() 
});
const entryId = ref(null);
const currentGlobalDesign = ref(null);

onMounted(() => {
    ipc.on('setup-editor', (event, arg) => {
        currentGlobalDesign.value = arg.globalDesign;
        if (arg.entry) {
            entry.value = JSON.parse(JSON.stringify(arg.entry));
            // Migration
            if (entry.value.hideGlobalLogo !== undefined) {
                entry.value.showGlobalLogo = !entry.value.hideGlobalLogo;
                delete entry.value.hideGlobalLogo;
            }
            if (entry.value.showGlobalLogo === undefined) entry.value.showGlobalLogo = true;
            
            if (!entry.value.localStyle) {
                entry.value.localStyle = createDefaultLocalStyle(arg.globalDesign);
            } else if (!entry.value.localStyle.yInverted) {
                // Convert old Top-Down Y to Bottom-Up
                console.log("[Editor] Converting legacy Y coordinate...");
                entry.value.localStyle.y = 100 - (entry.value.localStyle.y || 0);
                entry.value.localStyle.yInverted = true;
            }
        } else {
            // New Entry
            entry.value.localStyle = createDefaultLocalStyle(arg.globalDesign);
        }
        entryId.value = arg.id;
    });
    ipc.send('editor-ready');
});

const save = (close = true) => {
    ipc.send('save-entry', { 
        id: entryId.value, 
        entry: JSON.parse(JSON.stringify(entry.value)),
        close: close
    });
    
    if (!close) {
        if (entryId.value === null) {
            entry.value = { 
                name: '', title: '', image: null, showGlobalLogo: true, 
                useLocalStyle: false, localStyle: createDefaultLocalStyle(currentGlobalDesign.value) 
            };
        }
    }
};

const cancel = () => { window.close(); };

const remove = () => {
    if (confirm('Diese Bauchbinde wirklich löschen?')) {
        ipc.send('delete-entry', entryId.value);
    }
};

const handleImageDrop = (e) => {
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
        const file = files[0];
        const reader = new FileReader();
        reader.onload = (event) => { entry.value.image = event.target.result; };
        reader.readAsDataURL(file);
    }
};
</script>