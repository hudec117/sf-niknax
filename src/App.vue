<script setup lang="ts">
import { ref, type App, inject } from 'vue';
import AppContent from './components/AppContent.vue';
import ErrorModal from './components/modals/error/ErrorModal.vue';

const app = inject('app') as App<Element>;

const errorModal = ref<InstanceType<typeof ErrorModal> | null>(null);

app.config.errorHandler = err => {
  errorModal.value?.show(err as Error);
};

window.addEventListener('unhandledrejection', (e: PromiseRejectionEvent) => {
  errorModal.value?.show(e.reason as Error);
});
</script>

<template>
  <AppContent />
  <ErrorModal ref="errorModal" />
</template>

<style>
a.external-link[target='_blank']::after {
  content: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAQElEQVR42qXKwQkAIAxDUUdxtO6/RBQkQZvSi8I/pL4BoGw/XPkh4XigPmsUgh0626AjRsgxHTkUThsG2T/sIlzdTsp52kSS1wAAAABJRU5ErkJggg==);
  margin: 0 3px 0 5px;
}
</style>