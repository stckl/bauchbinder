var ipc = require('electron').ipcRenderer;
const {dialog} = require('electron').remote;
var fs = require('fs');
const path = require('path');
const url = require('url');
const fontList = require('font-list');

var app = new Vue({
    el: '#app',

    data: {
        lowerthirds: [],
        design: {
            white: {
                width: 0, // min-width
                left: 0, // left oder right
                bottom: 7, // bottom
                color: 'rgba(255,255,255,0.8)', // backgroundcolor
                paddingh: 5, // text padding horizontal
                paddingv: 2.6, // text padding vertical
                divalign: 0, // 0=left, 1=mid, 2=right
                textalign: 0 // 0=left, 1=mid, 2=right
            },
            h1: {
                fontfamily: 'Helvetica, Arial, "Lucida Grande", sans-serif',
                fontsize: 5, // fontsize and line-height
                bold: false,
                italic: false,
                color: '#000000'
            },
            h2: {
                fontfamily: 'Helvetica, Arial, "Lucida Grande", sans-serif',
                fontsize: 3.7,
                bold: false,
                italic: false,
                color: '#000000'
            },
            css: ''
        },
        animation: {
            type: 'fade',
            duration: 750,
            easing: 'easeInOutCirc'
        },
        newname: '',
        newtitle: '',
        newentryid: null,
        fonts: [],
        active: -1,
    },

    methods: {
        addLowerthird() {
            if(this.newentryid != null)
                Vue.set(this.lowerthirds, this.newentryid, { name: this.newname, title: this.newtitle })
            else
                this.lowerthirds.push({ name: this.newname, title: this.newtitle });

            this.newname = '';
            this.newtitle = '';
            this.newentryid = null;
            ipc.send('update-data', this.lowerthirds);
        },

        playLowerthird(index) {
            this.active = index;
            ipc.send('show-lowerthird', {name: this.lowerthirds[index].name, title: this.lowerthirds[index].title});
        },

        stopLowerthird() {
            ipc.send('hide-lowerthird');
            this.active = -1;
        },

        deleteLowerthird(id) {
            this.lowerthirds.splice(id,1);
            ipc.send('update-data', this.lowerthirds);
        },

        saveFile() {
            const filedata = {
                lowerthirds: this.lowerthirds,
                design: this.design,
                animation: this.animation
            };
            const content = JSON.stringify(filedata);
            const element = document.createElement("a");
            const file = new Blob([content], {type: "text/json"});
            element.href = URL.createObjectURL(file);
            element.download = "file.json";
            element.click();
        },

        openFile() {
            var self = this;
            dialog.showOpenDialog({
                /*filters: [
                    { name: 'JSON', extensions: ['json'] }
                ],*/
                properties: ['openFile']
            }).then(result => {
                if(!result.canceled && result.filePaths.length > 0) {
                    fs.readFile(result.filePaths[0], 'utf8', function (err,data) {
                        var loadedData = JSON.parse(data);
                        if(loadedData.lowerthirds) {
                            console.log("loading data");
                            self.lowerthirds = loadedData.lowerthirds;
                            ipc.send('update-data', loadedData.lowerthirds);
                        }
                        if(loadedData.design) {
                            console.log("loading design ...");
                            self.design = loadedData.design;
                            ipc.send('update-css', loadedData.design);
                        }
                        if(loadedData.animation) {
                            console.log("loading animations ...");
                            if (typeof loadedData.animation === 'string' || loadedData.animation instanceof String) { // convert old showfiles
                                self.animation.type = loadedData.animation;
                                self.animation.duration = 750;
                                self.animation.easing = 'easeInOutCirc';
                            } else
                                self.animation = loadedData.animation;
                        }
                    })
                }
            }).catch(err => {
                console.log(err)
            });
        },

        openWinKey() {
            console.log('openwinkey')
            ipc.send('openwinkey')
        },

        openWinFill() {
            console.log('openwinfill')
            ipc.send('openwinfill')
        },

        updateCSS() {
            ipc.send('update-css', this.design)
        },

        updateJS() {
            if(!(this.animation.duration > 1 && this.animation.duration < 10000))
                this.animation.duration = 750;
            ipc.send('update-js', this.animation)
        },

        toggleH1Bold() {
            this.design.h1.bold = !this.design.h1.bold;
        },

        toggleH1Italic() {
            this.design.h1.italic = !this.design.h1.italic;
        },

        toggleH2Bold() {
            this.design.h2.bold = !this.design.h2.bold;
        },

        toggleH2Italic() {
            this.design.h2.italic = !this.design.h2.italic;
        },

        setAnimation(type) {
            console.log('set-animation', type);
            this.animation.type = type;
            ipc.send('set-animation', type);
        },

        onDragEnd() {
            this.active = -1;
            console.log('onDragEnd');
            ipc.send('update-data', this.lowerthirds);
        },

        showModal(entryid) {
            if(entryid != null && entryid >= 0 && entryid < this.lowerthirds.length) {
                this.newname = this.lowerthirds[entryid].name;
                this.newtitle = this.lowerthirds[entryid].title;
                this.newentryid = entryid;
            } else {
                this.newname = '';
                this.newtitle = '';
                this.newentryid = null;
            }

            console.log('show modal');
            $('.ui.modal').modal('show');
        }
    },

    created() {
        let self = this;
        fontList.getFonts()
            .then(ret => {
            self.fonts = ret
            })
            .catch(err => {
            console.log(err)
            });
            
    },

    mounted() {
        let self = this;

        $(this.$refs["fontdropdownH1"])
        .dropdown({
          clearable: true,
          action: 'hide',
          onChange: function(value, text, $selectedItem) {
            self.design.h1.fontfamily = text;
          }
        })

        $(this.$refs["fontdropdownH2"])
        .dropdown({
          clearable: true,
          action: 'hide',
          onChange: function(value, text, $selectedItem) {
            self.design.h2.fontfamily = text;
          }
        })

        $('.menu .item').tab();

        $('.ui.modal').modal();
    },

    updated() {
        let self = this;
        $(this.$refs["fontdropdownH1"])
        .dropdown({
          clearable: true,
          action: 'hide',
          onChange: function(value, text, $selectedItem) {
            self.design.h1.fontfamily = text;
          }
        })
        $(this.$refs["fontdropdownH2"])
        .dropdown({
          clearable: true,
          action: 'hide',
          onChange: function(value, text, $selectedItem) {
            self.design.h2.fontfamily = text;
          }
        })
    }
})