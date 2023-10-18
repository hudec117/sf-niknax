<script setup lang="ts">
import { onMounted, ref } from 'vue';

import SalesforceRESTService from '@/services/salesforce-rest-service';
import SalesforceToolingService from '@/services/salesforce-tooling-service';
import PopoutCardFooter from './PopoutCardFooter.vue';
import Context from '@/models/context';

const props = defineProps<{
    context: Context
}>();

let restService: SalesforceRESTService;
let toolingService: SalesforceToolingService;

const title = ref('Bulk Freeze/Unfreeze Users');

const loading = ref(true);
const processing = ref(false);

onMounted(() => {
    // Initialise Salesforce services
    restService = new SalesforceRESTService(props.context.serverHost, props.context.sessionId);
    toolingService = new SalesforceToolingService(props.context.serverHost, props.context.sessionId);

    loadData();
});

async function loadData() {
    document.title = `Salesforce Niknax: ${title.value}`;

    loading.value = false;
}

async function onFreezeUnfreezeClick() {
    processing.value = true;

    processing.value = false;

    // const currentPopup = await chrome.windows.getCurrent();
    // await chrome.windows.remove(currentPopup.id!);
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
                        <span>{{ title }}</span>
                    </h2>
                </div>
                <div class="slds-no-flex">
                    <!-- <button class="slds-button slds-button_brand" @click="onFreezeUnfreezeClick"
                        :disabled="loading || processing">
                        {{ processing ? 'Cloning...' : 'Clone & Close' }}
                    </button> -->
                </div>
            </header>
        </div>
        <div class="slds-card__body slds-card__body_inner">
            
        </div>

        <PopoutCardFooter />
    </article>
</template>