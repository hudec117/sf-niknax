<script setup lang="ts">
import { computed } from 'vue';
import type LightningTableColumn from './LightningTableColumn';

const props = defineProps<{
    records: Array<any>,
    columns: Array<LightningTableColumn>
}>();

function columnHash(recordIndex: number, column: LightningTableColumn): string {
    return `${recordIndex}-${column.identifier}`;
}

const visibleColumns = computed(() => {
    return props.columns.filter(column => column.visible);
});
</script>

<template>
    <table class="slds-table slds-table_bordered slds-table_col-bordered slds-border_left slds-border_right">
        <thead>
            <tr class="slds-line-height_reset">
                <th v-for="column of visibleColumns" class="" scope="col" :key="column.identifier">
                    <div class="slds-truncate" :title="column.label">{{ column.label }}</div>
                </th>
            </tr>
        </thead>
        <tbody>
            <tr v-for="(record, recordIndex) of records" class="slds-hint-parent" :key="recordIndex">
                <td v-for="column of visibleColumns" :key="columnHash(recordIndex, column)">
                    <div class="slds-truncate" :title="record[column.identifier]">{{ record[column.identifier] }}</div>
                </td>
            </tr>
        </tbody>
    </table>
</template>