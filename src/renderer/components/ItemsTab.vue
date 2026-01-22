<template>
  <div>
    <div class="row">
      <div class="col" style="text-align: right;">
        <button class="ui green labeled icon button" @click="openEditor(null)">
          <i class="plus icon"></i>
          neue Bauchbinde
        </button>
      </div>
    </div>

    <div class="row" style="margin-top:20px;">
      <div class="col">
        <draggable v-model="state.lowerthirds" item-key="name" draggable=".card" class="ui cards" @end="onDragEnd">
          <template #item="{element, index}">
            <div class="card inverted" :class="{ active: (activeIndex == index) }">
              <div class="content">
                <span class="right floated"><i class="edit icon" @click="openEditor(index)"></i> {{index+1}}</span>
                
                <div class="header">{{element.name}}</div>
                <div class="description">
                  {{element.title}}
                </div>
              </div>
              <div class="ui bottom attached green button" @click="playLowerthird(index)">
                <i class="play icon"></i>
                anzeigen
              </div>
            </div>
          </template>
        </draggable>
      </div>        
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import draggable from 'vuedraggable';
import { state, activeIndex } from '../store.js';
const ipc = (typeof window !== 'undefined' && window.require) ? window.require('electron').ipcRenderer : null;

const openEditor = (id) => {
    if (ipc) ipc.send('open-entry-editor', id);
};

const playLowerthird = (i) => { 
    const item = JSON.parse(JSON.stringify(state.lowerthirds[i]));
    item.id = i + 1;
    if (ipc) ipc.send('show-lowerthird', item); 
};

const onDragEnd = () => { 
    if (ipc) ipc.send('update-data', JSON.parse(JSON.stringify(state.lowerthirds))); 
};
</script>