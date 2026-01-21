import { createApp } from 'vue';
import draggable from 'vuedraggable';

// Fomantic UI & Custom Style
import 'fomantic-ui-css/semantic.min.css';
import './style.css'; 
import 'fomantic-ui-css/semantic.min.js';

import App from './App.vue';
import FomanticDropdown from './components/FomanticDropdown.vue';
import ColorPicker from './components/ColorPicker.vue';
import CssEditor from './components/CssEditor.vue';

const app = createApp(App);

// Register global components if they are used recursively or widely
app.component('draggable', draggable);
app.component('fomantic-dropdown', FomanticDropdown);
app.component('color-picker', ColorPicker);
app.component('css-editor', CssEditor);

app.mount('#app');
