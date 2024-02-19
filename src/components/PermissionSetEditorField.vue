<script setup lang="ts">
import { onMounted, ref } from 'vue';

import PopoutCardFooter from './PopoutCardFooter.vue';
import SalesforceToolingService from '@/services/SalesforceToolingService';
import Context from '@/models/Context';
import LightningSpinner from './slds/LightningSpinner.vue';
import ErrorPopover from './slds/ErrorPopover.vue';

// Note: record to help with dev: https://ahpersonal-dev-ed.lightning.force.com/lightning/setup/ObjectManager/Case/FieldsAndRelationships/00N4J0000031WEL/view

const props = defineProps<{
    context: Context
}>();

let toolingService: SalesforceToolingService;

const saveButtonError = ref<string | undefined>();
const loading = ref(true);
const working = ref(false);

onMounted(() => {
    document.title = 'Salesforce Niknax: Set Field-Level Security for ...';

    // Initialise Salesforce services
    toolingService = new SalesforceToolingService(props.context.serverHost, props.context.sessionId);

    loadData();
});

async function loadData() {
    try {
        
    } catch (error) {
        saveButtonError.value = `Something went wrong in the loadData function: ${(error as Error).message}`;
    } finally {
        loading.value = false;
    }
}

async function onSaveClick() {
    working.value = true;
    saveButtonError.value = '';

    try {
        
    } finally {
        working.value = false;
    }
}

// async function closeWindow() {
//     const currentPopup = await chrome.windows.getCurrent();
//     await chrome.windows.remove(currentPopup.id!);
// }
</script>

<template>
    <article class="slds-card">
        <LightningSpinner :visible="loading || working" />

        <div class="slds-card__header slds-grid">
            <header class="slds-media slds-media_center slds-has-flexi-truncate">
                <div class="slds-media__figure">
                    <span class="slds-icon_container slds-icon-standard-slider">
                        <svg class="slds-icon slds-icon_small">
                            <use xlink:href="slds/assets/icons/standard-sprite/svg/symbols.svg#slider"></use>
                        </svg>
                    </span>
                </div>
                <div class="slds-media__body">
                    <h2 class="slds-card__header-title">
                        Set Field-Level Security for ...
                    </h2>
                </div>
                <div class="slds-no-flex">
                    <!-- Save button -->
                    <button class="slds-button slds-button_brand"
                           @click="onSaveClick"
                           :disabled="loading || working ">
                        Save
                    </button>

                    <!-- Save button popover -->
                    <ErrorPopover :message="saveButtonError"
                                  :right="51"
                                  :top="55"
                                  @close="saveButtonError = undefined" />
                </div>
            </header>
        </div>
        <div class="slds-card__body slds-card__body_inner">
            <table class="slds-table slds-table_bordered slds-table_col-bordered slds-border_left slds-border_right">
                <thead>
                    <tr class="slds-line-height_reset">
                        <th scope="col">
                            <div class="slds-truncate" title="Permission Set">Permission Set</div>
                        </th>
                        <th scope="col">
                            <div class="slds-truncate" title="Read Access">Read Access</div>
                        </th>
                        <th scope="col">
                            <div class="slds-truncate" title="Edit Access">Edit Access</div>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    
                </tbody>
            </table>
        </div>

        <PopoutCardFooter />
    </article>
</template>