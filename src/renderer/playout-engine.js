import { io } from 'socket.io-client';
import * as animeModule from 'animejs';
import $ from 'jquery';

window['$'] = window['jQuery'] = $;

const animate = animeModule.animate || animeModule.default?.animate || animeModule.default || animeModule;
window['anime'] = animate;

let ipc = null;
if (typeof window !== 'undefined' && window.process && window.process.versions?.electron) {
    try {
        const req = window['require'];
        if (req) ipc = req('electron').ipcRenderer;
    } catch (e) {}
}

let currentMode = 'h5'; 
let currentDesign = null;
let currentAnimation = { type: 'fade', duration: 750, easing: 'easeInOutCirc' };
let activeLowerthirds = []; 
let nextQueuedPlayout = null;
let isStopping = false;

export function initEngine(mode) {
    currentMode = mode;
    console.log(`[ENGINE] Playout Mode: ${mode}`);

    if (!document.getElementById('bb-container')) {
        const container = document.createElement('div');
        container.id = 'bb-container';
        container.style.cssText = "position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; overflow: hidden; pointer-events: none; z-index: 9999;";
        document.body.appendChild(container);
    }

    document.body.style.backgroundColor = 'black';
    document.body.style.margin = '0';

    const handleShow = (msg, source) => {
        if (ipc && source === 'socket') return;
        if (activeLowerthirds.length > 0 || isStopping) {
            nextQueuedPlayout = msg;
            if (!isStopping) stopAll();
        } else {
            play(msg);
        }
    };

    if (ipc) {
        ipc.on('show-lowerthird', (e, msg) => handleShow(msg, 'ipc'));
        ipc.on('hide-lowerthird', () => stopAll());
        ipc.on('update-css', (e, d) => { currentDesign = d; applyUnifiedStyles(d); });
        ipc.on('update-js', (e, a) => { currentAnimation = a; });
        ipc.send('request-state');
    }

    const socket = io('http://localhost:5001');
    socket.on('show-lowerthird', (msg) => handleShow(msg, 'socket'));
    socket.on('hide-lowerthird', () => stopAll());
    socket.on('update-css', (d) => { currentDesign = d; applyUnifiedStyles(d); });
    socket.on('update-js', (a) => { currentAnimation = a; });
    socket.emit('request-state');
}

function getRGBA(color) {
    const d = document.createElement("div");
    d.style.color = color || 'white';
    document.body.appendChild(d);
    const cs = window.getComputedStyle(d).color;
    document.body.removeChild(d);
    const vals = cs.match(/[0-9.]+/g);
    if (!vals) return { r: 255, g: 255, b: 255, a: 1 };
    return {
        r: parseInt(vals[0]), g: parseInt(vals[1]), b: parseInt(vals[2]),
        a: vals[3] ? parseFloat(vals[3]) : 1
    };
}

function transformCssColors(css) {
    if (!css) return '';
    const colorRegex = /(?:rgba?\s*\(.*\)|#[0-9a-fA-F]{3,8})/gi;
    return css.replace(colorRegex, (match) => {
        const rgba = getRGBA(match);
        if (currentMode === 'key') return `rgba(255, 255, 255, ${rgba.a})`;
        if (currentMode === 'fill') return `rgb(${rgba.r}, ${rgba.g}, ${rgba.b})`;
        return match;
    });
}

function applyUnifiedStyles(design) {
    if (!design || !design.unifiedCss) return;
    let fontCss = '';
    if (design.customFonts) {
        design.customFonts.forEach(font => {
            let format = font.type === 'ttf' ? 'truetype' : (font.type === 'otf' ? 'opentype' : font.type);
            fontCss += `@font-face { font-family: '${font.name}'; src: url(data:font/${font.type};base64,${font.data}) format('${format}'); }\n`;
        });
    }
    const transformedCss = transformCssColors(design.unifiedCss);
    $('#unified-styles').remove();
    $('head').append(`<style id="unified-styles">
        ${fontCss}
        #bb-container .bauchbinde-instance { position: absolute; width: 100%; }
        ${transformedCss}
    </style>`);
}

function play(msg) {
    if (!currentDesign) return;
    const container = document.getElementById('bb-container');
    const id = 'bb' + Math.floor(Math.random() * 1000000);
    const type = currentAnimation?.type || 'fade';
    const duration = parseInt(currentAnimation?.duration || 750);
    const easing = currentAnimation?.easing || 'easeInOutCirc';

    const div = document.createElement('div');
    div.id = id;
    div.className = `bauchbinde bauchbinde-instance ${type}`;
    div.innerHTML = `<div class="bb-box"><div class="text"><h1>${msg.name || ""}</h1><h2>${msg.title || ""}</h2></div></div>`;

    container.appendChild(div);
    const $div = $(div), $white = $div.find('.bb-box'), $text = $div.find('.text');

    const isFill = currentMode === 'fill';
    $div.css({ 'opacity': '1', 'visibility': 'visible' });

    // Anime.js 4 Params
    const opacityParams = isFill ? ['1', '1'] : ['0', '1'];

    try {
        switch(type) {
            case 'slideleft':
                animate(div, { left: ['-100vw', '0vw'], opacity: opacityParams, duration, easing });
                break;
            case 'slideright':
                animate(div, { left: ['100vw', '0vw'], opacity: opacityParams, duration, easing });
                break;
            case 'slideup':
                animate(div, { marginBottom: ['-100vh', '0vh'], opacity: opacityParams, duration, easing });
                break;
            case 'slideup_textdelay':
                $text.css({ 'position': 'relative', 'bottom': '-4vh', 'opacity': isFill ? '1' : '0' });
                animate(div, { marginBottom: ['-100vh', '0vh'], opacity: opacityParams, duration, easing });
                animate($text[0], { 
                    bottom: ['-4vh', '0vh'], 
                    opacity: isFill ? ['1', '1'] : ['0', '1'], 
                    duration: duration * 0.8, 
                    easing,
                    delay: 300 
                });
                break;
            case 'fade':
            default:
                if (!isFill) {
                    $white.css('opacity', '0');
                    animate($white[0], { opacity: ['0', '1'], duration, easing });
                } else {
                    $white.css('opacity', '1');
                }
                break;
        }
    } catch (e) {
        console.error("[ENGINE] Animation Play Error:", e);
    }

    activeLowerthirds.push({ id, type, div, white: $white[0], text: $text[0] });
}

function stopAll() {
    if (activeLowerthirds.length === 0) { isStopping = false; return; }
    isStopping = true;

    let itemsProcessed = 0;
    const itemsToStop = [...activeLowerthirds];
    const totalItems = itemsToStop.length;

    itemsToStop.forEach(item => {
        const duration = parseInt(currentAnimation?.duration || 500);
        const easing = currentAnimation?.easing || 'easeInOutCirc';
        const isFill = currentMode === 'fill';

        const finalize = () => {
            $(item.div).remove();
            itemsProcessed++;
            if (itemsProcessed === totalItems) {
                activeLowerthirds = [];
                isStopping = false;
                if (nextQueuedPlayout) {
                    const msg = nextQueuedPlayout;
                    nextQueuedPlayout = null;
                    play(msg);
                }
            }
        };

        const opacityParams = isFill ? ['1', '1'] : ['1', '0'];

        try {
            switch(item.type) {
                case 'slideleft': 
                    animate(item.div, { left: ['0vw', '-100vw'], opacity: opacityParams, duration, easing, onComplete: finalize }); 
                    break;
                case 'slideright': 
                    animate(item.div, { left: ['0vw', '100vw'], opacity: opacityParams, duration, easing, onComplete: finalize }); 
                    break;
                case 'slideup': 
                    animate(item.div, { marginBottom: ['0vh', '-100vh'], opacity: opacityParams, duration, easing, onComplete: finalize }); 
                    break;
                case 'slideup_textdelay':
                    animate(item.text, { 
                        bottom: ['0vh', '-4vh'], 
                        opacity: isFill ? ['1', '1'] : ['1', '0'], 
                        duration: duration * 0.8, 
                        easing 
                    });
                    animate(item.div, { 
                        marginBottom: ['0vh', '-100vh'], 
                        opacity: opacityParams, 
                        duration, 
                        easing, 
                        delay: 200, 
                        onComplete: finalize 
                    });
                    break;
                case 'fade':
                default: 
                    if (!isFill) {
                        animate(item.white, { opacity: ['1', '0'], duration, easing, onComplete: finalize }); 
                    } else {
                        // Fill wartet die Zeit ab (deckend), bis Key fertig ist
                        animate(item.white, { opacity: ['1', '1'], duration, easing, onComplete: finalize });
                    }
                    break;
            }
        } catch (e) {
            console.error("[ENGINE] Animation Stop Error:", e);
            finalize();
        }
    });
}