<script setup lang="ts">
defineProps<{
    visible: boolean
}>();
</script>

<template>
    <div v-if="visible" class="slds-spinner_container">
        <div role="status" class="slds-spinner slds-spinner_medium">
            <span class="slds-assistive-text">Loading</span>
            <div class="slds-spinner__dot-a"></div>
            <div class="slds-spinner__dot-b"></div>
        </div>
    </div>
</template>