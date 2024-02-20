<script setup lang="ts">
withDefaults(defineProps<{
    size?: string
}>(), {
    size: 'medium'
});
</script>

<template>
    <div class="slds-spinner_container">
        <div role="status" :class="`slds-spinner slds-spinner_${size}`">
            <span class="slds-assistive-text">Loading</span>
            <div class="slds-spinner__dot-a"></div>
            <div class="slds-spinner__dot-b"></div>
        </div>
    </div>
</template>