<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

import PopoutCardFooter from './PopoutCardFooter.vue';
import SalesforceRESTService from '@/services/SalesforceRESTService';
import Context from '@/models/Context';
import LightningSpinner from './slds/LightningSpinner.vue';
import type PermissionSet from '@/models/PermissionSet';
import LightningListItem from './slds/LightningListItem';
import LightningCombobox from './slds/LightningCombobox.vue';

const props = defineProps<{
    context: Context
}>();

let restService: SalesforceRESTService;

const loading = ref(true);
const working = ref(false);

const availablePermissionSets = ref<Array<PermissionSet>>([]);
const availablePermissionSetListItems = computed(() => {
    let listItems = new Array<LightningListItem>();

    listItems = listItems.concat(
        availablePermissionSets.value.map(
            permissionSet => {
                return new LightningListItem(
                    permissionSet.Id,
                    permissionSet.Label,
                    permissionSet.Name
                );
            }
        )
    );

    return listItems;
});

onMounted(() => {
    document.title = 'Salesforce Niknax: Select a Permission Set';

    // Initialise Salesforce services
    restService = new SalesforceRESTService(props.context.serverHost, props.context.sessionId);

    loadData();
});

async function loadData() {
    try {
        await loadPermissionSets();
    } catch (error) {
        // TODO: handle
        // saveButtonError.value = `Something went wrong in the loadData function: ${(error as Error).message}`;
    } finally {
        loading.value = false;
    }
}

async function loadPermissionSets() {
    const result = await restService.query<PermissionSet>('SELECT Id, Label, Name FROM PermissionSet WHERE IsOwnedByProfile = false AND NamespacePrefix = \'\' AND Type != \'Group\'');
    if (!result.success) {
        // TODO: handle
        return;
    }

    availablePermissionSets.value = result.guardedData;
}

async function onPermissionSetItemSelected(item: LightningListItem) {
    const permissionSetForEntry = availablePermissionSets.value.filter(permissionSet => item.value == permissionSet.Id)[0];

    
    // closeWindow();
}

// async function closeWindow() {
//     const currentPopup = await chrome.windows.getCurrent();
//     await chrome.windows.remove(currentPopup.id!);
// }
</script>

<template>
    <article class="slds-card slds-size_full">
        <LightningSpinner v-if="loading || working" />

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
                        Select a Permission Set
                    </h2>
                </div>
            </header>
        </div>
        <div class="slds-card__body slds-card__body_inner">
            <LightningCombobox placeholder="Search and select a Permission Set"
                               empty-list-label="No records found"
                              :items="availablePermissionSetListItems"
                              @selected="onPermissionSetItemSelected"
                               class="slds-m-bottom_medium"
                               autofocus />
        </div>

        <PopoutCardFooter />
    </article>
</template>