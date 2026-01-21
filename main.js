const { app, BrowserWindow, globalShortcut } = require('electron')
const isDev = require('electron-is-dev')
require('@electron/remote/main').initialize()
const path = require('path')
const url = require('url')
const ipc = require('electron').ipcMain
const express = require('express');
const expressapp = express();

// CORS Middleware für Express
expressapp.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

const http = require('http').Server(expressapp);
const io = require('socket.io')(http, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});
const fs = require('fs');
const { dialog } = require('electron')

let animationStyle = 'fade';
let animationParams = { 
  duration: 750,
  easing: 'easeInOutCirc',
  code: ''
};
let customCSS = '';

fs.readFile(path.join(__dirname, 'animations/fade.js'), 'utf8', function(err, data) {
  if (err) console.log("Error", err);
    animationParams.code = data;
});

expressapp.set('port', process.env.PORT || 5001);
expressapp.use(express.static(isDev ? path.join(__dirname, 'public/') : path.join(__dirname, 'dist/')));

expressapp.get('/', function(req, res) {
    if (isDev) {
      res.redirect('http://localhost:3000/bauchbinde_h5.html');
    } else {
      res.sendFile(path.join(__dirname, 'dist/bauchbinde_h5.html'));
    }
});

// Wir müssen sicherstellen, dass die src/renderer/playout-engine.js erreichbar ist
expressapp.use('/src', express.static(path.join(__dirname, 'src/')));
expressapp.use('/node_modules', express.static(path.join(__dirname, 'node_modules/')));

expressapp.get('/animate.js', function(req, res) {
  res.header("Content-Type", "application/javascript");

  if(animationStyle == 'custom') {
    res.write('// --------------------------------------\n// FX PARAMETERS\n// --------------------------------------\n');
    res.write('const FX_DURATION = ' + animationParams.duration + '\n');
    res.write('const FX_EASING = \'' + animationParams.easing + '\'\n');
    res.write('\n\n');
    res.write(animationParams.code);
    res.end();
  } else {
    res.write('// --------------------------------------\n// FX PARAMETERS\n// --------------------------------------\n');
    res.write('const FX_DURATION = ' + animationParams.duration + '\n');
    res.write('const FX_EASING = \'' + animationParams.easing + '\'\n');
    res.write('\n\n');
    fs.createReadStream(path.join(__dirname, 'animations/' + animationStyle + '.js')).pipe(res);
    //res.sendFile(path.join(__dirname, 'animations/' + animationStyle + '.js'));
  }
});

expressapp.get('/custom.css', function(req, res) {
  res.header("Content-Type", "text/css");
  res.send(customCSS);
});

// rest api
expressapp.get('/v1/list', function(req, res) {
  // Map data to include useful IDs (1-based index)
  const list = data ? data.map((item, index) => ({
    id: index + 1,
    name: item.name,
    title: item.title
  })) : [];
  res.json({
    activeId: activeLowerThirdId,
    list: list
  });
});

expressapp.post('/v1/show/:id', function(req, res) {
  showLowerThirdByID(req.params.id)
  res.send("ok")
});

expressapp.post('/v1/hide', function(req, res) {
  hideLowerThird()
  res.send("ok")
});


io.on('connection', (socket) => {
    console.log('a user connected');
    socket.emit('status-update', { activeId: activeLowerThirdId, activeItem: activeLowerThirdData });
    socket.on('request-state', () => {
      socket.emit('update-css', lastDesign);
      socket.emit('update-js', lastAnimation);
      socket.emit('status-update', { activeId: activeLowerThirdId, activeItem: activeLowerThirdData });
    });
});


http.listen(expressapp.get('port'), function() {
    console.log('[express.js] listening on *:' + expressapp.get('port'));
});

let win
let winKey
let winFill
let data
let lastDesign = {
  white: { width: 0, left: 0, bottom: 7, color: 'rgba(255,255,255,0.8)', paddingh: 5, paddingv: 2.6, borderradius: 0, divalign: 0, textalign: 0 },
  h1: { fontfamily: 'Helvetica, Arial, sans-serif', fontsize: 5, bold: false, italic: false, color: '#000000' },
  h2: { fontfamily: 'Helvetica, Arial, sans-serif', fontsize: 3.7, bold: false, italic: false, color: '#000000' },
  customcss: ''
};
let lastAnimation = { type: 'fade', duration: 750, easing: 'easeInOutCirc' };
let activeLowerThirdId = null;
let activeLowerThirdData = null;

function createWindow () {
  const width = isDev ? 1400 : 800;
  win = new BrowserWindow({
    width: width, 
    height: 680, 
    icon: path.join(__dirname, 'assets/icons/1024x1024.png'),
    webPreferences: { nodeIntegration: true, contextIsolation: false }
  })
  require("@electron/remote/main").enable(win.webContents)

  if (isDev) {
    win.loadURL('http://localhost:3000/index.html')
    win.webContents.openDevTools()
  } else {
    win.loadURL(url.format({
      pathname: path.join(__dirname, 'dist/index.html'),
      protocol: 'file:',
      slashes: true
    }))
  }

  // Open the DevTools.
  //win.webContents.openDevTools()

  win.on('close', async e => {
    e.preventDefault()
  
    const { response } = await dialog.showMessageBox(win, {
      type: 'question',
      title: '  Confirm  ',
      message: 'Willst du Bauchbinder wirklich beenden?',
      buttons: ['Ja', 'Nein'],
    })
  
    response === 0 && win.destroy()
  })

  win.on('closed', () => {
    win = null
  })
}

function createKeyWin() {
  console.log("create key window");
  if(!winKey) {
    winKey = new BrowserWindow({
      width: 800, 
      height: 630, 
      icon: path.join(__dirname, 'assets/icons/1024x1024.png'),
      webPreferences: { nodeIntegration: true, contextIsolation: false }
    })
    require("@electron/remote/main").enable(winKey.webContents)

    if (isDev) {
      winKey.loadURL('http://localhost:3000/bauchbinde_key.html')
    } else {
      winKey.loadURL(url.format({
        pathname: path.join(__dirname, 'dist/bauchbinde_key.html'),
        protocol: 'file:',
        slashes: true
      }))
    }

    winKey.removeMenu()         
    winKey.setMenu(null) 

    winKey.webContents.on('did-finish-load', () => {
      if (lastDesign) winKey.webContents.send('update-css', lastDesign);
      if (lastAnimation) winKey.webContents.send('update-js', lastAnimation);
    });

    winKey.on('closed', () => {
      winKey = null
    })
  }
}

function createFillWin() {
  console.log("create fill window");
  if(!winFill) {
    winFill = new BrowserWindow({
      width: 800, 
      height: 630, 
      icon: path.join(__dirname, 'assets/icons/1024x1024.png'),
      webPreferences: { nodeIntegration: true, contextIsolation: false }
    })
    require("@electron/remote/main").enable(winFill.webContents)

    if (isDev) {
      winFill.loadURL('http://localhost:3000/bauchbinde_fill.html')
    } else {
      winFill.loadURL(url.format({
        pathname: path.join(__dirname, 'dist/bauchbinde_fill.html'),
        protocol: 'file:',
        slashes: true
      }))
    }

    winFill.removeMenu()         
    winFill.setMenu(null) 

    winFill.webContents.on('did-finish-load', () => {
      if (lastDesign) winFill.webContents.send('update-css', lastDesign);
      if (lastAnimation) winFill.webContents.send('update-js', lastAnimation);
    });

    winFill.on('closed', () => {
      winFill = null
    })
  }
}

function sendToWindows(type, msg) {
  if(winFill)
    winFill.webContents.send(type, msg)
  if(winKey)
    winKey.webContents.send(type, msg)
}

function showLowerThird(arg) {
  sendToWindows('show-lowerthird', arg)
  io.emit('show-lowerthird', arg)
  console.log('show lowerthird', arg)
}

function showLowerThirdByID(arg) {
  let id = Number.parseInt(arg)
  console.log('show lowerthird by id', arg)
  if(id >= 1 && data && data.length >= id) {
    activeLowerThirdId = id;
    activeLowerThirdData = JSON.parse(JSON.stringify(data[id-1]));
    activeLowerThirdData.id = id; // Inject ID for sync tracking
    showLowerThird(activeLowerThirdData)
    io.emit('status-update', { activeId: activeLowerThirdId, activeItem: activeLowerThirdData });
    sendToWindows('status-update', { activeId: activeLowerThirdId, activeItem: activeLowerThirdData });
  }
}

function hideLowerThird() {
  activeLowerThirdId = null;
  activeLowerThirdData = null;
  var arg = null;
  sendToWindows('hide-lowerthird', arg)
  io.emit('hide-lowerthird', arg)
  io.emit('status-update', { activeId: activeLowerThirdId, activeItem: null });
  sendToWindows('status-update', { activeId: activeLowerThirdId, activeItem: null });
  console.log('hide lowerthird', arg)
}

ipc.on('request-state', (event) => {
  if (lastDesign) event.reply('update-css', lastDesign);
  if (lastAnimation) event.reply('update-js', lastAnimation);
  event.reply('status-update', { activeId: activeLowerThirdId, activeItem: activeLowerThirdData });
});

ipc.on('update-data', function (event, arg) {
  console.log("update data", arg)
  data = arg;
})

ipc.on('show-lowerthird', function (event, arg) {
  showLowerThird(arg)
})

ipc.on('hide-lowerthird', function (event, arg) {
  hideLowerThird()
})

ipc.on('openwinkey', function (event, arg) {
  createKeyWin()
})

ipc.on('openwinfill', function (event, arg) {
  createFillWin()
})

ipc.on('toggle-fullscreen-key', function() {
  console.log('Toggle Fullscreen Key. winKey exists:', !!winKey);
  if (winKey) {
    winKey.focus();
    const currentState = winKey.isFullScreen();
    winKey.setFullScreen(!currentState);
    console.log('winKey fullscreen set to:', !currentState);
  }
})

ipc.on('toggle-fullscreen-fill', function() {
  console.log('Toggle Fullscreen Fill. winFill exists:', !!winFill);
  if (winFill) {
    winFill.focus();
    const currentState = winFill.isFullScreen();
    winFill.setFullScreen(!currentState);
    console.log('winFill fullscreen set to:', !currentState);
  }
})

ipc.on('toggle-fullscreen', function(event) {
  const sender = event.sender;
  if (winKey && sender === winKey.webContents) {
    winKey.setFullScreen(!winKey.isFullScreen());
  }
  if (winFill && sender === winFill.webContents) {
    winFill.setFullScreen(!winFill.isFullScreen());
  }
})

ipc.on('set-animation', function(event, arg) {
  console.log('set-animation', arg)
  animationStyle = arg;

  if(winKey)
    winKey.reload();

  if(winFill)
    winFill.reload();

  io.emit('reload');
})

ipc.on('update-js', function(event, arg) {
  console.log('update-js', arg)
  animationStyle = arg.type;
  animationParams.duration = arg.duration;
  animationParams.easing = arg.easing;
  animationParams.code = arg.code;
  lastAnimation = arg;

  if(winKey) winKey.webContents.send('update-js', lastAnimation);
  if(winFill) winFill.webContents.send('update-js', lastAnimation);

  // WICHTIG: Daten auch an Sockets senden für HTML5/OBS
  io.emit('update-js', lastAnimation);
})

ipc.on('update-css', function (event, arg) {
  lastDesign = arg;
  if(winKey) winKey.webContents.send('update-css', lastDesign);
  if(winFill) winFill.webContents.send('update-css', lastDesign);
  
  let newCSS = '.bauchbinde {';
  if(arg.white.bottom)
    newCSS += 'bottom: ' + arg.white.bottom + 'vh;';
  if(arg.white.divalign == 0)
    newCSS += 'text-align: left;';
  if(arg.white.divalign == 1)
    newCSS += 'text-align: center;';
  if(arg.white.divalign == 2)
    newCSS += 'text-align: right;';
  newCSS += `}
  `;

  newCSS += 'div.bauchbinde > .white {';
  if(arg.white.width)
    newCSS += 'min-width: ' + arg.white.width + 'vw;';
  if(arg.white.left)
    newCSS += 'margin: 0 ' + arg.white.left + 'vw;';
  if(arg.white.color)
    newCSS += 'background: ' + arg.white.color + ';';
  if(arg.white.borderradius)
    newCSS += 'border-radius: ' + arg.white.borderradius + 'px;';  
  newCSS += `}
  `;

  newCSS += '.key div.bauchbinde > .white {';
  if(arg.white.color) {
    let keycolor = arg.white.color.replace(regexRGBA, rgbaKey);
    if(!keycolor.startsWith('rgba')) keycolor = '#ffffff';
    newCSS += 'background: ' + keycolor + ';';
  }
  newCSS += `}
  `;

  newCSS += '.fill div.bauchbinde > .white {';
  if(arg.white.color) {
    let fillcolor = arg.white.color.replace(regexRGBA, rgbaFill);
    newCSS += 'background: ' + fillcolor + ';';
  }
  newCSS += `}
  `;

  newCSS += 'div.bauchbinde > .white > .text {';
  if(arg.white.paddingh && arg.white.paddingv)
    newCSS += 'padding: ' + arg.white.paddingv + 'vh ' + arg.white.paddingh + 'vh;';
  if(arg.white.textalign == 0)
    newCSS += 'text-align: left;';
  if(arg.white.textalign == 1)
    newCSS += 'text-align: center;';
  if(arg.white.textalign == 2)
    newCSS += 'text-align: right;';
  newCSS += `}
  `;

  newCSS += 'h1 {';
  if(arg.h1.fontfamily)
    newCSS += 'font-family: ' + arg.h1.fontfamily + ';';
  if(arg.h1.fontsize) {
    newCSS += 'font-size: ' + arg.h1.fontsize + 'vh;';
    newCSS += 'line-height: ' + arg.h1.fontsize + 'vh;';
  }
  if(arg.h1.color)
    newCSS += 'color: ' + arg.h1.color + ';';
  if(arg.h1.bold)
    newCSS += 'font-weight: bold;';
  if(arg.h1.italic)
   newCSS += 'font-style: italic;';
  newCSS += `}
  `;

  newCSS += '.key h1 {';
  if(arg.h1.color) {
    let keycolor = arg.h1.color.replace(regexRGBA, rgbaKey);
    if(!keycolor.startsWith('rgba')) keycolor = '#ffffff';
    newCSS += 'color: ' + keycolor + ';';
  }
  newCSS += `}
  `;

  newCSS += '.fill h1 {';
  if(arg.h1.color) {
    let fillcolor = arg.h1.color.replace(regexRGBA, rgbaFill);
    newCSS += 'color: ' + fillcolor + ';';
  }
  newCSS += `}
  `;

  newCSS += 'h2 {';
  if(arg.h2.fontfamily)
    newCSS += 'font-family: ' + arg.h2.fontfamily + ';';
  if(arg.h2.fontsize)
    newCSS += 'font-size: ' + arg.h2.fontsize + 'vh;';
  if(arg.h2.color)
    newCSS += 'color: ' + arg.h2.color + ';';
  if(arg.h2.bold)
    newCSS += 'font-weight: bold;';
  if(arg.h2.italic)
   newCSS += 'font-style: italic;';
  newCSS += `}
  `;

  newCSS += '.key h2 {';
  if(arg.h1.color) {
    let keycolor = arg.h2.color.replace(regexRGBA, rgbaKey);
    if(!keycolor.startsWith('rgba')) keycolor = '#ffffff';
    newCSS += 'color: ' + keycolor + ';';
  }
  newCSS += `}
  `;

  newCSS += '.fill h2 {';
  if(arg.h1.color) {
    let fillcolor = arg.h2.color.replace(regexRGBA, rgbaFill);
    newCSS += 'color: ' + fillcolor + ';';
  }
  newCSS += `}
  `;

if(arg.customcss)
  newCSS += arg.customcss;

  if(arg.css)
    newCSS += arg.css;

  console.log(newCSS)
  
  customCSS = newCSS;

  if(winKey)
    winKey.reload();
  
  if(winFill)
    winFill.reload();

  io.emit('reload');
})

app.on('ready', () => {
  createWindow()

  globalShortcut.register('Control+Alt+0', () => {
    hideLowerThird()
  })

  globalShortcut.register('Control+Alt+1', () => {
    showLowerThirdByID(1)
  })

  globalShortcut.register('Control+Alt+2', () => {
    showLowerThirdByID(2)
  })

  globalShortcut.register('Control+Alt+3', () => {
    showLowerThirdByID(3)
  })

  globalShortcut.register('Control+Alt+4', () => {
    showLowerThirdByID(4)
  })

  globalShortcut.register('Control+Alt+5', () => {
    showLowerThirdByID(5)
  })

  globalShortcut.register('Control+Alt+6', () => {
    showLowerThirdByID(6)
  })

  globalShortcut.register('Control+Alt+7', () => {
    showLowerThirdByID(7)
  })

  globalShortcut.register('Control+Alt+8', () => {
    showLowerThirdByID(8)
  })

  globalShortcut.register('Control+Alt+9', () => {
    showLowerThirdByID(9)
  })
})

app.on('will-quit', () => {
  // Unregister all shortcuts.
  globalShortcut.unregisterAll()
})

app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow()
  }
})

const regexRGBA = /rgba\(([0-9]*),([0-9]*),([0-9]*),([0-9.]*)\)/

function rgbaKey(match, r, g, b, a, offset, string) {
  return 'rgba(255,255,255,' + a + ')';
}

function rgbaFill(match, r, g, b, a, offset, string) {
  return 'rgba(' + r + ',' + g + ',' + b + ',1)';
}