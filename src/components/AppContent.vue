<script setup lang="ts">
import { onMounted, ref } from 'vue';

import GroupMemberships from './GroupMemberships.vue';

const page = ref('');
const groupType = ref('');

onMounted(() => {
    const params = new URLSearchParams(window.location.search);
    const loadedPage = params.get('page');
    if (!loadedPage) {
        // TODO: handle
        return;
    }

    page.value = loadedPage;

    if (page.value === 'edit-public-group-memberships') {
        groupType.value = 'Regular';
    } else if (page.value === 'edit-queue-memberships') {
        groupType.value = 'Queue';
    }
});
</script>

<template>
    <div class="slds-grid slds-var-p-around_small">
        <GroupMemberships v-if="['edit-public-group-memberships', 'edit-queue-memberships'].includes(page)" :type="groupType" />
    </div>
</template>