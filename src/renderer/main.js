import { createApp, ref, reactive, onMounted, nextTick, watch, computed } from 'vue';
import * as animeModule from 'animejs';
import draggable from 'vuedraggable';
import { css } from '@codemirror/lang-css';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorView, basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';

// Fomantic UI & Custom Style
import 'fomantic-ui-css/semantic.min.css';
import './style.css'; 
import 'fomantic-ui-css/semantic.min.js';

import { ipcRenderer as ipc } from 'electron';
const { dialog } = require('@electron/remote');
const fs = require('fs');
const path = require('path');
const fontList = require('font-list');

const WEB_FONTS = [
    'Arial, sans-serif', 'Helvetica, sans-serif', 'Verdana, sans-serif',
    'Trebuchet MS, sans-serif', 'Times New Roman, serif', 'Georgia, serif',
    'Garamond, serif', 'Courier New, monospace', 'Brush Script MT, cursive'
];

const anime = animeModule.anime || animeModule.default?.animate || animeModule.default || animeModule;

// CSS Editor Component
const CssEditor = {
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template: `<div ref="editorRef" style="height: 400px; border: 1px solid #444; border-radius: 4px; overflow: hidden;"></div>`,
    setup(props, { emit }) {
        const editorRef = ref(null);
        let view = null;
        onMounted(() => {
            const startState = EditorState.create({
                doc: props.modelValue,
                extensions: [
                    basicSetup, css(), oneDark,
                    EditorView.updateListener.of((u) => { if (u.docChanged) emit('update:modelValue', u.state.doc.toString()); }),
                    EditorView.theme({ "&": { height: "100%", fontSize: "12px" }, ".cm-scroller": { overflow: "auto" } })
                ]
            });
            view = new EditorView({ state: startState, parent: editorRef.value });
        });
        watch(() => props.modelValue, (nv) => {
            if (view && nv !== view.state.doc.toString()) {
                view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: nv } });
            }
        });
        return { editorRef };
    }
};

// ColorPicker Component
const ColorPicker = {
    props: ['modelValue', 'label'],
    emits: ['update:modelValue'],
    template: `
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
    `,
    setup(props, { emit }) {
        const pickerBtn = ref(null), popupContent = ref(null), localHex = ref('#ffffff'), localAlpha = ref(1);
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
        onMounted(() => { $(pickerBtn.value).popup({ popup: $(popupContent.value), on: 'click', position: 'bottom left', lastResort: true }); });
        watch(() => props.modelValue, (nv) => { const p = parseRGBAForState(nv); localHex.value = p.h; localAlpha.value = p.a; }, { immediate: true });
        return { pickerBtn, popupContent, localHex, localAlpha, previewRgba, updateColor, updateAlpha, updateFromText };
    }
};

const FomanticDropdown = {
    props: ['modelValue', 'options', 'customFonts', 'manualFonts', 'systemFonts'],
    emits: ['update:modelValue'],
    template: `
        <select class="ui fluid search inverted dropdown" :value="modelValue" @change="$emit('update:modelValue', $event.target.value)">
            <option value="">Schriftart wählen...</option>
            <option v-for="opt in options" :key="opt" :value="opt">
                {{ getMarker(opt) }}{{ opt }}{{ getWarning(opt) }}
            </option>
        </select>
    `,
    methods: {
        getMarker(opt) {
            if (this.customFonts?.some(f => f.name === opt)) return '⭐ ';
            if (this.manualFonts?.includes(opt)) return '📄 ';
            return '';
        },
        getWarning(opt) {
            if (!opt) return '';
            if (this.customFonts?.some(f => f.name === opt) || this.systemFonts?.includes(opt) || WEB_FONTS.includes(opt)) return '';
            return ' ⚠️ (Nicht im System gefunden!)';
        }
    }
};

const App = {
    setup() {
        const lowerthirds = ref([]);
        const design = reactive({
            white: { width: 40, left: 5, bottom: 7, color: 'rgba(255,255,255,0.8)', paddingh: 5, paddingv: 2.6, borderradius: 0, divalign: 0, textalign: 0, overflow: 'hidden', textOverflow: 'visible', _overrides: {} },
            h1: { fontfamily: 'Helvetica, sans-serif', fontweight: 'normal', texttransform: 'none', fontvariant: 'normal', fontsize: 5, bold: false, italic: false, color: '#000000', _overrides: {} },
            h2: { fontfamily: 'Helvetica, sans-serif', fontweight: 'normal', texttransform: 'none', fontvariant: 'normal', fontsize: 3.7, bold: false, italic: false, color: '#000000', _overrides: {} },
            unifiedCss: '',
            customFonts: [] 
        });

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

        const animation = reactive({
            type: 'structured', 
            duration: 750, 
            easing: 'easeInOutCirc', 
            code: '',
            show: JSON.parse(JSON.stringify(PRESETS.fade.show)),
            hide: JSON.parse(JSON.stringify(PRESETS.fade.hide))
        });

        const editingStep = ref(null);

        const getFriendlyName = (selector) => {
            const names = {
                '.bauchbinde-instance': 'Ganze Bauchbinde',
                '.bb-box': 'Box',
                '.white': 'Box',
                '.text': 'Text-Bereich',
                'h1': 'Name (H1)',
                'h2': 'Titel (H2)'
            };
            return names[selector] || selector;
        };

        const getDesignValueForEditor = (selector, prop) => {
            // 1. Native GUI mapping
            if (selector === '.bb-box' || selector === '.white') {
                if (prop === 'backgroundColor') return design.white.color;
                if (prop === 'borderRadius') return design.white.borderradius;
                if (prop === 'left') return design.white.left + 'vw';
                if (prop === 'width') return design.white.width + 'vw';
                if (prop === 'opacity') return 1;
            }
            if (selector === 'h1' || selector === 'h2') {
                const obj = selector === 'h1' ? design.h1 : design.h2;
                if (prop === 'color') return obj.color;
                if (prop === 'fontSize') return obj.fontsize + 'vh';
                if (prop === 'fontWeight') return obj.fontweight || (obj.bold ? '700' : '400');
            }
            if (selector === '.bauchbinde' || selector === '.bauchbinde-instance') {
                if (prop === 'bottom') return design.white.bottom + 'vh';
                if (prop === 'borderRadius') return 0;
            }

            // 2. Fallback: Search in Custom CSS part of unifiedCss
            const parts = design.unifiedCss.split('/* CUSTOM */');
            const customCss = parts[1] || '';
            const escapedSelector = selector.replace(/[.*+?^${}()|[\\]/g, '\$&');
            const cssProp = prop.replace(/([A-Z])/g, '-$1').toLowerCase();
            const regex = new RegExp(escapedSelector + '\s*{[\s\S]*?' + cssProp + ':\s*([^;]+);?', 'i');
            const match = customCss.match(regex);
            if (match) return match[1].trim();

            // 3. Defaults for everything else
            const defaults = { 
                opacity: 1, scale: 1, rotate: 0, skewX: 0, translateX: '0vw', translateY: '0vh', 
                left: '0vw', right: '0vw', top: '0vh', bottom: '0vh',
                marginTop: '0px', marginRight: '0px', marginBottom: '0px', marginLeft: '0px',
                paddingTop: '0px', paddingRight: '0px', paddingBottom: '0px', paddingLeft: '0px',
                borderWidth: '0px', borderColor: '#ffffff', borderRadius: '0px', width: 'auto'
            };
            return defaults[prop] !== undefined ? defaults[prop] : 0;
        };

        const updateDesignValueFromAnimation = (selector, prop, value) => {
            // Native Sync
            if (selector === '.bb-box' || selector === '.white') {
                if (prop === 'backgroundColor') { design.white.color = value; return; }
                if (prop === 'borderRadius') { design.white.borderradius = parseFloat(value) || 0; return; }
                if (prop === 'left') { design.white.left = parseFloat(value) || 0; return; }
                if (prop === 'width') { design.white.width = parseFloat(value) || 0; return; }
            }
            if (selector === 'h1' || selector === 'h2') {
                const obj = selector === 'h1' ? design.h1 : design.h2;
                if (prop === 'color') { obj.color = value; return; }
                if (prop === 'fontSize') { obj.fontsize = parseFloat(value) || 0; return; }
                if (prop === 'fontWeight') { obj.fontweight = value; return; }
            }
            if (selector === '.bauchbinde' || selector === '.bauchbinde-instance') {
                if (prop === 'bottom') { design.white.bottom = parseFloat(value) || 0; return; }
            }

            // Auto-Unit Intelligence
            let valWithUnit = value;
            if (value !== '' && !isNaN(value)) {
                if (['translateX', 'left', 'right', 'width'].includes(prop)) valWithUnit += 'vw';
                else if (['translateY', 'top', 'bottom', 'marginBottom', 'marginTop'].includes(prop)) valWithUnit += 'vh';
                else if (['rotate', 'skewX'].includes(prop)) valWithUnit += 'deg';
                else if (['borderWidth', 'borderRadius', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft'].includes(prop)) valWithUnit += 'px';
            }

            // Custom CSS Sync
            const cssProp = prop.replace(/([A-Z])/g, '-$1').toLowerCase();
            const parts = design.unifiedCss.split('/* CUSTOM */');
            let customPart = (parts[1] || '').trim();
            const escapedSelector = selector.replace(/[.*+?^${}()|[\\]/g, '\$&');
            const selRegex = new RegExp(`(${escapedSelector}\s*{[\s\S]*?})`, 'i');
            const propRegex = new RegExp(`${cssProp}:\s*[^;]+;?`, 'i');

            if (selRegex.test(customPart)) {
                customPart = customPart.replace(selRegex, (match) => {
                    return propRegex.test(match) ? match.replace(propRegex, `${cssProp}: ${valWithUnit};`) : match.replace(/}$/, `  ${cssProp}: ${valWithUnit};
}`);
                });
            } else {
                customPart += `

${selector} {
  ${cssProp}: ${valWithUnit};
}`;
            }
            design.unifiedCss = parts[0].trim() + "\n\n/* CUSTOM */\n" + customPart.trim();
        };

        const setStepProperty = (step, prop, value) => {
            if (prop === 'motion_x_type') {
                ['translateX', 'left', 'right'].forEach(p => delete step.properties[p]);
                if (value !== 'none') step.properties[value] = [editingStep.value?.phase==='show'?'100vw':'0vw', getDesignValueForEditor(step.selector, value)];
                return;
            }
            if (prop === 'motion_y_type') {
                ['translateY', 'top', 'bottom', 'marginBottom'].forEach(p => delete step.properties[p]);
                if (value !== 'none') step.properties[value] = [editingStep.value?.phase==='show'?'100vh':'0vh', getDesignValueForEditor(step.selector, value)];
                return;
            }
            step.properties[prop] = value;
        };

        const getMotionXType = (step) => {
            if (step.properties.translateX !== undefined) return 'translateX';
            if (step.properties.left !== undefined) return 'left';
            return 'none';
        };

        const getMotionYType = (step) => {
            if (step.properties.translateY !== undefined) return 'translateY';
            if (step.properties.top !== undefined) return 'top';
            return 'none';
        };

        const openStepEditor = (phase, index) => {
            editingStep.value = { phase, index, step: animation[phase][index] };
            nextTick(() => {
                $('#step-modal').modal({
                    onHide: () => { editingStep.value = null; },
                    allowMultiple: true
                }).modal('show');
                initAccordions();
            });
        };

        const initAccordions = () => {
            nextTick(() => {
                $('.ui.accordion.structured-editor-acc').accordion({ exclusive: false });
            });
        };

        const addAnimationStep = (phase) => {
            animation[phase].push({
                selector: '.bb-box',
                properties: { opacity: (phase==='show'?[0, 1]:[1, 0]) },
                duration: 750,
                delay: 0,
                easing: 'easeInOutCirc'
            });
            initAccordions();
        };

        const removeAnimationStep = (phase, index) => {
            animation[phase].splice(index, 1);
        };

        const loadPreset = (name) => {
            if (PRESETS[name]) {
                animation.show = JSON.parse(JSON.stringify(PRESETS[name].show));
                animation.hide = JSON.parse(JSON.stringify(PRESETS[name].hide));
                animation.type = 'structured';
                initAccordions();
            }
        };

        const newname = ref(''), newtitle = ref(''), newentryid = ref(null), active = ref(-1), appversion = ref('4.0.0');
        const systemFonts = ref([]), manualFonts = ref([]);
        const cssConflicts = ref([]);

        const allFonts = computed(() => {
            const combined = [...design.customFonts.map(f => f.name), ...WEB_FONTS, ...systemFonts.value, ...manualFonts.value, design.h1.fontfamily, design.h2.fontfamily].filter(f => f && f !== '');
            return [...new Set(combined)];
        });

        const beautifyCSS = (text) => {
            if (!text) return "";
            return text
                .replace(/\s*([{};:])\s*/g, '$1') 
                .replace(/{/g, ' {\n  ') 
                .replace(/;/g, ':\n  ') 
                .replace(/\s*}/g, '\n}\n\n') 
                .replace(/\n\s*\n/g, '\n\n') 
                .replace(/  \n/g, '') 
                .trim();
        };

        const auditCSS = (cssText) => {
            if (!cssText) return;
            const parts = cssText.split('/* CUSTOM */');
            const guiCss = parts[0];
            const customCss = parts[1] || '';

            const parseToMap = (text) => {
                const map = {};
                const lines = text.split('\n');
                let currentSel = null;
                lines.forEach(l => {
                    const s = l.match(/^([^{]+)\s*{/);
                    if (s) { currentSel = s[1].trim(); if (!map[currentSel]) map[currentSel] = {}; } 
                    else if (l.includes('}')) currentSel = null;
                    else if (currentSel && l.includes(':')) {
                        const p = l.match(/^\s*([^:]+):\s*([^;]+);?/);
                        if (p) map[currentSel][p[1].trim()] = p[2].trim();
                    }
                });
                return map;
            };

            const guiMap = parseToMap(guiCss);
            const customMap = parseToMap(customCss);
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
                    if (!$m.modal('is active')) $m.modal({ closable: false }).modal('show');
                });
            } else {
                $('#conflict-modal').modal('hide');
            }
        };

        const resolveConflict = (index, source) => {
            const conflict = cssConflicts.value[index];
            if (source === 'custom') parseCssToProperties(`${conflict.selector} { ${conflict.property}: ${conflict.customValue}; }`);
            const parts = design.unifiedCss.split('/* CUSTOM */');
            let customPart = parts[1] || '';
            const selRegex = new RegExp(`(${conflict.selector.replace(/[.*+?^${}()|[\\]/g, '\$&')}\s*{[\s\S]*?)${conflict.property}:\s*[^;]+;?([\s\S]*?})`, 'i');
            customPart = customPart.replace(selRegex, (match, start, end) => {
                const inner = (start.split('{')[1] + end.split('}')[0]).trim();
                return inner.length === 0 ? '' : `${start.split('{')[0]} {\n  ${inner}\n}`;
            });
            design.unifiedCss = buildCss() + "\n/* CUSTOM */\n" + customPart.trim();
            cssConflicts.value.splice(index, 1);
            if (cssConflicts.value.length === 0) $('#conflict-modal').modal('hide');
        };

        const buildCss = () => {
            const line = (obj, key, prop, val) => {
                const comment = (obj._overrides && obj._overrides[key]) ? ' /* aus custom-css */' : '';
                return `  ${prop}: ${val};${comment}\n`;
            };

            let css = `.bauchbinde {\n`;
            css += line(design.white, 'bottom', 'bottom', `${design.white.bottom}vh`);
            css += `  text-align: ${['left', 'center', 'right'][design.white.divalign]};
  overflow: visible;
}

`;

            css += `.bb-box {\n`;
            css += line(design.white, 'width', 'min-width', `${design.white.width}vw`);
            css += line(design.white, 'left', 'margin', `0 ${design.white.left}vw`);
            css += line(design.white, 'color', 'background', design.white.color);
            css += line(design.white, 'borderradius', 'border-radius', `${design.white.borderradius}px`);
            css += `  padding: ${design.white.paddingv}vh ${design.white.paddingh}vh;
  text-align: ${['left', 'center', 'right'][design.white.textalign]};
  overflow: ${design.white.overflow || 'hidden'};
}

.text {\n`;
            css += `  overflow: ${design.white.textOverflow || 'visible'};
}

`;

            const textBlock = (sel, obj) => {
                let s = `${sel} {\n`;
                s += line(obj, 'fontfamily', 'font-family', `'${obj.fontfamily}'`);
                s += line(obj, 'fontsize', 'font-size', `${obj.fontsize}vh`);
                s += `  line-height: ${obj.fontsize}vh;
`;
                s += line(obj, 'color', 'color', obj.color);
                s += line(obj, 'fontweight', 'font-weight', obj.fontweight || (obj.bold ? 'bold' : 'normal'));
                s += line(obj, 'italic', 'font-style', obj.italic ? 'italic' : 'normal');
                s += line(obj, 'texttransform', 'text-transform', obj.texttransform || 'none');
                s += line(obj, 'fontvariant', 'font-variant', obj.fontvariant || 'normal');
                s += `}

`;
                return s;
            };

            css += textBlock('h1', design.h1);
            css += textBlock('h2', design.h2);
            return css;
        };

        const parseCssToProperties = (css) => {
            if (!css) return;
            const extractValue = (selector, prop) => {
                const escapedSelector = selector.replace(/[.*+?^${}()|[\\]/g, '\$&');
                const regex = new RegExp(escapedSelector + '\s*{[\s\S]*?' + prop + ':\s*([^;]+);?', 'i');
                const match = css.match(regex);
                return match ? match[1].trim().replace(/['"]/g, '') : null;
            };

            const bottom = extractValue('.bauchbinde', 'bottom');
            if (bottom) design.white.bottom = parseFloat(bottom);
            const align = extractValue('.bauchbinde', 'text-align');
            if (align) design.white.divalign = ['left', 'center', 'right'].indexOf(align);

            const minWidth = extractValue('.bb-box', 'min-width') || extractValue('.white', 'min-width');
            if (minWidth) design.white.width = parseFloat(minWidth);
            const bg = extractValue('.bb-box', 'background') || extractValue('.white', 'background');
            if (bg) design.white.color = bg;
            const radius = extractValue('.bb-box', 'border-radius') || extractValue('.white', 'border-radius');
            if (radius) design.white.borderradius = parseFloat(radius);
            const overflow = extractValue('.bb-box', 'overflow');
            if (overflow) design.white.overflow = overflow;
            const textOverflow = extractValue('.text', 'overflow');
            if (textOverflow) design.white.textOverflow = textOverflow;

            const parseText = (sel, obj) => {
                const family = extractValue(sel, 'font-family');
                if (family) { obj.fontfamily = family; if (!allFonts.value.includes(family)) manualFonts.value.push(family); }
                const size = extractValue(sel, 'font-size');
                if (size) obj.fontsize = parseFloat(size);
                const color = extractValue(sel, 'color');
                if (color) obj.color = color;
                const weight = extractValue(sel, 'font-weight');
                if (weight) { obj.fontweight = weight; obj.bold = (weight === 'bold' || parseInt(weight) >= 700); }
                const style = extractValue(sel, 'font-style');
                if (style) obj.italic = (style === 'italic');
                const transform = extractValue(sel, 'text-transform');
                if (transform) obj.texttransform = transform;
                const variant = extractValue(sel, 'font-variant');
                if (variant) obj.fontvariant = variant;
            };
            parseText('h1', design.h1); parseText('h2', design.h2);
        };

        const migrateFontsAndStyles = (customcss) => {
            if (!customcss) return "";
            let remainingCss = customcss;
            const fontFaceRegex = /@font-face\s*{([\s\S]*?)}/gi;
            let ffMatch;
            while ((ffMatch = fontFaceRegex.exec(customcss)) !== null) {
                const fullBlock = ffMatch[0], content = ffMatch[1];
                const familyMatch = content.match(/font-family:\s*['"](.+?)['"]/i);
                const srcMatch = content.match(/src:\s*url\(['"]data:font\/(.+?);base64,(.+?)['"]\)/i);
                if (familyMatch && srcMatch) {
                    if (!design.customFonts.some(f => f.name === familyMatch[1])) {
                        design.customFonts.push({ name: familyMatch[1], type: srcMatch[1], data: srcMatch[2] });
                    }
                    remainingCss = remainingCss.replace(fullBlock, '');
                }
            }
            parseCssToProperties(customcss);
            return beautifyCSS(remainingCss);
        };

        const addLowerthird = () => {
            if (newentryid.value !== null) { lowerthirds.value[newentryid.value] = { name: newname.value, title: newtitle.value }; }
            else { lowerthirds.value.push({ name: newname.value, title: newtitle.value }); }
            newname.value = ''; newtitle.value = ''; newentryid.value = null;
            ipc.send('update-data', JSON.parse(JSON.stringify(lowerthirds.value))); $('#entry-modal').modal('hide');
        };

        const playLowerthird = (i) => { active.value = i; ipc.send('show-lowerthird', JSON.parse(JSON.stringify(lowerthirds.value[i]))); };
        const stopLowerthird = () => { ipc.send('hide-lowerthird'); active.value = -1; };
        const deleteLowerthird = (id) => { lowerthirds.value.splice(id, 1); ipc.send('update-data', JSON.parse(JSON.stringify(lowerthirds.value))); $('#entry-modal').modal('hide'); };

        const saveFile = () => {
            const fd = { lowerthirds: lowerthirds.value, design: design, animation: animation };
            const el = document.createElement("a");
            el.href = URL.createObjectURL(new Blob([JSON.stringify(fd)], { type: "text/json" }));
            el.download = "bauchbinder_project.json"; el.click();
        };

        const openFile = () => {
            dialog.showOpenDialog({ properties: ['openFile'] }).then(res => {
                if (!res.canceled && res.filePaths.length > 0) {
                    fs.readFile(res.filePaths[0], 'utf8', (err, data) => {
                        const ld = JSON.parse(data);
                        isSyncing = true;
                        if (ld.lowerthirds) { lowerthirds.value = ld.lowerthirds; ipc.send('update-data', JSON.parse(JSON.stringify(ld.lowerthirds))); }
                        if (ld.design) {
                            if (!ld.design.customFonts) ld.design.customFonts = [];
                            design.h1._overrides = {}; design.h2._overrides = {}; design.white._overrides = {};
                            if (!ld.design.unifiedCss) {
                                Object.assign(design, ld.design);
                                const cleaned = migrateFontsAndStyles(ld.design.customcss || "");
                                design.unifiedCss = buildCss() + "\n/* CUSTOM */\n" + cleaned;
                            } else {
                                Object.assign(design, ld.design);
                                parseCssToProperties(design.unifiedCss); 
                            }
                            ipc.send('update-css', JSON.parse(JSON.stringify(design)));
                        }
                        if (ld.animation) { 
                            if (ld.animation.type !== 'structured' && PRESETS[ld.animation.type]) {
                                const oldType = ld.animation.type;
                                const oldDuration = parseInt(ld.animation.duration || 750);
                                const oldEasing = ld.animation.easing || 'easeInOutCirc';
                                loadPreset(oldType);
                                animation.show.forEach(step => { step.duration = oldDuration; step.easing = oldEasing; });
                                animation.hide.forEach(step => { step.duration = Math.round(oldDuration * 0.7); step.easing = oldEasing; });
                                animation.type = 'structured';
                            } else {
                                Object.assign(animation, ld.animation);
                                if (!animation.type) animation.type = 'structured';
                            }
                            ipc.send('update-js', JSON.parse(JSON.stringify(animation))); 
                        }
                        updateFontCSS();
                        nextTick(() => { isSyncing = false; auditCSS(design.unifiedCss); });
                    });
                }
            });
        };

        const updateFontCSS = () => {
            let css = '';
            design.customFonts.forEach(f => {
                let fmt = f.type === 'ttf' ? 'truetype' : (f.type === 'otf' ? 'opentype' : f.type);
                css += `@font-face { font-family: '${f.name}'; src: url(data:font/${f.type};base64,${f.data}) format('${fmt}'); }\n`;
            });
            $('#custom-font-styles').remove(); $('head').append(`<style id="custom-font-styles">${css}</style>`);
        };

        const addCustomFont = () => {
            dialog.showOpenDialog({ 
                filters: [{ name: 'Fonts', extensions: ['ttf', 'otf', 'woff', 'woff2'] }], 
                properties: ['openFile', 'multiSelections'] 
            }).then(res => {
                if (!res.canceled && res.filePaths.length > 0) {
                    res.filePaths.forEach(fp => {
                        const ext = path.extname(fp).replace('.', ''), fn = path.basename(fp, path.extname(fp));
                        if (!design.customFonts.some(f => f.name === fn)) {
                            design.customFonts.push({ name: fn, data: fs.readFileSync(fp).toString('base64'), type: ext });
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
                        if (!design.customFonts.some(f => f.name === name)) {
                            design.customFonts.push({ name: name, data: event.target.result.split(',')[1], type: ext });
                            updateFontCSS();
                        }
                    };
                    reader.readAsDataURL(file);
                }
            });
        };

        const removeCustomFont = (i) => { design.customFonts.splice(i, 1); updateFontCSS(); };
        const applyFontToH1 = (n) => { design.h1.fontfamily = n; };
        const applyFontToH2 = (n) => { design.h2.fontfamily = n; };
        const toggleH1Bold = () => { design.h1.bold = !design.h1.bold; }, toggleH1Italic = () => { design.h1.italic = !design.h1.italic; }, toggleH1Variant = () => { design.h1.fontvariant = design.h1.fontvariant === 'small-caps' ? 'normal' : 'small-caps'; };
        const toggleH2Bold = () => { design.h2.bold = !design.h2.bold; }, toggleH2Italic = () => { design.h2.italic = !design.h2.italic; }, toggleH2Variant = () => { design.h2.fontvariant = design.h2.fontvariant === 'small-caps' ? 'normal' : 'small-caps'; };
        const openWinKey = () => ipc.send('openwinkey'), openWinFill = () => ipc.send('openwinfill'), setAnimation = (t) => { animation.type = t; };
        const toggleFullscreenKey = () => ipc.send('toggle-fullscreen-key');
        const toggleFullscreenFill = () => ipc.send('toggle-fullscreen-fill');
        const onDragEnd = () => { active.value = -1; ipc.send('update-data', JSON.parse(JSON.stringify(lowerthirds.value))); };
        const showModal = (e) => {
            let id = (typeof e === 'number') ? e : null;
            if (id !== null) { newname.value = lowerthirds.value[id].name; newtitle.value = lowerthirds.value[id].title; newentryid.value = id; }
            else { newname.value = ''; newtitle.value = ''; newentryid.value = null; }
            $('#entry-modal').modal('show');
        };

        let isSyncing = false;
        watch(() => [design.white, design.h1, design.h2], () => {
            if (!isSyncing) {
                isSyncing = true;
                const parts = design.unifiedCss.split('/* CUSTOM */');
                const customPart = parts.length > 1 ? parts[1].trim() : '';
                design.unifiedCss = buildCss() + "\n/* CUSTOM */\n" + customPart;
                nextTick(() => { isSyncing = false; });
            }
        }, { deep: true });

        watch(() => design.unifiedCss, (nv) => {
            if (!isSyncing) {
                isSyncing = true;
                parseCssToProperties(nv); 
                auditCSS(nv);
                ipc.send('update-css', JSON.parse(JSON.stringify(design)));
                nextTick(() => { isSyncing = false; });
            }
        });

        watch(animation, (na) => { ipc.send('update-js', JSON.parse(JSON.stringify(na))); }, { deep: true });

        onMounted(() => {
            if (!design.unifiedCss) design.unifiedCss = buildCss();
            ipc.send('update-css', JSON.parse(JSON.stringify(design)));
            ipc.send('update-js', JSON.parse(JSON.stringify(animation)));
            $('.menu .item').tab();
            $('#entry-modal').modal();
            $('#conflict-modal').modal({ closable: false });
            $('.ui.dropdown').dropdown();
            initAccordions();
            fontList.getFonts().then(ret => { systemFonts.value = ret; }).catch(err => console.log(err));
        });

        return {
            lowerthirds, design, animation, newname, newtitle, newentryid, active, appversion, allFonts, systemFonts, manualFonts,
            cssConflicts, resolveConflict,
            addLowerthird, playLowerthird, stopLowerthird, deleteLowerthird, saveFile, openFile, openWinKey, openWinFill, setAnimation, onDragEnd, showModal,
            toggleH1Bold, toggleH1Italic, toggleH1Variant, toggleH2Bold, toggleH2Italic, toggleH2Variant, 
            toggleFullscreenKey, toggleFullscreenFill,
            addCustomFont, removeCustomFont, applyFontToH1, applyFontToH2,
            handleFontDrop,
            addAnimationStep, removeAnimationStep, loadPreset, setStepProperty, getMotionXType, getMotionYType,
            getDesignValueForEditor, updateDesignValueFromAnimation,
            editingStep, openStepEditor, getFriendlyName
        };
    }
};

const app = createApp(App);
app.component('draggable', draggable);
app.component('fomantic-dropdown', FomanticDropdown);
app.component('color-picker', ColorPicker);
app.component('css-editor', CssEditor);
app.mount('#app');