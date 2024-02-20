<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

import LightningListItem from './LightningListItem';
import { includesInsensitive } from '@/helper';

const props = defineProps<{
    autofocus?: boolean,
    label?: string,
    placeholder?: string,
    emptyListLabel?: string,
    helpLabel?: string,
    items: Array<LightningListItem>
}>();

const emit = defineEmits<{
    selected: [item: LightningListItem]
}>();

const text = ref('');
const focused = ref(false);
const mouseIsOverDropdown = ref(false);
const searchCombobox = ref<HTMLInputElement>();

const dropdownOpen = computed(() => {
    return filteredItems.value.length === 0 || focused.value || mouseIsOverDropdown.value;
});

const filteredItems = computed(() => {
    return props.items.filter(item => {
        return includesInsensitive(item.value, text.value) || includesInsensitive(item.label, text.value);
    });
});

onMounted(() => {
    if (props.autofocus === true) {
        searchCombobox.value?.focus();
    }
});

function onItemSelected(e: MouseEvent, item: LightningListItem) {
    emit('selected', item);
    
    text.value = '';
    focused.value = false;
    mouseIsOverDropdown.value = false;
}
</script>

<template>
    <div class="slds-form-element">
        <label class="slds-form-element__label" for="search-combobox" v-if="label">{{ label }}</label>
        <div class="slds-form-element__control">
            <div class="slds-combobox_container">
                <div :class="`slds-combobox slds-dropdown-trigger slds-dropdown-trigger_click ${dropdownOpen ? 'slds-is-open' : ''}`">
                    <div class="slds-combobox__form-element slds-input-has-icon slds-input-has-icon_right" role="none">
                        <input type="text"
                               class="slds-input slds-combobox__input"
                               id="search-combobox"
                               ref="searchCombobox"
                               autoComplete="off"
                               role="combobox"
                              @focus="focused = true"
                              @blur="focused = false"
                               v-model.trim="text"
                              :placeholder="placeholder" />

                        <span class="slds-icon_container slds-icon-utility-search slds-input__icon slds-input__icon_right">
                            <svg class="slds-icon slds-icon slds-icon_x-small slds-icon-text-default">
                                <use xlink:href="slds/assets/icons/utility-sprite/svg/symbols.svg#search"></use>
                            </svg>
                        </span>
                    </div>

                    <div class="slds-dropdown slds-dropdown_length-with-icon-5 slds-dropdown_fluid" tabindex="0" @mouseover="mouseIsOverDropdown = true" @mouseleave="mouseIsOverDropdown = false">
                        <ul class="slds-listbox slds-listbox_vertical" role="presentation">
                            <!-- Empty list item -->
                            <li role="presentation" class="slds-listbox__item" v-if="filteredItems.length === 0">
                                <div class="slds-media slds-listbox__option slds-listbox__option_plain slds-media_small" role="option">
                                    <span class="slds-media__body">
                                        <span class="slds-truncate">{{ props.emptyListLabel }}</span>
                                    </span>
                                </div>
                            </li>

                            <!-- Normal list item -->
                            <li role="presentation" class="slds-listbox__item" v-else v-for="item of filteredItems" :key="item.value" @click="(e) => onItemSelected(e, item)">
                                <div class="slds-media slds-listbox__option slds-listbox__option_entity slds-listbox__option_has-meta" role="option">
                                    <span class="slds-media__figure slds-listbox__option-icon">
                                        <span class="slds-icon_container slds-icon-standard-slider">
                                            <svg class="slds-icon slds-icon_small" aria-hidden="true">
                                                <use xlink:href="slds/assets/icons/standard-sprite/svg/symbols.svg#slider">
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

<style scoped>
/* Note: without this, the SLDS Spinners would appear on top of the dropdown */
.slds-combobox {
    z-index: 10000;
}
</style>