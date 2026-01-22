<template>
  <div class="ui fluid container inverted" style="padding: 20px; background: #1b1c1d; min-height: 100vh;">
    <h2 class="ui header inverted">
      <i class="edit icon"></i>
      <div class="content">
        {{ entryId !== null ? 'Bauchbinde Nr. ' + (entryId + 1) : 'Neue Bauchbinde' }}
      </div>
    </h2>
    
    <form class="ui inverted form" @submit.prevent="save(true)">
      <div class="field">
        <label>Name</label>
        <div class="ui input inverted fluid">
          <input type="text" v-model="entry.name" placeholder="Name" autofocus>
        </div>
      </div>
      <div class="field">
        <label>Titel</label>
        <div class="ui input inverted fluid">
          <input type="text" v-model="entry.title" placeholder="Titel">
        </div>
      </div>
      <div class="field">
        <label>Bild (Optional)</label>
        <div v-if="!entry.image" class="ui placeholder segment inverted" style="min-height: 150px; cursor: pointer;" @dragover.prevent @drop.prevent="handleImageDrop" @click="$refs.imgInput.click()">
          <div class="ui icon header">
            <i class="image outline icon"></i>
            Bild hierher ziehen oder klicken
          </div>
          <input type="file" ref="imgInput" style="display: none" accept="image/*" @change="handleImageDrop({ dataTransfer: { files: $event.target.files } })">
        </div>
        <div v-else class="ui segment inverted checkerboard" style="text-align: center; position: relative; padding: 10px; min-height: 150px; display: flex; align-items: center; justify-content: center;">
          <img :src="entry.image" style="max-height: 130px; max-width: 100%; object-fit: contain; display: block; margin: 0 auto;">
          <div class="ui top right attached label red" style="cursor: pointer;" @click="entry.image = null"><i class="trash icon"></i></div>
        </div>
      </div>

      <div class="field">
        <div class="ui toggle checkbox inverted">
          <input type="checkbox" v-model="entry.hideGlobalLogo">
          <label>Globales Logo für diese Bauchbinde ausblenden</label>
        </div>
      </div>

      <div style="margin-top: 30px; display: flex; flex-wrap: wrap; gap: 10px;">
        <template v-if="entryId === null">
          <button class="ui green labeled icon button" type="button" @click="save(false)">
            Speichern & Neu
            <i class="plus icon"></i>
          </button>
          <button class="ui positive right labeled icon button" type="submit">
            Speichern & Schließen
            <i class="checkmark icon"></i>
          </button>
        </template>
        <template v-else>
          <button class="ui positive right labeled icon button" type="submit">
            Speichern
            <i class="checkmark icon"></i>
          </button>
        </template>
        
        <button class="ui black button" type="button" @click="cancel">
          Abbrechen
        </button>
        <div style="flex-grow: 1;"></div>
        <button v-if="entryId !== null" class="ui red icon button" type="button" @click="remove" title="Löschen">
          <i class="trash icon"></i>
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
const ipc = (typeof window !== 'undefined' && window.require) ? window.require('electron').ipcRenderer : null;

const entry = ref({ name: '', title: '', image: null, hideGlobalLogo: false });
const entryId = ref(null);

onMounted(() => {
    ipc.on('setup-editor', (event, arg) => {
        if (arg.entry) {
            entry.value = JSON.parse(JSON.stringify(arg.entry));
            if (entry.value.hideGlobalLogo === undefined) entry.value.hideGlobalLogo = false;
        }
        entryId.value = arg.id;
    });
    ipc.send('editor-ready');
});

const save = (close = true) => {
    ipc.send('save-entry', { 
        id: entryId.value, 
        entry: JSON.parse(JSON.stringify(entry.value)),
        close: close
    });
    
    if (!close) {
        if (entryId.value === null) {
            entry.value = { name: '', title: '', image: null, hideGlobalLogo: false };
        }
    }
};

const cancel = () => { window.close(); };

const remove = () => {
    if (confirm('Diese Bauchbinde wirklich löschen?')) {
        ipc.send('delete-entry', entryId.value);
    }
};

const handleImageDrop = (e) => {
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
        const file = files[0];
        const reader = new FileReader();
        reader.onload = (event) => { entry.value.image = event.target.result; };
        reader.readAsDataURL(file);
    }
};
</script>