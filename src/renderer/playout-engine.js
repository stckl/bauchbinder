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

let currentDesign = null;
let currentAnimation = { type: 'fade', duration: 750, easing: 'easeInOutCirc' };
let activeLowerthirds = []; 

function updateCSS(data) {
    if (!data) return;
    if (isDev) console.log("[ENGINE] updateCSS received", !!data.unifiedCss);
    currentDesign = data;
    $('#custom-styles').remove();
    const style = document.createElement('style');
    style.id = 'custom-styles';
    style.innerHTML = data.unifiedCss || '';
    document.head.appendChild(style);
}

function updateJS(data) {
    if (!data) return;
    if (isDev) console.log("[ENGINE] updateJS received:", data.type);
    currentAnimation = data;
}

async function playLowerthird(item) {
    if (!item || !animate) return;
    
    if (activeLowerthirds.length > 0) {
        if (isDev) console.log("[ENGINE] Auto-hiding existing items before new play...");
        await stopAll();
    }

    if (isDev) console.log("[ENGINE] playLowerthird", item.name);
    
    const id = `bb-${Date.now()}`;
    const html = `<div id="${id}" class="bauchbinde bauchbinde-instance">
        <div class="bb-box">
            ${currentDesign?.logo ? `<img src="${currentDesign.logo}" class="logo">` : ''}
            ${item.image ? `<img src="${item.image}" class="image">` : ''}
            <div class="text">
                <h1>${item.name || ''}</h1>
                <h2>${item.title || ''}</h2>
            </div>
        </div>
    </div>`;
    
    $('#bauchbinde-container').append(html);
    const el = $(`#${id}`);
    
    if (currentAnimation && currentAnimation.type === 'structured' && currentAnimation.show) {
        currentAnimation.show.forEach((step) => {
            let selector = step.selector === '.white' ? '.bb-box' : step.selector;
            const targetEl = selector === '.bauchbinde-instance' ? el[0] : el.find(selector)[0];
            if (targetEl) {
                // Anime 4: animate(target, props, options)
                animate(targetEl, { ...step.properties }, {
                    duration: step.duration || 750,
                    delay: step.delay || 0,
                    easing: step.easing || 'out-expo'
                });
            }
        });
    } else {
        animate(el[0], { opacity: [0, 1] }, { duration: 750, easing: 'out-quad' });
    }
    activeLowerthirds.push({ id, el });
}

async function stopAll() {
    if (isDev) console.log("[ENGINE] stopAll triggered. Active count:", activeLowerthirds.length);
    
    const currentActive = [...activeLowerthirds];
    activeLowerthirds = [];

    const hidePromises = currentActive.map(async (lt) => {
        if (currentAnimation && currentAnimation.type === 'structured' && currentAnimation.hide && currentAnimation.hide.length > 0) {
            if (isDev) console.log("[ENGINE] Executing structured HIDE for", lt.id);
            
            const stepPromises = currentAnimation.hide.map(step => {
                let selector = step.selector === '.white' ? '.bb-box' : step.selector;
                const targetEl = selector === '.bauchbinde-instance' ? lt.el[0] : lt.el.find(selector)[0];
                if (targetEl) {
                    if (isDev) console.log(`[ENGINE] Animating hide step for ${selector}`);
                    // animate() in v4 returns a promise-like object
                    return animate(targetEl, { ...step.properties }, {
                        duration: step.duration || 500,
                        delay: step.delay || 0,
                        easing: step.easing || 'out-expo'
                    });
                }
                return Promise.resolve();
            });
            
            await Promise.all(stepPromises);
        } else {
            if (isDev) console.log("[ENGINE] Executing fallback HIDE for", lt.id);
            await animate(lt.el[0], { opacity: 0 }, { duration: 500, easing: 'out-quad' });
        }
        
        if (isDev) console.log("[ENGINE] Animation finished, removing element:", lt.id);
        lt.el.remove();
    });

    await Promise.all(hidePromises);
    if (isDev) console.log("[ENGINE] All items hidden and removed.");
}

export function initEngine(mode) {
    const socket = io();
    socket.on('connect', () => { socket.emit('request-state'); });
    socket.on('update-css', updateCSS);
    socket.on('update-js', updateJS);
    socket.on('show-lowerthird', playLowerthird);
    socket.on('hide-lowerthird', stopAll);
    
    if (ipc) {
        ipc.on('update-css', (e, d) => updateCSS(d));
        ipc.on('update-js', (e, d) => updateJS(d));
        ipc.on('show-lowerthird', (e, d) => playLowerthird(d));
        ipc.on('hide-lowerthird', stopAll);
        ipc.on('kill-playout', () => { location.reload(); });
        ipc.send('request-state');
    }
}