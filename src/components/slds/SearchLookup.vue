<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

import SearchLookupItem from './SearchLookupItem';

const props = defineProps<{
    label?: string,
    placeholder?: string,
    emptyListLabel?: string,
    errorLabel?: string,
    helpLabel?: string,
    doSearch: (value: string) => Promise<Array<SearchLookupItem>>
}>();

const emit = defineEmits<{
    selected: [item: SearchLookupItem]
    unselected: [],
}>();

const text = ref('');
const empty = ref(false);
const loading = ref(false);
const items = ref<Array<SearchLookupItem>>([]);
const selectedItem = ref<SearchLookupItem | undefined>();
const searchCombobox = ref<HTMLInputElement>();

const dropdownOpen = computed(() => {
    return selectedItem.value === undefined && (loading.value || empty.value || items.value.length > 0);
});

onMounted(() => {
    searchCombobox.value?.focus();
});

async function onSearch() {
    items.value = [];
    loading.value = false;
    empty.value = false;

    const searchText = text.value;
    if (searchText.length === 0) {
        return;
    }

    loading.value = true;
    items.value = await props.doSearch(text.value);
    loading.value = false;

    empty.value = items.value.length === 0;
}

function onItemSelected(item: SearchLookupItem) {
    text.value = '';
    items.value = [];
    selectedItem.value = item;

    emit('selected', item);
}

function onItemUnselected() {
    selectedItem.value = undefined;

    emit('unselected');
}
</script>

<template>
    <div class="slds-form-element">
        <label class="slds-form-element__label" for="search-combobox" v-if="label">{{ label }}</label>
        <div class="slds-form-element__control">
            <div class="slds-combobox_container slds-has-selection">
                <div :class="`slds-combobox slds-dropdown-trigger slds-dropdown-trigger_click ${dropdownOpen ? 'slds-is-open' : ''}`">
                    <div :class="`slds-combobox__form-element slds-input-has-icon ${selectedItem ? 'slds-input-has-icon_left-right' : 'slds-input-has-icon_right'}`" role="none">

                        <template v-if="selectedItem">
                            <span class="slds-icon_container slds-icon-standard-avatar slds-combobox__input-entity-icon">
                                <svg class="slds-icon slds-icon_small">
                                    <use xlink:href="slds/assets/icons/standard-sprite/svg/symbols.svg#avatar"></use>
                                </svg>
                            </span>
                            <div role="combobox" tabindex="0" class="slds-input_faux slds-combobox__input slds-combobox__input-value" aria-labelledby="combobox-label-id-14 combobox-id-5-selected-value" id="combobox-id-5-selected-value" aria-controls="listbox-id-5" aria-expanded="false" aria-haspopup="listbox">
                                <span class="slds-truncate">{{ selectedItem.label }}</span>
                            </div>
                            <button class="slds-button slds-button_icon slds-input__icon slds-input__icon_right" @click="onItemUnselected">
                                <svg class="slds-button__icon" aria-hidden="true">
                                    <use xlink:href="slds/assets/icons/utility-sprite/svg/symbols.svg#close"></use>
                                </svg>
                            </button>
                        </template>

                        <template v-else>
                            <input type="text"
                                   class="slds-input slds-combobox__input"
                                   id="search-combobox"
                                   ref="searchCombobox"
                                   autoComplete="off"
                                   role="combobox"
                                   v-debounce:500ms="onSearch"
                                   v-model.trim="text"
                                  :placeholder="placeholder" />
                            <span class="slds-icon_container slds-icon-utility-search slds-input__icon slds-input__icon_right">
                                <svg class="slds-icon slds-icon slds-icon_x-small slds-icon-text-default">
                                    <use xlink:href="slds/assets/icons/utility-sprite/svg/symbols.svg#search"></use>
                                </svg>
                            </span>
                        </template>
                    </div>
                    
                    <div class="slds-dropdown slds-dropdown_length-with-icon-5 slds-dropdown_fluid" tabindex="0">
                        <ul class="slds-listbox slds-listbox_vertical" role="presentation">
                            <!-- Loading list item -->
                            <li role="presentation" class="slds-listbox__item" v-if="loading">
                                <div class="slds-align_absolute-center slds-p-top_medium">
                                    <div role="status" class="slds-spinner slds-spinner_x-small slds-spinner_inline">
                                        <div class="slds-spinner__dot-a"></div>
                                        <div class="slds-spinner__dot-b"></div>
                                    </div>
                                </div>
                            </li>

                            <!-- Error list item -->
                            <li role="presentation" class="slds-listbox__item" v-else-if="errorLabel">
                                <div class="slds-media slds-listbox__option slds-listbox__option_plain slds-media_small" role="option">
                                    <!-- <span class="slds-media__figure slds-listbox__option-icon"></span> -->
                                    <span class="slds-media__body">
                                        <span class="slds-truncate">{{ props.errorLabel }}</span>
                                    </span>
                                </div>
                            </li>

                            <!-- Empty list item -->
                            <li role="presentation" class="slds-listbox__item" v-else-if="empty">
                                <div class="slds-media slds-listbox__option slds-listbox__option_plain slds-media_small" role="option">
                                    <!-- <span class="slds-media__figure slds-listbox__option-icon"></span> -->
                                    <span class="slds-media__body">
                                        <span class="slds-truncate">{{ props.emptyListLabel }}</span>
                                    </span>
                                </div>
                            </li>

                            <!-- Normal list item -->
                            <li role="presentation" class="slds-listbox__item" v-else v-for="item of items" :key="item.value" @click="onItemSelected(item)">
                                <div class="slds-media slds-listbox__option slds-listbox__option_entity slds-listbox__option_has-meta" role="option">
                                    <span class="slds-media__figure slds-listbox__option-icon">
                                        <span class="slds-icon_container slds-icon-standard-avatar">
                                            <svg class="slds-icon slds-icon_small" aria-hidden="true">
                                                <use xlink:href="slds/assets/icons/standard-sprite/svg/symbols.svg#avatar">
                                                </use>
                                            </svg>
                                        </span>
                                    </span>
                                    <span class="slds-media__body">
                                        <span class="slds-listbox__option-text slds-listbox__option-text_entity">
                                            {{ item.label }}
                                        </span>
                                        <span class="slds-listbox__option-meta slds-listbox__option-meta_entity">
                                            {{ item.sublabel }}
                                        </span>
                                    </span>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>

        <div class="slds-form-element__help" v-if="helpLabel">{{ helpLabel }}</div>
    </div>
</template>