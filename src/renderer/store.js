import { reactive, ref, watch } from 'vue';
import { ipcRenderer as ipc } from 'electron';

export const state = reactive({
    lowerthirds: [],
    design: {
        white: { 
            width: 40, left: 5, bottom: 7, height: 0, fixedWidth: false, fixedHeight: false,
            color: 'rgba(255,255,255,0.8)', 
            paddingh: 5, paddingv: 2.6, borderradius: 0, 
            divalign: 0, textalign: 0, overflow: 'hidden', textOverflow: 'visible',
            flexAlign: 'center', flexJustify: 'center', flexGap: 2, imageHeight: true, imageManualHeight: 10,
            _overrides: {} 
        },
        layoutOrder: [
            { id: '.logo', name: 'Bild (Global)', alignSelf: 'auto' },
            { id: '.image', name: 'Bild (Bauchbinde)', alignSelf: 'auto' },
            { id: '.text', name: 'Text', alignSelf: 'auto' }
        ],
        logoStyle: { height: 100, width: 0, radius: 0, opacity: 1, margin: 0, position: 'static', x: 0, y: 0, fitHeight: true, _overrides: {} },
        imageStyle: { height: 100, width: 0, radius: 0, opacity: 1, margin: 0, position: 'static', x: 0, y: 0, fitHeight: true, _overrides: {} },
        h1: { fontfamily: 'Helvetica, sans-serif', fontweight: 'normal', texttransform: 'none', fontvariant: 'normal', fontsize: 5, italic: false, color: '#000000', _overrides: {} },
        h2: { fontfamily: 'Helvetica, sans-serif', fontweight: 'normal', texttransform: 'none', fontvariant: 'normal', fontsize: 3.7, italic: false, color: '#000000', _overrides: {} },
        unifiedCss: '',
        customFonts: [],
        logo: null
    },
    animation: {
        type: 'fade', 
        duration: 750, 
        easing: 'easeInOutCirc', 
        code: '',
        show: [],
        hide: []
    }
});

export const activeIndex = ref(-1);
export const systemFonts = ref([]);
export const manualFonts = ref([]);

// Sync logic can move here or stay in main app logic
