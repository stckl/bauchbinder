import { reactive, ref } from 'vue';

export const state = reactive({
    isInternalUpdate: false,
    lowerthirds: [
        { name: 'Max Mustermann', title: 'Beispiel-Titel für Bauchbinde', image: null }
    ],
    design: {
        white: { 
            width: 10, left: 5, bottom: 7, height: 1, fixedWidth: false, fixedHeight: false,
            color: 'rgba(255,255,255,0.8)', 
            paddingTop: 2.6, paddingRight: 5, paddingBottom: 2.6, paddingLeft: 5, borderradius: 0, 
            divalign: 0, textalign: 0, overflow: 'hidden', textOverflow: 'visible',
            flexAlign: 'center', flexJustify: 'center', flexGap: 2, imageHeight: true, imageManualHeight: 10,
            _overrides: {} 
        },
        container: {
            left: { enabled: false, value: 0 },
            right: { enabled: false, value: 0 },
            top: { enabled: false, value: 0 },
            bottom: { enabled: true, value: 7 },
            width: { enabled: false, value: 100 },
            height: { enabled: false, value: 100 }
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
        unifiedCss: `.bauchbinde {
  display: flex;
  width: 100%;
  left: 0;
  right: 0;
  bottom: 7vh;
  justify-content: flex-start;
}

.bauchbinde-box {
  min-width: 10vw;
  min-height: 1vh;
  margin: 0 5vw;
  background: rgba(255,255,255,0.8);
  border-radius: 0px;
  padding: 2.6vh 5vh 2.6vh 5vh;
  text-align: left;
  overflow: hidden;
  align-items: center;
  justify-content: center;
  gap: 2vh;
}

.logo {
  height: 10vh;
  width: auto;
  border-radius: 0px;
  opacity: 1;
  margin-left: 0vh;
  margin-right: 0vh;
}

.image {
  height: 10vh;
  width: auto;
  border-radius: 0px;
  opacity: 1;
  margin-left: 0vh;
  margin-right: 0vh;
}

.logo { order: 1; align-self: auto; }
.image { order: 2; align-self: auto; }
.text { order: 3; align-self: auto; }

.text {
  overflow: visible;
}

h1 {
  font-family: Helvetica, sans-serif;
  font-size: 5vh;
  line-height: 5vh;
  color: #000000;
  font-weight: normal;
  font-style: normal;
  text-transform: none;
  font-variant: normal;
}

h2 {
  font-family: Helvetica, sans-serif;
  font-size: 3.7vh;
  line-height: 3.7vh;
  color: #000000;
  font-weight: normal;
  font-style: normal;
  text-transform: none;
  font-variant: normal;
}
`,
        customFonts: [],
        logo: null
    },
    animation: {
        type: 'structured',
        duration: 1000,
        easing: 'easeInOutCirc',
        code: '',
        show: [{ selector: '.bb-box', properties: { opacity: [0, 1] }, duration: 1000, delay: 0, easing: 'easeInOutCirc' }],
        hide: [{ selector: '.bb-box', properties: { opacity: [1, 0] }, duration: 750, delay: 0, easing: 'easeInOutCirc' }]
    }
});

export const activeIndex = ref(-1);
export const systemFonts = ref([]);
export const manualFonts = ref([]);
