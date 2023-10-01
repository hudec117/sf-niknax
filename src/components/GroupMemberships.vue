<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

import SalesforceRESTService from '@/services/salesforce-rest-services';
import DuelingPicklist from './DuelingPicklist.vue';
import Group from '@/models/Group';
import GroupMember from '@/models/GroupMember';
import DuelingPicklistItem from '@/models/DuelingPicklistItem';

const props = defineProps<{
    type: String
}>();

let restService: SalesforceRESTService;

let userId: string;
let userGroupMembers: Array<GroupMember>;

let userTabId: number;

const availableGroups = ref<Array<Group>>([]);
let originalAvailableGroups: Array<Group>;

const assignedGroups = ref<Array<Group>>([]);
let originalAssignedGroups: Array<Group>;

const showAPINames = ref(false);
const loading = ref(true);
const saving = ref(false);

const groupTypeLabel = computed(() => {
    if (props.type === 'Regular') {
        return 'Public Group';
    } else if (props.type === 'Queue') {
        return 'Queue';
    }

    return 'INVALID GROUP TYPE';
});

const leftListItems = computed(() => {
    return availableGroups.value.map((group) => {
        const displayName = showAPINames.value ? group.developerName : group.name;
        return new DuelingPicklistItem(group.id, displayName);
    });
});

const rightListItems = computed(() => {
    return assignedGroups.value.map((group) => {
        const displayName = showAPINames.value ? group.developerName : group.name;
        return new DuelingPicklistItem(group.id, displayName);
    });
});

onMounted(() => {
    // Initialise server host and user ID from URL
    const params = new URLSearchParams(window.location.search);
    const serverHost = params.get('host');
    if (!serverHost) {
        // TODO: handle
        return;
    }

    const loadedUserId = params.get('user');
    if (!loadedUserId) {
        // TODO: handle
        return;
    }
    userId = loadedUserId;

    const loadedUserTabId = params.get('tab');
    if (!loadedUserTabId) {
        // TODO: handle
        return;
    }
    userTabId = parseInt(loadedUserTabId);

    // Get session ID
    chrome.runtime.sendMessage({ operation: 'get-session-id', host: serverHost }, async function (session: any) {
        if (!session.id) {
            // TODO: handle
            return;
        }

        // Initialise Salesforce service
        restService = new SalesforceRESTService(serverHost, session.id);

        loadData();
    });
});

async function loadData() {
    // Get all groups
    const allGroupsQueryResult = await restService.query(`SELECT Id, Name, DeveloperName FROM Group WHERE Type = '${props.type}'`);
    const allGroups = (allGroupsQueryResult.records as Array<any>).map((record) => {
        return new Group(record.Id, record.Name, record.DeveloperName);
    });

    // Group memberships
    const groupMembersQueryResult = await restService.query(`SELECT Id, GroupId, UserOrGroupId FROM GroupMember WHERE UserOrGroupId = '${userId}'`);
    userGroupMembers = (groupMembersQueryResult.records as Array<any>).map((record) => {
        return new GroupMember(record.GroupId, record.UserOrGroupId, record.Id);
    });

    // Assigned groups
    originalAssignedGroups = allGroups.filter(group => {
        for (const groupMember of userGroupMembers) {
            if (groupMember.groupId === group.id) {
                return true;
            }
        }

        return false;
    });
    assignedGroups.value = originalAssignedGroups.map(group => ({...group}));

    // Available groups
    originalAvailableGroups = allGroups.filter(group => {
        for (const assignedGroup of assignedGroups.value) {
            if (assignedGroup.id === group.id) {
                return false;
            }
        }

        return true;
    });
    availableGroups.value = originalAvailableGroups.map(group => ({...group}));

    loading.value = false;
}

function onAssignGroups(items: Array<DuelingPicklistItem>) {
    for (const item of items) {
        const group = availableGroups.value.filter(group => group.id === item.value)[0];

        // Remove from available groups
        const groupIndex = availableGroups.value.indexOf(group);
        availableGroups.value.splice(groupIndex, 1);

        // Add to assigned groups
        assignedGroups.value.push(group);
    }
}

function onUnassignGroups(items: Array<DuelingPicklistItem>) {
    for (const item of items) {
        const group = assignedGroups.value.filter(group => group.id === item.value)[0];

        // Remove from assigned groups
        const groupIndex = assignedGroups.value.indexOf(group);
        assignedGroups.value.splice(groupIndex, 1);

        // Add to available groups
        availableGroups.value.push(group);
    }
}

async function onSaveAndCloseClick() {
    saving.value = true;

    // Create a list of groups that have been newly assigned
    const newlyAssignedGroups = assignedGroups.value.filter(group => {
        for (const originalAssignedGroup of originalAssignedGroups) {
            if (originalAssignedGroup.id === group.id) {
                return false;
            }
        }

        return true;
    });

    if (newlyAssignedGroups.length > 0) {
        await assignGroups(newlyAssignedGroups);
    }

    // Create a list of groups that have been newly unassigned
    const newlyUnassignedGroups = availableGroups.value.filter(group => {
        for (const originalAvailableGroup of originalAvailableGroups) {
            if (originalAvailableGroup.id === group.id) {
                return false;
            }
        }

        return true;
    });

    if (newlyUnassignedGroups.length > 0) {
        await unassignGroups(newlyUnassignedGroups);
    }

    // If there's been a change, refresh the page.
    if (newlyAssignedGroups.length > 0 || newlyUnassignedGroups.length > 0) {
        await chrome.tabs.reload(userTabId);
    }

    saving.value = false;

    const currentPopup = await chrome.windows.getCurrent();
    await chrome.windows.remove(currentPopup.id!);
}

async function assignGroups(groups: Array<Group>) {
    const groupMembersToCreate = groups.map(group => new GroupMember(group.id, userId));

    for (const groupMember of groupMembersToCreate) {
        await restService.create('GroupMember', groupMember);
    }
}

async function unassignGroups(groups: Array<Group>) {
    const groupMembersToDelete = groups.map(group => userGroupMembers.filter(groupMember => group.id == groupMember.groupId)[0]);

    for (const groupMember of groupMembersToDelete) {
        await restService.delete('GroupMember', groupMember.id!);
    }
}

</script>

<template>
    <article class="slds-card">
        <div class="slds-card__header slds-grid">
            <header class="slds-media slds-media_center slds-has-flexi-truncate">
                <div class="slds-media__figure">
                    <span class="slds-icon_container slds-icon-standard-customers">
                        <svg class="slds-icon slds-icon_small">
                            <use xlink:href="slds/assets/icons/standard-sprite/svg/symbols.svg#customers"></use>
                        </svg>
                    </span>
                </div>
                <div class="slds-media__body">
                    <h2 class="slds-card__header-title">
                        <span>{{ groupTypeLabel }} Memberships</span>
                    </h2>
                </div>
                <div class="slds-no-flex">
                    <button class="slds-button slds-button_icon slds-button_icon-border-filled slds-custom-align-button"
                            title="Toggle API Names"
                           @click="showAPINames = !showAPINames"
                           :disabled="loading || saving">
                        <svg class="slds-button__icon">
                            <use xlink:href="slds/assets/icons/utility-sprite/svg/symbols.svg#preview"></use>
                        </svg>
                    </button>
                    <button class="slds-button slds-button_brand"
                           @click="onSaveAndCloseClick"
                           :disabled="loading || saving">
                        {{ saving ? 'Saving...' : 'Save & Close' }}
                    </button>
                </div>
            </header>
        </div>
        <div class="slds-card__body slds-card__body_inner">
            <DuelingPicklist :left-list-label="`Available ${groupTypeLabel}s`"
                             :right-list-label="`Assigned ${groupTypeLabel}s`"
                            :left-list="leftListItems"
                            :right-list="rightListItems"
                            :disabled="loading || saving"
                            @move-left="onUnassignGroups"
                            @move-right="onAssignGroups" />
        </div>
        <footer class="slds-card__footer">
            <p>Only direct memberships are shown.</p>
        </footer>
    </article>
</template>

<style>
.slds-custom-align-button {
    margin-top: -4px;
}
</style>