<script setup lang="ts">
import { computed, watch } from 'vue';
import { toRef, useVirtualList } from '@vueuse/core';
import type LightningTableColumn from './LightningTableColumn';

const props = defineProps<{
    records: Array<any>,
    columns: Array<LightningTableColumn>,
    height: number,
    lastRowText?: string
}>();

const visibleColumns = computed(() => {
    return props.columns.filter(column => column.visible);
});

// Need to make a copy of the records prop into a ref otherwise, filtering on the
// records outside of the table does not reflect when using the virtual list.
const recordsMirror = toRef(props, 'records');
const { list, containerProps, wrapperProps, scrollTo } = useVirtualList(recordsMirror, {
    itemHeight: 28.5
});

// Whenever the records are updated as a result of a filter, we
// need to scroll to the first element otherwise a blank screen is shown.
watch(() => props.records, () => {
    scrollTo(0);
})

function getColumnHash(recordIndex: number, column: LightningTableColumn): string {
    return `${recordIndex}-${column.identifier}`;
}
</script>

<template>
    <div v-bind="containerProps" :style="`height: ${height}px;`">
        <div v-bind="wrapperProps">
            <table class="slds-table slds-table_bordered slds-table_col-bordered slds-border_left slds-border_right">
                <thead>
                    <tr>
                        <template v-for="column of visibleColumns" :key="column.identifier">
                            <th scope="col">
                                <div class="slds-truncate" :title="column.label">{{ column.label }}</div>
                            </th>
                        </template>
                    </tr>

                    <!-- Filters header row -->
                    <tr>
                        <template v-for="column of visibleColumns" :key="column.identifier">
                            <th class="slds-border_bottom">
                                <input type="text" placeholder="Filter" class="slds-input" v-model.trim="column.filter" />
                            </th>
                        </template>
                    </tr>
                </thead>
                <tbody>
                    <template v-if="list.length > 0">
                        <tr v-for="{ index, data } in list" :key="index">
                            <td v-for="column of visibleColumns" :key="getColumnHash(index, column)">
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
                        <tr v-if="lastRowText">
                            <td :colspan="visibleColumns.length">{{ lastRowText }}</td>
                        </tr>
                    </template>

                    <tr v-else>
                        <td :colspan="visibleColumns.length">No rows, check your filters.</td>
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

/* Virtual table requires fixed row height  */
.slds-table tbody tr {
    height: 28.5px;
}

/* Remove the top border from the first normal row */
.slds-table tr:first-child td {
    border-top: 0;
}

.slds-table thead {
    /* To make the header sticky */
    position: sticky;
    top: 0;

    /* To bring them forward and prevent the weird transparency effect */
    z-index: 1;
}

/* The inputs in the "th" inherit bold text */
.slds-table thead .slds-input {
    font-weight: initial;
}
</style>