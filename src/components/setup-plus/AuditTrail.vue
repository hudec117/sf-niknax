<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

import PopoutCardFooter from '../PopoutCardFooter.vue';
import Context from '@/models/Context';
import SalesforceRESTService from '@/services/SalesforceRESTService';
import LightningSpinner from '../slds/LightningSpinner.vue';
import SalesforceMiscService from '@/services/SalesforceMiscService';
import LightningTable from '../slds/LightningTable.vue';
import type LightningTableColumn from '../slds/LightningTableColumn';
import type AuditTrailEntry from '@/models/AuditTrailEntry';

const props = defineProps<{
    context: Context
}>();

let restService: SalesforceRESTService;
let miscService: SalesforceMiscService;

const loading = ref(true);
const loadError = ref('');
const auditTrailEntries = ref<Array<AuditTrailEntry> | undefined>();
const tableColumns = ref<Array<LightningTableColumn>>([
    {
        type: 'date',
        identifier: 'Date',
        label: 'Date',
        visible: true,
        dateFormatter: (value) => {
            return value.replace(',', '');
        }
    },
    {
        type: 'text',
        identifier: 'User',
        label: 'User',
        visible: true
    },
    {
        type: 'text',
        identifier: 'Source Namespace Prefix',
        label: 'Source Namespace Prefix',
        visible: false
    },
    {
        type: 'text',
        identifier: 'Section',
        label: 'Section',
        visible: true
    },
    {
        type: 'text',
        identifier: 'Action',
        label: 'Action',
        visible: true
    },
    {
        type: 'text',
        identifier: 'Delegate User',
        label: 'Delegate User',
        visible: false
    }
]);

const filteredEntries = computed(() => {
    let entries = auditTrailEntries.value;

    if (auditTrailEntries.value) {
        const filteredColumns = tableColumns.value.filter(column => column.filter && column.filter.length > 0);
        if (filteredColumns.length > 0) {
            entries = [];

            for (const auditTrailEntry of auditTrailEntries.value) {
                // We only want to keep the entry if all the filtered columns match
                const searchableAuditTrailEntry = auditTrailEntry as unknown as { [key: string]: string };

                let columnFilterMatches = 0;
                for (const filteredColumn of filteredColumns) {
                    const searchValue = searchableAuditTrailEntry[filteredColumn.identifier].toLowerCase();

                    if (searchValue.includes(filteredColumn.filter!.toLowerCase())) {
                        columnFilterMatches++;
                    }
                }

                if (filteredColumns.length === columnFilterMatches) {
                    entries.push(auditTrailEntry);
                }
            }
        }
    }

    return entries;
});

const canClearFilters = computed(() => {
    return tableColumns.value.filter(column => column.filter && column.filter.length > 0).length > 0;
});

onMounted(() => {
    // Initialise Salesforce services
    restService = new SalesforceRESTService(props.context.serverHost, props.context.sessionId);
    miscService = new SalesforceMiscService(props.context.serverHost, props.context.sessionId);

    loadData();
});

async function loadData() {
    try {
        const getOrgResult = await restService.getOrganisation();
        if (!getOrgResult.success) {
            loadError.value = `Failed to get the current organisation ID because: ${getOrgResult.error}`;
            return;
        }

        const getAuditTrailResult = await miscService.getAuditTrail(getOrgResult.guardedData.Id);
        if (!getAuditTrailResult.success) {
            loadError.value = `Failed to get or process the Audit Trail CSV because: ${getAuditTrailResult.error}`;
            return;
        }

        auditTrailEntries.value = getAuditTrailResult.data;
    } catch (error) {
        loadError.value = `Something went wrong in the loadData function: ${(error as Error).message}`;
    } finally {
        loading.value = false;
    }
}

function onClearFiltersClick() {
    for (const column of tableColumns.value) {
        column.filter = undefined;
    }
}
</script>

<template>
    <article class="slds-card tool-card">
        <LightningSpinner v-if="loading" />

        <div class="slds-card__header slds-grid">
            <header class="slds-media slds-media_center slds-has-flexi-truncate">
                <div class="slds-media__body">
                    <h2 class="slds-card__header-title">Audit Trail</h2>
                </div>
            </header>
        </div>

        <div v-if="loadError" class="slds-card__body slds-card__body_inner">
            <p class="slds-text-color_error">{{ loadError }}</p>
        </div>

        <div v-else class="slds-card__body slds-card__body_inner">
            <div class="slds-grid slds-m-bottom_medium">
                <div class="slds-col">
                    <fieldset class="slds-form-element">
                        <legend class="slds-form-element__legend slds-form-element__label">Visible Columns</legend>
                        <div class="slds-form-element__control">
                            <div class="slds-checkbox_button-group">
                                <span v-for="column of tableColumns" class="slds-button slds-checkbox_button" :key="column.identifier">
                                    <input type="checkbox" :id="`check-${column.identifier}`" v-model="column.visible" name="checkbox" />
                                    <label class="slds-checkbox_button__label" :for="`check-${column.identifier}`">
                                        <span class="slds-checkbox_faux">{{ column.label }}</span>
                                    </label>
                                </span>
                            </div>
                        </div>
                    </fieldset>
                </div>
                <div class="slds-col">
                    <button class="slds-button slds-button_neutral slds-m-top_large slds-float_right"
                           @click="onClearFiltersClick"
                           :disabled="!canClearFilters">
                        Clear Filters
                    </button>
                </div>
            </div>

            <LightningTable v-if="filteredEntries"
                           :records="filteredEntries"
                           :columns="tableColumns"
                           :height="600"
                            last-row-text="The Audit Trail only tracks changes made in the last 6 months." />
        </div>

        <PopoutCardFooter />
    </article>
</template>