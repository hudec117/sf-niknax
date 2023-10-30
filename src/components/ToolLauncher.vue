<script setup lang="ts">
import { onMounted, ref } from 'vue';

import GroupMemberships from './GroupMemberships.vue';
import CloneUser from './CloneUser.vue';
import BulkFreezeUsers from './BulkFreezeUsers.vue';
import QuickCreateUser from './QuickCreateUser.vue';

import Context from '@/models/context';

const displayEditGroupMemberships = ref(false);
const displayCloneUser = ref(false);
const displayBulkFreezeUsers = ref(false);
const displayQuickCreateUser = ref(false);

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

    const loadedUserId = params.get('user') ?? undefined;

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
            error.value = 'Session not found. Close all Salesforce Niknax windows, log into Salesforce and try again.';
            return;
        }

        context.value = new Context(loadedServerHost, parseInt(loadedOriginalTabId), session.id, loadedUserId);

        if (loadedPage === 'edit-public-group-memberships') {
            groupType.value = 'Regular';
            displayEditGroupMemberships.value = true;
        } else if (loadedPage === 'edit-queue-memberships') {
            groupType.value = 'Queue';
            displayEditGroupMemberships.value = true;
        } else if (loadedPage === 'clone-user') {
            displayCloneUser.value = true;
        } else if (loadedPage === 'bulk-freeze-users') {
            displayBulkFreezeUsers.value = true;
        } else if (loadedPage === 'quick-create-user') {
            displayQuickCreateUser.value = true;
        }
    });
});
</script>

<template>
    <div class="slds-grid slds-var-p-around_small">
        <GroupMemberships v-if="displayEditGroupMemberships" :type="groupType" :context="context!" />
        <CloneUser v-else-if="displayCloneUser" :context="context!" />
        <BulkFreezeUsers v-else-if="displayBulkFreezeUsers" :context="context!" />
        <QuickCreateUser v-else-if="displayQuickCreateUser" :context="context!" />

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
    width: 45vw;
}
</style>