<script setup lang="ts">
import { ref } from 'vue';

import UserQuickCreateSettingsForm from '@/models/UserQuickCreateSettingsForm';

// Setup promise to defer until the user has either selected a user or closed the dialog.
let resultResolve: (value: string | PromiseLike<string | null> | null) => void;

const visible = ref(false);
const showUsernameAtSuffixTooltip = ref(false);

const form = ref(new UserQuickCreateSettingsForm());

async function show(): Promise<string | null> {
    visible.value = true;
    document.addEventListener('keydown', onKeydown);

    return new Promise<string | null>((resolve) => {
        resultResolve = resolve;
    });
}

function onCancelClick() {
    close();
}

function onSaveClick() {
    // TODO

    //resultResolve();
    close();
}

function close() {
    visible.value = false;
    document.removeEventListener('keydown', onKeydown);
}

function onCloseClick() {
    resultResolve(null);
    close();
}

function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
        resultResolve(null);
        close();
    }
}

defineExpose<{
    show(): Promise<string | null>
}>({
    show
});
</script>

<template>
    <template v-if="visible">
        <section role="dialog" tabindex="-1" class="slds-modal slds-fade-in-open slds-modal_small">
            <div class="slds-modal__container">
                <button class="slds-button slds-button_icon slds-modal__close slds-button_icon-inverse"
                    @click="onCloseClick">
                    <svg class="slds-button__icon slds-button__icon_large">
                        <use xlink:href="slds/assets/icons/utility-sprite/svg/symbols.svg#close"></use>
                    </svg>
                </button>
                <div class="slds-modal__header">
                    <h1 class="slds-text-heading_medium">Settings</h1>
                </div>
                <div class="slds-modal__content slds-p-around_medium">
                    <div class="slds-form" role="list">
                        <div class="slds-form-element slds-form-element_stacked">
                            <label class="slds-form-element__label" for="username-at-suffix-input">Username @ Suffix</label>
                            <div class="slds-form-element__icon">
                                <button class="slds-button slds-button_icon" @mouseenter="showUsernameAtSuffixTooltip = true" @mouseleave="showUsernameAtSuffixTooltip = false">
                                    <svg class="slds-button__icon">
                                        <use xlink:href="slds/assets/icons/utility-sprite/svg/symbols.svg#info"></use>
                                    </svg>
                                </button>
                                <div id="usernameAtSuffixTooltip" class="slds-popover slds-popover_tooltip slds-nubbin_bottom-left" role="tooltip" v-show="showUsernameAtSuffixTooltip">
                                    <div class="slds-popover__body">The default text to place after the @ symbol in the username.</div>
                                </div>
                            </div>
                            <div class="slds-form-element__control">
                                <input type="text" id="username-at-suffix-input" class="slds-input" v-model="form.usernameAtSuffix" />
                            </div>
                        </div>

                        <fieldset class="slds-form-element slds-form-element_stacked">
                            <div class="slds-form-element__control">
                                <div class="slds-checkbox">
                                    <input type="checkbox" id="split-email-username-checkbox" v-model="form.getFirstLastNameFromEmail" />
                                    <label class="slds-checkbox__label" for="split-email-username-checkbox">
                                        <span class="slds-checkbox_faux"></span>
                                        <span class="slds-form-element__label">Get First/Last name from Email</span>
                                    </label>
                                </div>
                            </div>
                        </fieldset>
                    </div>
                </div>
                <div class="slds-modal__footer slds-theme_default">
                    <button class="slds-button slds-button_neutral" @click="onCancelClick">Cancel</button>
                    <button class="slds-button slds-button_brand" @click="onSaveClick">Save</button>
                </div>
            </div>
        </section>
        <div class="slds-backdrop slds-backdrop_open" role="presentation"></div>
    </template>
</template>

<style scoped>
/* Important to be able to show tooltips */
.slds-modal__content {
    overflow: visible;
}

#usernameAtSuffixTooltip {
    position: absolute;
    top: -45px;
    left: -15px;
    width: 45vw;
}
</style>