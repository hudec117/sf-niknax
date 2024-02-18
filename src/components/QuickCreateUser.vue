<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

import PopoutCardFooter from './PopoutCardFooter.vue';
import FullscreenOverlay from '@/components/slds/FullscreenOverlay.vue';
import LightningTableLite from '@/components/slds/LightningTableLite.vue';
import QuickCreateUserSettingsModal from '@/components/modals/quick-create-user-settings/QuickCreateUserSettingsModal.vue';
import UserSelectModal from '@/components/modals/user-select/UserSelectModal.vue';
import SalesforceToolingService from '@/services/SalesforceToolingService';
import Context from '@/models/Context';
import UserCreateCloneForm from '@/models/UserCreateForm';
import SalesforceUserService from '@/services/SalesforceUserService';
import type Profile from '@/models/Profile';
import type UserRole from '@/models/UserRole';
import type User from '@/models/User';
import type Organisation from '@/models/Organisation';
import UserQuickCreateSettings from '@/models/UserQuickCreateSettings';
import LightningSpinner from './slds/LightningSpinner.vue';
import ErrorPopover from './slds/ErrorPopover.vue';
import type LightningTableColumn from './slds/LightningTableColumn';
import type UserActionResult from '@/models/UserActionResult';
import type { ItemCloneResult } from '@/services/Results';

const SETTINGS_KEY = 'quick-create-user-settings';

const props = defineProps<{
    context: Context
}>();

const settingsModal = ref<InstanceType<typeof QuickCreateUserSettingsModal> | null>(null);
const userSelectModal = ref<InstanceType<typeof UserSelectModal> | null>(null);

let userService: SalesforceUserService;
let toolingService: SalesforceToolingService;
let createdUserId = '';

const mode = ref<'create' | 'clone'>('create');
const form = ref(new UserCreateCloneForm());

const primaryButtonText = ref('Create & Close');
const primaryButtonError = ref<string | undefined>();
const cloneButtonError = ref<string | undefined>();
const loading = ref(true);
const working = ref(false);
const overlay = ref({
    visible: false,
    type: 'success',
    actionResults: new Array<UserActionResult>(),
    actionResultsTableColumns: [
        {
            type: 'text',
            identifier: 'item',
            label: 'Action',
            visible: true
        },
        {
            type: 'text',
            identifier: 'outcome',
            label: 'Outcome',
            visible: true
        }
    ] as Array<LightningTableColumn>
});
const showUsernameTooltip = ref(false);
const showProfileTooltip = ref(false);
const showRoleTooltip = ref(false);
const isValidEmail = ref(false);
const cloneTargetUser = ref<User | undefined>();
const settings = ref(new UserQuickCreateSettings());

const profiles = ref({
    loading: true,
    items: new Array<Profile>(),
    error: ''
});
const roles = ref({
    loading: true,
    items: new Array<UserRole>(),
    error: ''
});

const isValidForm = computed(() => {
    return userService.isValidEmail(form.value.email)
        && userService.isValidFirstName(form.value.firstName)
        && userService.isValidLastName(form.value.lastName)
        && userService.isValidAlias(form.value.alias)
        && userService.isValidEmail(form.value.username)
        && userService.isValidNickname(form.value.nickname);
});

onMounted(() => {
    document.title = 'Salesforce Niknax: Quick Create User';

    // Initialise Salesforce services
    userService = new SalesforceUserService(props.context.serverHost, props.context.sessionId);
    toolingService = new SalesforceToolingService(props.context.serverHost, props.context.sessionId);

    loadData();
});

async function loadData() {
    try {
        // Load settings
        const settingsResult = await chrome.storage.local.get([SETTINGS_KEY]);
        if (SETTINGS_KEY in settingsResult) {
            settings.value = settingsResult[SETTINGS_KEY] as UserQuickCreateSettings;
        }

        form.value.resetPassword = settings.value.resetPasswordDefault;

        // Attempt to load email from clipboard
        if (settings.value.grabEmailFromClipboard) {
            const clipboardText = (await navigator.clipboard.readText()).trim();
            if (userService.isValidEmail(clipboardText)) {
                form.value.email = clipboardText;
                onEmailEntered();
            }
        }

        // Load profiles/roles
        await Promise.all([loadProfiles(), loadRoles()]);

        // If the user ID is in the context, switch to clone mode immediately.
        if (props.context.recordId) {
            switchToCloneMode(props.context.recordId);
        }
    } catch (error) {
        primaryButtonError.value = `Something went wrong in the loadData function: ${(error as Error).message}`;
    } finally {
        loading.value = false;
    }
}

async function loadProfiles() {
    form.value.profileId = 'loading';
    profiles.value.loading = true;

    try {
        const result = await userService.query<Profile>('SELECT Id, Name, UserLicenseId, UserLicense.Name FROM Profile');
        if (!result.success) {
            profiles.value.error = result.error as string;
            return;
        }

        profiles.value.items = result.guardedData;

        // Attempt to find the default profile as defined in the settings, falling back to System Administrator if not found.
        const matchedDefaultProfiles = profiles.value.items.filter(profile => profile.Name === settings.value.defaultProfile);
        if (matchedDefaultProfiles.length > 0) {
            form.value.profileId = matchedDefaultProfiles[0].Id;
        } else {
            form.value.profileId = profiles.value.items.filter(profile => profile.Name === 'System Administrator')[0].Id;
        }
    } finally {
        profiles.value.loading = false;
    }
}

async function loadRoles() {
    form.value.roleId = 'loading';
    roles.value.loading = true;

    try {
        const result = await userService.query<UserRole>('SELECT Id, Name, DeveloperName FROM UserRole');
        if (!result.success) {
            roles.value.error = result.error as string;
            return;
        }

        roles.value.items = result.guardedData;

        // Attempt to find the default role as defined in the settings, falling back to None if not found.
        const matchedDefaultRoles = roles.value.items.filter(role => role.DeveloperName === settings.value.defaultRole);
        if (matchedDefaultRoles.length > 0) {
            form.value.roleId = matchedDefaultRoles[0].Id;
        } else {
            form.value.roleId = '';
        }
    } finally {
        roles.value.loading = false;
    }
}

function onEmailEntered() {
    if (!(isValidEmail.value = userService.isValidEmail(form.value.email))) {
        return;
    }

    const emailUsername = form.value.email.substring(0, form.value.email.indexOf('@'));

    const fullNameRegexResult = /^(\w+)\.(\w+)/.exec(emailUsername);
    if (fullNameRegexResult) {
        // Get and format first name
        let firstName = fullNameRegexResult[1];
        firstName = firstName[0].toUpperCase() + firstName.slice(1);
        if (!form.value.firstName) {
            form.value.firstName = firstName;
        }

        // Get and format last name
        let lastName = fullNameRegexResult[2];
        lastName = lastName[0].toUpperCase() + lastName.slice(1);
        if (!form.value.lastName) {
            form.value.lastName = lastName;
        }
    } else {
        if (!form.value.lastName) {
            form.value.lastName = emailUsername;
        }
    }

    if (!form.value.alias) {
        form.value.alias = userService.generateAlias(form.value.firstName, form.value.lastName);
    }

    if (!form.value.username) {
        form.value.username = userService.generateUsername(emailUsername, settings.value.usernameDomain);
    }

    if (!form.value.nickname) {
        form.value.nickname = userService.generateNickname();
    }
}

function onClonePermissionSetAssignmentsChanged() {
    if (form.value.clonePermissionSetAssignments) {
        form.value.activateUser = true;
    }
}

function onActivateUserChanged() {
    if (!form.value.activateUser) {
        form.value.resetPassword = false;
        form.value.clonePermissionSetAssignments = false;
    }
}

function onResetPasswordChanged() {
    if (form.value.resetPassword) {
        form.value.activateUser = true;
    }
}

async function onSettingsClick() {
    const newSettings = await settingsModal.value?.show(settings.value);
    if (newSettings) {
        settings.value = newSettings;

        await chrome.storage.local.set({
            'quick-create-user-settings': newSettings
        });
    }
}

async function onCloneClick() {
    const cloneTargetUserId = await userSelectModal.value?.show(props.context);
    if (!cloneTargetUserId) {
        return;
    }

    loading.value = true;

    try {
        switchToCloneMode(cloneTargetUserId);
    } finally {
        loading.value = false;
    }
}

async function switchToCloneMode(cloneTargetUserId: string) {
    const userQueryResult = await userService.query<User>(`SELECT Id, Username, ProfileId, UserRoleId FROM User WHERE Id = '${cloneTargetUserId}'`);
    if (!userQueryResult.success) {
        cloneButtonError.value = `Failed to query the clone target User because: ${userQueryResult.error}`;
        return;
    }
    if (userQueryResult.guardedData.length === 0) {
        // This scenario (most likely) implies that the ID we tried to query using is not a User sObject ID and therefore we should stop trying
        // to switch into clone mode.
        return;
    }
    cloneTargetUser.value = userQueryResult.guardedData[0];

    // TODO: Check if the user has any permission set assignments

    // TODO: Check if the user has any public group memberships

    // TODO: Check if the user has any queue memberships

    // Resize window to accomodate visible checkboxes, change the title and mode.
    resizeTo(690, 724);
    document.title = `Salesforce Niknax: Clone ${cloneTargetUser.value.Username}`;
    mode.value = 'clone';
    primaryButtonText.value = 'Clone & Close';

    // Populate the Profile/Role picklists
    form.value.profileId = cloneTargetUser.value.ProfileId;
    form.value.roleId = cloneTargetUser.value.UserRoleId ?? '';
}

async function onPrimaryButtonClick() {
    if (mode.value === 'create') {
        onCreateAndCloseClick();
    } else if (mode.value === 'clone') {
        onCloneAndCloseClick();
    }
}

async function onCloneAndCloseClick() {
    working.value = true;
    primaryButtonError.value = '';

    if (!cloneTargetUser.value) {
        // Note: should never happen
        primaryButtonError.value = '"cloneTargetUser" is not set, please report this on GitHub.';
        return;
    }

    try {
        const overridenFieldValues = new Map<string, unknown>();
        overridenFieldValues.set('FirstName', form.value.firstName);
        overridenFieldValues.set('LastName', form.value.lastName);
        overridenFieldValues.set('Email', form.value.email);
        overridenFieldValues.set('Alias', form.value.alias);
        overridenFieldValues.set('Username', form.value.username);
        overridenFieldValues.set('CommunityNickname', form.value.nickname);
        overridenFieldValues.set('ProfileId', form.value.profileId);
        overridenFieldValues.set('UserRoleId', form.value.roleId);
        overridenFieldValues.set('IsActive', form.value.activateUser);

        const cloneUserResult = await userService.cloneUser(cloneTargetUser.value.Id, overridenFieldValues);
        if (!cloneUserResult.success) {
            primaryButtonError.value = `Failed to clone the user because: ${cloneUserResult.error}`;
            return;
        }

        createdUserId = cloneUserResult.guardedData.Id;
        overlay.value.actionResults.push({
            item: 'Clone User',
            outcome: 'Success'
        });

        await tryResetPasswordAfterCreate();

        if (form.value.clonePermissionSetAssignments) {
            const clonePermSetAssignmentsResult = await userService.clonePermissionSetAssignments(cloneTargetUser.value.Id, createdUserId);
            if (!clonePermSetAssignmentsResult.success || !clonePermSetAssignmentsResult.data) {
                // TODO: handle
            } else {
                addItemCloneResultsToOverlay(clonePermSetAssignmentsResult.data);
            }
        }

        if (form.value.clonePublicGroupMemberships) {
            const cloneGroupMembershipsResult = await userService.cloneGroupMemberships(cloneTargetUser.value.Id, createdUserId, 'Regular');
            if (!cloneGroupMembershipsResult.success || !cloneGroupMembershipsResult.data) {
                // TODO: handle
            } else {
                addItemCloneResultsToOverlay(cloneGroupMembershipsResult.data);
            }
        }

        if (form.value.cloneQueueMemberships) {
            const cloneQueueMembershipsResult = await userService.cloneGroupMemberships(cloneTargetUser.value.Id, createdUserId, 'Queue');
            if (!cloneQueueMembershipsResult.success || !cloneQueueMembershipsResult.data) {
                // TODO: handle
            } else {
                addItemCloneResultsToOverlay(cloneQueueMembershipsResult.data);
            }
        }

        // Show the overlay
        overlay.value.visible = true;
    } finally {
        working.value = false;
    }
}

async function onCreateAndCloseClick() {
    working.value = true;
    primaryButtonError.value = '';

    try {
        const getOrgResult = await userService.getOrganisation();
        if (!getOrgResult.success) {
            primaryButtonError.value = `Failed to get the current organisation ID because: ${getOrgResult.error}`;
            return;
        }

        const org = getOrgResult.data as Organisation;

        // Create the user
        const userCreateResult = await userService.create('User', {
            FirstName: form.value.firstName,
            LastName: form.value.lastName,
            Email: form.value.email,
            Alias: form.value.alias,
            Username: form.value.username,
            CommunityNickname: form.value.nickname,
            LocaleSidKey: org.DefaultLocaleSidKey,
            TimeZoneSidKey: org.TimeZoneSidKey,
            ProfileId: form.value.profileId,
            UserRoleId: form.value.roleId,
            LanguageLocaleKey: org.LanguageLocaleKey,
            EmailEncodingKey: 'UTF-8'
        });
        if (!userCreateResult.success) {
            primaryButtonError.value = `Failed to create the user because: ${userCreateResult.error}`;
            return;
        }

        createdUserId = userCreateResult.guardedData;
        overlay.value.actionResults.push({
            item: 'Create User',
            outcome: 'Success'
        });

        tryResetPasswordAfterCreate();

        overlay.value.visible = true;
    } finally {
        working.value = false;
    }
}

async function tryResetPasswordAfterCreate(): Promise<void> {
    if (form.value.resetPassword) {
        const resetPasswordResult = await toolingService.executeAnonymous(`System.resetPassword('${createdUserId}', true);`);
        if (!resetPasswordResult.success) {
            overlay.value.type = 'warning';

            // allSuccessful = false;
            overlay.value.actionResults.push({
                item: 'Reset Password',
                outcome: `Failed because: ${resetPasswordResult.error}`
            });
        } else {
            overlay.value.actionResults.push({
                item: 'Reset Password',
                outcome: 'Success'
            });
        }
    }
}

function addItemCloneResultsToOverlay(itemCloneResults: Array<ItemCloneResult>) {
    overlay.value.actionResults = overlay.value.actionResults.concat(
        itemCloneResults.map(itemCloneResult => {
            return {
                item: `Clone ${itemCloneResult.typeLabel} '${itemCloneResult.item}'`,
                outcome: itemCloneResult.outcome
            } as UserActionResult;
        })
    );
}

async function onOpenUser() {
    const userDetailUrl = `https://${props.context.serverHost}/lightning/setup/ManageUsers/page?address=/${createdUserId}?noredirect=1&isUserEntityOverride=1`;
    await chrome.tabs.create({
        url: userDetailUrl
    });

    await closeWindow();
}

async function closeWindow() {
    const currentPopup = await chrome.windows.getCurrent();
    await chrome.windows.remove(currentPopup.id!);
}
</script>

<template>
    <article class="slds-card">
        <LightningSpinner :visible="loading || working" />

        <div class="slds-card__header slds-grid">
            <header class="slds-media slds-media_center slds-has-flexi-truncate">
                <div class="slds-media__figure">
                    <span class="slds-icon_container slds-icon-standard-user">
                        <svg class="slds-icon slds-icon_small">
                            <use xlink:href="slds/assets/icons/standard-sprite/svg/symbols.svg#user"></use>
                        </svg>
                    </span>
                </div>
                <div class="slds-media__body">
                    <h2 class="slds-card__header-title">
                        <template v-if="mode === 'create'">Quick Create User</template>
                        <span v-else-if="mode === 'clone'" class="slds-truncate slds-m-right_x-small">Clone {{ cloneTargetUser?.Username }}</span>
                    </h2>
                </div>
                <div class="slds-no-flex">
                    <!-- Setting button -->
                    <button class="slds-button slds-button_icon slds-button_icon-border-filled align-card-action-button"
                            title="Settings"
                            @click="onSettingsClick">
                        <svg class="slds-button__icon">
                            <use xlink:href="slds/assets/icons/utility-sprite/svg/symbols.svg#settings"></use>
                        </svg>
                    </button>

                    <!-- Clone a User button -->
                    <button class="slds-button slds-button_neutral"
                           @click="onCloneClick"
                           :disabled="loading || working">
                        Clone a User...
                    </button>

                    <!-- Create/Clone & Close (aka primary) button -->
                    <button class="slds-button slds-button_brand"
                           @click="onPrimaryButtonClick"
                           :disabled="loading || working || !isValidForm">
                        {{ primaryButtonText }}
                    </button>

                    <!-- Primary button popover -->
                    <ErrorPopover :message="primaryButtonError"
                                  :right="51"
                                  :top="55"
                                  @close="primaryButtonError = undefined" />

                    <!-- Clone button popover -->
                    <ErrorPopover :message="cloneButtonError"
                                  :right="175"
                                  :top="55"
                                  @close="cloneButtonError = undefined" />
                </div>
            </header>
        </div>
        <div class="slds-card__body slds-card__body_inner">
            <p class="slds-m-bottom_x-small">Enter an email address and the rest of the form will auto-populate.</p>

            <div class="slds-form slds-m-top_x-small" role="list">

                <!-- Email field -->
                <div :class="`slds-form-element slds-m-bottom_x-small ${form.email.length === 0 || isValidEmail ? '' : 'slds-has-error'}`">
                    <label class="slds-form-element__label" for="email-input">
                        <abbr class="slds-required" title="required">* </abbr>
                        Email
                    </label>
                    <div class="slds-form-element__control">
                        <input type="text"
                               id="email-input"
                               class="slds-input"
                               v-model.trim="form.email"
                              @input="onEmailEntered"
                               autofocus
                               required />
                    </div>
                </div>

                <!-- First/Last name fields -->
                <div class="slds-form__row">
                    <div class="slds-form__item" role="listitem">
                        <div class="slds-form-element slds-form-element_horizontal slds-is-editing">
                            <label class="slds-form-element__label" for="first-name-input">First Name</label>
                            <div class="slds-form-element__control">
                                <input type="text"
                                       id="first-name-input"
                                       class="slds-input"
                                       v-model.trim="form.firstName" />
                            </div>
                        </div>
                    </div>
                    <div class="slds-form__item" role="listitem">
                        <div class="slds-form-element slds-form-element_horizontal slds-is-editing">
                            <label class="slds-form-element__label" for="last-name-input">
                                <abbr class="slds-required" title="required">* </abbr>
                                Last Name
                            </label>
                            <div class="slds-form-element__control">
                                <input type="text"
                                       id="last-name-input"
                                       class="slds-input"
                                       v-model.trim="form.lastName" />
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Profile/Role fields -->
                <div class="slds-form__row">
                    <div class="slds-form__item" role="listitem">
                        <div :class="`slds-form-element slds-form-element_horizontal slds-is-editing ${profiles.error.length > 0 ? 'slds-has-error' : ''}`">
                            <label class="slds-form-element__label" for="profile-input">
                                <abbr class="slds-required" title="required">* </abbr>
                                Profile
                            </label>
                            <div class="slds-form-element__icon">
                                <button class="slds-button slds-button_icon" @mouseenter="showProfileTooltip = true" @mouseleave="showProfileTooltip = false">
                                    <svg class="slds-button__icon">
                                        <use xlink:href="slds/assets/icons/utility-sprite/svg/symbols.svg#info"></use>
                                    </svg>
                                </button>
                                <div class="slds-popover slds-popover_tooltip slds-nubbin_bottom-left popover-help" role="tooltip" v-show="showProfileTooltip">
                                    <div class="slds-popover__body">The license is shown in brackets.</div>
                                </div>
                            </div>
                            <div class="slds-form-element__control">
                                <div class="slds-select_container">
                                <select id="profile-input" class="slds-select" :disabled="profiles.loading || profiles.error.length > 0" v-model="form.profileId">
                                    <option v-if="profiles.loading" value="loading">Loading...</option>

                                    <option v-for="profile of profiles.items"
                                           :key="profile.Id"
                                           :value="profile.Id">
                                           {{ profile.Name }} ({{ profile.UserLicense.Name }})
                                    </option>
                                </select>
                                </div>
                            </div>
                            <div class="slds-form-element__help" v-if="profiles.error">{{ profiles.error }}</div>
                        </div>
                    </div>
                    <div class="slds-form__item" role="listitem">
                        <div :class="`slds-form-element slds-form-element_horizontal slds-is-editing ${profiles.error.length > 0 ? 'slds-has-error' : ''}`">
                            <label class="slds-form-element__label" for="role-input">Role</label>
                            <div class="slds-form-element__icon">
                                <button class="slds-button slds-button_icon" @mouseenter="showRoleTooltip = true" @mouseleave="showRoleTooltip = false">
                                    <svg class="slds-button__icon">
                                        <use xlink:href="slds/assets/icons/utility-sprite/svg/symbols.svg#info"></use>
                                    </svg>
                                </button>
                                <div class="slds-popover slds-popover_tooltip slds-nubbin_bottom-left popover-help" role="tooltip" v-show="showRoleTooltip">
                                    <div class="slds-popover__body">The developer name is shown in brackets.</div>
                                </div>
                            </div>
                            <div class="slds-form-element__control">
                                <div class="slds-select_container">
                                <select class="slds-select" id="role-input" :disabled="roles.loading || roles.error.length > 0" v-model="form.roleId">
                                    <option v-if="roles.loading" value="loading">Loading...</option>

                                    <option v-else value="">None</option>
                                    <option v-for="role of roles.items"
                                           :key="role.Id"
                                           :value="role.Id">
                                           {{ role.Name }} ({{ role.DeveloperName }})
                                    </option>
                                </select>
                                </div>
                            </div>
                            <div class="slds-form-element__help" v-if="roles.error">{{ roles.error }}</div>
                        </div>
                    </div>
                </div>

                <!-- Alias field -->
                <div class="slds-form-element slds-m-bottom_x-small">
                    <label class="slds-form-element__label" for="alias-input">
                        <abbr class="slds-required" title="required">* </abbr>
                        Alias
                    </label>
                    <div class="slds-form-element__control">
                        <input type="text"
                               id="alias-input"
                               class="slds-input"
                               v-model.trim="form.alias" />
                    </div>
                </div>

                <!-- Username field -->
                <div class="slds-form-element slds-m-bottom_x-small">
                    <label class="slds-form-element__label" for="username-input">
                        <abbr class="slds-required" title="required">* </abbr>
                        Username
                    </label>
                    <div class="slds-form-element__icon">
                        <button class="slds-button slds-button_icon" @mouseenter="showUsernameTooltip = true" @mouseleave="showUsernameTooltip = false">
                            <svg class="slds-button__icon">
                                <use xlink:href="slds/assets/icons/utility-sprite/svg/symbols.svg#info"></use>
                            </svg>
                        </button>
                        <div class="slds-popover slds-popover_tooltip slds-nubbin_bottom-left popover-help" role="tooltip" v-show="showUsernameTooltip">
                            <div class="slds-popover__body">Parts of the username are randomly generated to ensure uniqueness.</div>
                        </div>
                    </div>
                    <div class="slds-form-element__control">
                        <input type="text"
                               id="username-input"
                               class="slds-input"
                               v-model.trim="form.username" />
                    </div>
                </div>

                <!-- Nickname field -->
                <div class="slds-form-element slds-m-bottom_x-small">
                    <label class="slds-form-element__label" for="nickname-input">
                        <abbr class="slds-required" title="required">* </abbr>
                        Nickname
                    </label>
                    <div class="slds-form-element__control">
                        <input type="text"
                               id="nickname-input"
                               class="slds-input"
                               v-model.trim="form.nickname" />
                    </div>
                </div>

                <fieldset class="slds-form-element slds-form-element_stacked" v-if="mode === 'clone'">
                    <legend class="slds-form-element__legend slds-form-element__label">Cloning Options</legend>
                    <div class="slds-form-element__control">
                        <div class="slds-checkbox">
                            <input type="checkbox"
                                   id="permission-set-assignments-checkbox"
                                   v-model="form.clonePermissionSetAssignments"
                                  @change="onClonePermissionSetAssignmentsChanged" />
                            <label class="slds-checkbox__label" for="permission-set-assignments-checkbox">
                                <span class="slds-checkbox_faux"></span>
                                <span class="slds-form-element__label">Permission Set Assignments</span>
                            </label>
                        </div>

                        <div class="slds-checkbox">
                            <input type="checkbox"
                                   id="public-group-memberships-checkbox"
                                   v-model="form.clonePublicGroupMemberships" />
                            <label class="slds-checkbox__label" for="public-group-memberships-checkbox">
                                <span class="slds-checkbox_faux"></span>
                                <span class="slds-form-element__label">Public Group Memberships</span>
                            </label>
                        </div>

                        <div class="slds-checkbox">
                            <input type="checkbox"
                                   id="queue-memberships-checkbox"
                                   v-model="form.cloneQueueMemberships" />
                            <label class="slds-checkbox__label" for="queue-memberships-checkbox">
                                <span class="slds-checkbox_faux"></span>
                                <span class="slds-form-element__label">Queue Memberships</span>
                            </label>
                        </div>

                        <div class="slds-checkbox">
                            <input type="checkbox"
                                   id="activate-user-checkbox"
                                   v-model="form.activateUser"
                                  @change="onActivateUserChanged" />
                            <label class="slds-checkbox__label" for="activate-user-checkbox">
                                <span class="slds-checkbox_faux"></span>
                                <span class="slds-form-element__label">Activate User</span>
                            </label>
                        </div>
                    </div>
                </fieldset>

                <fieldset class="slds-form-element slds-form-element_stacked">
                    <div class="slds-form-element__control">
                        <div class="slds-checkbox">
                            <input type="checkbox"
                                   id="generate-password-checkbox"
                                   v-model="form.resetPassword"
                                  @change="onResetPasswordChanged" />
                            <label class="slds-checkbox__label" for="generate-password-checkbox">
                                <span class="slds-checkbox_faux"></span>
                                <span class="slds-form-element__label">Reset password and notify user immediately</span>
                            </label>
                        </div>
                    </div>
                </fieldset>
            </div>
        </div>

        <PopoutCardFooter />
    </article>

    <QuickCreateUserSettingsModal ref="settingsModal" />
    <UserSelectModal ref="userSelectModal" immediate-select />

    <FullscreenOverlay :visible="overlay.visible" :type="overlay.type">
        <template v-slot:title>
            <span class="overlay-user-link" @click="onOpenUser" title="Open User detail page in a new tab.">Open User</span>
        </template>

        <template v-if="overlay.actionResults.length > 0" v-slot:body>
            <article class="slds-card">
                <!-- <div class="slds-card__header">
                    <h2 class="slds-card__header-title">Results</h2>
                </div> -->
                <div class="slds-card__body slds-card__body_inner">
                    <LightningTableLite :records="overlay.actionResults"
                                        :columns="overlay.actionResultsTableColumns" />
                </div>
            </article>
        </template>
    </FullscreenOverlay>
</template>

<style scoped>
.overlay-user-link {
    text-decoration: underline;
    cursor: pointer;
}
</style>