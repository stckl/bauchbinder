import { io } from 'socket.io-client';
import * as animeModule from 'animejs';
import $ from 'jquery';

window['$'] = window['jQuery'] = $;

// Robust Anime.js 4.x resolution
const animate = animeModule.animate || animeModule.default?.animate || (typeof animeModule === 'function' ? animeModule : null);
const stagger = animeModule.stagger || animeModule.default?.stagger;

console.log("[ENGINE] Anime resolution:", { 
    animate: typeof animate === 'function' ? 'OK' : 'FAIL',
    stagger: typeof stagger === 'function' ? 'OK' : 'FAIL'
});

window['anime'] = animate;
if (animate) window['anime'].stagger = stagger;

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

    // Add Fullscreen Icon (visible on hover if not in fullscreen) - ONLY for Key/Fill windows
    if ((mode === 'key' || mode === 'fill') && !document.getElementById('fullscreen-trigger')) {
        const fsBtn = document.createElement('div');
        fsBtn.id = 'fullscreen-trigger';
        fsBtn.innerHTML = '⛶'; // Square symbol
        fsBtn.style.cssText = `
            position: fixed; top: 10px; right: 10px; width: 40px; height: 40px;
            background: rgba(0,0,0,0.7); color: white; border-radius: 4px;
            display: flex; align-items: center; justify-content: center;
            cursor: pointer; z-index: 10000; font-size: 24px; opacity: 0;
            transition: opacity 0.3s; border: 1px solid rgba(255,255,255,0.3);
            pointer-events: auto;
        `;
        document.body.appendChild(fsBtn);

        document.addEventListener('mousemove', (e) => {
            // Check if window is currently fullscreen
            const isFS = window.innerHeight === screen.height || window.outerHeight === screen.height;
            // Show button if mouse is in the top right corner (200px area)
            if (e.clientX > window.innerWidth - 200 && e.clientY < 200 && !isFS) {
                fsBtn.style.opacity = "1";
            } else {
                fsBtn.style.opacity = "0";
            }
        });

        fsBtn.onclick = (e) => { 
            e.stopPropagation();
            if (ipc) ipc.send('toggle-fullscreen'); 
        };
    }

    document.body.style.backgroundColor = 'black';
    document.body.style.margin = '0';

    const handleShow = (msg, source) => {
        if (ipc && source === 'socket') return;
        if (activeLowerthirds.length > 0 || isStopping) {
            nextQueuedPlayout = msg;
            if (!isStopping) stopAll();
        }
        // If there is an active item but we are not showing anything, play it!
        else {
            play(msg);
        }
    };

    const handleStatusUpdate = (msg) => {
        const alreadyPlaying = activeLowerthirds.some(al => al.idFromStatus === msg.activeId);
        
        // If there is an active item but we are not showing it, play it!
        if (msg.activeId && msg.activeItem && !alreadyPlaying && !isStopping) {
            console.log("[ENGINE] Syncing status: Playing active item", msg.activeItem);
            play(msg.activeItem);
        } 
        // If there is NO active item but we are showing something, stop it!
        else if (!msg.activeId && activeLowerthirds.length > 0) {
            console.log("[ENGINE] Syncing status: Stopping (no active item)");
            stopAll();
        }
    };

    if (ipc) {
        ipc.on('show-lowerthird', (e, msg) => handleShow(msg, 'ipc'));
        ipc.on('hide-lowerthird', () => stopAll());
        ipc.on('status-update', (e, msg) => handleStatusUpdate(msg));
        ipc.on('update-css', (e, d) => { 
            console.log("[ENGINE] IPC update-css received:", d); 
            currentDesign = d; 
            applyUnifiedStyles(d); 
        });
        ipc.on('update-js', (e, a) => { 
            console.log("[ENGINE] IPC update-js received:", a); 
            currentAnimation = a; 
        });
        ipc.send('request-state');
    }

    const socket = io('http://localhost:5001');
    socket.on('show-lowerthird', (msg) => handleShow(msg, 'socket'));
    socket.on('hide-lowerthird', () => stopAll());
    socket.on('status-update', (msg) => handleStatusUpdate(msg));
    socket.on('update-css', (d) => { 
        console.log("[ENGINE] Socket update-css received:", d); 
        currentDesign = d; 
        applyUnifiedStyles(d); 
    });
    socket.on('update-js', (a) => { 
        console.log("[ENGINE] Socket update-js received:", a); 
        currentAnimation = a; 
    });
    socket.emit('request-state');
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
    const colorRegex = /(?:rgba?\s*\(.*\)|#[0-9a-fA-F]{3,8})/gi;
    return css.replace(colorRegex, (match) => {
        const rgba = getRGBA(match);
        if (currentMode === 'key') return `rgba(255, 255, 255, ${rgba.a})`;
        if (currentMode === 'fill') return `rgb(${rgba.r}, ${rgba.g}, ${rgba.b})`;
        return match;
    });
}

function applyUnifiedStyles(design) {
    if (!design || !design.unifiedCss) {
        console.warn("[ENGINE] applyUnifiedStyles: No CSS provided or design missing.");
        return;
    }
    let fontCss = '';
    if (design.customFonts) {
        design.customFonts.forEach(font => {
            if (font.data && font.name) {
                let format = font.type === 'ttf' ? 'truetype' : (font.type === 'otf' ? 'opentype' : font.type);
                fontCss += `@font-face { font-family: '${font.name}'; src: url(data:font/${font.type};base64,${font.data}) format('${format}'); }\n`;
            }
        });
    }
    const transformedCss = transformCssColors(design.unifiedCss);
    console.log("[ENGINE] Applying CSS (first 100 chars):", transformedCss.substring(0, 100) + "...");
    
    $('#unified-styles').remove();
    $('head').append(`<style id="unified-styles">
        ${fontCss}
        .bauchbinde-instance { position: absolute; width: 100%; }
        ${transformedCss}
        .bauchbinde-instance h1, .bauchbinde-instance h2 { margin: 0; padding: 0; }
    </style>`);
}

function getDesignValue(selector, prop) {
    if (!currentDesign || !selector) return null;
    
    // Check in unifiedCss (Custom part) for non-native properties
    const cssProp = typeof prop === 'string' ? prop.replace(/([A-Z])/g, '-$1').toLowerCase() : '';
    const parts = (typeof currentDesign.unifiedCss === 'string') ? currentDesign.unifiedCss.split('/* CUSTOM */') : [];
    const customCss = parts[1] || '';
    const escapedSelector = String(selector).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedSelector + '\\s*{[\\s\\S]*?' + cssProp + ':\\s*([^;]+);?', 'i');
    const match = customCss.match(regex);
    if (match) {
        return match[1].trim();
    }

    // Default neutral values for motion/scale
    const defaults = {
        'opacity': 1,
        'translateX': '0vw',
        'translateY': '0vh',
        'scale': 1,
        'rotate': 0,
        'skewX': 0,
        'left': '0vw',
        'marginBottom': '0vh'
    };

    const isNumeric = ['opacity', 'scale', 'rotate', 'skewX', 'skewY', 'zIndex'].includes(prop);

    // Color resolution from design
    if (prop === 'backgroundColor') {
        if (selector === '.bb-box' || selector === '.white') return currentDesign.white.color;
    }
    if (prop === 'color') {
        if (selector === 'h1') return currentDesign.h1.color;
        if (selector === 'h2') return currentDesign.h2.color;
    }
    
    // Position/Layout resolution
    if (selector === '.bb-box' || selector === '.white') {
        if (prop === 'left' || prop === 'marginLeft') return (currentDesign.white.left || 0) + 'vw';
        if (prop === 'width' || prop === 'minWidth') return (currentDesign.white.width || 0) + 'vw';
        if (prop === 'borderRadius') return (currentDesign.white.borderradius || 0) + 'px';
        if (prop === 'opacity') return 1;
    }

    if (selector === 'h1') {
        if (prop === 'fontSize') return (currentDesign.h1.fontsize || 5) + 'vh';
        if (prop === 'fontWeight') return currentDesign.h1.fontweight || (currentDesign.h1.bold ? '700' : '400');
        if (prop === 'opacity') return 1;
    }
    if (selector === 'h2') {
        if (prop === 'fontSize') return (currentDesign.h2.fontsize || 3.7) + 'vh';
        if (prop === 'fontWeight') return currentDesign.h2.fontweight || (currentDesign.h2.bold ? '700' : '400');
        if (prop === 'opacity') return 1;
    }

    let val = defaults[prop] !== undefined ? defaults[prop] : null;
    if (isNumeric && val !== null && typeof val === 'string') return parseFloat(val);
    return val;
}

function splitText(element, type) {
    if (!element || !element.innerText) return [element]; // Return element itself if no text (e.g. img)
    const text = element.innerText;
    element.innerHTML = '';
    const items = type === 'chars' ? text.split('') : text.split(' ');
    const spans = items.map(item => {
        const span = document.createElement('span');
        span.style.display = 'inline-block';
        span.style.whiteSpace = 'pre';
        span.innerText = type === 'chars' ? item : item + ' ';
        element.appendChild(span);
        return span;
    });
    return spans;
}

function play(msg, immediate = false) {
    if (!currentDesign) return;
    const container = document.getElementById('bb-container');
    const id = 'bb' + Math.floor(Math.random() * 1000000);
    const type = currentAnimation?.type || 'fade';
    const duration = immediate ? 0 : parseInt(currentAnimation?.duration || 750);
    const easing = currentAnimation?.easing || 'easeInOutCirc';

    const div = document.createElement('div');
    div.id = id;
    div.className = `bauchbinde bauchbinde-instance ${type}`;
    
    let contentHtml = '<div class="bb-box">';
    if (currentDesign.logo) {
        contentHtml += `<img class="logo" src="${currentDesign.logo}" />`;
    }
    if (msg.image) {
        contentHtml += `<img class="image" src="${msg.image}" />`;
    }
    contentHtml += `<div class="text"><h1>${msg.name || ""}</h1><h2>${msg.title || ""}</h2></div></div>`;
    
    div.innerHTML = contentHtml;

    container.appendChild(div);
    const $div = $(div), $white = $div.find('.bb-box'), $text = $div.find('.text');

    const isFill = currentMode === 'fill';
    $div.css({ 'opacity': '1', 'visibility': 'visible' });
    const opacityParams = isFill ? ['1', '1'] : ['0', '1'];

    try {
        if (type === 'structured' && currentAnimation.show) {
            currentAnimation.show.forEach(step => {
                let targets = Array.from(div.querySelectorAll(step.selector));
                
                // SplitText handling - only if targets are valid text elements
                if (step.split && (step.selector === 'h1' || step.selector === 'h2' || step.selector === '.text')) {
                    let allSpans = [];
                    targets.forEach(t => {
                        allSpans = allSpans.concat(splitText(t, step.split));
                    });
                    targets = allSpans;
                }

                if (targets.length > 0) {
                    const params = {
                        targets: targets,
                        duration: step.duration || duration,
                        easing: step.easing || easing,
                        delay: step.delay || 0
                    };
                    
                    // Add properties
                    Object.keys(step.properties).forEach(prop => {
                        const rawVal = step.properties[prop];
                        
                        const numericProps = ['opacity', 'scale', 'rotate', 'skewX', 'skewY', 'zIndex'];
                        const propName = typeof prop === 'string' ? prop : String(prop);
                        const isNumeric = numericProps.includes(propName);

                        const sanitize = (v) => {
                            if (v === null || v === undefined) return isNumeric ? 0 : '';
                            if (isNumeric) return !isNaN(parseFloat(v)) ? parseFloat(v) : 0;
                            return String(v);
                        };

                        // Extract start and end values
                        let startVal, endVal;
                        if (Array.isArray(rawVal)) {
                            startVal = sanitize(rawVal[0]);
                            endVal = sanitize(rawVal[1]);
                        } else {
                            endVal = sanitize(rawVal);
                            startVal = sanitize(getDesignValue(step.selector, propName));
                        }

                        // Apply current design value as target if it overrides
                        const designVal = getDesignValue(step.selector, propName);
                        if (designVal !== null) {
                            endVal = sanitize(designVal);
                        }

                        // Set initial state using animate.set (more reliable in v4)
                        if (typeof animate.set === 'function') {
                            const setProps = {};
                            setProps[propName] = startVal;
                            animate.set(targets, setProps);
                        } else {
                            // Fallback to manual style
                            targets.forEach(el => {
                                if (el && el.style) {
                                    if (propName === 'opacity') el.style.opacity = startVal;
                                    else if (propName === 'translateX' || propName === 'translateY') {
                                        el.style.transform = (el.style.transform || '').replace(new RegExp(propName + '\\([^)]*\\)', 'g'), '') + ` ${propName}(${startVal})`;
                                    }
                                }
                            });
                        }

                        if (propName === 'opacity' && isFill) endVal = 1;
                        
                        if (['backgroundColor', 'color', 'borderColor'].includes(propName)) {
                            const transformColor = (v) => {
                                const rgba = getRGBA(v);
                                if (currentMode === 'key') return `rgba(255, 255, 255, ${rgba.a})`;
                                if (currentMode === 'fill') return `rgb(${rgba.r}, ${rgba.g}, ${rgba.b})`;
                                return v;
                            };
                            endVal = transformColor(endVal);
                        }

                        params[propName] = endVal;
                    });

                    // Line Draw Effect
                    if (step.lineDraw) {
                        params.clipPath = 'inset(0 0 0 0)';
                        targets.forEach(el => { if(el.style) el.style.clipPath = 'inset(0 100% 100% 0)'; });
                    }
                    
                    if (step.split && typeof stagger === 'function') {
                        params.delay = stagger(step.delay || 50, { from: step.staggerFrom || 'first' });
                    }
                    
                    // Add targets to params
                    params.targets = targets;

                    // Log detailed info to server
                    if (ipc) {
                        const debugInfo = {
                            action: 'animate',
                            selector: step.selector,
                            targetCount: targets.length,
                            params: JSON.parse(JSON.stringify(params, (key, value) => {
                                if (value instanceof HTMLElement) return `<${value.tagName.toLowerCase()} class="${value.className}">`;
                                if (value instanceof NodeList || Array.isArray(value)) return value;
                                return value;
                            }))
                        };
                        ipc.send('log-debug', debugInfo);
                    }
                    
                    if (typeof animate === 'function') {
                        try {
                            // Anime.js 4.x API: animate(targets, props, settings)
                            const { targets: animTargets, duration: animDuration, delay: animDelay, easing: animEasing, ...animProps } = params;
                            animate(animTargets, animProps, {
                                duration: animDuration,
                                delay: animDelay,
                                easing: animEasing
                            });
                        } catch (animErr) {
                            console.error("[ENGINE] animate() failed:", animErr);
                            if (ipc) ipc.send('log-debug', { error: animErr.message, stack: animErr.stack });
                        }
                    } else {
                        console.error("[ENGINE] animate is not a function!");
                    }
                }
            });
        } else {
                                                switch(type) {
                                                    case 'slideleft': 
                                                        div.style.transform = 'translateX(-100vw)';
                                                        div.style.opacity = isFill ? 1 : 0;
                                                        animate(div, { translateX: '0vw', opacity: 1 }, { duration, easing }); 
                                                        break;
                                                    case 'slideright': 
                                                        div.style.transform = 'translateX(100vw)';
                                                        div.style.opacity = isFill ? 1 : 0;
                                                        animate(div, { translateX: '0vw', opacity: 1 }, { duration, easing }); 
                                                        break;
                                                    case 'slideup': 
                                                        div.style.transform = 'translateY(100vh)';
                                                        div.style.opacity = isFill ? 1 : 0;
                                                        animate(div, { translateY: '0vh', opacity: 1 }, { duration, easing }); 
                                                        break;
                                                    case 'slideup_textdelay':
                                                        div.style.transform = 'translateY(100vh)';
                                                        div.style.opacity = isFill ? 1 : 0;
                                                        animate(div, { translateY: '0vh', opacity: 1 }, { duration, easing }); 
                                                        $text[0].style.transform = 'translateY(5vh)';
                                                        $text[0].style.opacity = isFill ? 1 : 0;
                                                        animate($text[0], { translateY: '0vh', opacity: 1 }, { duration: duration * 0.8, easing, delay: 300 });
                                                        break;
                                                    case 'fade':
                                                    default: 
                                                        $white[0].style.opacity = isFill ? 1 : 0;
                                                        animate($white[0], { opacity: 1 }, { duration, easing }); 
                                                        break;
                                                }        }
    } catch (e) {
        console.error("[ENGINE] Animation Play Error:", e);
    }

    // Always track the active lower third, even if animation failed partially
    activeLowerthirds.push({ id, idFromStatus: msg.id, type, div, white: $white[0], text: $text[0] });
}

function stopAll() {
    if (activeLowerthirds.length === 0) { isStopping = false; return; };
    isStopping = true;

    // Safety timeout: Reset isStopping after 2 seconds no matter what
    const safetyTimeout = setTimeout(() => {
        if (isStopping) {
            console.warn("[ENGINE] stopAll safety timeout fired. Forcing state reset.");
            activeLowerthirds.forEach(item => $(item.div).remove());
            activeLowerthirds = [];
            isStopping = false;
        }
    }, 2000);

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
                clearTimeout(safetyTimeout);
                activeLowerthirds = [];
                isStopping = false;
                if (nextQueuedPlayout) {
                    const msg = nextQueuedPlayout;
                    nextQueuedPlayout = null;
                    play(msg);
                }
            }
        };

        const opacityParams = isFill ? 1 : 0;

        try {
            if (item.type === 'structured' && currentAnimation.hide) {
                let maxDuration = 0;
                currentAnimation.hide.forEach((step, index) => {
                    let targets = Array.from(item.div.querySelectorAll(step.selector));

                    let subTargets = [];
                    targets.forEach(t => {
                        const spans = t.querySelectorAll('span');
                        if (spans.length > 0) subTargets = subTargets.concat(Array.from(spans));
                        else subTargets.push(t);
                    });
                    targets = subTargets;

                    if (targets.length > 0) {
                        const stepDuration = step.duration || duration;
                        const stepDelay = step.delay || 0;
                        const totalStepDuration = step.split ? (stepDuration + (targets.length * (step.delay || 50))) : (stepDuration + stepDelay);
                        maxDuration = Math.max(maxDuration, totalStepDuration);

                        const params = {};
                        Object.keys(step.properties).forEach(prop => {
                            const rawVal = step.properties[prop];
                            const propName = typeof prop === 'string' ? prop : String(prop);
                            const sanitize = (v) => (v === null || v === undefined) ? '' : String(v);
                            let endVal = Array.isArray(rawVal) ? sanitize(rawVal[1]) : sanitize(rawVal);
                            if (propName === 'opacity' && isFill) endVal = 1;
                            if (propName === 'backgroundColor' || propName === 'color') {
                                const rgba = getRGBA(endVal);
                                if (currentMode === 'key') endVal = `rgba(255, 255, 255, ${rgba.a})`;
                                if (currentMode === 'fill') endVal = `rgb(${rgba.r}, ${rgba.g}, ${rgba.b})`;
                            }
                            params[propName] = endVal;
                        });

                        if (typeof animate === 'function') {
                            animate(targets, params, {
                                duration: stepDuration,
                                delay: step.split && typeof stagger === 'function' ? stagger(step.delay || 50, { from: 'last' }) : stepDelay,
                                easing: step.easing || easing
                            });
                        }
                    }
                });
                setTimeout(finalize, maxDuration + 50);
            } else {
                if (typeof animate === 'function') {
                    switch(item.type) {
                        case 'slideleft': 
                            animate(item.div, { translateX: '-100vw', opacity: isFill ? 1 : 0 }, { duration, easing, onComplete: finalize }); 
                            break;
                        case 'slideright': 
                            animate(item.div, { translateX: '100vw', opacity: isFill ? 1 : 0 }, { duration, easing, onComplete: finalize }); 
                            break;
                        case 'slideup': 
                            animate(item.div, { translateY: '10vh', opacity: isFill ? 1 : 0 }, { duration, easing, onComplete: finalize }); 
                            break;
                        case 'slideup_textdelay':
                            animate(item.text, { translateY: '10vh', opacity: isFill ? 1 : 0 }, { duration: duration * 0.8, easing });
                            animate(item.div, { translateY: '10vh', opacity: isFill ? 1 : 0 }, { duration, easing, delay: 200, onComplete: finalize });
                            break;
                        case 'fade':
                        default: 
                            animate(item.white, { opacity: isFill ? 1 : 0 }, { duration, easing, onComplete: finalize });
                            break;
                    }
                } else {
                    finalize();
                }
            }
        } catch (e) {
            console.error("[ENGINE] Animation Stop Error:", e);
            if (ipc) ipc.send('log-debug', { error: e.message, stack: e.stack });
            finalize();
        }
    });
}