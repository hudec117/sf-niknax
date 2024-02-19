<script setup lang="ts">
import { computed, ref, type Ref } from 'vue';
import { includesInsensitive } from '@/helper';

import DuelingPicklistItem from './LightningDuelingPicklistItem';

const props = defineProps<{
    leftList: Array<DuelingPicklistItem>
    leftListLabel: String
    rightList: Array<DuelingPicklistItem>
    rightListLabel: String
}>();

const emit = defineEmits<{
  moveRight: [items: Array<DuelingPicklistItem>]
  moveLeft: [items: Array<DuelingPicklistItem>]
}>();

const leftFilter = ref('');
const rightFilter = ref('');

const leftSelected = ref(new Set<string>());
const rightSelected = ref(new Set<string>());

const leftFilteredItems = computed(() => {
    return filterList(leftFilter, props.leftList);
});

const rightFilteredItems = computed(() => {
    return filterList(rightFilter, props.rightList);
});

function filterList(filter: Ref<string>, items: Array<DuelingPicklistItem>): Array<DuelingPicklistItem> {
    if (filter.value.trim().length > 0) {
        return items.filter(item => includesInsensitive(item.label, filter.value));
    } else {
        return items;
    }
}

function onLeftItemClick(leftItem: DuelingPicklistItem) {
    if (rightSelected.value.size > 0) {
        rightSelected.value.clear();
    }

    if (leftSelected.value.has(leftItem.value)) {
        leftSelected.value.delete(leftItem.value);
    } else {
        leftSelected.value.add(leftItem.value);
    }
}

function onRightItemClick(rightItem: DuelingPicklistItem) {
    if (leftSelected.value.size > 0) {
        leftSelected.value.clear();
    }

    if (rightSelected.value.has(rightItem.value)) {
        rightSelected.value.delete(rightItem.value);
    } else {
        rightSelected.value.add(rightItem.value);
    }
}

function onLeftSelectAllClick() {
    if (rightSelected.value.size > 0) {
        rightSelected.value.clear();
    }

    for (const item of leftFilteredItems.value) {
        leftSelected.value.add(item.value);
    }
}

function onRightSelectAllClick() {
    if (leftSelected.value.size > 0) {
        leftSelected.value.clear();
    }

    for (const item of rightFilteredItems.value) {
        rightSelected.value.add(item.value);
    }
}

function onMoveRightClick() {
    rightFilter.value = '';

    const selectedItems = leftFilteredItems.value.filter(item => leftSelected.value.has(item.value));
    emit('moveRight', selectedItems);

    leftSelected.value.clear();
}

function onMoveLeftClick() {
    leftFilter.value = '';

    const selectedItems = rightFilteredItems.value.filter(item => rightSelected.value.has(item.value));
    emit('moveLeft', selectedItems);

    rightSelected.value.clear();
}
</script>

<template>
    <div class="slds-form-element" role="group">
        <div class="slds-form-element__control">
            <div class="slds-dueling-list">
                <div class="slds-dueling-list__column">
                    <span class="slds-form-element__label">{{ props.leftListLabel }}</span>

                    <!-- Filter -->
                    <div class="slds-form-element">
                        <div class="slds-form-element__control slds-input-has-icon slds-input-has-icon_right">
                            <input type="text"
                                   placeholder="Filter"
                                   class="slds-input slds-custom-filter-input"
                                  :disabled="leftList.length == 0"
                                   v-model="leftFilter" />
                            <button class="slds-button slds-button_icon slds-input__icon slds-input__icon_right slds-m-around_none"
                                    v-if="leftFilter.trim().length > 0"
                                    @click="leftFilter = ''">
                                <svg class="slds-button__icon slds-icon-text-light">
                                    <use xlink:href="slds/assets/icons/utility-sprite/svg/symbols.svg#clear"></use>
                                </svg>
                            </button>
                        </div>
                    </div>

                    <!-- Left items -->
                    <div class="slds-dueling-list__options">
                        <ul class="slds-listbox slds-listbox_vertical">
                            <template v-for="leftItem in leftFilteredItems" :key="leftItem.value">
                                <li role="presentation" class="slds-listbox__item" @click="onLeftItemClick(leftItem)">
                                    <div class="slds-listbox__option slds-listbox__option_plain slds-media slds-media_small slds-media_inline"
                                         :aria-selected="leftSelected.has(leftItem.value)"
                                         role="option"
                                         tabindex="-1">
                                        <span class="slds-media__body">
                                            <span class="slds-truncate">{{ leftItem.label }}</span>
                                        </span>
                                    </div>
                                </li>
                            </template>
                        </ul>
                    </div>

                    <!-- Select all -->
                    <button class="slds-button slds-button_neutral slds-m-around_none slds-custom-select-all-button"
                           @click="onLeftSelectAllClick"
                           :disabled="leftFilteredItems.length === 0">
                        Select All
                    </button>
                </div>

                <div class="slds-dueling-list__column">
                    <button class="slds-button slds-button_icon slds-button_icon-container" @click="onMoveRightClick" :disabled="leftSelected.size === 0">
                        <svg class="slds-button__icon">
                            <use xlink:href="slds/assets/icons/utility-sprite/svg/symbols.svg#right"></use>
                        </svg>
                        <span class="slds-assistive-text">Move Selection to {{ props.rightListLabel }}</span>
                    </button>
                    <button class="slds-button slds-button_icon slds-button_icon-container" @click="onMoveLeftClick" :disabled="rightSelected.size === 0">
                        <svg class="slds-button__icon">
                            <use xlink:href="slds/assets/icons/utility-sprite/svg/symbols.svg#left"></use>
                        </svg>
                        <span class="slds-assistive-text">Move Selection to {{ props.leftListLabel }}</span>
                    </button>
                </div>

                <div class="slds-dueling-list__column">
                    <span class="slds-form-element__label">{{ props.rightListLabel }}</span>

                    <!-- Filter -->
                    <div class="slds-form-element">
                        <div class="slds-form-element__control slds-input-has-icon slds-input-has-icon_right">
                            <input type="text"
                                   placeholder="Filter"
                                   class="slds-input slds-custom-filter-input"
                                  :disabled="rightList.length == 0"
                                   v-model="rightFilter" />
                            <button class="slds-button slds-button_icon slds-input__icon slds-input__icon_right slds-m-around_none"
                                    v-if="rightFilter.trim().length > 0"
                                    @click="rightFilter = ''">
                                <svg class="slds-button__icon slds-icon-text-light">
                                    <use xlink:href="slds/assets/icons/utility-sprite/svg/symbols.svg#clear"></use>
                                </svg>
                            </button>
                        </div>
                    </div>

                    <!-- Right items -->
                    <div class="slds-dueling-list__options">
                        <ul class="slds-listbox slds-listbox_vertical" role="listbox">
                            <template v-for="rightItem in rightFilteredItems" :key="rightItem.value">
                                <li role="presentation" class="slds-listbox__item" @click="onRightItemClick(rightItem)">
                                    <div class="slds-listbox__option slds-listbox__option_plain slds-media slds-media_small slds-media_inline"
                                         :aria-selected="rightSelected.has(rightItem.value)"
                                         role="option"
                                         tabindex="-1">
                                        <span class="slds-media__body">
                                            <span class="slds-truncate">{{ rightItem.label }}</span>
                                        </span>
                                    </div>
                                </li>
                            </template>
                        </ul>
                    </div>

                    <!-- Select all -->
                    <button class="slds-button slds-button_neutral slds-m-around_none slds-custom-select-all-button"
                           @click="onRightSelectAllClick"
                           :disabled="rightFilteredItems.length === 0">
                        Select All
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.slds-listbox__option {
    user-select: none;
}

.slds-dueling-list__options {
    padding: 0;
    border-radius: 0;
    width: 17.5rem;
    height: 17.5rem;
}

.slds-custom-select-all-button {
    border-top: none;
    border-top-left-radius: 0;
    border-top-right-radius: 0;
}

.slds-custom-filter-input {
    border-bottom: none;
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
}

.slds-input-has-icon .slds-input__icon {
    top: 30% !important;
}
</style>