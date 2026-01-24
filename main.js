const { app, BrowserWindow, globalShortcut, ipcMain: ipc } = require('electron')
const isDev = !app.isPackaged
require('@electron/remote/main').initialize()
const path = require('path')
const url = require('url')
const express = require('express');
const expressapp = express();
const http = require('http').Server(expressapp);
const io = require('socket.io')(http, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});
const fs = require('fs');
const { dialog } = require('electron')
const winston = require('winston');
const { createProxyMiddleware } = require('http-proxy-middleware');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'debug.log' }),
    new winston.transports.Console()
  ]
});

let win, winKey, winFill, winEditor, winStep;
let data = [{ name: 'Max Mustermann', title: 'Beispiel-Titel für Bauchbinde', image: null }];
let activeLowerThirdId = null;
let activeLowerThirdData = null;

let lastDesign = {
  white: { 
    width: 10, left: 5, bottom: 7, height: 1, fixedWidth: false, fixedHeight: false,
    color: 'rgba(255,255,255,0.8)', 
    paddingTop: 2.6, paddingRight: 5, paddingBottom: 2.6, paddingLeft: 5, borderradius: 0, 
    divalign: 0, textalign: 0, overflow: 'hidden', textOverflow: 'visible',
    flexAlign: 'center', flexJustify: 'center', flexGap: 2, imageHeight: true, imageManualHeight: 10
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
  logoStyle: { height: 10, width: 0, radius: 0, opacity: 1, marginLeft: 0, marginRight: 0, position: 'static', x: 0, y: 0, fitHeight: false },
  imageStyle: { height: 10, width: 0, radius: 0, opacity: 1, marginLeft: 0, marginRight: 0, position: 'static', x: 0, y: 0, fitHeight: false },
  h1: { fontfamily: 'Helvetica, Arial, sans-serif', fontsize: 5, italic: false, color: '#000000' },
  h2: { fontfamily: 'Helvetica, Arial, sans-serif', fontsize: 3.7, italic: false, color: '#000000' },
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
  font-family: Helvetica, Arial, sans-serif;
  font-size: 5vh;
  line-height: 5vh;
  color: #000000;
  font-weight: normal;
  font-style: normal;
  text-transform: none;
  font-variant: normal;
}

h2 {
  font-family: Helvetica, Arial, sans-serif;
  font-size: 3.7vh;
  line-height: 3.7vh;
  color: #000000;
  font-weight: normal;
  font-style: normal;
  text-transform: none;
  font-variant: normal;
}
`,
  logo: null
};

let lastAnimation = {
  type: 'structured',
  duration: 1000,
  easing: 'easeInOutCirc',
  code: '',
  show: [{ selector: '.bauchbinde-box', properties: { opacity: [0, 1] }, duration: 1000, delay: 0, easing: 'easeInOutCirc' }],
  hide: [{ selector: '.bauchbinde-box', properties: { opacity: [1, 0] }, duration: 750, delay: 0, easing: 'easeInOutCirc' }]
};

expressapp.set('port', process.env.PORT || 5001);

// Disable caching in dev mode
if (isDev) {
    expressapp.use((req, res, next) => {
        res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
        res.header('Expires', '-1');
        res.header('Pragma', 'no-cache');
        next();
    });
}

// 1. Root Route: Always serve Playout
expressapp.get('/', (req, res, next) => {
    if (isDev) {
        req.url = '/bauchbinde_h5.html';
        next();
    } else {
        const prodPath = path.join(__dirname, 'dist/bauchbinde_h5.html');
        if (fs.existsSync(prodPath)) {
            res.sendFile(prodPath);
        } else {
            res.status(404).send('Playout files not found.');
        }
    }
});

// 2. Custom CSS & API Routes
expressapp.get('/custom.css', (req, res) => {
  res.header("Content-Type", "text/css");
  res.send(lastDesign.unifiedCss || '');
});

expressapp.get('/v1/list', (req, res) => {
  const list = data ? data.map((item, index) => ({ id: index + 1, name: item.name, title: item.title })) : [];
  res.json({ activeId: activeLowerThirdId, list: list });
});

expressapp.post('/v1/show/:id', (req, res) => {
  showLowerThirdByID(req.params.id);
  res.send("ok");
});

expressapp.post('/v1/hide', (req, res) => {
  hideLowerThird();
  res.send("ok");
});

// 3. Dev Proxy (HIGH PRIORITY in Dev)
if (isDev) {
    expressapp.use(createProxyMiddleware({
        target: 'http://localhost:3000',
        ws: true,
        logLevel: 'silent',
        changeOrigin: true
    }));
}

// 4. Static Files (ONLY Production)
expressapp.use(express.static(path.join(__dirname, 'dist/')));

io.on('connection', (socket) => {
    console.log('[Socket.io] Client connected');
    socket.emit('status-update', { activeId: activeLowerThirdId, activeItem: activeLowerThirdData });
    socket.on('request-state', () => {
      console.log('[Socket.io] request-state received, sending CSS length:', lastDesign.unifiedCss?.length);
      socket.emit('update-css', lastDesign);
      socket.emit('update-js', lastAnimation);
      socket.emit('status-update', { activeId: activeLowerThirdId, activeItem: activeLowerThirdData });
    });
});

http.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        const port = expressapp.get('port');
        console.error(`[express.js] Port ${port} ist bereits belegt!`);

        // Show error dialog when app is ready
        const showError = () => {
            dialog.showErrorBox(
                'Port bereits belegt',
                `Der Port ${port} wird bereits verwendet.\n\n` +
                `Mögliche Ursachen:\n` +
                `• Eine andere Instanz von Bauchbinder läuft bereits\n` +
                `• Ein anderes Programm verwendet Port ${port}\n\n` +
                `Bitte schließe die andere Anwendung und versuche es erneut.`
            );
            app.exit(1);
        };

        if (app.isReady()) {
            showError();
        } else {
            app.on('ready', showError);
        }
    } else {
        console.error('[express.js] Server error:', err);
    }
});

http.listen(expressapp.get('port'), () => {
    console.log('[express.js] listening on *:' + expressapp.get('port'));
});

function sendToWindows(channel, arg) {
  if (win) win.webContents.send(channel, arg);
  if (winKey) winKey.webContents.send(channel, arg);
  if (winFill) winFill.webContents.send(channel, arg);
}

function createWindow () {
  const width = isDev ? 1400 : 800;
  win = new BrowserWindow({
    width: width, height: 680, 
    icon: path.join(__dirname, 'assets/icons/1024x1024.png'),
    webPreferences: { nodeIntegration: true, contextIsolation: false }
  })
  require("@electron/remote/main").enable(win.webContents)
  if (isDev) {
    win.loadURL('http://localhost:3000/index.html');
    win.webContents.openDevTools();
  } else {
    win.loadURL(url.format({ pathname: path.join(__dirname, 'dist/index.html'), protocol: 'file:', slashes: true }));
  }
  win.on('close', async e => {
    e.preventDefault();
    const { response } = await dialog.showMessageBox(win, {
      type: 'question', title: 'Confirm', message: 'Willst du Bauchbinder wirklich beenden?', buttons: ['Ja', 'Nein'],
    });
    if (response === 0) {
      win.destroy();
      app.quit();
    }
  });
  win.on('closed', () => { win = null; });
}

function createKeyWin() {
  if(!winKey) {
    winKey = new BrowserWindow({ width: 800, height: 630, webPreferences: { nodeIntegration: true, contextIsolation: false } });
    require("@electron/remote/main").enable(winKey.webContents);
    winKey.loadURL(isDev ? 'http://localhost:3000/bauchbinde_key.html' : url.format({ pathname: path.join(__dirname, 'dist/bauchbinde_key.html'), protocol: 'file:', slashes: true }));
    winKey.removeMenu(); winKey.setMenu(null);
    winKey.webContents.on('did-finish-load', () => {
      winKey.webContents.send('update-css', lastDesign);
      winKey.webContents.send('update-js', lastAnimation);
    });
    winKey.on('closed', () => { winKey = null; });
  }
}

function createFillWin() {
  if(!winFill) {
    winFill = new BrowserWindow({ width: 800, height: 630, webPreferences: { nodeIntegration: true, contextIsolation: false } });
    require("@electron/remote/main").enable(winFill.webContents);
    winFill.loadURL(isDev ? 'http://localhost:3000/bauchbinde_fill.html' : url.format({ pathname: path.join(__dirname, 'dist/bauchbinde_fill.html'), protocol: 'file:', slashes: true }));
    winFill.removeMenu(); winFill.setMenu(null);
    winFill.webContents.on('did-finish-load', () => {
      winFill.webContents.send('update-css', lastDesign);
      winFill.webContents.send('update-js', lastAnimation);
    });
    winFill.on('closed', () => { winFill = null; });
  }
}

function createEditorWin(id = null) {
  if (winEditor) {
    winEditor.focus();
    return;
  }
  winEditor = new BrowserWindow({
    width: 1000, height: 600,
    parent: win,
    backgroundColor: '#1b1c1d',
    webPreferences: { nodeIntegration: true, contextIsolation: false }
  });
  require("@electron/remote/main").enable(winEditor.webContents);
  const editorUrl = isDev 
    ? 'http://localhost:3000/index.html?window=entry' 
    : url.format({ pathname: path.join(__dirname, 'dist/index.html'), protocol: 'file:', slashes: true, query: { window: 'entry' } });
  winEditor.loadURL(editorUrl);
  winEditor.removeMenu();
  ipc.once('editor-ready', () => {
    winEditor.webContents.send('setup-editor', { 
      id: id, 
      entry: id !== null ? data[id] : null,
      globalDesign: lastDesign
    });
  });
  winEditor.on('closed', () => { winEditor = null; });
}

function createStepEditorWin(phase, index) {
  if (winStep) {
    winStep.focus();
    return;
  }
  winStep = new BrowserWindow({
    width: 1000, height: 700,
    parent: win,
    backgroundColor: '#1b1c1d',
    webPreferences: { nodeIntegration: true, contextIsolation: false }
  });
  require("@electron/remote/main").enable(winStep.webContents);
  const stepUrl = isDev 
    ? 'http://localhost:3000/index.html?window=step' 
    : url.format({ pathname: path.join(__dirname, 'dist/index.html'), protocol: 'file:', slashes: true, query: { window: 'step' } });
  winStep.loadURL(stepUrl);
  winStep.removeMenu();
  ipc.once('step-editor-ready', () => {
    winStep.webContents.send('setup-step-editor', { phase, index, step: lastAnimation[phase][index] });
  });
  winStep.on('closed', () => { winStep = null; });
}

const animatingTimeouts = new Map();

function getAnimationDuration(steps) {
  if (!steps || !steps.length) return 750;
  return Math.max(...steps.map(s => (s.duration || 750) + (s.delay || 0)));
}

function startAnimating(index, duration) {
  // Clear existing timeout for this index if any
  if (animatingTimeouts.has(index)) {
    clearTimeout(animatingTimeouts.get(index));
  }

  sendToWindows('animating-add', index);

  const timeout = setTimeout(() => {
    sendToWindows('animating-remove', index);
    animatingTimeouts.delete(index);
  }, duration + 50);

  animatingTimeouts.set(index, timeout);
}

function showLowerThird(arg) {
  activeLowerThirdData = JSON.parse(JSON.stringify(arg));
  activeLowerThirdId = arg.id || null;
  const status = { activeId: activeLowerThirdId, activeItem: activeLowerThirdData };

  // Start animating for show animation
  const animatingId = arg.id ? arg.id - 1 : -1;
  if (animatingId >= 0) {
    const duration = getAnimationDuration(lastAnimation?.show);
    startAnimating(animatingId, duration);
  }

  sendToWindows('show-lowerthird', activeLowerThirdData);
  io.emit('show-lowerthird', activeLowerThirdData);
  sendToWindows('status-update', status);
  io.emit('status-update', status);
}

function showLowerThirdByID(arg) {
  let id = Number.parseInt(arg);
  if(id >= 1 && data && data.length >= id) {
    const item = JSON.parse(JSON.stringify(data[id-1]));
    item.id = id;
    showLowerThird(item);
  }
}

function hideLowerThird() {
  // Start animating for hide animation
  const animatingId = activeLowerThirdId ? activeLowerThirdId - 1 : -1;
  if (animatingId >= 0) {
    const duration = getAnimationDuration(lastAnimation?.hide);
    startAnimating(animatingId, duration);
  }

  activeLowerThirdId = null;
  activeLowerThirdData = null;
  sendToWindows('hide-lowerthird', null);
  io.emit('hide-lowerthird', null);
  io.emit('status-update', { activeId: activeLowerThirdId, activeItem: null });
  sendToWindows('status-update', { activeId: activeLowerThirdId, activeItem: null });
}

function cancelLowerThird() {
  // Clear all animating timeouts and send remove for each
  animatingTimeouts.forEach((timeout, index) => {
    clearTimeout(timeout);
    sendToWindows('animating-remove', index);
  });
  animatingTimeouts.clear();

  activeLowerThirdId = null;
  activeLowerThirdData = null;
  sendToWindows('cancel-lowerthird', null);
  io.emit('cancel-lowerthird', null);
  io.emit('status-update', { activeId: activeLowerThirdId, activeItem: null });
  sendToWindows('status-update', { activeId: activeLowerThirdId, activeItem: null });
}

ipc.on('request-state', (event) => {
  if (data) event.sender.send('update-data', data);
  if (lastDesign) event.sender.send('update-css', lastDesign);
  if (lastAnimation) event.sender.send('update-js', lastAnimation);
  event.sender.send('status-update', { activeId: activeLowerThirdId, activeItem: activeLowerThirdData });
});

ipc.on('update-data', (event, arg) => {
  data = arg;
});

ipc.on('update-css', (event, arg) => {
  console.log('[IPC] update-css received, CSS length:', arg.unifiedCss?.length);
  lastDesign = arg;
  sendToWindows('update-css', arg);
  io.emit('update-css', arg);
});

ipc.on('update-js', (event, arg) => {
  lastAnimation = arg;
  sendToWindows('update-js', arg);
  io.emit('update-js', arg);
});

ipc.on('log-debug', (event, arg) => {
  logger.info('RENDERER DEBUG:', arg);
});

ipc.handle('download-to-base64', async (event, url) => {
  try {
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const contentType = response.headers.get('content-type') || 'font/woff2';
    return { data: base64, type: contentType };
  } catch (err) {
    logger.error('Download failed:', { url, error: err.message });
    return null;
  }
});

ipc.on('show-lowerthird', (event, arg) => showLowerThird(arg));
ipc.on('hide-lowerthird', () => hideLowerThird());
ipc.on('cancel-lowerthird', () => cancelLowerThird());
ipc.on('kill-playout', () => {
  sendToWindows('kill-playout', null);
  io.emit('kill-playout', null);
  activeLowerThirdId = null;
  activeLowerThirdData = null;
});
ipc.on('openwinkey', () => createKeyWin());
ipc.on('openwinfill', () => createFillWin());
ipc.on('open-entry-editor', (event, id) => createEditorWin(id));
ipc.on('open-step-editor', (event, arg) => createStepEditorWin(arg.phase, arg.index));

ipc.on('save-entry', (event, arg) => {
  if (arg.id !== null) data[arg.id] = arg.entry;
  else { if (!data) data = []; data.push(arg.entry); }
  sendToWindows('update-data', data);
  
  // LIVE UPDATE: If this item is currently active, broadcast changes immediately
  if (arg.id !== null && (arg.id + 1) === activeLowerThirdId) {
    const updatedItem = JSON.parse(JSON.stringify(data[arg.id]));
    updatedItem.id = activeLowerThirdId;
    showLowerThird(updatedItem);
  }

  if (arg.close && winEditor) winEditor.close();
});

ipc.on('save-step', (event, arg) => {
  if (lastAnimation[arg.phase]) {
    lastAnimation[arg.phase][arg.index] = arg.step;
    sendToWindows('update-js', lastAnimation);
    io.emit('update-js', lastAnimation);
  }
  if (winStep) winStep.close();
});

ipc.on('delete-entry', (event, id) => {
  if (id !== null && data) { data.splice(id, 1); sendToWindows('update-data', data); }
  if (winEditor) winEditor.close();
});

ipc.on('toggle-fullscreen-key', () => { if (winKey) winKey.setFullScreen(!winKey.isFullScreen()); });
ipc.on('toggle-fullscreen-fill', () => { if (winFill) winFill.setFullScreen(!winFill.isFullScreen()); });

app.on('ready', () => {
  createWindow();
  for(let i=0; i<=9; i++) {
    globalShortcut.register(`Control+Alt+${i}`, () => {
      if(i===0) hideLowerThird(); else showLowerThirdByID(i);
    });
  }
});

app.on('will-quit', () => { globalShortcut.unregisterAll(); });
app.on('window-all-closed', () => { app.quit(); });
app.on('activate', () => { if (win === null) createWindow(); });
