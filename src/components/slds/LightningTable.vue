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

function onColumnSortClick(column: LightningTableColumn) {
    if (!column.sortDirection) {
        return;
    }

    column.sortDirection = column.sortDirection === 'asc' ? 'desc' : 'asc';

    if (column.onSortDirectionChanged) {
        column.onSortDirectionChanged();
    }
}
</script>

<template>
    <div v-bind="containerProps" :style="`height: ${height}px;`">
        <div v-bind="wrapperProps">
            <table class="slds-table slds-table_bordered slds-table_col-bordered slds-border_left slds-border_right">
                <thead>
                    <tr class="slds-line-height_reset">
                        <template v-for="column of visibleColumns" :key="column.identifier">
                            <!-- Sortable header -->
                            <th v-if="column.sortDirection" class="slds-border_top slds-is-sortable slds-is-sorted" scope="col">
                                <a class="slds-th__action slds-text-link_reset" href="#" role="button" tabindex="0" @click.prevent="onColumnSortClick(column)">
                                    <span class="slds-assistive-text">Sort by: </span>
                                    <div class="slds-grid slds-grid_vertical-align-center slds-has-flexi-truncate">
                                        <div class="slds-truncate" :title="column.label">{{ column.label }}</div>

                                        <span v-if="column.sortDirection === 'desc'" class="slds-icon_container slds-icon-utility-arrowdown">
                                            <svg class="slds-icon slds-icon-text-default slds-is-sortable__icon" aria-hidden="true">
                                                <use xlink:href="slds/assets/icons/utility-sprite/svg/symbols.svg#arrowdown"></use>
                                            </svg>
                                        </span>

                                        <span v-else-if="column.sortDirection === 'asc'" class="slds-icon_container slds-icon-utility-arrowup">
                                            <svg class="slds-icon slds-icon-text-default slds-is-sortable__icon" aria-hidden="true">
                                                <use xlink:href="slds/assets/icons/utility-sprite/svg/symbols.svg#arrowup"></use>
                                            </svg>
                                        </span>
                                    </div>
                                </a>
                            </th>

                            <!-- Standard header -->
                            <th v-else class="slds-border_top" scope="col">
                                <div class="slds-truncate" :title="column.label">{{ column.label }}</div>
                            </th>
                        </template>
                    </tr>
                    <tr>
                        <template v-for="column of visibleColumns" :key="column.identifier">
                            <th class="slds-border_bottom">
                                <input type="text" placeholder="Filter" class="slds-input" />
                            </th>
                        </template>
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

.slds-table thead {
    /* To make the header sticky */
    position: sticky;
    top: 0;

    /* To bring them forward and prevent the weird transparency effect */
    z-index: 1;
}

/* Required to fix sortable headers affecting padding of non-sorted headers */
.slds-table thead th.slds-is-sortable {
    padding: 0;
}
</style>