import { createApp } from 'vue';
import draggable from 'vuedraggable';

// CSS remains in Vite for hot reloading and easy management
import 'fomantic-ui-css/semantic.min.css';
import './style.css'; 

import App from './App.vue';
import FomanticDropdown from './components/FomanticDropdown.vue';
import ColorPicker from './components/ColorPicker.vue';
import CssEditor from './components/CssEditor.vue';

const app = createApp(App);

app.component('draggable', draggable);
app.component('fomantic-dropdown', FomanticDropdown);
app.component('color-picker', ColorPicker);
app.component('css-editor', CssEditor);

app.mount('#app');
