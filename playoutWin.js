var ipc = require('electron').ipcRenderer;

ipc.on('show-lowerthird', function (event, arg) {
    console.log('show lowerthird', arg)
})

ipc.on('hide-lowerthird', function (event, arg) {
    console.log('hide lowerthird', arg)
})