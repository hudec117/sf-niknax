<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

import SalesforceRESTService from '@/services/SalesforceRESTService';
import DuelingPicklist from './slds/DuelingPicklist.vue';
import UserSelectModal from './modals/user-select/UserSelectModal.vue';
import PopoutCardFooter from './PopoutCardFooter.vue';
import type Group from '@/models/Group';
import type GroupMember from '@/models/GroupMember';
import DuelingPicklistItem from './slds/DuelingPicklistItem';
import type Context from '@/models/Context';
import LightningSpinner from './slds/LightningSpinner.vue';
import ErrorPopover from './slds/ErrorPopover.vue';

const props = defineProps<{
    context: Context,
    type: String
}>();

const userSelectModal = ref<InstanceType<typeof UserSelectModal> | null>(null);

let restService: SalesforceRESTService;

let userGroupMembers: Array<GroupMember>;

const availableGroups = ref<Array<Group>>([]);
let originalAvailableGroups: Array<Group>;

const assignedGroups = ref<Array<Group>>([]);
let originalAssignedGroups: Array<Group>;

const title = ref('');
const primaryButtonError = ref<string | undefined>();
const showAPINames = ref(false);
const loading = ref(true);
const working = ref(false);

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
        const displayName = showAPINames.value ? group.DeveloperName : group.Name;
        return new DuelingPicklistItem(group.Id, displayName);
    });
});

const rightListItems = computed(() => {
    return assignedGroups.value.map((group) => {
        const displayName = showAPINames.value ? group.DeveloperName : group.Name;
        return new DuelingPicklistItem(group.Id, displayName);
    });
});

onMounted(() => {
    title.value = `${groupTypeLabel.value} Memberships`;
    document.title = `Salesforce Niknax: ${title.value}`;

    // Initialise Salesforce service
    restService = new SalesforceRESTService(props.context.serverHost, props.context.sessionId);

    loadData();
});

async function loadData() {
    try {
        // Get all groups
        const allGroupsQueryResult = await restService.query<Group>(`SELECT Id, Name, DeveloperName FROM Group WHERE Type = '${props.type}'`);
        if (!allGroupsQueryResult.success) {
            primaryButtonError.value = `Initial query for all Group records failed because: ${allGroupsQueryResult.error}`;
            return;
        }
        const allGroups = allGroupsQueryResult.guardedData;

        // Group memberships
        const groupMembersQueryResult = await restService.query<GroupMember>(`SELECT Id, GroupId, UserOrGroupId FROM GroupMember WHERE UserOrGroupId = '${props.context.userId}'`);
        if (!groupMembersQueryResult.success) {
            primaryButtonError.value = `Initial query for GroupMember records failed because: ${groupMembersQueryResult.error}`;
            return;
        }
        userGroupMembers = groupMembersQueryResult.guardedData;

        // Assigned groups
        originalAssignedGroups = allGroups.filter(group => {
            for (const groupMember of userGroupMembers) {
                if (groupMember.GroupId === group.Id) {
                    return true;
                }
            }

            return false;
        });
        assignedGroups.value = originalAssignedGroups.map(group => ({...group}));

        // Available groups
        originalAvailableGroups = allGroups.filter(group => {
            for (const assignedGroup of assignedGroups.value) {
                if (assignedGroup.Id === group.Id) {
                    return false;
                }
            }

            return true;
        });
        availableGroups.value = originalAvailableGroups.map(group => ({...group}));
    } catch (error) {
        primaryButtonError.value = `Something went wrong in the loadData function: ${(error as Error).message}`;
    } finally {
        loading.value = false;
    }
}

function onAssignGroups(items: Array<DuelingPicklistItem>) {
    for (const item of items) {
        const group = availableGroups.value.filter(group => group.Id === item.value)[0];

        // Remove from available groups
        const groupIndex = availableGroups.value.indexOf(group);
        availableGroups.value.splice(groupIndex, 1);

        // Add to assigned groups
        assignedGroups.value.push(group);
    }
}

function onUnassignGroups(items: Array<DuelingPicklistItem>) {
    for (const item of items) {
        const group = assignedGroups.value.filter(group => group.Id === item.value)[0];

        // Remove from assigned groups
        const groupIndex = assignedGroups.value.indexOf(group);
        assignedGroups.value.splice(groupIndex, 1);

        // Add to available groups
        availableGroups.value.push(group);
    }
}

async function onMatchUserClick() {
    const userId = await userSelectModal.value?.show(props.context);
    if (userId) {
        const cloneUserGroupMembershipsQueryResult = await restService.query<GroupMember>(`SELECT Id, GroupId, UserOrGroupId FROM GroupMember WHERE UserOrGroupId = '${userId}' AND Group.Type = '${props.type}'`);
        if (!cloneUserGroupMembershipsQueryResult.success) {
            primaryButtonError.value = `Query to retrieve match user's GroupMember records failed because: ${cloneUserGroupMembershipsQueryResult.error}`
            return;
        }

        const matchUserGroupMembers = cloneUserGroupMembershipsQueryResult.guardedData;
        if (matchUserGroupMembers.length === 0) {
            // TODO: handle if match user has no groups
            return;
        }

        // Move all the ones in the assigned list to available
        for (const group of assignedGroups.value) {
            availableGroups.value.push(group);
        }
        assignedGroups.value = [];

        // Assign the ones from the query
        for (const groupMember of matchUserGroupMembers) {
            const groupFinds = availableGroups.value.filter(group => group.Id === groupMember.GroupId);
            if (groupFinds.length < 1) {
                primaryButtonError.value = `Available groups does not contain the match user's group "${groupMember.GroupId}".`;
                return;
            } else if (groupFinds.length > 1) {
                primaryButtonError.value = `Available groups contains too many groups matching "${groupMember.GroupId}".`;
                return;
            }

            const groupToAssign = groupFinds[0];

            // Assign the group
            assignedGroups.value.push(groupToAssign);

            // Remove from available
            const indexOfGroupToAssign = availableGroups.value.indexOf(groupToAssign);
            availableGroups.value.splice(indexOfGroupToAssign, 1);
        }
    }
}

async function onSaveAndCloseClick() {
    working.value = true;
    primaryButtonError.value = '';

    try {
        let success = true;

        // Create a list of groups that have been newly assigned
        const newlyAssignedGroups = assignedGroups.value.filter(group => {
            for (const originalAssignedGroup of originalAssignedGroups) {
                if (originalAssignedGroup.Id === group.Id) {
                    return false;
                }
            }

            return true;
        });
        if (newlyAssignedGroups.length > 0) {
            success = await assignGroups(newlyAssignedGroups);
        }

        // Create a list of groups that have been newly unassigned
        const newlyUnassignedGroups = availableGroups.value.filter(group => {
            for (const originalAvailableGroup of originalAvailableGroups) {
                if (originalAvailableGroup.Id === group.Id) {
                    return false;
                }
            }

            return true;
        });
        if (newlyUnassignedGroups.length > 0) {
            success = await unassignGroups(newlyUnassignedGroups);
        }

        if (success) {
            if (newlyAssignedGroups.length > 0 || newlyUnassignedGroups.length > 0) {
                await chrome.tabs.reload(props.context.originalTabId);
            }

            const currentPopup = await chrome.windows.getCurrent();
            await chrome.windows.remove(currentPopup.id!);
        }
    } finally {
        working.value = false;
    }
}

async function assignGroups(groups: Array<Group>): Promise<boolean> {
    const assignToUserId = props.context.userId;
    if (!assignToUserId) {
        primaryButtonError.value = 'Missing User ID in the context.';
        return false;
    }

    const groupMembersToCreate = groups.map(group => {
        return {
            GroupId: group.Id,
            UserOrGroupId: assignToUserId
        } as GroupMember;
    });

    for (const groupMember of groupMembersToCreate) {
        const result = await restService.create('GroupMember', groupMember);
        if (!result.success) {
            primaryButtonError.value = `Failed to assign (create) user to group "${groupMember.GroupId}" because: ${result.error}`;
            return false;
        }
    }

    return true;
}

async function unassignGroups(groups: Array<Group>): Promise<boolean> {
    const groupMembersToDelete = groups.map(group => userGroupMembers.filter(groupMember => group.Id == groupMember.GroupId)[0]);

    for (const groupMember of groupMembersToDelete) {
        const result = await restService.delete('GroupMember', groupMember.Id!);
        if (!result.success) {
            primaryButtonError.value = `Failed to unassign (delete) user from group "${groupMember.GroupId}" because: ${result.error}`;
            return false;
        }
    }

    return true;
}
</script>

<template>
    <article class="slds-card">
        <LightningSpinner :visible="loading || working" />

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
                        <span>{{ title }}</span>
                    </h2>
                </div>
                <div class="slds-no-flex">
                    <!-- Toggle API names button -->
                    <button class="slds-button slds-button_icon slds-button_icon-border-filled align-card-action-button"
                            title="Toggle API Names"
                           @click="showAPINames = !showAPINames">
                        <svg class="slds-button__icon">
                            <use xlink:href="slds/assets/icons/utility-sprite/svg/symbols.svg#preview"></use>
                        </svg>
                    </button>

                    <!-- Match User button -->
                    <button class="slds-button slds-button_neutral"
                            title="Match another user's group memberships"
                           @click="onMatchUserClick">
                        Match a User
                    </button>

                    <!-- Save & Close button -->
                    <button class="slds-button slds-button_brand"
                           @click="onSaveAndCloseClick">
                        Save & Close
                    </button>

                    <!-- Error popover -->
                    <ErrorPopover :message="primaryButtonError"
                                  :right="44"
                                  :top="55"
                                  @close="primaryButtonError = undefined" />
                </div>
            </header>
        </div>
        <div class="slds-card__body slds-card__body_inner">
            <DuelingPicklist :left-list-label="`Available ${groupTypeLabel}s`"
                             :right-list-label="`Assigned ${groupTypeLabel}s`"
                            :left-list="leftListItems"
                            :right-list="rightListItems"
                            @move-left="onUnassignGroups"
                            @move-right="onAssignGroups" />
        </div>
        <PopoutCardFooter />
    </article>

    <UserSelectModal ref="userSelectModal" immediate-select />
</template>