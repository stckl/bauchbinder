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
        ipc.on('update-css', (e, d) => { currentDesign = d; applyUnifiedStyles(d); });
        ipc.on('update-js', (e, a) => { currentAnimation = a; });
        ipc.send('request-state');
    }

    const socket = io('http://localhost:5001');
    socket.on('show-lowerthird', (msg) => handleShow(msg, 'socket'));
    socket.on('hide-lowerthird', () => stopAll());
    socket.on('status-update', (msg) => handleStatusUpdate(msg));
    socket.on('update-css', (d) => { currentDesign = d; applyUnifiedStyles(d); });
    socket.on('update-js', (a) => { currentAnimation = a; });
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
    if (!design || !design.unifiedCss) return;
    let fontCss = '';
    if (design.customFonts) {
        design.customFonts.forEach(font => {
            let format = font.type === 'ttf' ? 'truetype' : (font.type === 'otf' ? 'opentype' : font.type);
            fontCss += `@font-face { font-family: '${font.name}'; src: url(data:font/${font.type};base64,${font.data}) format('${format}'); }\n`;
        });
    }
    const transformedCss = transformCssColors(design.unifiedCss);
    let extraCss = '';
    if (currentMode === 'key') {
        // Force images to be white silhouettes for the Alpha Key signal
        extraCss += 'img { filter: brightness(0) invert(1); }';
    }
    $('#unified-styles').remove();
    $('head').append(`<style id="unified-styles">
        ${fontCss}
        #bb-container .bauchbinde-instance { position: absolute; width: 100%; }
        ${transformedCss}
        ${extraCss}
    </style>`);
}

function getDesignValue(selector, prop) {
    if (!currentDesign || !selector) return null;
    
    // Check in unifiedCss (Custom part) for non-native properties
    const cssProp = prop.replace(/([A-Z])/g, '-$1').toLowerCase();
    const parts = currentDesign.unifiedCss ? currentDesign.unifiedCss.split('/* CUSTOM */') : [];
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
    }

    if (selector === 'h1') {
        if (prop === 'fontSize') return (currentDesign.h1.fontsize || 5) + 'vh';
        if (prop === 'fontWeight') return currentDesign.h1.fontweight || (currentDesign.h1.bold ? '700' : '400');
    }
    if (selector === 'h2') {
        if (prop === 'fontSize') return (currentDesign.h2.fontsize || 3.7) + 'vh';
        if (prop === 'fontWeight') return currentDesign.h2.fontweight || (currentDesign.h2.bold ? '700' : '400');
    }

    return defaults[prop] !== undefined ? defaults[prop] : null;
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
                        let val = JSON.parse(JSON.stringify(step.properties[prop]));
                        
                        // Enforce design value as target (end value)
                        const designVal = getDesignValue(step.selector, prop);
                        if (designVal !== null) {
                            if (Array.isArray(val)) {
                                val[1] = designVal;
                            } else {
                                val = [val, designVal];
                            }
                        }

                        // Force string for CSS properties that are NOT purely numeric (prevent str.includes errors)
                        const numericProps = ['opacity', 'scale', 'rotate', 'skewX', 'skewY', 'zIndex'];
                        
                        const sanitize = (v) => {
                            if (v === null || v === undefined) return '';
                            if (numericProps.includes(prop) && !isNaN(parseFloat(v))) return parseFloat(v); // Keep as number
                            return String(v); // Force string
                        };

                        if (Array.isArray(val)) {
                            val = val.map(sanitize);
                        } else {
                            val = sanitize(val);
                        }

                        // Special handling for opacity in FILL mode
                        if (prop === 'opacity' && isFill) val = ['1', '1'];
                        
                        // Handle colors for Key/Fill mode (ensure even single values are transformed)
                        if (['backgroundColor', 'color', 'borderColor'].includes(prop)) {
                            const transformColor = (v) => {
                                const rgba = getRGBA(v);
                                if (currentMode === 'key') return `rgba(255, 255, 255, ${rgba.a})`;
                                if (currentMode === 'fill') return `rgb(${rgba.r}, ${rgba.g}, ${rgba.b})`;
                                return v;
                            };

                            if (Array.isArray(val)) {
                                val = val.map(transformColor);
                            } else {
                                val = transformColor(val);
                            }
                        }
                        params[prop] = val;
                    });

                    // Line Draw Effect (Simulated via clip-path for Rects)
                    if (step.lineDraw) {
                        params.clipPath = ['inset(0 100% 100% 0)', 'inset(0 0 0 0)'];
                    }
                    
                    // Staggering for split text
                    if (step.split) {
                        params.delay = anime.stagger(step.delay || 50, { from: step.staggerFrom || 'first' });
                    }
                    
                    console.log("[ENGINE] Animate Params:", JSON.parse(JSON.stringify(params))); // Debug Log
                    animate(params.targets, params);
                }
            });
        } else {
            // ... Legacy/Simple Animations ...
            // (Same error handling needed here?)
            // ...
            switch(type) {
                // ...
            }
        }
    } catch (e) {
        console.error("[ENGINE] Animation Play Error:", e);
    }

    // Always track the active lower third, even if animation failed partially
    activeLowerthirds.push({ id, idFromStatus: msg.id, type, div, white: $white[0], text: $text[0] });
}

function stopAll() {
    if (activeLowerthirds.length === 0) { isStopping = false; return; };
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
            if (item.type === 'structured' && currentAnimation.hide) {
                let maxDuration = 0;
                currentAnimation.hide.forEach((step, index) => {
                    let targets = Array.from(item.div.querySelectorAll(step.selector));

                    // SplitText handling for hide (only if not already split, but usually we just target what's there)
                    // If it was already split during show, querySelectorAll('span') would be needed.
                    // To keep it simple, we check if spans exist inside the target.
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
                        
                        // For stagger, the total duration increases
                        const totalStepDuration = step.split ? (stepDuration + (targets.length * (step.delay || 50))) : (stepDuration + stepDelay);
                        maxDuration = Math.max(maxDuration, totalStepDuration);

                        const params = {
                            targets: targets,
                            duration: stepDuration,
                            easing: step.easing || easing,
                            delay: stepDelay
                        };

                        Object.keys(step.properties).forEach(prop => {
                            let val = JSON.parse(JSON.stringify(step.properties[prop]));
                            
                            // Enforce design value as start value
                            const designVal = getDesignValue(step.selector, prop);
                            if (designVal !== null) {
                                if (Array.isArray(val)) {
                                    val[0] = designVal;
                                } else {
                                    val = [designVal, val];
                                }
                            }

                            if (prop === 'opacity' && isFill) {
                                val = ['1', '1'];
                            }
                            
                            // Handle colors for Key/Fill mode
                            if (prop === 'backgroundColor' || prop === 'color') {
                                if (Array.isArray(val)) {
                                    val = val.map(v => {
                                        const rgba = getRGBA(v);
                                        if (currentMode === 'key') return `rgba(255, 255, 255, ${rgba.a})`;
                                        if (currentMode === 'fill') return `rgb(${rgba.r}, ${rgba.g}, ${rgba.b})`;
                                        return v;
                                    });
                                }
                            }
                            
                            params[prop] = val;
                        });

                        if (step.split) {
                            params.delay = anime.stagger(step.delay || 50, { from: 'last' });
                        }

                        animate(params.targets, params);
                    }
                });
                setTimeout(finalize, maxDuration + 50);
            } else {
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
            }
        } catch (e) {
            console.error("[ENGINE] Animation Stop Error:", e);
            finalize();
        }
    });
}