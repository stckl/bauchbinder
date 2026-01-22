<template>
  <div class="row" style="margin-top: 20px;">
    <div class="col">
      <h2>Animation Editor</h2>
    </div>
    
    <div class="col" style="margin-top:20px;">
      <h4 class="ui dividing header inverted">Vorlagen laden</h4>
      <div class="ui inverted buttons small">
        <button class="ui button" :class="{ blue: isPresetActive('fade') }" @click.prevent="loadPreset('fade')">fade</button>
        <button class="ui button" :class="{ blue: isPresetActive('slideleft') }" @click.prevent="loadPreset('slideleft')">slideleft</button>
        <button class="ui button" :class="{ blue: isPresetActive('slideright') }" @click.prevent="loadPreset('slideright')">slideright</button>
        <button class="ui button" :class="{ blue: isPresetActive('slideup') }" @click.prevent="loadPreset('slideup')">slideup</button>
        <button class="ui button" :class="{ blue: isPresetActive('slideup_textdelay') }" @click.prevent="loadPreset('slideup_textdelay')">slideup textdelay</button>
      </div>
    </div>
  </div>

  <div v-if="state.animation.type == 'structured'" class="row" style="margin-top: 40px;">
    <div class="col">
      <h3 class="ui header inverted"><i class="eye icon"></i> Anzeigen (Fade In)</h3>
      <div class="ui segment inverted timeline-container">
        <div v-for="(step, index) in state.animation.show" :key="'show'+index" class="animation-step-card inverted">
          <div class="card-header">
            <span class="step-num">{{index + 1}}</span>
            <span class="step-title">{{ getFriendlyName(step.selector) }}</span>
            <i class="trash alternate outline red icon delete-btn" @click.stop="removeAnimationStep('show', index)"></i>
          </div>
          <div class="card-body">
            <div class="info-line"><i class="clock outline icon"></i> {{step.duration}}ms</div>
          </div>
          <button class="ui mini fluid blue inverted button" @click="openStepEditor('show', index)"><i class="edit icon"></i> Edit</button>
        </div>
        <button class="ui circular icon green inverted big button add-step-btn" @click="addAnimationStep('show')"><i class="plus icon"></i></button>
      </div>

      <h3 class="ui header inverted" style="margin-top: 40px;"><i class="eye slash icon"></i> Ausblenden (Fade Out)</h3>
      <div class="ui segment inverted timeline-container">
        <div v-for="(step, index) in state.animation.hide" :key="'hide'+index" class="animation-step-card inverted">
          <div class="card-header">
            <span class="step-num">{{index + 1}}</span>
            <span class="step-title">{{ getFriendlyName(step.selector) }}</span>
            <i class="trash alternate outline red icon delete-btn" @click.stop="removeAnimationStep('hide', index)"></i>
          </div>
          <div class="card-body">
            <div class="info-line"><i class="clock outline icon"></i> {{step.duration}}ms</div>
          </div>
          <button class="ui mini fluid blue inverted button" @click="openStepEditor('hide', index)"><i class="edit icon"></i> Edit</button>
        </div>
        <button class="ui circular icon green inverted big button add-step-btn" @click="addAnimationStep('hide')"><i class="plus icon"></i></button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { watch, onMounted, nextTick } from 'vue';
import { state } from '../store.js';
const ipc = (typeof window !== 'undefined' && window.require) ? window.require('electron').ipcRenderer : null;

const getFriendlyName = (s) => {
    const names = { '.bauchbinde': 'Ganze Bauchbinde', '.bauchbinde-box': 'Box', '.white': 'Box', '.text': 'Text-Bereich', 'h1': 'Name (H1)', 'h2': 'Titel (H2)', '.logo': 'Bild (Global)', '.image': 'Bild (Bauchbinde)' };
    return names[s] || s;
};

const openStepEditor = (phase, index) => {
    ipc.send('open-step-editor', { phase, index });
};

const addAnimationStep = (phase) => {
    state.animation[phase].push({ selector: '.bb-box', properties: { opacity: (phase==='show'?[0, 1]:[1, 0]) }, duration: 750, delay: 0, easing: 'easeInOutCirc' });
};

const removeAnimationStep = (phase, index) => { state.animation[phase].splice(index, 1); };

const PRESETS = {
    fade: {
        show: [{ selector: '.bb-box', properties: { opacity: [0, 1] }, duration: 750, delay: 0, easing: 'easeInOutCirc' }],
        hide: [{ selector: '.bb-box', properties: { opacity: [1, 0] }, duration: 500, delay: 0, easing: 'easeInOutCirc' }]
    },
    slideleft: {
        show: [{ selector: '.bauchbinde-instance', properties: { translateX: ['-100vw', '0vw'] }, duration: 750, delay: 0, easing: 'easeInOutCirc' }],
        hide: [{ selector: '.bauchbinde-instance', properties: { translateX: ['0vw', '-100vw'] }, duration: 500, delay: 0, easing: 'easeInOutCirc' }]
    },
    slideright: {
        show: [{ selector: '.bauchbinde-instance', properties: { translateX: ['100vw', '0vw'] }, duration: 750, delay: 0, easing: 'easeInOutCirc' }],
        hide: [{ selector: '.bauchbinde-instance', properties: { translateX: ['0vw', '100vw'] }, duration: 500, delay: 0, easing: 'easeInOutCirc' }]
    },
    slideup: {
        show: [{ selector: '.bauchbinde-instance', properties: { translateY: ['100vh', '0vh'] }, duration: 750, delay: 0, easing: 'easeInOutCirc' }],
        hide: [{ selector: '.bauchbinde-instance', properties: { translateY: ['0vh', '100vh'] }, duration: 500, delay: 0, easing: 'easeInOutCirc' }]
    },
    slideup_textdelay: {
        show: [
            { selector: '.bauchbinde-instance', properties: { translateY: ['100vh', '0vh'] }, duration: 750, delay: 0, easing: 'easeInOutCirc' },
            { selector: '.text', properties: { translateY: ['5vh', '0vh'] }, duration: 600, delay: 300, easing: 'easeInOutCirc' }
        ],
        hide: [
            { selector: '.text', properties: { translateY: ['0vh', '5vh'] }, duration: 400, delay: 0, easing: 'easeInOutCirc' },
            { selector: '.bauchbinde-instance', properties: { translateY: ['0vh', '100vh'] }, duration: 500, delay: 200, easing: 'easeInOutCirc' }
        ]
    }
};

const loadPreset = (name) => {
    if (PRESETS[name]) {
        state.animation.show = JSON.parse(JSON.stringify(PRESETS[name].show));
        state.animation.hide = JSON.parse(JSON.stringify(PRESETS[name].hide));
        state.animation.type = 'structured';
    }
};

const isPresetActive = (name) => {
    const p = PRESETS[name];
    if (!p) return false;
    // Compare only show and hide arrays
    return JSON.stringify(state.animation.show) === JSON.stringify(p.show) &&
           JSON.stringify(state.animation.hide) === JSON.stringify(p.hide);
};

let isInternalUpdate = false;
watch(() => state.animation, (na) => { 
    if (isInternalUpdate) return;
    ipc.send('update-js', JSON.parse(JSON.stringify(na))); 
}, { deep: true });

onMounted(() => {
    if (ipc) {
        ipc.on('update-js', (event, arg) => { 
            isInternalUpdate = true;
            state.animation = arg; 
            nextTick(() => { isInternalUpdate = false; });
        });
    }
});
</script>