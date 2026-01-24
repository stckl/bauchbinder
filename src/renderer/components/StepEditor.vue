<template>
  <div class="ui fluid container inverted" style="padding: 20px; background: #1b1c1d; min-height: 100vh;">
    <h2 class="ui header inverted">
      <i class="magic icon"></i>
      <div class="content">
        Effekt bearbeiten: {{ step ? getFriendlyName(step.selector) : '' }}
      </div>
    </h2>

    <div v-if="step" class="ui form inverted small">
      <div class="two fields">
        <div class="field">
          <label>Ziel-Element</label>
          <select v-model="step.selector" class="ui dropdown inverted selection">
            <option value=".bauchbinde-instance">Ganze Bauchbinde</option>
            <option value=".bauchbinde-box">Box</option>
            <option value=".text">Text-Bereich</option>
            <option value=".logo">Bild (Global)</option>
            <option value=".image">Bild (Bauchbinde)</option>
            <option value="h1">Name (H1)</option>
            <option value="h2">Titel (H2)</option>
          </select>
        </div>
        <div v-if="step.selector === 'h1' || step.selector === 'h2'" class="field">
          <label>Text-Aufteilung (Split)</label>
          <select v-model="step.split" class="ui dropdown inverted selection">
            <option :value="undefined">Ganze Zeile</option>
            <option value="lines">Zeilen</option>
            <option value="words">Wörter</option>
            <option value="chars">Buchstaben</option>
          </select>
        </div>
      </div>

      <div class="three fields">
        <div class="field">
          <label>Dauer (ms)</label>
          <div class="ui input inverted fluid">
            <input type="number" v-model.number="step.duration">
          </div>
        </div>
        <div class="field">
          <label>Verzögerung (ms)</label>
          <div class="ui input inverted fluid">
            <input type="number" v-model.number="step.delay">
          </div>
        </div>
        <div class="field">
          <label>Kurve</label>
          <select v-model="step.easing" class="ui dropdown inverted selection">
            <option value="linear">linear</option>
            <option value="easeInQuad">easeInQuad</option>
            <option value="easeOutQuad">easeOutQuad</option>
            <option value="easeInOutQuad">easeInOutQuad</option>
            <option value="easeInCirc">easeInCirc</option>
            <option value="easeOutCirc">easeOutCirc</option>
            <option value="easeInOutCirc">easeInOutCirc</option>
            <option value="easeInBack">easeInBack</option>
            <option value="easeOutBack">easeOutBack</option>
            <option value="easeOutBounce">easeOutBounce</option>
          </select>
        </div>
      </div>

      <!-- Hier kommen die Akkordeons für Sichtbarkeit, Bewegung etc. -->
      <div class="ui accordion inverted structured-editor-acc" style="border: 1px solid #333; padding: 10px; border-radius: 4px;">
        
        <div class="title active"><i class="dropdown icon"></i> Sichtbarkeit & Größe</div>
        <div class="content active">
          <div class="inline field">
            <div class="ui checkbox inverted tiny">
              <input type="checkbox" :checked="step.properties.opacity !== undefined" @change="toggleProp('opacity', phase==='show'?[0, 1]:[1, 0])">
              <label>Deckkraft</label>
            </div>
          </div>
          <div v-if="step.properties.opacity !== undefined" class="fields inverted">
            <div class="field"><label>Start</label><input type="number" step="0.1" v-model="step.properties.opacity[0]"></div>
            <div class="field"><label>Ziel</label><input type="number" step="0.1" v-model="step.properties.opacity[1]"></div>
          </div>

          <div class="inline field">
            <div class="ui checkbox inverted tiny">
              <input type="checkbox" :checked="step.properties.scale !== undefined" @change="toggleProp('scale', phase==='show'?[0, 1]:[1, 0])">
              <label>Größe (Scale)</label>
            </div>
          </div>
          <div v-if="step.properties.scale !== undefined" class="fields inverted">
            <div class="field"><label>Start</label><input type="number" step="0.1" v-model="step.properties.scale[0]"></div>
            <div class="field"><label>Ziel</label><input type="number" step="0.1" v-model="step.properties.scale[1]"></div>
          </div>
        </div>

        <div class="title"><i class="dropdown icon"></i> Bewegung (X, Y & Z)</div>
        <div class="content">
          <div class="field">
            <label>X-Achse</label>
            <select :value="getMotionXType()" @change="setMotionX($event.target.value)" class="ui mini dropdown inverted selection">
              <option value="none">-- Keine --</option>
              <option value="translateX">Transform X (vw)</option>
              <option value="left">Position Links (vw)</option>
            </select>
            <div v-if="getMotionXType() !== 'none'" class="fields inverted">
              <div class="field"><label>Start</label><input type="text" v-model="step.properties[getMotionXType()][0]"></div>
              <div class="field"><label>Ziel</label><input type="text" v-model="step.properties[getMotionXType()][1]"></div>
            </div>
          </div>
          <div class="field">
            <label>Y-Achse</label>
            <select :value="getMotionYType()" @change="setMotionY($event.target.value)" class="ui mini dropdown inverted selection">
              <option value="none">-- Keine --</option>
              <option value="translateY">Transform Y (vh)</option>
              <option value="top">Position Oben (vh)</option>
            </select>
            <div v-if="getMotionYType() !== 'none'" class="fields inverted">
              <div class="field"><label>Start</label><input type="text" v-model="step.properties[getMotionYType()][0]"></div>
              <div class="field"><label>Ziel</label><input type="text" v-model="step.properties[getMotionYType()][1]"></div>
            </div>
          </div>
          <div class="field">
            <label>Z-Achse</label>
            <select :value="getMotionZType()" @change="setMotionZ($event.target.value)" class="ui mini dropdown inverted selection">
              <option value="none">-- Keine --</option>
              <option value="translateZ">Transform Z (px)</option>
            </select>
            <div v-if="getMotionZType() !== 'none'" class="fields inverted">
              <div class="field"><label>Start</label><input type="text" v-model="step.properties.translateZ[0]"></div>
              <div class="field"><label>Ziel</label><input type="text" v-model="step.properties.translateZ[1]"></div>
            </div>
          </div>
        </div>

        <div class="title"><i class="dropdown icon"></i> Rotation</div>
        <div class="content">
          <div class="inline field">
            <div class="ui checkbox inverted tiny">
              <input type="checkbox" :checked="step.properties.rotateX !== undefined" @change="toggleProp('rotateX', ['0deg', '360deg'])">
              <label>Rotation X</label>
            </div>
          </div>
          <div v-if="step.properties.rotateX !== undefined" class="fields inverted">
            <div class="field"><label>Start</label><input type="text" v-model="step.properties.rotateX[0]"></div>
            <div class="field"><label>Ziel</label><input type="text" v-model="step.properties.rotateX[1]"></div>
          </div>

          <div class="inline field">
            <div class="ui checkbox inverted tiny">
              <input type="checkbox" :checked="step.properties.rotateY !== undefined" @change="toggleProp('rotateY', ['0deg', '360deg'])">
              <label>Rotation Y</label>
            </div>
          </div>
          <div v-if="step.properties.rotateY !== undefined" class="fields inverted">
            <div class="field"><label>Start</label><input type="text" v-model="step.properties.rotateY[0]"></div>
            <div class="field"><label>Ziel</label><input type="text" v-model="step.properties.rotateY[1]"></div>
          </div>

          <div class="inline field">
            <div class="ui checkbox inverted tiny">
              <input type="checkbox" :checked="step.properties.rotateZ !== undefined" @change="toggleProp('rotateZ', ['0deg', '360deg'])">
              <label>Rotation Z</label>
            </div>
          </div>
          <div v-if="step.properties.rotateZ !== undefined" class="fields inverted">
            <div class="field"><label>Start</label><input type="text" v-model="step.properties.rotateZ[0]"></div>
            <div class="field"><label>Ziel</label><input type="text" v-model="step.properties.rotateZ[1]"></div>
          </div>
        </div>

        <div class="title"><i class="dropdown icon"></i> Farbe</div>
        <div class="content">
          <div class="inline field">
            <div class="ui checkbox inverted tiny">
              <input type="checkbox" :checked="step.properties.backgroundColor !== undefined" @change="toggleProp('backgroundColor', ['rgba(255,255,255,1)', 'rgba(255,255,255,0)'])">
              <label>Hintergrundfarbe</label>
            </div>
          </div>
          <div v-if="step.properties.backgroundColor !== undefined" class="fields inverted">
            <div class="field">
              <label>Start</label>
              <input type="color" :value="toHex(step.properties.backgroundColor[0])" @input="step.properties.backgroundColor[0] = $event.target.value" style="width: 60px; height: 30px;">
              <input type="text" v-model="step.properties.backgroundColor[0]" style="width: 140px;">
            </div>
            <div class="field">
              <label>Ziel</label>
              <input type="color" :value="toHex(step.properties.backgroundColor[1])" @input="step.properties.backgroundColor[1] = $event.target.value" style="width: 60px; height: 30px;">
              <input type="text" v-model="step.properties.backgroundColor[1]" style="width: 140px;">
            </div>
          </div>
        </div>

        <div class="title"><i class="dropdown icon"></i> Ränder</div>
        <div class="content">
          <div class="inline field">
            <div class="ui checkbox inverted tiny">
              <input type="checkbox" :checked="step.properties.borderWidth !== undefined" @change="toggleProp('borderWidth', ['0px', '2px'])">
              <label>Rahmendicke</label>
            </div>
          </div>
          <div v-if="step.properties.borderWidth !== undefined" class="fields inverted">
            <div class="field"><label>Start</label><input type="text" v-model="step.properties.borderWidth[0]"></div>
            <div class="field"><label>Ziel</label><input type="text" v-model="step.properties.borderWidth[1]"></div>
          </div>

          <div class="inline field">
            <div class="ui checkbox inverted tiny">
              <input type="checkbox" :checked="step.properties.borderColor !== undefined" @change="toggleProp('borderColor', ['rgba(255,255,255,1)', 'rgba(255,255,255,0)'])">
              <label>Rahmenfarbe</label>
            </div>
          </div>
          <div v-if="step.properties.borderColor !== undefined" class="fields inverted">
            <div class="field">
              <label>Start</label>
              <input type="color" :value="toHex(step.properties.borderColor[0])" @input="step.properties.borderColor[0] = $event.target.value" style="width: 60px; height: 30px;">
              <input type="text" v-model="step.properties.borderColor[0]" style="width: 140px;">
            </div>
            <div class="field">
              <label>Ziel</label>
              <input type="color" :value="toHex(step.properties.borderColor[1])" @input="step.properties.borderColor[1] = $event.target.value" style="width: 60px; height: 30px;">
              <input type="text" v-model="step.properties.borderColor[1]" style="width: 140px;">
            </div>
          </div>

          <div class="inline field">
            <div class="ui checkbox inverted tiny">
              <input type="checkbox" :checked="step.properties.borderRadius !== undefined" @change="toggleProp('borderRadius', ['0px', '10px'])">
              <label>Eckenradius</label>
            </div>
          </div>
          <div v-if="step.properties.borderRadius !== undefined" class="fields inverted">
            <div class="field"><label>Start</label><input type="text" v-model="step.properties.borderRadius[0]"></div>
            <div class="field"><label>Ziel</label><input type="text" v-model="step.properties.borderRadius[1]"></div>
          </div>
        </div>

        <div v-if="step.selector === 'h1' || step.selector === 'h2'" class="title"><i class="dropdown icon"></i> Schrift</div>
        <div v-if="step.selector === 'h1' || step.selector === 'h2'" class="content">
          <div class="inline field">
            <div class="ui checkbox inverted tiny">
              <input type="checkbox" :checked="step.properties.fontSize !== undefined" @change="toggleProp('fontSize', ['0vh', '5vh'])">
              <label>Schriftgröße</label>
            </div>
          </div>
          <div v-if="step.properties.fontSize !== undefined" class="fields inverted">
            <div class="field"><label>Start</label><input type="text" v-model="step.properties.fontSize[0]"></div>
            <div class="field"><label>Ziel</label><input type="text" v-model="step.properties.fontSize[1]"></div>
          </div>

          <div class="inline field">
            <div class="ui checkbox inverted tiny">
              <input type="checkbox" :checked="step.properties.color !== undefined" @change="toggleProp('color', ['rgba(0,0,0,1)', 'rgba(0,0,0,1)'])">
              <label>Schriftfarbe</label>
            </div>
          </div>
          <div v-if="step.properties.color !== undefined" class="fields inverted">
            <div class="field">
              <label>Start</label>
              <input type="color" :value="toHex(step.properties.color[0])" @input="step.properties.color[0] = $event.target.value" style="width: 60px; height: 30px;">
              <input type="text" v-model="step.properties.color[0]" style="width: 140px;">
            </div>
            <div class="field">
              <label>Ziel</label>
              <input type="color" :value="toHex(step.properties.color[1])" @input="step.properties.color[1] = $event.target.value" style="width: 60px; height: 30px;">
              <input type="text" v-model="step.properties.color[1]" style="width: 140px;">
            </div>
          </div>

          <div class="inline field">
            <div class="ui checkbox inverted tiny">
              <input type="checkbox" :checked="step.properties.fontWeight !== undefined" @change="toggleProp('fontWeight', [400, 700])">
              <label>Schriftstärke</label>
            </div>
          </div>
          <div v-if="step.properties.fontWeight !== undefined" class="fields inverted">
            <div class="field"><label>Start</label><input type="number" step="100" min="100" max="900" v-model.number="step.properties.fontWeight[0]"></div>
            <div class="field"><label>Ziel</label><input type="number" step="100" min="100" max="900" v-model.number="step.properties.fontWeight[1]"></div>
          </div>
        </div>
      </div>

      <div style="margin-top: 30px; display: flex; gap: 10px;">
        <button class="ui positive fluid labeled icon button" @click="save">
          Fertig & Schließen
          <i class="checkmark icon"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue';
// Use global jQuery with Fomantic UI plugins (loaded in index.html)
const $ = window.$;
const ipc = (typeof window !== 'undefined' && window.require) ? window.require('electron').ipcRenderer : null;

const step = ref(null);
const phase = ref('');
const index = ref(null);

onMounted(() => {
    ipc.on('setup-step-editor', (event, arg) => {
        step.value = JSON.parse(JSON.stringify(arg.step));
        phase.value = arg.phase;
        index.value = arg.index;
        nextTick(() => {
            $('.ui.accordion').accordion({ exclusive: false });
            $('.ui.dropdown').dropdown();
            $('.ui.checkbox').checkbox();
        });
    });
    ipc.send('step-editor-ready');
});

const getFriendlyName = (s) => {
    const names = { '.bauchbinde-instance': 'Ganze Bauchbinde', '.bauchbinde-box': 'Box', '.text': 'Text-Bereich', '.logo': 'Bild (Global)', '.image': 'Bild (Bauchbinde)', 'h1': 'Name (H1)', 'h2': 'Titel (H2)' };
    return names[s] || s;
};

const toggleProp = (p, def) => {
    if (step.value.properties[p] !== undefined) delete step.value.properties[p];
    else step.value.properties[p] = def;
};

const getMotionXType = () => {
    if (step.value.properties.translateX !== undefined) return 'translateX';
    if (step.value.properties.left !== undefined) return 'left';
    return 'none';
};

const setMotionX = (val) => {
    ['translateX', 'left', 'right'].forEach(p => delete step.value.properties[p]);
    if (val !== 'none') step.value.properties[val] = [phase.value==='show'?'100vw':'0vw', '0vw'];
};

const getMotionYType = () => {
    if (step.value.properties.translateY !== undefined) return 'translateY';
    if (step.value.properties.top !== undefined) return 'top';
    return 'none';
};

const setMotionY = (val) => {
    ['translateY', 'top', 'bottom'].forEach(p => delete step.value.properties[p]);
    if (val !== 'none') step.value.properties[val] = [phase.value==='show'?'100vh':'0vh', '0vh'];
};

const getMotionZType = () => {
    if (step.value.properties.translateZ !== undefined) return 'translateZ';
    return 'none';
};

const setMotionZ = (val) => {
    delete step.value.properties.translateZ;
    if (val !== 'none') step.value.properties.translateZ = [phase.value==='show'?'100px':'0px', '0px'];
};

const toHex = (color) => {
    if (!color) return '#ffffff';
    if (color.startsWith('#')) return color.substring(0, 7);
    // Parse rgba/rgb
    const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (match) {
        const r = parseInt(match[1]).toString(16).padStart(2, '0');
        const g = parseInt(match[2]).toString(16).padStart(2, '0');
        const b = parseInt(match[3]).toString(16).padStart(2, '0');
        return `#${r}${g}${b}`;
    }
    return '#ffffff';
};

const save = () => {
    ipc.send('save-step', { phase: phase.value, index: index.value, step: JSON.parse(JSON.stringify(step.value)) });
};
</script>

<style scoped>
select.ui.dropdown {
    background: #2d2d2d !important;
    color: #fff !important;
    border: 1px solid #555 !important;
}
select.ui.dropdown option {
    background: #2d2d2d;
    color: #fff;
}
</style>
