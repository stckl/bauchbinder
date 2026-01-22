import { reactive, ref } from 'vue';

export const state = reactive({
    lowerthirds: [
        { name: 'Max Mustermann', title: 'Beispiel-Titel für Bauchbinde', image: null }
    ],
    design: {
        white: { 
            width: 10, left: 5, bottom: 7, height: 1, fixedWidth: false, fixedHeight: false,
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
        logoStyle: { height: 10, width: 0, radius: 0, opacity: 1, marginLeft: 0, marginRight: 0, position: 'static', x: 0, y: 0, fitHeight: false, _overrides: {} },
        imageStyle: { height: 10, width: 0, radius: 0, opacity: 1, marginLeft: 0, marginRight: 0, position: 'static', x: 0, y: 0, fitHeight: false, _overrides: {} },
        h1: { fontfamily: 'Helvetica, sans-serif', fontweight: 'normal', texttransform: 'none', fontvariant: 'normal', fontsize: 5, italic: false, color: '#000000', _overrides: {} },
        h2: { fontfamily: 'Helvetica, sans-serif', fontweight: 'normal', texttransform: 'none', fontvariant: 'normal', fontsize: 3.7, italic: false, color: '#000000', _overrides: {} },
        unifiedCss: '',
        customFonts: [],
        logo: null
    },
    animation: {
        type: 'structured', 
        duration: 750, 
        easing: 'easeInOutCirc', 
        code: '',
        show: [{ selector: '.bb-box', properties: { opacity: [0, 1] }, duration: 750, delay: 0, easing: 'easeInOutCirc' }],
        hide: [{ selector: '.bb-box', properties: { opacity: [1, 0] }, duration: 500, delay: 0, easing: 'easeInOutCirc' }]
    }
});

export const activeIndex = ref(-1);
export const systemFonts = ref([]);
export const manualFonts = ref([]);
