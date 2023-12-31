<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
    visible: boolean,
    type: string
}>();

const overlayClasses = computed(() => {
    let classes = 'overlay slds-align_absolute-center slds-var-p-around_small';

    switch (props.type) {
        case 'success':
            classes += ' overlay-success';
            break;
        case 'warning':
            classes += ' overlay-warning';
            break;
        case 'error':
            classes += ' overlay-error';
            break;
    }

    return classes;
});
</script>

<template>
    <Transition>
        <div :class="overlayClasses" v-if="props.visible">
            <div class="overlay-content">
                <span class="slds-icon_container">
                    <svg class="slds-icon overlay-check-icon">
                        <use v-if="type === 'success'" xlink:href="slds/assets/icons/utility-sprite/svg/symbols.svg#success"></use>
                        <use v-else-if="type === 'warning'" xlink:href="slds/assets/icons/utility-sprite/svg/symbols.svg#warning"></use>
                        <use v-else-if="type === 'error'" xlink:href="slds/assets/icons/utility-sprite/svg/symbols.svg#error"></use>
                    </svg>
                </span>

                <div class="overlay-title slds-text-heading_medium slds-m-top_medium">
                    <slot name="title"></slot>
                </div>
                <div class="overlay-subtitle slds-text-heading_small slds-m-top_medium">
                    <slot name="subtitle"></slot>
                </div>

                <div class="slds-m-top_medium">
                    <slot name="body"></slot>
                </div>
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
    z-index: 2;
}

.overlay-success {
    background-color: #45c65a;
}

.overlay-warning {
    background-color: #fe9339;
}

.overlay-error {
    background-color: #ba0517;
}

.overlay-content {
    text-align: center;
}

.overlay-title, .overlay-subtitle {
    color: white;
}

.overlay-check-icon {
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