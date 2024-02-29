<script setup lang="ts">
import { ref, type App, inject } from 'vue';

import ToolLauncher from './components/ToolLauncher.vue';
import ErrorModal from './components/modals/error/ErrorModal.vue';

const app = inject('app') as App<Element>;

const errorModal = ref<InstanceType<typeof ErrorModal> | null>(null);

app.config.errorHandler = err => {
  errorModal.value?.show(err as Error);
};

app.provide('errorModal', errorModal);

window.addEventListener('unhandledrejection', (e: PromiseRejectionEvent) => {
  errorModal.value?.show(e.reason as Error);
});
</script>

<template>
  <ToolLauncher />
  <ErrorModal ref="errorModal" />
</template>

<style>
a.external-link[target='_blank']::after {
  content: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAQElEQVR42qXKwQkAIAxDUUdxtO6/RBQkQZvSi8I/pL4BoGw/XPkh4XigPmsUgh0626AjRsgxHTkUThsG2T/sIlzdTsp52kSS1wAAAABJRU5ErkJggg==);
  margin: 0 3px 0 5px;
}

/* Modals should be above all else */
.slds-backdrop {
  z-index: 10000;
}

.slds-modal {
  z-index: 10001;
}

/* Without this, the SLDS Spinners would appear on top of the dropdown */
.slds-dropdown {
    z-index: 9500;
}

/* This sets "selected" background colour when there is only one selectable item in a listbox.
   Used by:
   components\slds\LightningCombobox.vue
   components\slds\LightningSearchLookup.vue
*/
.slds-listbox > li.selectable-item:only-child > .slds-media {
    background-color: #f3f3f3;
}

.slds-listbox > li.unselectable-item:only-child > .slds-media {
    cursor: default;
    background-color: unset;
}
</style>