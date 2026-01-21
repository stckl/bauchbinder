<template>
    <div class="field">
        <label v-if="label">{{ label }}</label>
        <div class="ui fluid action input inverted">
            <div class="ui button" ref="pickerBtn" :style="{ background: modelValue, border: '1px solid rgba(255,255,255,0.2)', width: '40px', padding: 0 }"></div>
            <input type="text" :value="modelValue" @change="updateFromText($event.target.value)" @keyup.enter="$event.target.blur()" style="font-family: monospace; font-size: 11px;">
        </div>
        <div class="ui popup inverted" ref="popupContent" style="min-width: 220px; background: #1b1c1d; border: 1px solid #444; padding: 15px;">
            <div class="ui inverted form">
                <div class="field">
                    <div :style="{ background: previewRgba, height: '30px', borderRadius: '4px', marginBottom: '10px', border: '1px solid #555' }"></div>
                    <input type="color" :value="localHex" @input="updateColor($event.target.value)" style="width: 100%; height: 40px; background: none; border: none; cursor: pointer; padding: 0;">
                </div>
                <div class="field" style="margin-top: 15px;">
                    <div style="display: flex; justify-content: space-between; color: rgba(255,255,255,0.7); font-size: 10px; margin-bottom: 5px;">
                        <span>Transparenz</span>
                        <span>{{ Math.round(localAlpha * 100) }}%</span>
                    </div>
                    <input type="range" min="0" max="1" step="0.01" :value="localAlpha" @input="updateAlpha($event.target.value)" style="width: 100%;">
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import $ from 'jquery';

const props = defineProps(['modelValue', 'label']);
const emit = defineEmits(['update:modelValue']);

const pickerBtn = ref(null);
const popupContent = ref(null);
const localHex = ref('#ffffff');
const localAlpha = ref(1);

const parseToRGBA = (str) => {
    if (!str) return null; str = str.trim();
    if (/^#[0-9a-f]{3}$/i.test(str)) { const r = parseInt(str[1] + str[1], 16), g = parseInt(str[2] + str[2], 16), b = parseInt(str[3] + str[3], 16); return `rgba(${r}, ${g}, ${b}, 1)`; }
    if (/^#[0-9a-f]{6}$/i.test(str)) { const r = parseInt(str.slice(1, 3), 16), g = parseInt(str.slice(3, 5), 16), b = parseInt(str.slice(5, 7), 16); return `rgba(${r}, ${g}, ${b}, 1)`; }
    if (/^#[0-9a-f]{8}$/i.test(str)) { const r = parseInt(str.slice(1, 3), 16), g = parseInt(str.slice(3, 5), 16), b = parseInt(str.slice(5, 7), 16); const a = (parseInt(str.slice(7, 9), 16) / 255).toFixed(2); return `rgba(${r}, ${g}, ${b}, ${a})`; }
    if (/^rgba?\s*\(.*\)$/i.test(str)) return str; return null;
};

const parseRGBAForState = (rgba) => {
    if (!rgba) return { h: '#ffffff', a: 1 };
    const m = rgba.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)/i);
    if (!m) return { h: '#ffffff', a: 1 };
    const toHex = (c) => parseInt(c).toString(16).padStart(2, '0');
    return { h: `#${toHex(m[1])}${toHex(m[2])}${toHex(m[3])}`, a: m[4] ? parseFloat(m[4]) : 1 };
};

const previewRgba = computed(() => {
    const r = parseInt(localHex.value.slice(1, 3), 16), g = parseInt(localHex.value.slice(3, 5), 16), b = parseInt(localHex.value.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${localAlpha.value})`;
});

const sync = () => { emit('update:modelValue', previewRgba.value); };
const updateColor = (nh) => { localHex.value = nh; sync(); };
const updateAlpha = (na) => { localAlpha.value = parseFloat(na); sync(); };
const updateFromText = (text) => { const rgba = parseToRGBA(text); if (rgba) emit('update:modelValue', rgba); };

onMounted(() => { 
    $(pickerBtn.value).popup({ popup: $(popupContent.value), on: 'click', position: 'bottom left', lastResort: true }); 
});

watch(() => props.modelValue, (nv) => { 
    const p = parseRGBAForState(nv); 
    localHex.value = p.h; 
    localAlpha.value = p.a; 
}, { immediate: true });
</script>
