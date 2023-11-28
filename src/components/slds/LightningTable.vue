<script setup lang="ts">
import { computed } from 'vue';
import { useVirtualList } from '@vueuse/core';
import type LightningTableColumn from './LightningTableColumn';

const props = defineProps<{
    records: Array<any>,
    columns: Array<LightningTableColumn>,
    height: number
}>();

const { list, containerProps, wrapperProps } = useVirtualList(props.records, {
    itemHeight: 28.5
});

function columnHash(recordIndex: number, column: LightningTableColumn): string {
    return `${recordIndex}-${column.identifier}`;
}

const visibleColumns = computed(() => {
    return props.columns.filter(column => column.visible);
});
</script>

<template>
    <div v-bind="containerProps" :style="`height: ${height}px;`">
        <div v-bind="wrapperProps">
            <table class="slds-table slds-table_bordered slds-table_col-bordered slds-border_left slds-border_right">
                <thead>
                    <tr class="slds-line-height_reset">
                        <th v-for="column of visibleColumns" class="slds-border_bottom slds-border_top" scope="col" :key="column.identifier">
                            <div class="slds-truncate" :title="column.label">{{ column.label }}</div>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="{ index, data } in list" :key="index">
                        <td v-for="column of visibleColumns" :key="columnHash(index, column)">
                            <div class="slds-truncate" :title="data[column.identifier]">
                                <template v-if="column.type === 'text'">
                                    {{ data[column.identifier] }}
                                </template>
                                <template v-else-if="column.type === 'date'">
                                    {{ column.dateFormatter?.call(null, data[column.identifier]) }}
                                </template>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<style scoped>
.slds-table {
    border-top: none;
}

.slds-table tr {
    height: 28.5px;
}

.slds-table tr:first-child td {
    border-top: 0;
}

.slds-table th {
    /* To make the header sticky */
    position: sticky;
    top: 0;

    /* To bring them forward and prevent the weird transparency effect */
    z-index: 1;
}
</style>