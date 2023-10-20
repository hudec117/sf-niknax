<script setup lang="ts">
import { ref } from 'vue';

const visible = ref(false);
const message = ref('');

function show(messageInput: string, duration: number): Promise<void> {
    message.value = messageInput;

    visible.value = true;

    return new Promise<void>((resolve) => {
        setTimeout(() => {
            visible.value = false;
            resolve();
        }, duration);
    });
}

defineExpose<{
    show(message: string, duration: number): Promise<void>
}>({
    show
});
</script>

<template>
    <Transition>
        <div class="overlay slds-align_absolute-center" v-if="visible">
            <div class="overlay-content">
                <span class="slds-icon_container slds-icon-utility-success slds-m-bottom_x-small">
                    <svg class="slds-icon slds-icon-text-default">
                        <use xlink:href="slds/assets/icons/utility-sprite/svg/symbols.svg#success"></use>
                    </svg>
                </span>
                <div class="slds-text-heading_medium">{{ message }}</div>
            </div>
        </div>
    </Transition>
</template>

<style scoped>
.overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgb(69, 198, 90);
    z-index: 2;
}

.overlay-content {
    text-align: center;
    color: white;
}

.overlay .slds-icon {
    fill: white;
}

.v-enter-active {
  animation: scale-in 0.25s;
}

@keyframes scale-in {
  0% {
    transform: scale(0);
  }
  100% {
    transform: scale(1);
  }
}
</style>