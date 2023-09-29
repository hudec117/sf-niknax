<script setup lang="ts">
import { ref, type App, inject } from 'vue';
import AppContent from './components/AppContent.vue';
import ErrorPrompt from './components/modals/error/ErrorPrompt.vue';

const app = inject('app') as App<Element>;

const errorPrompt = ref<InstanceType<typeof ErrorPrompt> | null>(null);

app.config.errorHandler = err => {
  errorPrompt.value?.show(err as Error);
};

window.addEventListener('unhandledrejection', (e: PromiseRejectionEvent) => {
  errorPrompt.value?.show(e.reason as Error);
});
</script>

<template>
  <AppContent />
  <ErrorPrompt ref="errorPrompt" />
</template>