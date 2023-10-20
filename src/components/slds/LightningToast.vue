<script setup lang="ts">
import { computed, ref } from 'vue';

const visible = ref(false);
const text = ref('');
const type = ref('');
const duration = ref(1000);

const notifyClasses = computed(() => {
    let classes = 'slds-notify slds-notify_toast';

    switch (type.value) {
        case 'warning':
            classes += ' slds-theme_warning';
            break;
        case 'error':
            classes += ' slds-theme_error';
            break;
        case 'success':
            classes += ' slds-theme_success';
            break;
    }

    return classes;
});

function show(inputText: string, inputType: string, inputDuration: number) {
    text.value = inputText;
    type.value = inputType;
    duration.value = inputDuration;

    visible.value = true;

    // setTimeout(() => {
    //     visible.value = false;
    // }, inputDuration);
}

defineExpose<{
    show(text: string, type: string, duration: number): void
}>({
    show
});
</script>

<template>
    <div class="slds-notify_container slds-is-relative" v-if="visible">
        <div :class="notifyClasses" role="status">
            <div class="slds-notify__content">
                <div class="slds-text-align_center">{{ text }}</div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.slds-notify_toast {
    margin: 0;
}
</style>