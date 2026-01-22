import { io } from 'socket.io-client';
import * as animeModule from 'animejs';
import $ from 'jquery';

window['$'] = window['jQuery'] = $;

const isDev = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

// Robust Anime.js 4.x resolution
const animate = animeModule.animate || animeModule.default?.animate || (typeof animeModule.default === 'function' ? animeModule.default : null);
const stagger = animeModule.stagger || animeModule.default?.stagger;

window['anime'] = animate; 

let ipc = null;
if (typeof window !== 'undefined' && window['process'] && window['process'].versions?.electron) {
    try { 
        const r = window['require'];
        if (r) ipc = r('electron').ipcRenderer;
    } catch (e) {}
}

let currentMode = 'h5';
let currentDesign = null;
let currentAnimation = { type: 'fade', duration: 750, easing: 'easeInOutCirc' };
let activeLowerthirds = []; 

function getRGBA(color) {
    if (typeof color !== 'string') color = String(color || 'white');
    const d = document.createElement("div");
    d.style.color = color;
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
    const colorRegex = /(?:rgba?\s*\([^)]*\)|#[0-9a-fA-F]{3,8})/gi;
    return css.replace(colorRegex, (match) => {
        if (match.length > 50) return match; 
        const rgba = getRGBA(match);
        if (currentMode === 'key') return "rgba(255, 255, 255, " + rgba.a + ")";
        if (currentMode === 'fill') return "rgb(" + rgba.r + ", " + rgba.g + ", " + rgba.b + ")";
        return match;
    });
}

function updateCSS(data) {
    if (!data) return;
    console.log("[ENGINE] updateCSS - Logo:", !!data.logo, "CSS-Len:", data.unifiedCss?.length);
    currentDesign = data;
    
    let fontCss = '';
    if (data.customFonts) {
        data.customFonts.forEach(font => {
            if (font.data && font.name) {
                let format = font.type === 'ttf' ? 'truetype' : (font.type === 'otf' ? 'opentype' : font.type);
                fontCss += "@font-face { font-family: '" + font.name + "'; src: url(data:font/" + font.type + ";base64," + font.data + ") format('" + format + "'); }\n";
            }
        });
    }

    const transformedCss = transformCssColors(data.unifiedCss || '');
    let extraCss = '';
    if (currentMode === 'key') {
        extraCss += 'img { filter: brightness(0) invert(1) !important; }';
    }

    $('#custom-styles').remove();
    const style = document.createElement('style');
    style.id = 'custom-styles';
    style.innerHTML = fontCss + "\n.bauchbinde-instance { position: absolute; width: 100%; }\n" + transformedCss + "\n" + extraCss;
    document.head.appendChild(style);

    // LIVE UPDATE for Logo if something is showing
    activeLowerthirds.forEach(lt => {
        if (lt.showGlobalLogo === false) return;
        const $logo = lt.el.find('.logo');
        if (data.logo) {
            if ($logo.length) $logo.attr('src', data.logo);
            else lt.el.find('.bb-box').prepend('<img src="' + data.logo + '" class="logo">');
        } else {
            $logo.remove();
        }
    });
}

function updateJS(data) {
    if (!data) return;
    currentAnimation = data;
}

function handleStatusUpdate(arg) {
    if (arg && arg.activeItem) {
        playLowerthird(arg.activeItem);
    } else if (arg && arg.activeId === null && activeLowerthirds.length > 0) {
        stopAll();
    }
}

function transformProperties(props) {
    const p = { ...props };
    Object.keys(p).forEach(k => {
        if (currentMode === 'fill' && k === 'opacity') {
            p[k] = 1;
        }
        if (['backgroundColor', 'color', 'borderColor'].includes(k)) {
            const val = p[k];
            const transform = (v) => {
                const rgba = getRGBA(v);
                if (currentMode === 'key') return "rgba(255, 255, 255, " + rgba.a + ")";
                if (currentMode === 'fill') return "rgb(" + rgba.r + ", " + rgba.g + ", " + rgba.b + ")";
                return v;
            };
            if (Array.isArray(val)) p[k] = val.map(transform);
            else p[k] = transform(val);
        }
    });
    return p;
}

async function playLowerthird(item) {
    if (!item || !animate) return;
    
    // LIVE UPDATE: Check if we are already showing this ID
    const existing = activeLowerthirds.find(lt => lt.idFromStatus === item.id);
    if (existing) {
        console.log("[ENGINE] Live update for item ID:", item.id);
        existing.el.find('h1').text(item.name || '');
        existing.el.find('h2').text(item.title || '');
        existing.showGlobalLogo = item.showGlobalLogo !== false;
        
        const $logo = existing.el.find('.logo');
        if (item.showGlobalLogo === false || !currentDesign?.logo) {
            $logo.remove();
        } else {
            if ($logo.length) $logo.attr('src', currentDesign.logo);
            else existing.el.find('.bb-box').prepend('<img src="' + currentDesign.logo + '" class="logo">');
        }

        const $img = existing.el.find('.image');
        if (item.image) {
            if ($img.length) $img.attr('src', item.image);
            else existing.el.find('.text').before('<img src="' + item.image + '" class="image">');
        } else {
            $img.remove();
        }
        return;
    }

    if (activeLowerthirds.length > 0) await stopAll();

    console.log("[ENGINE] Rendering new instance - Logo:", !!currentDesign?.logo, "ItemImg:", !!item.image);

    const id = "bb-" + Date.now();
    const logoHtml = (currentDesign?.logo && item.showGlobalLogo !== false) ? '<img src="' + currentDesign.logo + '" class="logo">' : '';
    const imageHtml = item.image ? '<img src="' + item.image + '" class="image">' : '';
    
    const html = '<div id="' + id + '" class="bauchbinde bauchbinde-instance">' +
        '<div class="bb-box">' +
            logoHtml +
            imageHtml +
            '<div class="text">' +
                '<h1>' + (item.name || '') + '</h1>' +
                '<h2>' + (item.title || '') + '</h2>' +
            '</div>' +
        '</div>' +
    '</div>';
    
    $('#bauchbinde-container').append(html);
    const el = $("#" + id);
    
    if (currentAnimation && currentAnimation.type === 'structured' && currentAnimation.show) {
        currentAnimation.show.forEach((step) => {
            let selector = step.selector === '.white' ? '.bb-box' : step.selector;
            const targetEl = selector === '.bauchbinde-instance' ? el[0] : el.find(selector)[0];
            if (targetEl) {
                animate(targetEl, transformProperties(step.properties), {
                    duration: step.duration || 750,
                    delay: step.delay || 0,
                    easing: step.easing || 'out-expo'
                });
            }
        });
    } else {
        animate(el[0], { opacity: currentMode === 'fill' ? [1, 1] : [0, 1] }, { duration: 750, easing: 'out-quad' });
    }
    activeLowerthirds.push({ id, idFromStatus: item.id, el, showGlobalLogo: item.showGlobalLogo !== false });
}

async function stopAll() {
    const currentActive = [...activeLowerthirds];
    activeLowerthirds = [];

    const hidePromises = currentActive.map(async (lt) => {
        if (currentAnimation && currentAnimation.type === 'structured' && currentAnimation.hide && currentAnimation.hide.length > 0) {
            const stepPromises = currentAnimation.hide.map(async (step) => {
                let selector = step.selector === '.white' ? '.bb-box' : step.selector;
                const targetEl = selector === '.bauchbinde-instance' ? lt.el[0] : lt.el.find(selector)[0];
                if (targetEl) {
                    await animate(targetEl, transformProperties(step.properties), {
                        duration: step.duration || 500,
                        delay: step.delay || 0,
                        easing: step.easing || 'out-expo'
                    });
                }
            });
            await Promise.all(stepPromises);
        } else {
            await animate(lt.el[0], { opacity: currentMode === 'fill' ? 1 : 0 }, { duration: 500, easing: 'out-quad' });
        }
        lt.el.remove();
    });

    await Promise.all(hidePromises);
}

export function initEngine(mode) {
    currentMode = mode;
    console.log("[ENGINE] init mode: " + mode + ", IPC: " + (!!ipc));

    const socket = io();
    socket.on('connect', () => { 
        console.log("[ENGINE] Socket connected, requesting state...");
        socket.emit('request-state'); 
    });
    socket.on('update-css', (d) => updateCSS(d));
    socket.on('update-js', (d) => updateJS(d));
    socket.on('show-lowerthird', (d) => playLowerthird(d));
    socket.on('hide-lowerthird', stopAll);
    socket.on('status-update', (d) => handleStatusUpdate(d));
    
    if (ipc) {
        ipc.on('update-css', (e, d) => updateCSS(d));
        ipc.on('update-js', (e, d) => updateJS(d));
        ipc.on('show-lowerthird', (e, d) => playLowerthird(d));
        ipc.on('hide-lowerthird', stopAll);
        ipc.on('status-update', (e, d) => handleStatusUpdate(d));
        ipc.on('kill-playout', () => { location.reload(); });
        ipc.send('request-state');
    }
}
