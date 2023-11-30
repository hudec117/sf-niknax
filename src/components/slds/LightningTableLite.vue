<script setup lang="ts">
import { computed } from 'vue';
import type LightningTableColumn from './LightningTableColumn';

const props = defineProps<{
    records: Array<any>,
    columns: Array<LightningTableColumn>
}>();

const visibleColumns = computed(() => {
    return props.columns.filter(column => column.visible);
});

function getColumnHash(recordIndex: number, column: LightningTableColumn): string {
    return `${recordIndex}-${column.identifier}`;
}
</script>

<template>
    <table class="slds-table slds-table_bordered slds-table_col-bordered slds-border_left slds-border_right">
        <thead>
            <tr class="slds-line-height_reset">
                <template v-for="column of visibleColumns" :key="column.identifier">
                    <th class="slds-border_top" scope="col">
                        <div class="slds-truncate" :title="column.label">{{ column.label }}</div>
                    </th>
                </template>
            </tr>
        </thead>
        <tbody>
            <template v-if="records.length > 0">
                <tr v-for="(record, index) of records" :key="index">
                    <td v-for="column of visibleColumns" :key="getColumnHash(index, column)">
                        <div class="slds-truncate" :title="record[column.identifier]">
                            <template v-if="column.type === 'text'">
                                {{ record[column.identifier] }}
                            </template>
                            <template v-else-if="column.type === 'date'">
                                {{ column.dateFormatter?.call(null, record[column.identifier]) }}
                            </template>
                        </div>
                    </td>
                </tr>
            </template>

            <tr v-else>
                <td :colspan="visibleColumns.length">No rows, check your filters.</td>
            </tr>
        </tbody>
    </table>
</template>