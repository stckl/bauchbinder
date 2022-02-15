const { app, BrowserWindow, globalShortcut } = require('electron')
const path = require('path')
const url = require('url')
const ipc = require('electron').ipcMain
const express = require('express');
const expressapp = express();
const http = require('http').Server(expressapp);
const io = require('socket.io')(http);
const fs = require('fs');
const { dialog } = require('electron')

let animationStyle = 'fade';
let animationParams = { 
  duration: 750,
  easing: 'easeInOutCirc'
};
let customCSS = '';

expressapp.set('port', process.env.PORT || 5000);
expressapp.use(express.static(path.join(__dirname, 'public/')));

expressapp.get('/', function(req, res) {
    res.sendFile(path.join(__dirname, 'bauchbinde_h5.html'));
});

expressapp.get('/animate.js', function(req, res) {
  res.header("Content-Type", "application/javascript");
  res.write('// --------------------------------------\n// FX PARAMETERS\n// --------------------------------------\n');
  res.write('const FX_DURATION = ' + animationParams.duration + '\n');
  res.write('const FX_EASING = \'' + animationParams.easing + '\'\n');
  res.write('\n\n');
  fs.createReadStream(__dirname + '/animations/' + animationStyle + '.js').pipe(res);
  //res.sendFile(path.join(__dirname, 'animations/' + animationStyle + '.js'));
});

expressapp.get('/custom.css', function(req, res) {
  res.header("Content-Type", "text/css");
  res.send(customCSS);
});

// rest api
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
});

http.listen(expressapp.get('port'), function() {
    console.log('[express.js] listening on *:' + expressapp.get('port'));
});

let win
let winKey
let winFill
let data

function createWindow () {
  win = new BrowserWindow({width: 800, height: 680, webPreferences: { nodeIntegration: true }})

  win.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }))

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
    winKey = new BrowserWindow({width: 800, height: 630, webPreferences: { nodeIntegration: true }})

    winKey.loadURL(url.format({
      pathname: path.join(__dirname, 'bauchbinde_key.html'),
      protocol: 'file:',
      slashes: true
    }))

    winKey.removeMenu()         
    winKey.setMenu(null) 

    // Open the DevTools.
    //winKey.webContents.openDevTools()

    winKey.on('closed', () => {
      winKey = null
    })
  }
}

function createFillWin() {
  console.log("create fill window");
  if(!winFill) {
    winFill = new BrowserWindow({width: 800, height: 630, webPreferences: { nodeIntegration: true }})

    winFill.loadURL(url.format({
      pathname: path.join(__dirname, 'bauchbinde_fill.html'),
      protocol: 'file:',
      slashes: true
    }))

    winFill.removeMenu()         
    winFill.setMenu(null) 

    // Open the DevTools.
    //winFill.webContents.openDevTools()

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
    var arg = data[id-1]
    showLowerThird(arg)
  }
}

function hideLowerThird() {
  var arg = null;
  sendToWindows('hide-lowerthird', arg)
  io.emit('hide-lowerthird', arg)
  console.log('hide lowerthird', arg)
}

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
  console.log('set-animation', arg)
  animationStyle = arg.type;
  animationParams.duration = arg.duration;
  animationParams.easing = arg.easing;

  if(winKey)
    winKey.reload();

  if(winFill)
    winFill.reload();

  io.emit('reload');
})

ipc.on('update-css', function (event, arg) {
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