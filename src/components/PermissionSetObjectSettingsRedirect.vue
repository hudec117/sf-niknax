<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

import { closeWindow } from '@/helper';
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
const loadError = ref('');

const availablePermissionSets = ref<Array<PermissionSet>>([]);
const availablePermissionSetListItems = computed(() => {
    return availablePermissionSets.value.map(
        permissionSet => {
            return new LightningListItem(
                permissionSet.Id,
                permissionSet.Label,
                permissionSet.Name
            );
        }
    );
});

onMounted(() => {
    document.title = 'Salesforce Niknax: Select a Permission Set';

    // Initialise Salesforce services
    restService = new SalesforceRESTService(props.context.serverHost, props.context.sessionId);

    loadPermissionSets();
});

async function loadPermissionSets() {
    try {
        const result = await restService.query<PermissionSet>('SELECT Id, Label, Name FROM PermissionSet WHERE IsOwnedByProfile = false AND NamespacePrefix = \'\' AND Type != \'Group\'');
        if (!result.success) {
            loadError.value = `Something went wrong: ${result.error}`;
            return;
        }

        availablePermissionSets.value = result.guardedData;
    } finally {
        loading.value = false;
    }
}

async function onPermissionSetItemSelected(item: LightningListItem) {
    // Build redirect URL to open the permission set edit page for this object.
    const redirectUrl = `https://${props.context.serverHost}/lightning/setup/PermSets/page?address=%2F${item.value}%2Fe%3Fs%3DEntityPermissions%26o%3D${props.context.object}`;

    await chrome.tabs.update(props.context.originalTabId, { url: redirectUrl });

    await closeWindow();
}
</script>

<template>
    <article class="slds-card slds-size_full">
        <LightningSpinner v-if="loading" />

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
                    <h2 class="slds-card__header-title">Select a Permission Set</h2>
                </div>
            </header>
        </div>
        <div class="slds-card__body slds-card__body_inner">
            <LightningCombobox placeholder="Search and select a Permission Set"
                               empty-list-label="No records found"
                              :error-label="loadError"
                              :items="availablePermissionSetListItems"
                              @selected="onPermissionSetItemSelected"
                               class="slds-m-bottom_small"
                               autofocus />
        </div>

        <PopoutCardFooter />
    </article>
</template>