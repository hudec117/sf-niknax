<script setup lang="ts">
import { ref } from 'vue';

import type User from '@/models/User';
import LightningSearchLookup from '../../slds/LightningSearchLookup.vue';
import LightningListItem from '@/components/slds/LightningListItem';
import Context from '@/models/Context';
import SalesforceRESTService from '@/services/SalesforceRESTService';

const props = defineProps<{
    immediateSelect?: boolean
}>();

let restService: SalesforceRESTService;

// Setup promise to defer until the user has either selected a user or closed the dialog.
let resultResolve: (value: string | PromiseLike<string | null> | null) => void;

const visible = ref(false);
const searchError = ref('');
const selectedUserId = ref<string | undefined>();

async function doSearch(value: string): Promise<Array<LightningListItem>> {
    const queryResult = await restService.query<User>(`SELECT Id, FirstName, LastName, Username, Email FROM User WHERE (Name LIKE '%${value}%' OR Username LIKE '%${value}%' OR Email LIKE '%${value}%') AND UserType != 'AutomatedProcess' AND UserType != 'CloudIntegrationUser'`);
    if (!queryResult.success) {
        searchError.value = `Something went wrong: ${queryResult.error}`;
        return [];
    }

    searchError.value = '';

    return queryResult.guardedData.map(user => {
        let fullName = user.LastName;
        if (user.FirstName) {
            fullName = user.FirstName + ' ' + fullName;
        }

        const sublabel = `${user.Email} • ${user.Username}`;

        return new LightningListItem(user.Id, fullName, sublabel);
    });
}

function onSearchSelected(item: LightningListItem) {
    selectedUserId.value = item.value;

    if (props.immediateSelect) {
        onSelectClick();
    }
}

function onSearchUnselected() {
    selectedUserId.value = undefined;
}

async function show(context: Context): Promise<string | null> {
    visible.value = true;
    document.addEventListener('keydown', onKeydown);

    restService = new SalesforceRESTService(context.serverHost, context.sessionId);

    return new Promise<string | null>((resolve) => {
        resultResolve = resolve;
    });
}

function onSelectClick() {
    if (selectedUserId.value) {
        resultResolve(selectedUserId.value);

        close();
    }
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
    show(context: Context): Promise<string | null>
}>({
    show
});
</script>

<template>
    <template v-if="visible">
        <section role="dialog" tabindex="-1" class="slds-modal slds-fade-in-open slds-modal_small">
            <div class="slds-modal__container">
                <button class="slds-button slds-button_icon slds-modal__close slds-button_icon-inverse" @click="onCloseClick">
                    <svg class="slds-button__icon slds-button__icon_large">
                        <use xlink:href="slds/assets/icons/utility-sprite/svg/symbols.svg#close"></use>
                    </svg>
                </button>
                <div class="slds-modal__header">
                    <h1 class="slds-text-heading_medium">Select a User</h1>
                </div>
                <div class="slds-modal__content slds-p-around_medium">
                    <LightningSearchLookup placeholder="Search by name, username or email"
                                           empty-list-label="No records found"
                                           autofocus
                                          :error-label="searchError"
                                          :do-search="doSearch"
                                          @selected="onSearchSelected"
                                          @unselected="onSearchUnselected" />
                </div>
                <div class="slds-modal__footer slds-theme_default" v-if="!immediateSelect">
                    <button class="slds-button slds-button_brand" :disabled="selectedUserId == undefined" @click="onSelectClick">Select</button>
                </div>
            </div>
        </section>
        <div class="slds-backdrop slds-backdrop_open" role="presentation"></div>
    </template>
</template>

<style scoped>

/* Important to be able to show full dropdown */
.slds-modal__content {
    overflow: visible;
}
</style>