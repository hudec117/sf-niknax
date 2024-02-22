<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

import PopoutCardFooter from './PopoutCardFooter.vue';
import SalesforceRESTService from '@/services/SalesforceRESTService';
import SalesforceMetadataService from '@/services/SalesforceMetadataService';
import Context from '@/models/Context';
import LightningSpinner from './slds/LightningSpinner.vue';
import ErrorPopover from './slds/ErrorPopover.vue';
import type PermissionSet from '@/models/PermissionSet';
import LightningListItem from './slds/LightningListItem';
import LightningCombobox from './slds/LightningCombobox.vue';
import type PermissionSetFLSEntry from '@/models/PermissionSetFLSEntry';

// Note: record to help with dev: https://ahpersonal-dev-ed.lightning.force.com/lightning/setup/ObjectManager/Case/FieldsAndRelationships/00N4J0000031WEL/view

const props = defineProps<{
    context: Context
}>();

let restService: SalesforceRESTService;
let metadataService: SalesforceMetadataService;

const saveButtonError = ref<string | undefined>();
const loading = ref(true);
const working = ref(false);

const availablePermissionSets = ref<Array<PermissionSet>>([]);
const availablePermissionSetListItems = computed(() => {
    let listItems = new Array<LightningListItem>();

    listItems.push(new LightningListItem('all', 'All Permission Sets', 'WARNING: This may take a while.'));

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

const permissionSetFLSEntries = ref<Array<PermissionSetFLSEntry>>([]);
const masterReadEditCheckboxesVisible = computed(() => {
    const numOfLoadedEntries = permissionSetFLSEntries.value.filter(entry => !entry.loading).length;

    const hasEntries = permissionSetFLSEntries.value.length > 0;
    const allEntriesLoaded = numOfLoadedEntries === permissionSetFLSEntries.value.length;

    return hasEntries && allEntriesLoaded;
});

onMounted(() => {
    document.title = 'Salesforce Niknax: Set Field-Level Security for ...';

    // Initialise Salesforce services
    restService = new SalesforceRESTService(props.context.serverHost, props.context.sessionId);
    metadataService = new SalesforceMetadataService(props.context.serverHost, props.context.sessionId);

    loadData();
});

async function loadData() {
    try {
        await loadPermissionSets();
    } catch (error) {
        saveButtonError.value = `Something went wrong in the loadData function: ${(error as Error).message}`;
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
    if (item.value === 'all') {
        // TODO: handle
        return;
    }

    const permissionSetForEntry = availablePermissionSets.value.filter(permissionSet => item.value == permissionSet.Id)[0];

    const newFLSEntry = ref<PermissionSetFLSEntry>({
        permissionSet: permissionSetForEntry,
        loading: true
    });

    permissionSetFLSEntries.value.push(newFLSEntry.value);

    // Read the metadata for the field
    // TODO: remove line below, only for TESTING
    await metadataService.readPermissionSetFLS('Test_Perm_Set_15', 'Account.Fax');
    const readMdResult = await metadataService.readMetadata('PermissionSet', [permissionSetForEntry.Name]);
    if (!readMdResult.success) {
        // TODO: handle
        return;
    }

    newFLSEntry.value.loading = false;

    // Remove permission set from the available permission sets so it can't be readded to the entries.
    availablePermissionSets.value = availablePermissionSets.value.filter(permissionSet => permissionSet.Id !== permissionSetForEntry.Id);
}

async function onSaveClick() {
    working.value = true;
    saveButtonError.value = '';

    // try {
        
    // } finally {
    //     working.value = false;
    // }
}
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
            <LightningCombobox placeholder="Search and select Permission Sets"
                               empty-list-label="No records found"
                              :items="availablePermissionSetListItems"
                              @selected="onPermissionSetItemSelected"
                               class="slds-m-bottom_medium" />

            <table class="slds-table slds-no-row-hover slds-table_bordered slds-table_col-bordered slds-border_left slds-border_right">
                <thead>
                    <tr class="slds-line-height_reset">
                        <th scope="col" class="slds-cell-shrink"></th>
                        <th scope="col">
                            <div class="slds-truncate" title="Permission Set">Permission Set</div>
                        </th>
                        <th scope="col" class="slds-cell-shrink">
                            <div class="slds-truncate" title="Read Access">
                                <input type="checkbox"
                                       v-if="masterReadEditCheckboxesVisible" />
                                
                                Read Access
                            </div>
                        </th>
                        <th scope="col" class="slds-cell-shrink">
                            <div class="slds-truncate" title="Edit Access">
                                <input type="checkbox"
                                       v-if="masterReadEditCheckboxesVisible" />
                                
                                Edit Access
                            </div>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="permissionSetFLSEntry of permissionSetFLSEntries" :key="permissionSetFLSEntry.permissionSet.Id">
                        <td>
                            <button class="slds-button slds-button_icon" title="Pinning Permission Sets will automatically load them each time you open this tool.">
                                <svg class="slds-button__icon slds-button__icon_small" aria-hidden="true">
                                    <use xlink:href="slds/assets/icons/utility-sprite/svg/symbols.svg#pin"></use>
                                </svg>
                                <span class="slds-assistive-text">Pinning Permission Sets will automatically load them each time you open this tool.</span>
                            </button>
                        </td>
                        <td :title="permissionSetFLSEntry.permissionSet.Name">
                            {{ permissionSetFLSEntry.permissionSet.Label }}
                        </td>
                        <td>
                            <LightningSpinner v-if="permissionSetFLSEntry.loading" size="xx-small" />
                            <input type="checkbox" v-else :value="permissionSetFLSEntry.readAccess" />
                        </td>
                        <td>
                            <LightningSpinner v-if="permissionSetFLSEntry.loading" size="xx-small" />
                            <input type="checkbox" v-else :value="permissionSetFLSEntry.editAccess" />
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <PopoutCardFooter />
    </article>
</template>