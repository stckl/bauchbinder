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
            white: { width: 40, left: 5, bottom: 7, color: 'rgba(255,255,255,0.8)', paddingh: 5, paddingv: 2.6, borderradius: 0, divalign: 0, textalign: 0, _overrides: {} },
            h1: { fontfamily: 'Helvetica, sans-serif', fontweight: 'normal', texttransform: 'none', fontvariant: 'normal', fontsize: 5, bold: false, italic: false, color: '#000000', _overrides: {} },
            h2: { fontfamily: 'Helvetica, sans-serif', fontweight: 'normal', texttransform: 'none', fontvariant: 'normal', fontsize: 3.7, bold: false, italic: false, color: '#000000', _overrides: {} },
            unifiedCss: '',
            customFonts: [] 
        });

        const animation = reactive({ type: 'fade', duration: 750, easing: 'easeInOutCirc', code: '' });
        const newname = ref(''), newtitle = ref(''), newentryid = ref(null), active = ref(-1), appversion = ref('3.1.0');
        const systemFonts = ref([]), manualFonts = ref([]);
        const cssConflicts = ref([]); // { selector, prop, guiVal, customVal }

        const allFonts = computed(() => {
            const combined = [...design.customFonts.map(f => f.name), ...WEB_FONTS, ...systemFonts.value, ...manualFonts.value, design.h1.fontfamily, design.h2.fontfamily].filter(f => f && f !== '');
            return [...new Set(combined)];
        });

        const beautifyCSS = (text) => {
            if (!text) return "";
            return text
                .replace(/\s*([{};:])\s*/g, '$1') // Leerzeichen um Sonderzeichen weg
                .replace(/{/g, ' {\n  ') // Klammer auf -> Neue Zeile + Einrückung
                .replace(/;/g, ';\n  ') // Semikolon -> Neue Zeile + Einrückung
                .replace(/\s*}/g, '\n}\n\n') // Klammer zu -> Neue Zeile + Abstand
                .replace(/\n\s*\n/g, '\n\n') // Doppelte Leerzeilen fixen
                .replace(/  \n/g, '') // Leere eingerückte Zeilen fixen
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
                                selector: sel,
                                property: prop,
                                guiValue: guiMap[sel][prop],
                                customValue: customMap[sel][prop]
                            });
                        }
                    });
                }
            });

            cssConflicts.value = foundConflicts;
            if (foundConflicts.length > 0) {
                nextTick(() => {
                    const $m = $('#conflict-modal');
                    if (!$m.modal('is active')) {
                        $m.modal({ closable: false }).modal('show');
                    }
                });
            } else {
                $('#conflict-modal').modal('hide');
            }
        };

        const resolveConflict = (index, source) => {
            const conflict = cssConflicts.value[index];
            const isCustom = (source === 'custom');
            
            // GUI Update falls Custom gewählt wurde
            if (isCustom) {
                // Wir aktualisieren die GUI-Eigenschaft, damit buildCss() den richtigen Wert nimmt
                parseCssToProperties(`${conflict.selector} { ${conflict.property}: ${conflict.customValue}; }`);
            }

            // In jedem Fall: Duplikat aus dem Custom-Bereich entfernen (da es jetzt im Master ist)
            const parts = design.unifiedCss.split('/* CUSTOM */');
            let customPart = parts[1] || '';
            const selRegex = new RegExp(`(${conflict.selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*{[\\s\\S]*?)${conflict.property}:\\s*[^;]+;?([\\s\\S]*?})`, 'i');
            
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
}

`;

            css += `.bb-box {\n`;
            css += line(design.white, 'width', 'min-width', `${design.white.width}vw`);
            css += line(design.white, 'left', 'margin', `0 ${design.white.left}vw`);
            css += line(design.white, 'color', 'background', design.white.color);
            css += line(design.white, 'borderradius', 'border-radius', `${design.white.borderradius}px`);
            css += `  padding: ${design.white.paddingv}vh ${design.white.paddingh}vh;
`;
            css += `  text-align: ${['left', 'center', 'right'][design.white.textalign]};
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
                const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const regex = new RegExp(escapedSelector + '\\s*{[\\s\\S]*?' + prop + ':\\s*([^;]+);?', 'i');
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

            // 1. @font-face
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

            // Wir parsen jetzt nur die GUI-Werte aus dem custom-css, lassen den Rest aber stehen
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
                        isSyncing = true; // Synchronisation blockieren während des Ladens

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
                        if (ld.animation) { Object.assign(animation, ld.animation); ipc.send('update-js', JSON.parse(JSON.stringify(animation))); }
                        updateFontCSS();

                        nextTick(() => {
                            isSyncing = false;
                            auditCSS(design.unifiedCss);
                        });
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
            const allowedExts = ['ttf', 'otf', 'woff', 'woff2'];
            
            files.forEach(file => {
                const ext = file.name.split('.').pop().toLowerCase();
                if (allowedExts.includes(ext)) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        const name = file.name.replace(`.${ext}`, '');
                        if (!design.customFonts.some(f => f.name === name)) {
                            design.customFonts.push({
                                name: name,
                                data: event.target.result.split(',')[1],
                                type: ext
                            });
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
            fontList.getFonts().then(ret => { systemFonts.value = ret; }).catch(err => console.log(err));
        });

        return {
            lowerthirds, design, animation, newname, newtitle, newentryid, active, appversion, allFonts, systemFonts, manualFonts,
            cssConflicts, resolveConflict,
            addLowerthird, playLowerthird, stopLowerthird, deleteLowerthird, saveFile, openFile, openWinKey, openWinFill, setAnimation, onDragEnd, showModal,
            toggleH1Bold, toggleH1Italic, toggleH1Variant, toggleH2Bold, toggleH2Italic, toggleH2Variant, 
            addCustomFont, removeCustomFont, applyFontToH1, applyFontToH2,
            handleFontDrop
        };
    }
};

const app = createApp(App);
app.component('draggable', draggable);
app.component('fomantic-dropdown', FomanticDropdown);
app.component('color-picker', ColorPicker);
app.component('css-editor', CssEditor);
app.mount('#app');
