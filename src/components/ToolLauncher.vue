<script setup lang="ts">
import { onMounted, ref } from 'vue';

import GroupMemberships from './GroupMemberships.vue';
import QuickCreateUser from './QuickCreateUser.vue';
import SetupPlusHub from './setup-plus/SetupPlusHub.vue';

import Context from '@/models/Context';

const displayEditGroupMemberships = ref(false);
const displayQuickCreateUser = ref(false);
const displaySetupPlusHub = ref(false);

const error = ref('');
const groupType = ref('');

const context = ref<Context>();

onMounted(() => {
    const params = new URLSearchParams(window.location.search);

    const loadedServerHost = params.get('host');
    if (!loadedServerHost) {
        error.value = 'Missing "host" from the URL, please re-open the window.';
        return;
    }

    const loadedRecordId = params.get('record') ?? undefined;

    const loadedOriginalTabId = params.get('tab');
    if (!loadedOriginalTabId) {
        error.value = 'Missing "tab" from the URL, please re-open the window.';
        return;
    }

    const loadedPage = params.get('page');
    if (!loadedPage) {
        error.value = 'Missing "page" from the URL, please re-open the window.';
        return;
    }

    chrome.runtime.sendMessage({ operation: 'get-session-id', host: loadedServerHost }, async function (session: any) {
        if (!session.id) {
            error.value = 'Session expired or invalid. Close all Salesforce Niknax windows, log into Salesforce and try again.';
            return;
        }

        context.value = new Context(loadedServerHost, parseInt(loadedOriginalTabId), session.id, loadedRecordId);

        if (loadedPage === 'edit-public-group-memberships') {
            groupType.value = 'Regular';
            displayEditGroupMemberships.value = true;
        } else if (loadedPage === 'edit-queue-memberships') {
            groupType.value = 'Queue';
            displayEditGroupMemberships.value = true;
        } if (loadedPage === 'quick-create-user') {
            displayQuickCreateUser.value = true;
        } else if (loadedPage === 'setup-plus') {
            displaySetupPlusHub.value = true;
        }
    });
});
</script>

<template>
    <div class="slds-grid slds-var-p-around_small">
        <GroupMemberships v-if="displayEditGroupMemberships" :type="groupType" :context="context!" />
        <QuickCreateUser v-else-if="displayQuickCreateUser" :context="context!" />
        <SetupPlusHub v-else-if="displaySetupPlusHub" :context="context!" />

        <p v-if="error" class="slds-text-color_error">{{ error }}</p>
    </div>
</template>

<style>
/* Used in GroupdMembership.vue and QuickCreateUser.vue */
.align-card-action-button {
    margin-top: -4px;
}

/* QuickCreateUser.vue and QuickCreateUserSettings.vue */
.popover-help {
    position: absolute;
    top: -45px;
    left: -15px;
    width: max-content;
}
</style>