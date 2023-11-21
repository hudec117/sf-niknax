<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

import PopoutCardFooter from './PopoutCardFooter.vue';
import FullscreenOverlay from '@/components/slds/FullscreenOverlay.vue';
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
const createOverlay = ref({
    visible: false,
    type: 'success',
    passwordResetSuccessful: true,
    passwordResetError: ''
});
const cloneOverlay = ref({
    visible: false,
    type: 'success',
    passwordResetSuccessful: true,
    passwordResetError: '',
    cloneOperationResults: [],
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

    loading.value = false;
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

async function onEmailEntered() {
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
        const queryResult = await userService.query<User>(`SELECT Id, Username, ProfileId, UserRoleId FROM User WHERE Id = '${cloneTargetUserId}'`);
        if (!queryResult.success) {
            cloneButtonError.value = queryResult.error;
            return;
        }
        cloneTargetUser.value = queryResult.guardedData[0];
    
        // Resize window to accomodate visible checkboxes, change the title and mode.
        resizeTo(627, 701);
        document.title = `Salesforce Niknax: Clone ${cloneTargetUser.value.Username}`;
        mode.value = 'clone';
        primaryButtonText.value = 'Clone & Close';
    
        // Populate the Profile/Role picklists
        form.value.profileId = cloneTargetUser.value.ProfileId;
        form.value.roleId = cloneTargetUser.value.UserRoleId ?? '';
    } finally {
        loading.value = false;
    }
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

        const cloneUserResult = await userService.cloneUser(cloneTargetUser.value.Id, overridenFieldValues);
        if (!cloneUserResult.success) {
            primaryButtonError.value = `Failed to clone the user. ${cloneUserResult.error}`;
            return;
        }

        createdUserId = cloneUserResult.guardedData.Id;

        // Attempt to reset the password
        let allSuccessful = true;
        if (form.value.resetPassword) {
            const resetPasswordResult = await toolingService.executeAnonymous(`System.resetPassword('${createdUserId}', true);`);
            if (!resetPasswordResult.success) {
                cloneOverlay.value.type = 'warning';
                cloneOverlay.value.passwordResetSuccessful = false;
                cloneOverlay.value.passwordResetError = `Failed to reset the password. ${resetPasswordResult.error}`;

                allSuccessful = false;
            }
        }

        if (form.value.clonePermissionSetAssignments) {
            const clonePermSetAssignmentsResult = await userService.clonePermissionSetAssignments(cloneTargetUser.value.Id, createdUserId);
            if (!clonePermSetAssignmentsResult.success) {
                // TODO: handle
                allSuccessful = false;
            }
        }

        if (form.value.clonePublicGroupMemberships) {
            const cloneGroupMembershipsResult = await userService.cloneGroupMemberships(cloneTargetUser.value.Id, createdUserId, 'Regular');
            if (!cloneGroupMembershipsResult.success) {
                // TODO: handle
                allSuccessful = false;
            }
        }

        if (form.value.cloneQueueMemberships) {
            const cloneQueueMembershipsResult = await userService.cloneGroupMemberships(cloneTargetUser.value.Id, createdUserId, 'Queue');
            if (!cloneQueueMembershipsResult.success) {
                // TODO: handle
                allSuccessful = false;
            }
        }

        // Only auto-close the window if the entire cloning process is successful.
        if (allSuccessful) {
            setTimeout(closeWindow, 3000);
        }

        // Show the overlay
        cloneOverlay.value.visible = true;
    } finally {
        working.value = false;
        primaryButtonText.value = 'Clone & Close';
    }
}

async function onCreateAndCloseClick() {
    working.value = true;
    primaryButtonError.value = '';

    try {
        const getOrgResult = await userService.getOrganisation();
        if (!getOrgResult.success) {
            // TODO: handle
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
            primaryButtonError.value = `Failed to create the user. ${userCreateResult.error}`;
            return;
        }

        createdUserId = userCreateResult.guardedData;

        // Attempt to reset the password
        let allSuccessful = true;
        if (form.value.resetPassword) {
            const resetPasswordResult = await toolingService.executeAnonymous(`System.resetPassword('${createdUserId}', true);`);
            if (!resetPasswordResult.success) {
                createOverlay.value.type = 'warning';
                createOverlay.value.passwordResetSuccessful = false;
                createOverlay.value.passwordResetError = `Failed to reset the password. ${resetPasswordResult.error}`;

                allSuccessful = false;
            }
        }

        // Only auto-close the window if the entire process (including password reset if chosen) is successful.
        if (allSuccessful) {
            setTimeout(closeWindow, 3000);
        }

        createOverlay.value.visible = true;
    } finally {
        working.value = false;
    }
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
                    <!-- TODO: refactor -->
                    <section id="primary-button-popover" class="slds-popover slds-popover_error slds-nubbin_top-right slds-is-absolute" role="dialog" v-if="primaryButtonError">
                        <button class="slds-button slds-button_icon slds-button_icon-small slds-float_right slds-popover__close slds-button_icon-inverse slds-m-top_x-small slds-m-right_small" title="Close" @click="primaryButtonError = ''">
                            <svg class="slds-button__icon">
                                <use xlink:href="slds/assets/icons/utility-sprite/svg/symbols.svg#close"></use>
                            </svg>
                        </button>
                        <header class="slds-popover__header">
                            <div class="slds-media slds-media_center slds-has-flexi-truncate ">
                                <div class="slds-media__figure">
                                    <span class="slds-icon_container slds-icon-utility-error">
                                        <svg class="slds-icon slds-icon_x-small">
                                            <use xlink:href="slds/assets/icons/utility-sprite/svg/symbols.svg#error"></use>
                                        </svg>
                                    </span>
                                </div>
                                <div class="slds-media__body">
                                    <h2 class="slds-truncate slds-text-heading_medium">We hit a snag</h2>
                                </div>
                            </div>
                        </header>
                        <div class="slds-popover__body">
                            <p>{{ primaryButtonError }}</p>
                        </div>
                    </section>

                    <!-- Clone button popover -->
                    <!-- TODO: refactor -->
                    <section id="clone-button-popover" class="slds-popover slds-popover_error slds-nubbin_top-right slds-is-absolute" role="dialog" v-if="cloneButtonError">
                        <button class="slds-button slds-button_icon slds-button_icon-small slds-float_right slds-popover__close slds-button_icon-inverse slds-m-top_x-small slds-m-right_small" title="Close" @click="cloneButtonError = ''">
                            <svg class="slds-button__icon">
                                <use xlink:href="slds/assets/icons/utility-sprite/svg/symbols.svg#close"></use>
                            </svg>
                        </button>
                        <header class="slds-popover__header">
                            <div class="slds-media slds-media_center slds-has-flexi-truncate ">
                                <div class="slds-media__figure">
                                    <span class="slds-icon_container slds-icon-utility-error">
                                        <svg class="slds-icon slds-icon_x-small">
                                            <use xlink:href="slds/assets/icons/utility-sprite/svg/symbols.svg#error"></use>
                                        </svg>
                                    </span>
                                </div>
                                <div class="slds-media__body">
                                    <h2 class="slds-truncate slds-text-heading_medium">We hit a snag</h2>
                                </div>
                            </div>
                        </header>
                        <div class="slds-popover__body">
                            <p>{{ cloneButtonError }}</p>
                        </div>
                    </section>
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
                                   v-model="form.clonePermissionSetAssignments" />
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
                    </div>
                </fieldset>

                <fieldset class="slds-form-element slds-form-element_stacked">
                    <div class="slds-form-element__control">
                        <div class="slds-checkbox">
                            <input type="checkbox"
                                   id="generate-password-checkbox"
                                   v-model="form.resetPassword" />
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

    <!-- User Create overlay -->
    <FullscreenOverlay :visible="createOverlay.visible" :type="createOverlay.type">
        <template v-slot:title>
            <span class="overlay-user-link" @click="onOpenUser" title="Open User detail page in a new tab.">User</span>
            <template v-if="createOverlay.passwordResetSuccessful">
                created!
            </template>
            <template v-else>
                created but...
            </template>
        </template>

        <template v-slot:subtitle>
            {{ createOverlay.passwordResetError }}
        </template>
    </FullscreenOverlay>

    <!-- Clone overlay -->
    <FullscreenOverlay :visible="cloneOverlay.visible" :type="cloneOverlay.type">
        <template v-slot:title>
            <span class="overlay-user-link" @click="onOpenUser" title="Open User detail page in a new tab.">User</span>
            <template v-if="cloneOverlay.passwordResetSuccessful">
                cloned!
            </template>
            <template v-else>
                created but...
            </template>
        </template>
    </FullscreenOverlay>
</template>

<style scoped>
#primary-button-popover {
    right: 50px;
    top: 55px;
}

#clone-button-popover {
    right: 175px;
    top: 55px;
}

.overlay-user-link {
    text-decoration: underline;
    cursor: pointer;
}
</style>