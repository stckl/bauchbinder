<template>
  <div class="row" style="margin-top: 20px;">
    <div class="col">
      <h2>style</h2>
      <form class="ui form inverted" v-on:submit.prevent>
        <h4 class="ui dividing header inverted">Positionierung (Container)</h4>
        <div class="ui doubling six column grid">
          <div v-for="prop in ['left', 'right', 'width']" :key="prop" class="column field">
            <label>{{ prop.charAt(0).toUpperCase() + prop.slice(1) }} (vw)</label>
            <div class="ui right labeled input left icon fluid inverted">
              <i class="arrows alternate horizontal icon"></i>
              <input type="number" step="0.1" v-model="state.design.container[prop].value" :disabled="!state.design.container[prop].enabled">
              <div class="ui basic label" style="background: #333; border-color: #555; color: #fff; padding: 0 8px; display: flex; align-items: center;">
                <div class="ui checkbox inverted" style="margin: 0;">
                  <input type="checkbox" v-model="state.design.container[prop].enabled">
                  <label></label>
                </div>
              </div>
            </div>
          </div>
          <div v-for="prop in ['top', 'bottom', 'height']" :key="prop" class="column field">
            <label>{{ prop.charAt(0).toUpperCase() + prop.slice(1) }} (vh)</label>
            <div class="ui right labeled input left icon fluid inverted">
              <i class="arrows alternate vertical icon"></i>
              <input type="number" step="0.1" v-model="state.design.container[prop].value" :disabled="!state.design.container[prop].enabled">
              <div class="ui basic label" style="background: #333; border-color: #555; color: #fff; padding: 0 8px; display: flex; align-items: center;">
                <div class="ui checkbox inverted" style="margin: 0;">
                  <input type="checkbox" v-model="state.design.container[prop].enabled">
                  <label></label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <h4 class="ui dividing header inverted">Bauchbinde</h4>
        <div class="ui doubling four column grid">
          <div class="column field">
            <label>Breite (in %)</label>
            <div class="ui right labeled input left icon fluid inverted">
              <i class="arrows alternate horizontal icon"></i>
              <input type="number" step="0.1" min="0" max="100" v-model="state.design.white.width" placeholder="Breite">
              <div class="ui basic label" style="background: #333; border-color: #555; color: #fff; padding: 0 8px; display: flex; align-items: center;">
                <div class="ui checkbox inverted" style="margin: 0;">
                  <input type="checkbox" v-model="state.design.white.fixedWidth">
                  <label style="color: #fff !important; padding-left: 1.5rem;">Fest</label>
                </div>
              </div>
            </div>
          </div>
          <div class="column field">
            <label>Höhe (in vh)</label>
            <div class="ui right labeled input left icon fluid inverted">
              <i class="arrows alternate vertical icon"></i>
              <input type="number" step="0.1" min="0" max="100" v-model="state.design.white.height" placeholder="Höhe">
              <div class="ui basic label" style="background: #333; border-color: #555; color: #fff; padding: 0 8px; display: flex; align-items: center;">
                <div class="ui checkbox inverted" style="margin: 0;">
                  <input type="checkbox" v-model="state.design.white.fixedHeight">
                  <label style="color: #fff !important; padding-left: 1.5rem;">Fest</label>
                </div>
              </div>
            </div>
          </div>
          <div class="column field">
            <label>Abstand links/rechts (in %)</label>
            <div class="ui left icon input fluid inverted">
              <input type="number" step="0.01" min="-100" max="100" v-model="state.design.white.left" placeholder="Abstand seite">
              <i class="arrow right icon"></i>
            </div>
          </div>
          <div class="column field">
            <color-picker v-model="state.design.white.color" label="Hintergrundfarbe"></color-picker>
          </div>
          <div class="column field">
            <label>Position</label>
            <div class="ui icon inverted buttons fluid">
              <button class="ui button" :class="{ blue: (state.design.white.divalign == 0) }"  v-on:click.prevent="state.design.white.divalign = 0"><i class="align left icon"></i></button>
              <button class="ui button" :class="{ blue: (state.design.white.divalign == 1) }"  v-on:click.prevent="state.design.white.divalign = 1"><i class="align center icon"></i></button>
              <button class="ui button" :class="{ blue: (state.design.white.divalign == 2) }"  v-on:click.prevent="state.design.white.divalign = 2"><i class="align right icon"></i></button>
            </div>
          </div>
          <div class="column field">
            <label>Text Ausrichtung</label>
            <div class="ui icon inverted buttons fluid">
              <button class="ui button" :class="{ blue: (state.design.white.textalign == 0) }"  v-on:click.prevent="state.design.white.textalign = 0"><i class="align left icon"></i></button>
              <button class="ui button" :class="{ blue: (state.design.white.textalign == 1) }"  v-on:click.prevent="state.design.white.textalign = 1"><i class="align center icon"></i></button>
              <button class="ui button" :class="{ blue: (state.design.white.textalign == 2) }"  v-on:click.prevent="state.design.white.textalign = 2"><i class="align right icon"></i></button>
            </div>
          </div>
          <div class="column field">
            <label>Text Abstand horizontal</label>
            <div class="ui left icon input fluid inverted">
              <input type="number" step="0.01" min="0" max="100" v-model="state.design.white.paddingh" placeholder="Abstand seite">
              <i class="arrow right icon"></i>
            </div>
          </div>
          <div class="column field">
            <label>Text Abstand vertikal</label>
            <div class="ui left icon input fluid inverted">
              <input type="number" step="0.01" min="0" max="100" v-model="state.design.white.paddingv" placeholder="Abstand unten">
              <i class="arrow up icon"></i>
            </div>
          </div>
          <div class="column field">
            <label>Ecken Rundung</label>
            <div class="ui left icon input fluid inverted">
              <input type="number" step="1" min="0" max="1000" v-model="state.design.white.borderradius" placeholder="Ecken Rundung">
              <i class="circle outline icon"></i>
            </div>
          </div>
          <div class="column field">
            <label>Box Überlauf</label>
            <div class="ui toggle checkbox inverted">
              <input type="checkbox" v-model="state.design.white.overflow" true-value="visible" false-value="hidden">
              <label>Sichtbar</label>
            </div>
          </div>
          <div class="column field">
            <label>Text Überlauf</label>
            <div class="ui toggle checkbox inverted">
              <input type="checkbox" v-model="state.design.white.textOverflow" true-value="visible" false-value="hidden">
              <label>Sichtbar</label>
            </div>
          </div>
        </div>

        <h4 class="ui dividing header inverted">Layout Inhalt (Flexbox)</h4>
        <div class="ui doubling four column grid">
          <div class="column field">
            <label>Vertikale Ausrichtung (Box)</label>
            <div class="ui icon inverted buttons fluid">
              <button class="ui button" :class="{ blue: (state.design.white.flexAlign == 'flex-start') }"  v-on:click.prevent="state.design.white.flexAlign = 'flex-start'" title="Oben"><i class="align left icon" style="transform: rotate(90deg)"></i></button>
              <button class="ui button" :class="{ blue: (state.design.white.flexAlign == 'center') }"  v-on:click.prevent="state.design.white.flexAlign = 'center'" title="Mitte"><i class="align center icon" style="transform: rotate(90deg)"></i></button>
              <button class="ui button" :class="{ blue: (state.design.white.flexAlign == 'flex-end') }"  v-on:click.prevent="state.design.white.flexAlign = 'flex-end'" title="Unten"><i class="align right icon" style="transform: rotate(90deg)"></i></button>
              <button class="ui button" :class="{ blue: (state.design.white.flexAlign == 'stretch') }"  v-on:click.prevent="state.design.white.flexAlign = 'stretch'" title="Strecken"><i class="arrows alternate vertical icon"></i></button>
            </div>
          </div>
          <div class="column field">
            <label>Horizontale Ausrichtung</label>
            <div class="ui icon inverted buttons fluid">
              <button class="ui button" :class="{ blue: (state.design.white.flexJustify == 'flex-start') }"  v-on:click.prevent="state.design.white.flexJustify = 'flex-start'" title="Links"><i class="align left icon"></i></button>
              <button class="ui button" :class="{ blue: (state.design.white.flexJustify == 'center') }"  v-on:click.prevent="state.design.white.flexJustify = 'center'" title="Mitte"><i class="align center icon"></i></button>
              <button class="ui button" :class="{ blue: (state.design.white.flexJustify == 'flex-end') }"  v-on:click.prevent="state.design.white.flexJustify = 'flex-end'" title="Rechts"><i class="align right icon"></i></button>
              <button class="ui button" :class="{ blue: (state.design.white.flexJustify == 'space-between') }"  v-on:click.prevent="state.design.white.flexJustify = 'space-between'" title="Verteilen"><i class="arrows alternate horizontal icon"></i></button>
            </div>
          </div>
          <div class="column field">
            <label>Abstand (Gap in vh)</label>
            <div class="ui left icon input fluid inverted">
              <input type="number" step="0.1" min="0" max="50" v-model="state.design.white.flexGap">
              <i class="arrows alternate horizontal icon"></i>
            </div>
          </div>
        </div>
        <div class="field">
          <label>Reihenfolge & Ausrichtung (Klick auf Icon ändert Ausrichtung)</label>
          <draggable v-model="state.design.layoutOrder" item-key="id" class="ui inverted horizontal list" style="background: #333; padding: 10px; border-radius: 4px; display: flex; gap: 10px; justify-content: flex-start; overflow-x: auto;">
            <template #item="{element}">
              <div class="item" style="cursor: move; padding: 5px 10px; background: #444; border-radius: 4px; border: 1px solid #555; text-align: center; min-width: 110px; display: flex; align-items: center; gap: 8px;">
                <i class="bars icon" style="transform: rotate(90deg); color: #888;"></i>
                <i v-if="element.id == '.logo' || element.id == '.image'" class="image outline icon" style="color: #aaa;"></i>
                <i v-else class="font icon" style="color: #aaa;"></i>
                <div class="content" style="font-size: 0.9em; flex-grow: 1; text-align: left;">{{element.name.replace('Bild ', '').replace('(', '').replace(')', '')}}</div>
                <i class="icon link" :class="getAlignIconClass(element)" :style="getAlignIconStyle(element)" @click="cycleAlign(element)" title="Vertikale Ausrichtung ändern"></i>
              </div>
            </template>
          </draggable>
        </div>

        <h4 class="ui dividing header inverted">Typografie</h4>
        <h5 class="ui header inverted">Name (H1)</h5>
        <div class="field">
          <label>Schriftart</label>
          <fomantic-dropdown v-model="state.design.h1.fontfamily" :options="allFonts" :custom-fonts="state.design.customFonts" :manual-fonts="manualFonts" :system-fonts="systemFonts"></fomantic-dropdown>
        </div>
        <div style="display: flex; flex-wrap: wrap; gap: 10px; align-items: flex-end;">
          <div class="ui labeled input inverted mini">
            <div class="ui label">Größe</div>
            <input type="number" step="0.1" v-model="state.design.h1.fontsize" style="width: 70px;">
          </div>
          <div class="ui labeled input inverted mini">
            <div class="ui label">Dicke</div>
            <input type="text" v-model="state.design.h1.fontweight" placeholder="800" style="width: 60px;">
          </div>
          <div style="width: 140px;">
             <color-picker v-model="state.design.h1.color"></color-picker>
          </div>
          <div class="ui icon inverted buttons mini">
              <button class="ui button" :class="{ blue: isBold(state.design.h1.fontweight) }"  v-on:click.prevent="toggleH1Bold()" title="Fett"><i class="bold icon"></i></button>
              <button class="ui button" :class="{ blue: state.design.h1.italic }"  v-on:click.prevent="toggleH1Italic()" title="Kursiv"><i class="italic icon"></i></button>
              <button class="ui button" :class="{ blue: state.design.h1.fontvariant === 'small-caps' }" v-on:click.prevent="toggleH1Variant()" title="Kapitälchen"><span style="font-variant: small-caps; font-weight: bold;">Aa</span></button>
          </div>
          <div class="ui small basic inverted icon buttons mini">
              <button class="ui button" :class="{ blue: state.design.h1.texttransform === 'none' }" v-on:click.prevent="state.design.h1.texttransform = 'none'" title="Normal">Aa</button>
              <button class="ui button" :class="{ blue: state.design.h1.texttransform === 'uppercase' }" v-on:click.prevent="state.design.h1.texttransform = 'uppercase'" title="GROSS">AA</button>
              <button class="ui button" :class="{ blue: state.design.h1.texttransform === 'lowercase' }" v-on:click.prevent="state.design.h1.texttransform = 'lowercase'" title="klein">aa</button>
              <button class="ui button" :class="{ blue: state.design.h1.texttransform === 'capitalize' }" v-on:click.prevent="state.design.h1.texttransform = 'capitalize'" title="Erster Groß">Ab</button>
          </div>
        </div>

        <h5 class="ui header inverted" style="margin-top: 20px;">Titel (H2)</h5>
        <div class="field">
          <label>Schriftart</label>
          <fomantic-dropdown v-model="state.design.h2.fontfamily" :options="allFonts" :custom-fonts="state.design.customFonts" :manual-fonts="manualFonts" :system-fonts="systemFonts"></fomantic-dropdown>
        </div>
        <div style="display: flex; flex-wrap: wrap; gap: 10px; align-items: flex-end;">
          <div class="ui labeled input inverted mini">
            <div class="ui label">Größe</div>
            <input type="number" step="0.1" v-model="state.design.h2.fontsize" style="width: 70px;">
          </div>
          <div class="ui labeled input inverted mini">
            <div class="ui label">Dicke</div>
            <input type="text" v-model="state.design.h2.fontweight" placeholder="800" style="width: 60px;">
          </div>
          <div style="width: 140px;">
             <color-picker v-model="state.design.h2.color"></color-picker>
          </div>
          <div class="ui icon inverted buttons mini">
              <button class="ui button" :class="{ blue: isBold(state.design.h2.fontweight) }"  v-on:click.prevent="toggleH2Bold()" title="Fett"><i class="bold icon"></i></button>
              <button class="ui button" :class="{ blue: state.design.h2.italic }"  v-on:click.prevent="toggleH2Italic()" title="Kursiv"><i class="italic icon"></i></button>
              <button class="ui button" :class="{ blue: state.design.h2.fontvariant === 'small-caps' }" v-on:click.prevent="toggleH2Variant()" title="Kapitälchen"><span style="font-variant: small-caps; font-weight: bold;">Aa</span></button>
          </div>
          <div class="ui small basic inverted icon buttons mini">
              <button class="ui button" :class="{ blue: state.design.h2.texttransform === 'none' }" v-on:click.prevent="state.design.h2.texttransform = 'none'" title="Normal">Aa</button>
              <button class="ui button" :class="{ blue: state.design.h2.texttransform === 'uppercase' }" v-on:click.prevent="state.design.h2.texttransform = 'uppercase'" title="GROSS">AA</button>
              <button class="ui button" :class="{ blue: state.design.h2.texttransform === 'lowercase' }" v-on:click.prevent="state.design.h2.texttransform = 'lowercase'" title="klein">aa</button>
              <button class="ui button" :class="{ blue: state.design.h2.texttransform === 'capitalize' }" v-on:click.prevent="state.design.h2.texttransform = 'capitalize'" title="Erster Groß">Ab</button>
          </div>
        </div>

        <h4 class="ui dividing header inverted">Eigene Schriftarten (Base64)</h4>
        <div class="field">
          <div class="ui segment" style="border: 2px dashed #444; background: #1b1c1d; padding: 20px; text-align: center; cursor: pointer;" @dragover.prevent @drop.prevent="handleFontDrop" @click="addCustomFont">
            <i class="huge upload icon" style="color: #555;"></i>
            <p style="margin-top: 10px; color: #888;">Schriftarten hierher ziehen oder klicken (.ttf, .otf, .woff)</p>
          </div>
          <div class="ui middle aligned divided list inverted" style="margin-top: 10px;">
            <div v-for="(font, index) in state.design.customFonts" :key="index" class="item" style="padding: 10px 0;">
              <div class="right floated content">
                <div class="ui mini inverted basic blue button" @click="applyFontToH1(font.name)">Name</div>
                <div class="ui mini inverted basic green button" @click="applyFontToH2(font.name)">Titel</div>
                <div class="ui mini inverted red icon button" @click="removeCustomFont(index)"><i class="trash icon"></i></div>
              </div>
              <i class="font icon"></i>
              <div class="content">
                <div class="header" :style="{ fontFamily: font.name }">{{ font.name }}</div>
              </div>
            </div>
          </div>
        </div>

        <h4 class="ui dividing header inverted">Bilder</h4>
        <h5 class="ui header inverted" style="margin-top: 10px;">Upload: Bild (Global)</h5>
        <div class="field">
          <div v-if="!state.design.logo" class="ui segment" style="border: 2px dashed #444; background: #1b1c1d; padding: 20px; text-align: center; cursor: pointer;" @dragover.prevent @drop.prevent="handleLogoDrop" @click="$refs.logoInput.click()">
            <i class="huge image outline icon" style="color: #555;"></i>
            <p style="margin-top: 10px; color: #888;">Bild hierher ziehen oder klicken</p>
            <input type="file" ref="logoInput" style="display: none" accept="image/*" @change="handleLogoDrop({ dataTransfer: { files: $event.target.files } })">
          </div>
          <div v-else class="ui segment checkerboard" style="text-align: center; position: relative; padding: 0; min-height: 150px; height: 150px; display: flex; align-items: center; justify-content: center; overflow: hidden;">
             <img :src="state.design.logo" style="height: 150px; width: 100%; object-fit: contain; display: block; margin: 0 auto;">
             <div class="ui mini inverted red icon button" style="position: absolute; top: 10px; right: 10px; z-index: 10;" @click="removeLogo"><i class="trash icon"></i></div>
          </div>
        </div>

        <h5 class="ui header inverted" style="margin-top: 20px;">Stil: Bild (Global)</h5>
        <div class="ui doubling four column grid">
          <div class="column field">
            <label>Höhe (in vh)</label>
            <div class="ui left icon input fluid inverted">
              <input type="number" step="0.1" min="0" max="100" v-model="state.design.logoStyle.height">
              <i class="arrows alternate vertical icon"></i>
            </div>
          </div>
          <div class="column field">
            <label>Breite (in vh)</label>
            <div class="ui left icon input fluid inverted">
              <input type="number" step="0.1" min="0" max="100" v-model="state.design.logoStyle.width">
              <i class="arrows alternate horizontal icon"></i>
            </div>
          </div>
          <div class="column field">
            <label>Ecken Rundung</label>
            <div class="ui left icon input fluid inverted">
              <input type="number" step="1" min="0" max="1000" v-model="state.design.logoStyle.radius">
              <i class="circle outline icon"></i>
            </div>
          </div>
          <div class="column field">
            <label>Abstand Links (vh)</label>
            <div class="ui left icon input fluid inverted">
              <input type="number" step="0.1" v-model="state.design.logoStyle.marginLeft">
              <i class="arrow left icon"></i>
            </div>
          </div>
          <div class="column field">
            <label>Abstand Rechts (vh)</label>
            <div class="ui left icon input fluid inverted">
              <input type="number" step="0.1" v-model="state.design.logoStyle.marginRight">
              <i class="arrow right icon"></i>
            </div>
          </div>
          <div class="column field">
            <label>Positionierung</label>
            <select class="ui inverted dropdown fluid" v-model="state.design.logoStyle.position">
              <option value="static">Standard (Flex)</option>
              <option value="relative">Relativ</option>
              <option value="absolute">Absolut</option>
            </select>
          </div>
          <div class="column field" v-if="state.design.logoStyle.position !== 'static'">
            <label>X-Pos (vw)</label>
            <div class="ui left icon input fluid inverted">
              <input type="number" step="0.1" v-model="state.design.logoStyle.x">
              <i class="arrows alternate horizontal icon"></i>
            </div>
          </div>
          <div class="column field" v-if="state.design.logoStyle.position !== 'static'">
            <label>Y-Pos (vh)</label>
            <div class="ui left icon input fluid inverted">
              <input type="number" step="0.1" v-model="state.design.logoStyle.y">
              <i class="arrows alternate vertical icon"></i>
            </div>
          </div>
        </div>

        <h5 class="ui header inverted" style="margin-top: 20px;">Stil: Bild (Bauchbinde)</h5>

        <h4 class="ui dividing header inverted">Unified CSS Editor</h4>
        <div class="field">
          <css-editor v-model="state.design.unifiedCss"></css-editor>
        </div>
      </form>
    </div>
  </div>
  
  <!-- CSS Duplicates Modal -->
  <div class="ui inverted modal" id="conflict-modal">
    <div class="header inverted">CSS Duplikate gefunden</div>
    <div class="content inverted" style="background: #1b1c1d;">
      <p>Die geladene Datei enthält Design-Einstellungen...</p>
      <div class="ui middle aligned divided list inverted">
        <div v-for="(c, index) in cssConflicts" :key="index" class="item" style="padding: 15px 0;">
          <div class="content">
            <div class="header" style="color: #adff2f;">Selektor: {{ c.selector }} &raquo; Eigenschaft: {{ c.property }}</div>
            <div class="description" style="margin-top: 10px;">
              <div class="ui two column grid">
                <div class="column">
                                      <div class="ui segment inverted">
                                          <div class="ui top attached label">GUI Standard</div>
                                          <code>{{ c.guiValue }}</code>
                                          <button class="ui fluid basic inverted button" :class="{ loading: isResolving }" style="margin-top: 10px;" @click="resolveConflict(index, 'gui')">Behalten</button>
                                        </div>
                                      </div>
                                      <div class="column">
                                        <div class="ui segment inverted secondary">
                                          <div class="ui top attached label teal">Custom CSS (Empfohlen)</div>
                                          <code>{{ c.customValue }}</code>
                                          <button class="ui fluid teal button" :class="{ loading: isResolving }" style="margin-top: 10px;" @click="resolveConflict(index, 'custom')">Behalten</button>
                                        </div>                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, watch, onMounted } from 'vue';
import draggable from 'vuedraggable';
import ColorPicker from './ColorPicker.vue';
import CssEditor from './CssEditor.vue';
import FomanticDropdown from './FomanticDropdown.vue';
import { state, systemFonts, manualFonts } from '../store.js';

const isElectron = typeof window !== 'undefined' && window.process && window.process.versions?.electron;
const ipc = isElectron ? window.require('electron').ipcRenderer : null;
const remote = isElectron ? window.require('@electron/remote') : null;
const dialog = remote ? remote.dialog : null;
const fs = isElectron ? window.require('fs') : null;
const path = isElectron ? window.require('path') : null;

const WEB_FONTS = [
    'Arial, sans-serif',
    'Helvetica, sans-serif',
    'Verdana, sans-serif',
    'Trebuchet MS, sans-serif',
    'Times New Roman, serif',
    'Georgia, serif',
    'Garamond, serif',
    'Courier New, monospace',
    'Brush Script MT, cursive'
];

const cssConflicts = ref([]);
const isResolving = ref(false);

const allFonts = computed(() => {
    const combined = [...state.design.customFonts.map(f => f.name), ...WEB_FONTS, ...systemFonts.value, ...manualFonts.value, state.design.h1.fontfamily, state.design.h2.fontfamily].filter(f => f && f !== '');
    return [...new Set(combined)];
});

const isBold = (w) => w === 'bold' || parseInt(w) >= 700;
const toggleH1Bold = () => { state.design.h1.fontweight = isBold(state.design.h1.fontweight) ? 'normal' : 'bold'; };
const toggleH2Bold = () => { state.design.h2.fontweight = isBold(state.design.h2.fontweight) ? 'normal' : 'bold'; };
const toggleH1Italic = () => { state.design.h1.italic = !state.design.h1.italic; }; 
const toggleH1Variant = () => { state.design.h1.fontvariant = state.design.h1.fontvariant === 'small-caps' ? 'normal' : 'small-caps'; };
const toggleH2Italic = () => { state.design.h2.italic = !state.design.h2.italic; }; 
const toggleH2Variant = () => { state.design.h2.fontvariant = state.design.h2.fontvariant === 'small-caps' ? 'normal' : 'small-caps'; };

const getAlignIconClass = (el) => {
    const map = {
        'auto': 'asterisk',
        'flex-start': 'align left',
        'center': 'align center',
        'flex-end': 'align right',
        'stretch': 'arrows alternate vertical'
    };
    return map[el.alignSelf || 'auto'] || 'asterisk';
};

const getAlignIconStyle = (el) => {
    const val = el.alignSelf;
    const isRotated = ['flex-start', 'center', 'flex-end'].includes(val);
    return {
        transform: isRotated ? 'rotate(90deg)' : 'none',
        color: val && val !== 'auto' ? '#54c8ff' : '#666'
    };
};

const cycleAlign = (el) => {
    const order = ['auto', 'flex-start', 'center', 'flex-end', 'stretch'];
    const curr = el.alignSelf || 'auto';
    const next = order[(order.indexOf(curr) + 1) % order.length];
    el.alignSelf = next;
};

const removeCustomFont = (i) => { state.design.customFonts.splice(i, 1); updateFontCSS(); };
const applyFontToH1 = (n) => { state.design.h1.fontfamily = n; };
const applyFontToH2 = (n) => { state.design.h2.fontfamily = n; };
const removeLogo = () => { state.design.logo = null; };

const updateFontCSS = () => {
    let css = '';
    state.design.customFonts.forEach(f => {
        let fmt = f.type === 'ttf' ? 'truetype' : (f.type === 'otf' ? 'opentype' : f.type);
        css += `@font-face { font-family: '${f.name}'; src: url(data:font/${f.type};base64,${f.data}) format('${fmt}'); }
`;
    });
    $('#custom-font-styles').remove(); 
    $('head').append(`<style id="custom-font-styles">${css}</style>`);
};

const addCustomFont = () => {
    dialog.showOpenDialog({ filters: [{ name: 'Fonts', extensions: ['ttf', 'otf', 'woff', 'woff2'] }], properties: ['openFile', 'multiSelections'] }).then(res => {
        if (!res.canceled && res.filePaths.length > 0) {
            res.filePaths.forEach(fp => {
                const ext = path.extname(fp).replace('.', ''), fn = path.basename(fp, path.extname(fp));
                if (!state.design.customFonts.some(f => f.name === fn)) {
                    state.design.customFonts.push({ name: fn, data: fs.readFileSync(fp).toString('base64'), type: ext });
                }
            });
            updateFontCSS();
        }
    });
};

const handleFontDrop = (e) => {
    const files = Array.from(e.dataTransfer.files);
    files.forEach(file => {
        const ext = file.name.split('.').pop().toLowerCase();
        if (['ttf', 'otf', 'woff', 'woff2'].includes(ext)) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const name = file.name.replace(`.${ext}`, '');
                if (!state.design.customFonts.some(f => f.name === name)) {
                    state.design.customFonts.push({ name: name, data: event.target.result.split(',')[1], type: ext });
                    updateFontCSS();
                }
            };
            reader.readAsDataURL(file);
        }
    });
};

const handleLogoDrop = (e) => {
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
        const file = files[0];
        const reader = new FileReader();
        reader.onload = (event) => { state.design.logo = event.target.result; };
        reader.readAsDataURL(file);
    }
};

const getEnabledCount = (axis) => {
    if (!state.design.container) return 0;
    const props = axis === 'horizontal' ? ['left', 'right', 'width'] : ['top', 'bottom', 'height'];
    return props.filter(p => state.design.container[p].enabled).length;
};

// CSS Generation Logic
const buildCss = () => {
  const line = (obj, key, prop, val) => {
    return `  ${prop}: ${val};
`;
  };

  let css = ".bauchbinde {\n";
  css += "  display: flex;\n";
  
  if (state.design.container) {
      const c = state.design.container;
      
      // Horizontal positioning
      const hCount = (c.left.enabled ? 1 : 0) + (c.right.enabled ? 1 : 0);

      if (hCount === 0) { // No left/right enabled
          if (c.width.enabled) {
              css += `  width: ${c.width.value}vw;\n`;
              css += `  left: calc(50vw - ${c.width.value}vw / 2);\n`;
              css += `  right: auto;\n`; // Ensure right is not set
          } else { // No left/right/width enabled
              css += `  width: auto;\n`;
              css += `  left: auto;\n`;
              css += `  right: auto;\n`;
          }
      } else { // left/right or both enabled
          if (c.left.enabled) css += `  left: ${c.left.value}vw;\n`; else css += `  left: auto;\n`;
          if (c.right.enabled) css += `  right: ${c.right.value}vw;\n`; else css += `  right: auto;\n`;
          if (c.width.enabled) css += `  width: ${c.width.value}vw;\n`; else css += `  width: auto;\n`;
      }

      // Vertical positioning
      const vCount = (c.top.enabled ? 1 : 0) + (c.bottom.enabled ? 1 : 0);
      if (vCount === 0) { // No top/bottom enabled
          if (c.height.enabled) {
              css += `  height: ${c.height.value}vh;\n`;
              css += `  top: calc(50vh - ${c.height.value}vh / 2);\n`;
              css += `  bottom: auto;\n`; // Ensure bottom is not set
          } else { // No top/bottom/height enabled
              css += `  height: auto;\n`;
              css += `  top: auto;\n`;
              css += `  bottom: auto;\n`;
              css += `  align-items: center;\n`; // If height is auto, align the flex items (box) vertically
          }
      } else { // top/bottom or both enabled
          if (c.top.enabled) css += `  top: ${c.top.value}vh;\n`; else css += `  top: auto;\n`;
          if (c.bottom.enabled) css += `  bottom: ${c.bottom.value}vh;\n`; else css += `  bottom: auto;\n`;
          if (c.height.enabled) css += `  height: ${c.height.value}vh;\n`; else css += `  height: auto;\n`;
      }
  } else { // Fallback for old states without state.design.container
      css += `  width: 100vw;\n`;
      css += `  left: 0;\n`;
      css += `  bottom: ${(state.design.white?.bottom || 0)}vh;\n`;
      css += `  height: 10vh;\n`;
  }

  css += `  justify-content: ${["flex-start", "center", "flex-end"][state.design.white.divalign || 0]};\n`;
  css += "}\n\n";

  css += ".bauchbinde-box {\n";
  const wProp = state.design.white.fixedWidth ? "width" : "min-width";
  css += line(state.design.white, 'width', wProp, (state.design.white.width || 10) + "vw");
  
  if (state.design.white.height > 0) {
    const hProp = state.design.white.fixedHeight ? "height" : "min-height";
    css += line(state.design.white, 'height', hProp, (state.design.white.height || 1) + "vh");
  }
  
  css += line(state.design.white, 'left', 'margin', "0 " + (state.design.white.left || 0) + "vw");
  css += line(state.design.white, 'color', 'background', state.design.white.color);
  css += line(state.design.white, 'borderradius', 'border-radius', (state.design.white.borderradius || 0) + "px");
  css += line(state.design.white, 'padding', 'padding', (state.design.white.paddingv || 0) + "vh " + (state.design.white.paddingh || 0) + "vh");
  css += `  text-align: ${["left", "center", "right"][state.design.white.textalign || 0]};\n`;
  css += `  overflow: ${state.design.white.overflow || "hidden"};\n`;
  css += `  align-items: ${state.design.white.flexAlign || "center"};\n`;
  css += `  justify-content: ${state.design.white.flexJustify || "center"};\n`;
  css += line(state.design.white, 'flexGap', 'gap', (state.design.white.flexGap || 0) + "vh");
  css += "}\n\n";

  const imgBlock = (sel, obj) => {
    let s = sel + " {\n";
    s += line(obj, 'height', 'height', (obj.height > 0 ? obj.height + "vh" : "auto"));
    s += line(obj, 'width', 'width', (obj.width > 0 ? obj.width + "vh" : "auto"));
    s += line(obj, 'radius', 'border-radius', (obj.radius || 0) + "px");
    s += line(obj, 'opacity', 'opacity', (obj.opacity || 1));
    s += line(obj, 'marginLeft', 'margin-left', (obj.marginLeft || 0) + "vh");
    s += line(obj, 'marginRight', 'margin-right', (obj.marginRight || 0) + "vh");
    
    if (obj.position && obj.position !== "static") {
      s += line(obj, 'position', 'position', obj.position);
      s += line(obj, 'x', 'left', (obj.x || 0) + "vw");
      s += line(obj, 'y', 'top', (obj.y || 0) + "vh");
    }
    s += "}\n\n";
    return s;
  };

  css += imgBlock(".logo", state.design.logoStyle);
  css += imgBlock(".image", state.design.imageStyle);
  
  state.design.layoutOrder.forEach((item, index) => {
    css += `${item.id} { order: ${index + 1}; align-self: ${item.alignSelf || "auto"}; }\n`;
  });

  css += "\n.text {\n";
  css += `  overflow: ${state.design.white.textOverflow || "visible"};\n`;
  css += "}\n\n";

  const textBlock = (sel, obj) => {
    let family = obj.fontfamily || "Helvetica, Arial, sans-serif";
    family = String(family).replace(/!important/g, "").replace(/['"]/g, "").trim();
    const formattedFamily = family.split(",").map(f => {
      f = f.trim();
      return (f.includes(" ") && !f.startsWith("\"")) ? `"${f}"` : f;
    }).join(", ");
    
    let s = sel + " {\n";
    s += line(obj, 'fontfamily', 'font-family', formattedFamily);
    s += line(obj, 'fontsize', 'font-size', (obj.fontsize || (sel === "h1" ? 5 : 3.7)) + "vh");
    s += line(obj, 'fontsize', 'line-height', (obj.fontsize || (sel === "h1" ? 5 : 3.7)) + "vh");
    s += line(obj, 'color', 'color', obj.color);
    s += line(obj, 'fontweight', 'font-weight', obj.fontweight || "normal");
    s += line(obj, 'italic', 'font-style', obj.italic ? "italic" : "normal");
    s += line(obj, 'texttransform', 'text-transform', obj.texttransform || "none");
    s += line(obj, 'fontvariant', 'font-variant', obj.fontvariant || "normal");
    s += "}\n\n";
    return s;
  };

  css += textBlock("h1", state.design.h1);
  css += textBlock("h2", state.design.h2);
  return css;
};

// ... CSS Parsing Logic ... (omitted for brevity, but should be included)
// For now, I assume main.js handles parsing or I need to copy it here.
// Actually, parsing logic is tightly coupled with conflict resolution modal.
// I will include parseCssToProperties, auditCSS, resolveConflict here.

const parseCssToProperties = (css) => {
    if (!css) return;
    const extractValue = (selector, prop) => {
        const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escapedSelector + '\\s*{[\\s\\S]*?' + prop + ':\\s*([^;]+);?', 'i');
        const match = css.match(regex);
        return match ? match[1].trim().replace(/['"]/g, '') : null;
    };

    if (state.design.container) {
        ['left', 'right', 'width'].forEach(p => {
            const v = extractValue('.bauchbinde', p);
            if (v) { state.design.container[p].value = parseFloat(v); state.design.container[p].enabled = true; }
            else { state.design.container[p].enabled = false; }
        });
        ['top', 'bottom', 'height'].forEach(p => {
            const v = extractValue('.bauchbinde', p);
            if (v) { state.design.container[p].value = parseFloat(v); state.design.container[p].enabled = true; }
            else { state.design.container[p].enabled = false; }
        });
    }

    const justify = extractValue('.bauchbinde', 'justify-content');
    if (justify) state.design.white.divalign = ['flex-start', 'center', 'flex-end'].indexOf(justify);

    const minWidth = extractValue('.bauchbinde-box', 'min-width') || extractValue('.bb-box', 'min-width') || extractValue('.white', 'min-width');
    const fixedWidth = extractValue('.bauchbinde-box', 'width');
    if (minWidth) { state.design.white.width = parseFloat(minWidth); state.design.white.fixedWidth = false; }
    else if (fixedWidth) { state.design.white.width = parseFloat(fixedWidth); state.design.white.fixedWidth = true; }
    
    const minHeight = extractValue('.bauchbinde-box', 'min-height');
    const fixedHeight = extractValue('.bauchbinde-box', 'height');
    if (minHeight) { state.design.white.height = parseFloat(minHeight); state.design.white.fixedHeight = false; }
    else if (fixedHeight) { state.design.white.height = parseFloat(fixedHeight); state.design.white.fixedHeight = true; }

    const bg = extractValue('.bauchbinde-box', 'background') || extractValue('.bb-box', 'background') || extractValue('.white', 'background');
    if (bg) state.design.white.color = bg;
    const radius = extractValue('.bauchbinde-box', 'border-radius') || extractValue('.bb-box', 'border-radius') || extractValue('.white', 'border-radius');
    if (radius) state.design.white.borderradius = parseFloat(radius);
    
    // Migration: Update display types to Flexbox
    const display = extractValue('.bauchbinde-box', 'display') || extractValue('.bb-box', 'display') || extractValue('.white', 'display');
    
    const overflow = extractValue('.bauchbinde-box', 'overflow');
    if (overflow) state.design.white.overflow = overflow;
    const textOverflow = extractValue('.text', 'overflow');
    if (textOverflow) state.design.white.textOverflow = textOverflow;

    // Flex props
    const flexAlign = extractValue('.bauchbinde-box', 'align-items');
    if (flexAlign) state.design.white.flexAlign = flexAlign;
    const flexJustify = extractValue('.bauchbinde-box', 'justify-content');
    if (flexJustify) state.design.white.flexJustify = flexJustify;
    const gap = extractValue('.bauchbinde-box', 'gap');
    if (gap) state.design.white.flexGap = parseFloat(gap);

    const parseText = (sel, obj) => {
        let family = extractValue(sel, 'font-family');
        if (family) { 
            family = family.replace(/!important/g, '').replace(/['"]/g, '').trim();
            obj.fontfamily = family; 
            if (!allFonts.value.includes(family)) manualFonts.value.push(family); 
        }
        const size = extractValue(sel, 'font-size');
        if (size) {
            const parsedSize = parseFloat(size);
            obj.fontsize = isNaN(parsedSize) ? (sel === 'h1' ? 5 : 3.7) : parsedSize;
        }
        const color = extractValue(sel, 'color');
        if (color) obj.color = color;
        const weight = extractValue(sel, 'font-weight');
        if (weight) obj.fontweight = weight;
        const style = extractValue(sel, 'font-style');
        if (style) obj.italic = (style === 'italic');
        const transform = extractValue(sel, 'text-transform');
        if (transform) obj.texttransform = transform;
        const variant = extractValue(sel, 'font-variant');
        if (variant) obj.fontvariant = variant;
    };
    parseText('h1', state.design.h1); parseText('h2', state.design.h2);

    const parseImg = (sel, obj) => {
        const h = extractValue(sel, 'height');
        if (h && (h.includes('%') || h.includes('vh'))) { obj.height = parseFloat(h); }

        const w = extractValue(sel, 'width');
        if (w && (w.includes('%') || w.includes('vh'))) obj.width = parseFloat(w);
        const r = extractValue(sel, 'border-radius');
        if (r) obj.radius = parseFloat(r);
        const o = extractValue(sel, 'opacity');
        if (o) obj.opacity = parseFloat(o);
        
        const ml = extractValue(sel, 'margin-left');
        if (ml) obj.marginLeft = parseFloat(ml);
        const mr = extractValue(sel, 'margin-right');
        if (mr) obj.marginRight = parseFloat(mr);
        
        const m = extractValue(sel, 'margin');
        if (m) {
            const parts = m.trim().split(' ');
            if (parts.length > 1) {
                const val = parseFloat(parts[1]);
                if (isNaN(obj.marginLeft)) obj.marginLeft = val;
                if (isNaN(obj.marginRight)) obj.marginRight = val;
            } else if (parts.length === 1 && parts[0] !== '') {
                const val = parseFloat(parts[0]);
                if (isNaN(obj.marginLeft)) obj.marginLeft = val;
                if (isNaN(obj.marginRight)) obj.marginRight = val;
            }
        }
        
        const p = extractValue(sel, 'position');
        if (p) obj.position = p;
        const x = extractValue(sel, 'left');
        if (x) obj.x = parseFloat(x);
        const y = extractValue(sel, 'top');
        if (y) obj.y = parseFloat(y);
    };
    parseImg('.logo', state.design.logoStyle);
    parseImg('.image', state.design.imageStyle);
};

// Helper to normalize selectors for comparison
const normalizeSelector = (s) => {
    return s.trim()
        .replace(/\.bauchbinde-instance\s+/, '')
        .replace(/^div\.bauchbinde/, '.bauchbinde')
        .replace(/^div\.white/, '.bb-box')
        .replace(/^div\.bb-box/, '.bb-box')
        .replace(/^\.white/, '.bb-box')
        .replace(/^h1/, 'h1') // Keep tags but ensure consistent
        .replace(/^h2/, 'h2')
        .replace(/>\s*/g, '')
        .replace(/\s+/g, ' ')
        .trim();
};

const auditCSS = (cssText) => {
    if (!cssText) return;
    const parts = cssText.split('/* CUSTOM */');
    const guiCss = parts[0];
    const customCss = parts[1] || '';

    // Optimization: Remove huge base64 data URIs before parsing to keep it fast
    const cleanCustomCss = customCss.replace(/url\s*\(\s*['"]?data:[\s\S]*?['"]?\s*\)/g, 'url("data:embedded")');

    const parseToMap = (text) => {
        const map = {};
        const lines = text.split('\n');
        let currentSel = null;
        lines.forEach(l => {
            if (l.length > 1000) return; // Skip potential large data lines
            const s = l.match(/^([^{]+)\s*{/);
            if (s) { 
                currentSel = normalizeSelector(s[1]); 
                if (!map[currentSel]) map[currentSel] = {}; 
            } 
            else if (l.includes('}')) currentSel = null;
            else if (currentSel && l.includes(':')) {
                const p = l.match(/^\s*([^:]+):\s*([^;]+);?/);
                if (p) {
                    const key = p[1].trim();
                    const val = p[2].trim().replace(/!important/g, '').replace(/['"]/g, '').trim();
                    map[currentSel][key] = val;
                }
            }
        });
        return map;
    };

    const guiMap = parseToMap(guiCss);
    const customMap = parseToMap(cleanCustomCss);
    const foundConflicts = [];

    Object.keys(guiMap).forEach(sel => {
        if (customMap[sel]) {
            Object.keys(guiMap[sel]).forEach(prop => {
                if (customMap[sel][prop]) {
                    foundConflicts.push({
                        selector: sel, property: prop, guiValue: guiMap[sel][prop], customValue: customMap[sel][prop]
                    });
                }
            });
        }
    });

    cssConflicts.value = foundConflicts;
    if (foundConflicts.length > 0) {
        nextTick(() => {
            const $m = $('#conflict-modal');
            if (!$m.modal('is active')) $m.modal({ closable: false, detachable: false }).modal('show');
        });
    } else {
        $('#conflict-modal').modal('hide');
    }
};

const resolveConflict = async (index, source) => {
    isResolving.value = true;
    const conflict = cssConflicts.value[index];
    
    // Small delay to allow UI to show loader if needed
    await new Promise(r => setTimeout(r, 10));

    if (source === 'custom') {
        // Apply custom value to GUI
        const fakeCss = `${conflict.selector} { ${conflict.property}: ${conflict.customValue}; }`;
        parseCssToProperties(fakeCss);
    }
    
    const parts = state.design.unifiedCss.split('/* CUSTOM */');
    let customPart = parts[1] || '';
    
    // Efficient targeted replacement for huge strings
    const escapedSelector = conflict.selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const propRegex = new RegExp(`(${escapedSelector}\\s*{[\\s\\S]*?)${conflict.property}:\\s*[^;]+;?([\\s\\S]*?})`, 'i');
    
    customPart = customPart.replace(propRegex, (match, start, end) => {
        const inner = (start.split('{')[1] + end.split('}')[0]).trim();
        return inner.length === 0 ? '' : `${start.split('{')[0]} {\n  ${inner}\n}`;
    });

    // Cleanup empty rulesets
    customPart = customPart.replace(/[^{}\n]+\s*{\s*}/g, '').trim();

    state.design.unifiedCss = buildCss() + "\n/* CUSTOM */\n" + customPart;
    cssConflicts.value.splice(index, 1);
    isResolving.value = false;
    if (cssConflicts.value.length === 0) $('#conflict-modal').modal('hide');
};

const props = defineProps({
    isActive: Boolean
});

let isSyncing = false;

// Function to sync everything to server
const syncToMain = () => {
    if (isSyncing || state.isInternalUpdate) return;
    // Safety: Only sync if this tab is actually the active one
    if (!props.isActive) return;
    
    isSyncing = true;
    if (ipc) ipc.send('update-css', JSON.parse(JSON.stringify(state.design)));
    nextTick(() => { isSyncing = false; });
};

// Watch GUI changes -> Rebuild CSS
watch(() => [
    state.design.white, state.design.container, state.design.h1, state.design.h2, 
    state.design.layoutOrder, state.design.logoStyle, state.design.imageStyle,
    state.design.logo, state.design.logoStyle.marginLeft, state.design.logoStyle.marginRight,
    state.design.imageStyle.marginLeft, state.design.imageStyle.marginRight
], () => {
    if (state.isInternalUpdate) return;
    const parts = (state.design.unifiedCss || '').split('/* CUSTOM */');
    const customPart = parts.length > 1 ? parts[1].trim() : '';
    const newCss = buildCss() + "\n/* CUSTOM */\n" + customPart;
    
    if (state.design.unifiedCss !== newCss) {
        // This will trigger the watch on unifiedCss which calls syncToMain
        state.design.unifiedCss = newCss;
    } else {
        // Logo or other non-CSS data might have changed
        syncToMain();
    }
}, { deep: true });

// Watch unifiedCss -> Parse back to properties (if changed manually) and Sync
watch(() => state.design.unifiedCss, (nv, ov) => {
    if (isSyncing || state.isInternalUpdate || !nv) return;
    
    // Check if this was a manual change in the CSS editor 
    // or just our own buildCss() update
    const parts = nv.split('/* CUSTOM */');
    const guiPart = parts[0];
    const oldGuiPart = ov ? ov.split('/* CUSTOM */')[0] : '';
    
    if (guiPart !== oldGuiPart) {
        parseCssToProperties(nv); 
        auditCSS(nv);
    }
    
    syncToMain();
});

onMounted(() => {
    if (ipc) {
        ipc.on('design-update-start', () => { isInternalUpdate = true; });
        ipc.on('design-update-end', () => { isInternalUpdate = false; });
    }

    // Legacy Migration Fallback for container
    if (!state.design.container) {
        state.design.container = {
            left: { enabled: false, value: 0 },
            right: { enabled: false, value: 0 },
            top: { enabled: false, value: 0 },
            bottom: { enabled: true, value: state.design.white?.bottom || 0 }, // Preserve old bottom value
            width: { enabled: true, value: 100 },
            height: { enabled: false, value: 0 }
        };
    }

    // Force initial build if missing
    if (!state.design.unifiedCss || state.design.unifiedCss.trim() === '') {
        console.log("[DesignTab] Building initial CSS...");
        state.design.unifiedCss = buildCss();
        syncToMain();
    }
});
</script>
