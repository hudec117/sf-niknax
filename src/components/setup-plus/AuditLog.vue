<script setup lang="ts">
import { onMounted, ref } from 'vue';

import PopoutCardFooter from '../PopoutCardFooter.vue';
import Context from '@/models/Context';
import SalesforceRESTService from '@/services/SalesforceRESTService';
import LightningSpinner from '../slds/LightningSpinner.vue';
import SalesforceMiscService from '@/services/SalesforceMiscService';
import LightningTable from '../slds/LightningTable.vue';
import type LightningTableColumn from '../slds/LightningTableColumn';
import type AuditLogEntry from '@/models/AuditLogEntry';

const props = defineProps<{
    context: Context
}>();

let restService: SalesforceRESTService;
let miscService: SalesforceMiscService;

const loading = ref(true);
const auditLogEntries = ref<Array<AuditLogEntry> | undefined>();
const tableColumns = ref<Array<LightningTableColumn>>([
    {
        type: 'date',
        identifier: 'Date',
        label: 'Date (GMT)',
        visible: true,
        sortDirection: 'desc',
        onSortDirectionChanged: () => {
            if (auditLogEntries.value) {
                auditLogEntries.value = auditLogEntries.value.reverse();
            }
        },
        dateFormatter: (value) => {
            return value.replace(',', '').substring(0, 19);
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

onMounted(() => {
    document.title = 'Salesforce Niknax: Quick Create User';

    // Initialise Salesforce services
    restService = new SalesforceRESTService(props.context.serverHost, props.context.sessionId);
    miscService = new SalesforceMiscService(props.context.serverHost, props.context.sessionId);

    loadData();
});

async function loadData() {
    try {
        const getOrgResult = await restService.getOrganisation();
        if (!getOrgResult.success) {
            // TODO: handle
            return;
        }

        const getAuditLogResult = await miscService.getAuditLog(getOrgResult.guardedData.Id);
        if (!getAuditLogResult.success) {
            // TODO: handle
            return;
        }

        auditLogEntries.value = getAuditLogResult.data;
    } catch (error) {
        // primaryButtonError.value = `Something went wrong in the loadData function: ${(error as Error).message}`;
    } finally {
        loading.value = false;
    }
}
</script>

<template>
    <article class="slds-card tool-card">
        <LightningSpinner :visible="loading" />

        <div class="slds-card__header slds-grid">
            <header class="slds-media slds-media_center slds-has-flexi-truncate">
                <div class="slds-media__body">
                    <h2 class="slds-card__header-title">
                        Audit Log
                    </h2>
                </div>
            </header>
        </div>
        <div class="slds-card__body slds-card__body_inner">
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
                <!-- <div class="slds-col">
                    <button class="slds-button slds-button_neutral slds-m-top_large slds-float_right">Filters</button>
                </div> -->
            </div>

            <LightningTable v-if="auditLogEntries" :records="auditLogEntries" :columns="tableColumns" :height="600" />
        </div>

        <PopoutCardFooter />
    </article>
</template>