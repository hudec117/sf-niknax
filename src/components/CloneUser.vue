<script setup lang="ts">
import { onMounted, ref } from 'vue';

import PopoutCardFooter from './PopoutCardFooter.vue';
import FullscreenOverlay from '@/components/slds/FullscreenOverlay.vue';
import SearchLookup from './slds/SearchLookup.vue';
import SalesforceUserService from '@/services/salesforce-user-service';
import Context from '@/models/context';
import UserCloneForm from '@/models/UserCloneForm';
import Profile from '@/models/Profile';
import Role from '@/models/Role';
import type User from '@/models/User';
import SearchLookupItem from './slds/SearchLookupItem';
import SalesforceRESTService from '@/services/salesforce-rest-service';

const props = defineProps<{
    context: Context
}>();

let userService: SalesforceUserService;
let restService: SalesforceRESTService;

const stage = ref<'select-user' | 'clone-user'>('select-user');

const cloneTargetUserId = ref<string | undefined>();

const form = ref(new UserCloneForm());

const loading = ref(true);
const cloning = ref(false);
const overlay = ref({
    visible: false,
    type: 'success',
    passwordResetSuccessful: true,
    passwordResetError: ''
});

const showUsernameTooltip = ref(false);
const showRoleTooltip = ref(false);

const profiles = ref({
    loading: true,
    items: new Array<Profile>(),
    error: ''
});

const roles = ref({
    loading: true,
    items: new Array<Role>(),
    error: ''
});

onMounted(() => {
    // Initialise Salesforce services
    userService = new SalesforceUserService(props.context.serverHost, props.context.sessionId);
    restService = new SalesforceRESTService(props.context.serverHost, props.context.sessionId);

    loadData();
});

async function loadData() {
    // if (!props.context.userId) {
    //     // TODO: handle
    //     return;
    // }

    // const getUserResult = await userService.get('User', props.context.userId);
    // if (!getUserResult.success) {
    //     // TODO: handle
    //     return;
    // }

    // originalUser.value = getUserResult.data as User;

    document.title = `Salesforce Niknax: Clone User`;

    // Load profiles/roles
    await Promise.all([loadProfiles(), loadRoles()]);

    loading.value = false;
}

async function loadProfiles() {
    form.value.profileId = 'loading';
    profiles.value.loading = true;

    try {
        const result = await userService.query('SELECT Id, Name, UserLicenseId, UserLicense.Name FROM Profile');
        if (!result.success) {
            profiles.value.error = result.error as string;
            return;
        }

        profiles.value.items = (result.data as Array<any>).map(record => new Profile(record.Id, record.Name, record.UserLicenseId, record.UserLicense.Name));

        // TODO: default to clone user value?
    } finally {
        profiles.value.loading = false;
    }
}

async function loadRoles() {
    form.value.roleId = 'loading';
    roles.value.loading = true;

    try {
        const result = await userService.query('SELECT Id, Name, DeveloperName FROM UserRole');
        if (!result.success) {
            roles.value.error = result.error as string;
            return;
        }

        roles.value.items = (result.data as Array<any>).map(record => new Role(record.Id, record.Name, record.DeveloperName));

        // TODO: default to clone user value?
    } finally {
        roles.value.loading = false;
    }
}

async function doUserSearch(value: string): Promise<Array<SearchLookupItem>> {
    const result = await restService.query(`SELECT Id, FirstName, LastName, Username, Email FROM User WHERE Name LIKE '%${value}%' OR Username LIKE '%${value}%' OR Email LIKE '%${value}%'`);
    if (!result.success) {
        // TODO: handle
        return [];
    }

    return (result.data as Array<any>).map(record => {
        const user = record as User;

        let fullName = user.LastName;
        if (user.FirstName) {
            fullName = user.FirstName + ' ' + fullName;
        }

        const sublabel = `${user.Email} • ${user.Username}`;

        return new SearchLookupItem(user.Id, fullName, sublabel);
    });
}

function onUserSearchSelected(item: SearchLookupItem) {
    cloneTargetUserId.value = item.value;

    stage.value = 'clone-user';
    window.resizeTo(627, 757);
}

function onUserSearchUnselected() {
    cloneTargetUserId.value = undefined;
}

// function onLastNameUnfocused() {
//     const alias = form.value.alias.trim();
//     const firstName = form.value.firstName.trim();
//     const lastName = form.value.lastName.trim();

//     if (alias.length === 0 && lastName.length > 0) {
//         form.value.alias = userService.generateAlias(firstName, lastName);
//     }
// }

// function onEmailUnfocused() {
//     const email = form.value.email.trim();

//     if (email.length > 0) {
//         form.value.username = email;
//     }
// }

// function onUsernameFocusChange() {
//     const username = form.value.username.trim();
//     const nickname = form.value.nickname.trim();

//     if (username.length > 0 && nickname.length === 0) {
//         form.value.nickname = userService.generateNickname();
//     }
// }

async function onCloneAndCloseClick() {
    cloning.value = true;

    // const userCreateResult = await restService.create('User', {
    //     LastName: form.value.lastName,
    //     Email: form.value.email,
    //     Alias: form.value.alias,
    //     Username: form.value.username,
    //     CommunityNickname: form.value.nickname,
    //     LocaleSidKey: originalUser.LocaleSidKey,
    //     TimeZoneSidKey: originalUser.TimeZoneSidKey,
    //     ProfileID: originalUser.ProfileID,
    //     LanguageLocaleKey: originalUser.LanguageLocaleKey,
    //     EmailEncodingKey: originalUser.EmailEncodingKey
    // });
    // if (!userCreateResult.success) {
    //     // TODO: handle
    //     return;
    // }

    // if (form.value.resetPassword) {
    //     const resetPasswordResult = await toolingService.executeAnonymous(`System.resetPassword('0058d0000085kN6', true);`);
    //     if (!resetPasswordResult.success) {
    //         // TODO: handle
    //         return;
    //     }
    // }

    cloning.value = false;

    // const currentPopup = await chrome.windows.getCurrent();
    // await chrome.windows.remove(currentPopup.id!);
}

async function onOpenUser() {
    // const userDetailUrl = `https://${props.context.serverHost}/lightning/setup/ManageUsers/page?address=/${createdUserId}?noredirect=1&isUserEntityOverride=1`;
    // await chrome.tabs.create({
    //     url: userDetailUrl
    // });

    await closeWindow();
}

async function closeWindow() {
    const currentPopup = await chrome.windows.getCurrent();
    await chrome.windows.remove(currentPopup.id!);
}
</script>

<template>
    <article class="slds-card slds-size_full">
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
                        <template v-if="stage === 'select-user'">Select a User to Clone</template>
                        <template v-else-if="stage === 'clone-user'">Clone User</template>
                    </h2>
                </div>
                <div class="slds-no-flex" v-if="stage === 'clone-user'">
                    <button class="slds-button slds-button_neutral">
                        Back
                    </button>

                    <button class="slds-button slds-button_brand"
                           @click="onCloneAndCloseClick"
                           :disabled="loading || cloning">
                        {{ cloning ? 'Cloning...' : 'Clone & Close' }}
                    </button>
                </div>
            </header>
        </div>
        <div class="slds-card__body slds-card__body_inner">
            <div class="slds-form slds-m-vertical_medium" role="list" v-if="stage === 'select-user'">
                <SearchLookup placeholder="Search by name, username or email"
                              empty-list-label="No users found"
                             :do-search="doUserSearch"
                             @selected="onUserSearchSelected"
                             @unselected="onUserSearchUnselected" />
            </div>

            <div class="slds-form" role="list" v-else-if="stage === 'clone-user'">
                <!-- Email field -->
                <div class="slds-form-element slds-m-bottom_x-small">
                    <label class="slds-form-element__label" for="email-input">
                        <abbr class="slds-required" title="required">* </abbr>
                        Email
                    </label>
                    <div class="slds-form-element__control">
                        <input type="text"
                               id="email-input"
                               class="slds-input"
                               v-model.trim="form.email"
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
                                <input type="text" id="first-name-input" class="slds-input" v-model.trim="form.firstName" />
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
                                <input type="text" id="last-name-input" class="slds-input" v-model.trim="form.lastName" />
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
                            <div class="slds-form-element__control">
                                <div class="slds-select_container">
                                <select id="profile-input" class="slds-select" :disabled="profiles.loading || profiles.error.length > 0" v-model="form.profileId">
                                    <option v-if="profiles.loading" value="loading">Loading...</option>

                                    <option v-for="profile of profiles.items"
                                           :key="profile.id"
                                           :value="profile.id">
                                           {{ profile.name }}
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
                                           :key="role.id"
                                           :value="role.id">
                                           {{ role.name }} ({{ role.developerName }})
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
                        <input type="text" id="alias-input" class="slds-input" v-model.trim="form.alias" />
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
                        <input type="text" id="username-input" class="slds-input" v-model.trim="form.username" />
                    </div>
                </div>

                <!-- Nickname field -->
                <div class="slds-form-element slds-m-bottom_x-small">
                    <label class="slds-form-element__label" for="nickname-input">
                        <abbr class="slds-required" title="required">* </abbr>
                        Nickname
                    </label>
                    <div class="slds-form-element__control">
                        <input type="text" id="nickname-input" class="slds-input" v-model.trim="form.nickname" />
                    </div>
                </div>

                <!-- Federation Identifier field -->
                <div class="slds-form-element slds-m-bottom_x-small">
                    <label class="slds-form-element__label" for="federation-identifier-input">
                        Federation Identifier
                    </label>
                    <div class="slds-form-element__control">
                        <input type="text" id="federation-identifier-input" class="slds-input" v-model="form.federationIdentifier" />
                    </div>
                </div>

                <fieldset class="slds-form-element slds-form-element_stacked">
                    <legend class="slds-form-element__legend slds-form-element__label">Advanced</legend>
                    <div class="slds-form-element__control">
                        <div class="slds-checkbox">
                            <input type="checkbox" name="advanced-group" id="permission-set-assignments-checkbox" v-model="form.clonePermissionSetAssignments" />
                            <label class="slds-checkbox__label" for="permission-set-assignments-checkbox">
                                <span class="slds-checkbox_faux"></span>
                                <span class="slds-form-element__label">Permission Set Assignments</span>
                            </label>
                        </div>

                        <div class="slds-checkbox">
                            <input type="checkbox" name="advanced-group" id="public-group-memberships-checkbox" v-model="form.clonePublicGroupMemberships" />
                            <label class="slds-checkbox__label" for="public-group-memberships-checkbox">
                                <span class="slds-checkbox_faux"></span>
                                <span class="slds-form-element__label">Public Group Memberships</span>
                            </label>
                        </div>

                        <div class="slds-checkbox">
                            <input type="checkbox" name="advanced-group" id="queue-memberships-checkbox" v-model="form.cloneQueueMemberships" />
                            <label class="slds-checkbox__label" for="queue-memberships-checkbox">
                                <span class="slds-checkbox_faux"></span>
                                <span class="slds-form-element__label">Queue Memberships</span>
                            </label>
                        </div>

                        <div class="slds-checkbox">
                            <input type="checkbox" name="advanced-group" id="permission-set-license-assignments-checkbox" v-model="form.clonePermissionSetLicenseAssignments" />
                            <label class="slds-checkbox__label" for="permission-set-license-assignments-checkbox">
                                <span class="slds-checkbox_faux"></span>
                                <span class="slds-form-element__label">Permission Set License Assignments</span>
                            </label>
                        </div>
                    </div>
                </fieldset>

                <fieldset class="slds-form-element slds-form-element_stacked">
                    <div class="slds-form-element__control">
                        <div class="slds-checkbox">
                            <input type="checkbox" name="advanced-group" id="generate-password-checkbox" v-model="form.resetPassword" />
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

    <FullscreenOverlay :visible="overlay.visible" :type="overlay.type">
        <span class="slds-icon_container slds-m-bottom_x-small">
            <svg class="slds-icon overlay-check-icon">
                <use v-if="overlay.type === 'success'" xlink:href="slds/assets/icons/utility-sprite/svg/symbols.svg#success"></use>
                <use v-else-if="overlay.type === 'warning'" xlink:href="slds/assets/icons/utility-sprite/svg/symbols.svg#warning"></use>
            </svg>
        </span>

        <div class="slds-text-heading_medium slds-m-bottom_x-small">
            <span class="overlay-user-link" @click="onOpenUser" title="Open User detail page in a new tab.">User</span>
            <template v-if="overlay.passwordResetSuccessful">
                cloned!
            </template>
            <template v-else>
                cloned but...
            </template>
        </div>
        <div class="slds-text-heading_small" v-if="!overlay.passwordResetSuccessful">{{ overlay.passwordResetError }}</div>
    </FullscreenOverlay>
</template>