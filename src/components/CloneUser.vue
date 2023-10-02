<script setup lang="ts">
import { onMounted, ref } from 'vue';

import SalesforceRESTService from '@/services/salesforce-rest-services';
import Context from '@/models/context';

const props = defineProps<{
    context: Context
}>();

let restService: SalesforceRESTService;

const loading = ref(true);
const saving = ref(false);

onMounted(() => {
    // Initialise Salesforce service
    restService = new SalesforceRESTService(props.context.serverHost, props.context.sessionId);

    loadData();
});

async function loadData() {
    

    loading.value = false;
}

async function onSaveAndCloseClick() {
    saving.value = true;

    saving.value = false;

    const currentPopup = await chrome.windows.getCurrent();
    await chrome.windows.remove(currentPopup.id!);
}
</script>

<template>
    <article class="slds-card">
        <div class="slds-card__header slds-grid">
            <header class="slds-media slds-media_center slds-has-flexi-truncate">
                <div class="slds-media__figure">
                    <span class="slds-icon_container slds-icon-standard-customers">
                        <svg class="slds-icon slds-icon_small">
                            <use xlink:href="slds/assets/icons/standard-sprite/svg/symbols.svg#customers"></use>
                        </svg>
                    </span>
                </div>
                <div class="slds-media__body">
                    <h2 class="slds-card__header-title">
                        <span>Clone User</span>
                    </h2>
                </div>
                <div class="slds-no-flex">
                    <button class="slds-button slds-button_brand"
                           @click="onSaveAndCloseClick"
                           :disabled="loading || saving">
                        {{ saving ? 'Saving...' : 'Save & Close' }}
                    </button>
                </div>
            </header>
        </div>
        <div class="slds-card__body slds-card__body_inner">
            
        </div>
    </article>
</template>