const { app, BrowserWindow, globalShortcut, ipcMain: ipc } = require('electron')
const isDev = require('electron-is-dev')
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

let win, winKey, winFill, data;
let activeLowerThirdId = null;
let activeLowerThirdData = null;

let lastDesign = {

  white: { 

    width: 10, left: 5, bottom: 7, height: 1, fixedWidth: false, fixedHeight: false,

    color: 'rgba(255,255,255,0.8)', 

    paddingh: 5, paddingv: 2.6, borderradius: 0, 

    divalign: 0, textalign: 0, overflow: 'hidden', textOverflow: 'visible',

    flexAlign: 'center', flexJustify: 'center', flexGap: 2, imageHeight: true, imageManualHeight: 10

  },
  layoutOrder: [
    { id: '.logo', name: 'Bild (Global)', alignSelf: 'auto' },
    { id: '.image', name: 'Bild (Bauchbinde)', alignSelf: 'auto' },
    { id: '.text', name: 'Text', alignSelf: 'auto' }
  ],
  logoStyle: { height: 100, width: 0, radius: 0, opacity: 1, margin: 0, position: 'static', x: 0, y: 0, fitHeight: true },
  imageStyle: { height: 100, width: 0, radius: 0, opacity: 1, margin: 0, position: 'static', x: 0, y: 0, fitHeight: true },
  h1: { fontfamily: 'Helvetica, Arial, sans-serif', fontsize: 5, italic: false, color: '#000000' },
  h2: { fontfamily: 'Helvetica, Arial, sans-serif', fontsize: 3.7, italic: false, color: '#000000' },
  unifiedCss: ''
};

let lastAnimation = { 
  type: 'structured', 
  duration: 750, 
  easing: 'easeInOutCirc', 
  code: '',
  show: [{ selector: '.bb-box', properties: { opacity: [0, 1] }, duration: 750, delay: 0, easing: 'easeInOutCirc' }],
  hide: [{ selector: '.bb-box', properties: { opacity: [1, 0] }, duration: 500, delay: 0, easing: 'easeInOutCirc' }]
};

expressapp.set('port', process.env.PORT || 5001);
expressapp.use(express.static(isDev ? path.join(__dirname, 'public/') : path.join(__dirname, 'dist/')));

expressapp.get('/', (req, res) => {
    if (isDev) res.redirect('http://localhost:3000/bauchbinde_h5.html');
    else res.sendFile(path.join(__dirname, 'dist/bauchbinde_h5.html'));
});

expressapp.use('/src', express.static(path.join(__dirname, 'src/')));
expressapp.use('/node_modules', express.static(path.join(__dirname, 'node_modules/')));

// Legacy support for OBS custom.css
expressapp.get('/custom.css', (req, res) => {
  res.header("Content-Type", "text/css");
  res.send(lastDesign.unifiedCss || '');
});

// REST API
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

io.on('connection', (socket) => {
    logger.info('Socket: User connected');
    socket.emit('status-update', { activeId: activeLowerThirdId, activeItem: activeLowerThirdData });
    socket.on('request-state', () => {
      socket.emit('update-css', lastDesign);
      socket.emit('update-js', lastAnimation);
      socket.emit('status-update', { activeId: activeLowerThirdId, activeItem: activeLowerThirdData });
    });
});

http.listen(expressapp.get('port'), () => {
    console.log('[express.js] listening on *:' + expressapp.get('port'));
});

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
    if (response === 0) win.destroy();
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

function sendToWindows(type, msg) {
  if(winFill) winFill.webContents.send(type, msg);
  if(winKey) winKey.webContents.send(type, msg);
}

function showLowerThird(arg) {
  sendToWindows('show-lowerthird', arg);
  io.emit('show-lowerthird', arg);
}

function showLowerThirdByID(arg) {
  let id = Number.parseInt(arg);
  if(id >= 1 && data && data.length >= id) {
    activeLowerThirdId = id;
    activeLowerThirdData = JSON.parse(JSON.stringify(data[id-1]));
    activeLowerThirdData.id = id;
    showLowerThird(activeLowerThirdData);
    io.emit('status-update', { activeId: activeLowerThirdId, activeItem: activeLowerThirdData });
    sendToWindows('status-update', { activeId: activeLowerThirdId, activeItem: activeLowerThirdData });
  }
}

function hideLowerThird() {
  activeLowerThirdId = null;
  activeLowerThirdData = null;
  sendToWindows('hide-lowerthird', null);
  io.emit('hide-lowerthird', null);
  io.emit('status-update', { activeId: activeLowerThirdId, activeItem: null });
  sendToWindows('status-update', { activeId: activeLowerThirdId, activeItem: null });
}

// IPC Listeners
ipc.on('request-state', (event) => {
  logger.info('IPC: request-state');
  if (data) event.reply('update-data', data);
  if (lastDesign) event.reply('update-css', lastDesign);
  if (lastAnimation) event.reply('update-js', lastAnimation);
  event.reply('status-update', { activeId: activeLowerThirdId, activeItem: activeLowerThirdData });
});

ipc.on('update-data', (event, arg) => {
  logger.info('IPC: update-data', { count: arg ? arg.length : 0 });
  data = arg;
});

ipc.on('update-css', (event, arg) => {
  logger.info('IPC: update-css', { hasUnified: !!arg.unifiedCss });
  lastDesign = arg;
  sendToWindows('update-css', arg);
  io.emit('update-css', arg);
});

ipc.on('update-js', (event, arg) => {
  logger.info('IPC: update-js', { type: arg.type });
  lastAnimation = arg;
  sendToWindows('update-js', arg);
  io.emit('update-js', arg);
});

ipc.on('log-debug', (event, arg) => {
  logger.info('RENDERER DEBUG:', arg);
});

ipc.on('show-lowerthird', (event, arg) => showLowerThird(arg));
ipc.on('hide-lowerthird', () => hideLowerThird());
ipc.on('openwinkey', () => createKeyWin());
ipc.on('openwinfill', () => createFillWin());

ipc.on('toggle-fullscreen-key', () => { if (winKey) winKey.setFullScreen(!winKey.isFullScreen()); });
ipc.on('toggle-fullscreen-fill', () => { if (winFill) winFill.setFullScreen(!winFill.isFullScreen()); });
ipc.on('toggle-fullscreen', (event) => {
  if (winKey && event.sender === winKey.webContents) winKey.setFullScreen(!winKey.isFullScreen());
  if (winFill && event.sender === winFill.webContents) winFill.setFullScreen(!winFill.isFullScreen());
});

app.on('ready', () => {
  createWindow();
  for(let i=0; i<=9; i++) {
    globalShortcut.register(`Control+Alt+${i}`, () => {
      if(i===0) hideLowerThird(); else showLowerThirdByID(i);
    });
  }
});

app.on('will-quit', () => { globalShortcut.unregisterAll(); });
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (win === null) createWindow(); });
