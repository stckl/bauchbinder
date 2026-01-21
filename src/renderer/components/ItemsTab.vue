<template>
  <div>
    <div class="row">
      <div class="col" style="text-align: right;">
        <button class="ui green labeled icon button" @click="showModal(null)">
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
                <span class="right floated"><i class="edit icon" @click="showModal(index)"></i> {{index+1}}</span>
                
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

    <!-- lower third modal -->
    <div class="ui inverted modal" id="entry-modal">
      <i class="close icon"></i>
      <div v-if="newentryid == null" class="header inverted">
        Neue Bauchbinde
      </div>
      <div v-else class="header inverted">
        Bauchbinde Nr. {{newentryid}}
      </div>
      <div class="content inverted" style="background: #1b1c1d;">
        <div class="row">
          <div class="col">
            <div style="margin-top: 10px;">
            <form class="ui inverted form" @submit.prevent="addLowerthird">
              <div class="field">
                <label>Name</label>
                <div class="ui input inverted fluid">
                  <input type="text" name="name" placeholder="Name" v-model="newname">
                </div>
              </div>
              <div class="field">
                <label>Titel</label>
                <div class="ui input inverted fluid">
                  <input type="text" name="title" placeholder="Titel" v-model="newtitle">
                </div>
              </div>
              <div class="field">
                <label>Bild (Optional)</label>
                <div v-if="!newimage" class="ui placeholder segment inverted" style="min-height: 100px; cursor: pointer;" @dragover.prevent @drop.prevent="handleImageDrop" @click="$refs.imgInput.click()">
                  <div class="ui icon header">
                    <i class="image outline icon"></i>
                    Bild hierher ziehen oder klicken
                  </div>
                  <input type="file" ref="imgInput" style="display: none" accept="image/*" @change="handleImageDrop({ dataTransfer: { files: $event.target.files } })">
                </div>
                <div v-else class="ui segment inverted" style="text-align: center; position: relative; padding: 0;">
                  <img :src="newimage" style="max-height: 150px; max-width: 100%;">
                  <div class="ui top right attached label red" style="cursor: pointer;" @click="removeImage"><i class="trash icon"></i></div>
                </div>
              </div>
            </form>
            </div>
          </div>        
        </div>
      </div>
      <div class="actions inverted" style="background: #1b1c1d;">
        <div v-if="newentryid != null" class="ui icon inverted red deny button" @click="deleteLowerthird(newentryid)"><i class="trash icon"></i></div>
        <div class="ui inverted black deny button">abbrechen</div>
        <div v-if="newentryid == null" class="ui green right labeled icon button" @click="addLowerthird(false)">hinzufügen <i class="plus icon"></i></div>
        <div class="ui green right labeled icon button" @click="addLowerthird(true)">
          speichern und beenden
          <i class="checkmark icon"></i>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { ipcRenderer as ipc } from 'electron';
import draggable from 'vuedraggable';
import { state, activeIndex } from '../store.js';
import $ from 'jquery';

const newname = ref('');
const newtitle = ref('');
const newimage = ref(null);
const newentryid = ref(null);

const showModal = (id) => {
    if (typeof id === 'number') { 
        newname.value = state.lowerthirds[id].name; 
        newtitle.value = state.lowerthirds[id].title; 
        newimage.value = state.lowerthirds[id].image || null; 
        newentryid.value = id; 
    } else { 
        newname.value = ''; 
        newtitle.value = ''; 
        newimage.value = null; 
        newentryid.value = null; 
    }
    $('#entry-modal').modal('show');
};

const addLowerthird = (close = true) => {
    if (newentryid.value !== null) { 
        state.lowerthirds[newentryid.value] = { name: newname.value, title: newtitle.value, image: newimage.value }; 
    } else { 
        state.lowerthirds.push({ name: newname.value, title: newtitle.value, image: newimage.value }); 
    }
    
    // Always clear fields for next entry (if adding new) or reset (if editing)
    if (newentryid.value === null) {
       newname.value = ''; newtitle.value = ''; newimage.value = null;
    }
    
    ipc.send('update-data', JSON.parse(JSON.stringify(state.lowerthirds))); 
    
    if (close) {
        newentryid.value = null; // Reset ID only on close
        $('#entry-modal').modal('hide');
    }
};

const playLowerthird = (i) => { 
    const item = JSON.parse(JSON.stringify(state.lowerthirds[i]));
    item.id = i + 1; // 1-based index for status tracking
    ipc.send('show-lowerthird', item); 
};

const deleteLowerthird = (id) => { 
    state.lowerthirds.splice(id, 1); 
    ipc.send('update-data', JSON.parse(JSON.stringify(state.lowerthirds))); 
    $('#entry-modal').modal('hide'); 
};

const onDragEnd = () => { 
    ipc.send('update-data', JSON.parse(JSON.stringify(state.lowerthirds))); 
};

const handleImageDrop = (e) => {
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
        const file = files[0];
        const reader = new FileReader();
        reader.onload = (event) => { newimage.value = event.target.result; };
        reader.readAsDataURL(file);
    }
};

const removeImage = () => { newimage.value = null; };

onMounted(() => {
    $('#entry-modal').modal();
});
</script>
