<script setup lang="ts">
import { onMounted } from 'vue';

import Context from '@/models/Context';
import AuditTrail from './AuditTrail.vue';

defineProps<{
    context: Context
}>();

onMounted(() => {
    document.title = 'Salesforce Niknax: Setup+';
});
</script>

<template>
    <div class="slds-grid slds-size_full">
        <div class="slds-col slds-size_1-of-6">
            <article class="slds-card tool-selector-card">
                <div class="slds-card__header slds-grid">
                    <header class="slds-media slds-media_center slds-has-flexi-truncate">
                        <div class="slds-media__body">
                            <h2 class="slds-card__header-title">
                                Setup+
                            </h2>
                        </div>
                    </header>
                </div>
                <div class="tool-button tool-button-selected slds-p-around_medium">
                    Audit Trail
                </div>
                <div class="tool-button-disabled slds-p-around_medium">
                    More coming soon!
                </div>
                <!-- <div class="tool-button-disabled slds-p-around_medium">
                    Debug Logs/User Trace
                </div>
                <div class="tool-button-disabled slds-p-around_medium">
                    Bulk Freeze/Unfreeze Users
                </div> -->
            </article>
        </div>
        <div class="slds-col slds-size_5-of-6">
            <AuditTrail :context="context" />
        </div>
    </div>
</template>

<style>
.tool-selector-card {
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
    border-right: none;
}

.tool-button {
    user-select: none;
}

.tool-button:hover {
    background-color: #f3f3f3;
    cursor: pointer;
}

.tool-button-selected {
    background-color: #f3f3f3;
}

.tool-button-disabled {
    color: #c0c0c0;
    cursor: unset;
    pointer-events: none;
    user-select: none;
}

.tool-card {
    border-top-left-radius: 0;
}
</style>