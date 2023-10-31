import './assets/main.css';

import 'slds/assets/styles/salesforce-lightning-design-system.css';

import { createApp } from 'vue';
import { vue3Debounce } from 'vue-debounce';
import App from './App.vue';

const app = createApp(App);
app.provide('app', app);

app.directive('debounce', vue3Debounce({ lock: true }))
   .mount('#app');