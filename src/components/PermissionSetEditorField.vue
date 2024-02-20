<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

import PopoutCardFooter from './PopoutCardFooter.vue';
import SalesforceRESTService from '@/services/SalesforceRESTService';
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
const noEntries = computed(() => permissionSetFLSEntries.value.length === 0);

onMounted(() => {
    document.title = 'Salesforce Niknax: Set Field-Level Security for ...';

    // Initialise Salesforce services
    restService = new SalesforceRESTService(props.context.serverHost, props.context.sessionId);

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

function onPermissionSetItemSelected(item: LightningListItem) {
    if (item.value === 'all') {
        // TODO: handle
        return;
    }

    const permissionSetForEntry = availablePermissionSets.value.filter(permissionSet => item.value == permissionSet.Id)[0];

    permissionSetFLSEntries.value.push({
        permissionSet: permissionSetForEntry,
        readAccess: false,
        editAccess: true
    });

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
            <LightningCombobox placeholder="Search and select Permission Sets"
                               empty-list-label="No records found"
                              :items="availablePermissionSetListItems"
                              @selected="onPermissionSetItemSelected"
                               class="slds-m-bottom_medium" />

            <table class="slds-table slds-no-row-hover slds-table_bordered slds-table_col-bordered slds-border_left slds-border_right">
                <thead>
                    <tr class="slds-line-height_reset">
                        <th scope="col"></th>
                        <th scope="col">
                            <div class="slds-truncate" title="Permission Set">Permission Set</div>
                        </th>
                        <th scope="col">
                            <div class="slds-truncate" title="Read Access">
                                <input type="checkbox"
                                       v-if="!noEntries" />
                                
                                Read Access
                            </div>
                        </th>
                        <th scope="col">
                            <div class="slds-truncate" title="Edit Access">
                                <input type="checkbox"
                                       v-if="!noEntries" />
                                
                                Edit Access
                            </div>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="permissionSetFLSEntry of permissionSetFLSEntries" :key="permissionSetFLSEntry.permissionSet.Id">
                        <td>
                            <button class="slds-button slds-button_icon" title="Pin/unpin the Permission Set">
                                <svg class="slds-button__icon slds-button__icon_small" aria-hidden="true">
                                    <use xlink:href="slds/assets/icons/utility-sprite/svg/symbols.svg#pin"></use>
                                </svg>
                                <span class="slds-assistive-text">More options</span>
                            </button>
                        </td>
                        <td :title="permissionSetFLSEntry.permissionSet.Name">
                            {{ permissionSetFLSEntry.permissionSet.Label }}
                        </td>
                        <td>
                            <input type="checkbox" :value="permissionSetFLSEntry.readAccess" />
                        </td>
                        <td>
                            <input type="checkbox" :value="permissionSetFLSEntry.editAccess" />
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <PopoutCardFooter />
    </article>
</template>