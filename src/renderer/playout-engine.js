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
let playLock = false;

// Convert old anime.js 3.x easing names to 4.x format
function convertEasing(easing) {
    if (!easing) return 'out-quad';
    // If already in new format (contains hyphen), return as-is
    if (easing.includes('-')) return easing;
    // Convert camelCase to kebab-case: easeInOutCirc -> in-out-circ
    const map = {
        'linear': 'linear',
        'easeInQuad': 'in-quad', 'easeOutQuad': 'out-quad', 'easeInOutQuad': 'in-out-quad',
        'easeInCubic': 'in-cubic', 'easeOutCubic': 'out-cubic', 'easeInOutCubic': 'in-out-cubic',
        'easeInQuart': 'in-quart', 'easeOutQuart': 'out-quart', 'easeInOutQuart': 'in-out-quart',
        'easeInQuint': 'in-quint', 'easeOutQuint': 'out-quint', 'easeInOutQuint': 'in-out-quint',
        'easeInSine': 'in-sine', 'easeOutSine': 'out-sine', 'easeInOutSine': 'in-out-sine',
        'easeInExpo': 'in-expo', 'easeOutExpo': 'out-expo', 'easeInOutExpo': 'in-out-expo',
        'easeInCirc': 'in-circ', 'easeOutCirc': 'out-circ', 'easeInOutCirc': 'in-out-circ',
        'easeInBack': 'in-back', 'easeOutBack': 'out-back', 'easeInOutBack': 'in-out-back',
        'easeOutBounce': 'out-bounce', 'easeInBounce': 'in-bounce', 'easeInOutBounce': 'in-out-bounce'
    };
    return map[easing] || 'out-quad';
}

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
    // .bauchbinde-custom has minimal base styling - actual styling comes from applyLocalStyles()
    const baseCss = ".bauchbinde { position: absolute; width: 100%; display: flex; }\n" +
                    ".bauchbinde-custom { position: absolute; display: flex; }\n";
    style.innerHTML = fontCss + "\n" + baseCss + transformedCss + "\n" + extraCss;
    document.head.appendChild(style);

    // LIVE UPDATE for Logo if something is showing (only for global style)
    activeLowerthirds.forEach(lt => {
        if (lt.useLocalStyle || lt.showGlobalLogo === false) return;
        const $logo = lt.el.find('.logo');
        if (data.logo) {
            if ($logo.length) $logo.attr('src', data.logo);
            else lt.el.find('.bauchbinde-box').prepend('<img src="' + data.logo + '" class="logo">');
        } else {
            $logo.remove();
        }
    });
}

function updateJS(data) {
    if (!data) return;
    console.log("[ENGINE] updateJS - hide duration:", data.hide?.[0]?.duration, "show duration:", data.show?.[0]?.duration);
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
    if (!item || !animate || playLock) return;
    
    // LIVE UPDATE: Check if we are already showing this ID
    const existing = activeLowerthirds.find(lt => lt.idFromStatus === item.id);
    if (existing) {
        console.log("[ENGINE] Live update for item ID:", item.id);

        // Use appropriate selectors based on style type
        if (existing.useLocalStyle) {
            existing.el.find('.custom-h1').text(item.name || '');
            existing.el.find('.custom-h2').text(item.title || '');
        } else {
            existing.el.find('h1').text(item.name || '');
            existing.el.find('h2').text(item.title || '');
        }
        existing.showGlobalLogo = item.showGlobalLogo !== false;
        
        // Update local style properties if enabled
        if (item.useLocalStyle && item.localStyle) {
            applyLocalStyles(existing.el, item.localStyle);
        } else {
            const $logo = existing.el.find('.logo');
            if (item.showGlobalLogo === false || !currentDesign?.logo) {
                $logo.remove();
            } else {
                if ($logo.length) $logo.attr('src', currentDesign.logo);
                else existing.el.find('.bauchbinde-box').prepend('<img src="' + currentDesign.logo + '" class="logo">');
            }

            const $img = existing.el.find('.image');
            if (item.image) {
                if ($img.length) $img.attr('src', item.image);
                else existing.el.find('.text').before('<img src="' + item.image + '" class="image">');
            } else {
                $img.remove();
            }
        }
        return;
    }

    playLock = true;
    try {
        if (activeLowerthirds.length > 0) await stopAll();

        console.log("[ENGINE] Rendering new instance - LocalStyle:", !!item.useLocalStyle);

        const id = "bb-" + Date.now();
        let html;

        if (item.useLocalStyle) {
            // Custom style: use different classes to avoid global CSS interference
            html = '<div id="' + id + '" class="bauchbinde-custom">' +
                '<div class="custom-box">' +
                    '<div class="custom-text">' +
                        '<span class="custom-h1">' + (item.name || '') + '</span>' +
                        '<span class="custom-h2">' + (item.title || '') + '</span>' +
                    '</div>' +
                '</div>' +
            '</div>';
        } else {
            // Global style: use standard classes that match unified CSS
            let logoHtml = (currentDesign?.logo && item.showGlobalLogo !== false) ? '<img src="' + currentDesign.logo + '" class="logo">' : '';
            let imageHtml = item.image ? '<img src="' + item.image + '" class="image">' : '';

            html = '<div id="' + id + '" class="bauchbinde">' +
                '<div class="bauchbinde-box">' +
                    logoHtml +
                    imageHtml +
                    '<div class="text">' +
                        '<h1>' + (item.name || '') + '</h1>' +
                        '<h2>' + (item.title || '') + '</h2>' +
                    '</div>' +
                '</div>' +
            '</div>';
        }
        
        $('#bauchbinde-container').append(html);
        const el = $("#" + id);
        
        if (item.useLocalStyle && item.localStyle) {
            applyLocalStyles(el, item.localStyle);
            // Simple Fade Animation for Local Style
            await animate(el[0], { opacity: currentMode === 'fill' ? [1, 1] : [0, 1], duration: 750, easing: 'out-quad' });
        } else if (currentAnimation && currentAnimation.type === 'structured' && currentAnimation.show) {
            const stepPromises = currentAnimation.show.map(async (step) => {
                let selector = step.selector;
                if (selector === '.white' || selector === '.bb-box') selector = '.bauchbinde-box';
                // .bauchbinde-instance targets the root element (same as .bauchbinde)
                const targetEl = (selector === '.bauchbinde' || selector === '.bauchbinde-instance') ? el[0] : el.find(selector)[0];
                if (targetEl) {
                    // anime.js 4.x: duration/delay/easing go in the properties object
                    await animate(targetEl, {
                        ...transformProperties(step.properties),
                        duration: step.duration || 750,
                        delay: step.delay || 0,
                        easing: convertEasing(step.easing)
                    });
                }
            });
            await Promise.all(stepPromises);
        } else {
            await animate(el[0], { opacity: currentMode === 'fill' ? [1, 1] : [0, 1], duration: 750, easing: 'out-quad' });
        }
        activeLowerthirds.push({ id, idFromStatus: item.id, el, showGlobalLogo: item.showGlobalLogo !== false, useLocalStyle: !!item.useLocalStyle });
    } finally {
        playLock = false;
    }
}

function applyLocalStyles(el, s) {
    const transformColor = (c) => {
        const rgba = getRGBA(c);
        if (currentMode === 'key') return "rgba(255, 255, 255, " + rgba.a + ")";
        if (currentMode === 'fill') return "rgb(" + rgba.r + ", " + rgba.g + ", " + rgba.b + ")";
        return c;
    };

    // Container styling
    el.css({
        position: 'absolute',
        bottom: s.y + 'vh',
        top: 'auto',
        width: 'auto',
        margin: 0,
        display: 'flex'
    });

    // Apply horizontal positioning
    if (s.position === 'center') {
        el.css({ left: '0', right: '0', justifyContent: 'center' });
    } else if (s.position === 'right') {
        el.css({ left: 'auto', right: s.x + 'vw', justifyContent: 'flex-end' });
    } else { // left
        el.css({ left: s.x + 'vw', right: 'auto', justifyContent: 'flex-start' });
    }

    // Box styling (uses .custom-box for local style)
    const box = el.find('.custom-box');
    box.css({
        background: transformColor(s.bgColor),
        minWidth: s.minWidth + 'vw',
        minHeight: s.minHeight > 0 ? s.minHeight + 'vh' : 'auto',
        display: 'inline-flex',
        flexDirection: 'column',
        justifyContent: s.justifyContent || 'center',
        alignItems: s.alignItems || 'center',
        padding: (s.padding || 2) + 'vh',
        textAlign: s.textalign || 'center'
    });

    // Text container
    el.find('.custom-text').css({
        display: 'flex',
        flexDirection: 'column',
        alignItems: s.alignItems || 'center'
    });

    // H1 styling (uses .custom-h1)
    const h1 = el.find('.custom-h1');
    h1.css({
        fontFamily: s.h1.fontfamily,
        fontSize: s.h1.fontsize + 'vh',
        lineHeight: s.h1.fontsize + 'vh',
        color: transformColor(s.h1.color),
        margin: 0,
        display: 'block'
    });

    // H2 styling (uses .custom-h2)
    const h2 = el.find('.custom-h2');
    h2.css({
        fontFamily: s.h2.fontfamily,
        fontSize: s.h2.fontsize + 'vh',
        lineHeight: s.h2.fontsize + 'vh',
        color: transformColor(s.h2.color),
        margin: 0,
        display: 'block'
    });
}

async function stopAll() {
    const currentActive = [...activeLowerthirds];
    activeLowerthirds = [];

    const hidePromises = currentActive.map(async (lt) => {
        if (!lt.useLocalStyle && currentAnimation && currentAnimation.type === 'structured' && currentAnimation.hide && currentAnimation.hide.length > 0) {
            console.log("[ENGINE] Running hide animation, steps:", currentAnimation.hide.length);
            const stepPromises = currentAnimation.hide.map(async (step) => {
                console.log("[ENGINE] Hide step - duration:", step.duration, "delay:", step.delay, "easing:", step.easing);
                let selector = step.selector;
                if (selector === '.white' || selector === '.bb-box') selector = '.bauchbinde-box';
                // .bauchbinde-instance targets the root element (same as .bauchbinde)
                const targetEl = (selector === '.bauchbinde' || selector === '.bauchbinde-instance') ? lt.el[0] : lt.el.find(selector)[0];
                if (targetEl) {
                    // anime.js 4.x: duration/delay/easing go in the properties object, not separate options
                    await animate(targetEl, {
                        ...transformProperties(step.properties),
                        duration: step.duration || 500,
                        delay: step.delay || 0,
                        easing: convertEasing(step.easing)
                    });
                }
            });
            await Promise.all(stepPromises);
        } else {
            await animate(lt.el[0], { opacity: currentMode === 'fill' ? 1 : 0, duration: 500, easing: 'out-quad' });
        }
        lt.el.remove();
    });

    await Promise.all(hidePromises);
}

export function initEngine(mode) {
    currentMode = mode;
    console.log("[ENGINE] init mode: " + mode + ", IPC: " + (!!ipc));

    const socket = io();
    
    const setupListeners = (bus, isIpc = false) => {
        const on = isIpc ? (ev, cb) => bus.on(ev, (e, d) => cb(d)) : (ev, cb) => bus.on(ev, cb);
        
        on('update-css', (d) => updateCSS(d));
        on('update-js', (d) => updateJS(d));
        on('show-lowerthird', (d) => playLowerthird(d));
        on('hide-lowerthird', () => stopAll());
        on('status-update', (d) => handleStatusUpdate(d));
    };

    if (ipc) {
        setupListeners(ipc, true);
        ipc.on('kill-playout', () => { location.reload(); });
        ipc.send('request-state');
    } else {
        socket.on('connect', () => { 
            console.log("[ENGINE] Socket connected, requesting state...");
            socket.emit('request-state'); 
        });
        setupListeners(socket, false);
    }
}
