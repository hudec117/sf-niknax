<script setup lang="ts">
import { ref } from 'vue';

const error = ref<Error>();
const visible = ref(false);

function show(incomingError: Error) {
  error.value = incomingError;
  visible.value = true;
  document.addEventListener('keydown', onKeydown);
}

function close() {
  visible.value = false;
  document.removeEventListener('keydown', onKeydown);
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    close();
  }
}

defineExpose<{
  show(error: Error): void
}>({
  show
});
</script>

<template>
  <template v-if="visible">
    <section role="dialog" tabindex="0" class="slds-modal slds-modal_prompt slds-fade-in-open">
      <div class="slds-modal__container">
        <div class="slds-modal__header slds-theme_error slds-theme_alert-texture">
          <h1 class="slds-text-heading_medium">Error</h1>
        </div>
        <div class="slds-modal__content slds-p-around_medium">
          <div class="slds-form-element" v-if="error?.name">
            <label class="slds-form-element__label" for="error-prompt-name">Name</label>
            <div class="slds-form-element__control">
              <input type="text" id="error-prompt-name" class="slds-input" :value="error?.name" disabled />
            </div>
          </div>
          <div class="slds-form-element">
            <label class="slds-form-element__label" for="error-prompt-message">Message</label>
            <div class="slds-form-element__control">
              <input type="text" id="error-prompt-message" class="slds-input" :value="error?.message" disabled />
            </div>
          </div>
          <div class="slds-form-element" v-if="error?.stack">
            <label class="slds-form-element__label" for="error-prompt-stack">Details</label>
            <div class="slds-form-element__control">
              <textarea id="error-prompt-stack" class="slds-textarea" :value="error?.stack" disabled></textarea>
            </div>
          </div>
        </div>
        <div class="slds-modal__footer slds-theme_default">
          <button class="slds-button slds-button_neutral" @click="close">Close</button>
        </div>
      </div>
    </section>
    <div class="slds-backdrop slds-backdrop_open" role="presentation"></div>
  </template>
</template>

<style scoped>
#error-prompt-stack {
  height: 300px;
}
</style>