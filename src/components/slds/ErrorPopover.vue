<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
    message: string | undefined,
    right: number,
    top: number
}>();

const emit = defineEmits<{
  close: []
}>();

const absolutePositionStyle = computed(() => {
    return `right: ${props.right}px; top: ${props.top}px;`;
});
</script>

<template>
    <section class="slds-popover slds-popover_error slds-nubbin_top-right slds-is-absolute" :style="absolutePositionStyle" role="dialog" v-if="message && message.length > 0">
        <button class="slds-button slds-button_icon slds-button_icon-small slds-float_right slds-popover__close slds-button_icon-inverse slds-m-top_x-small slds-m-right_small" title="Close" @click="emit('close')">
            <svg class="slds-button__icon">
                <use xlink:href="slds/assets/icons/utility-sprite/svg/symbols.svg#close"></use>
            </svg>
        </button>
        <header class="slds-popover__header">
            <div class="slds-media slds-media_center slds-has-flexi-truncate ">
                <div class="slds-media__figure">
                    <span class="slds-icon_container slds-icon-utility-error">
                        <svg class="slds-icon slds-icon_x-small">
                            <use xlink:href="slds/assets/icons/utility-sprite/svg/symbols.svg#error"></use>
                        </svg>
                    </span>
                </div>
                <div class="slds-media__body">
                    <h2 class="slds-truncate slds-text-heading_medium">We hit a snag</h2>
                </div>
            </div>
        </header>
        <div class="slds-popover__body">
            <p>{{ message }}</p>
        </div>
    </section>
</template>