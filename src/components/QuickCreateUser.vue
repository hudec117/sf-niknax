<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

import PopoutCardFooter from './PopoutCardFooter.vue';
import FullscreenOverlay from '@/components/slds/FullscreenOverlay.vue';
import SalesforceToolingService from '@/services/salesforce-tooling-service';
import Context from '@/models/context';
import QuickCreateUserSettingsModal from '@/components/modals/quick-create-user-settings/QuickCreateUserSettingsModal.vue';
import UserCreateForm from '@/models/UserCreateForm';
import SalesforceUserService from '@/services/salesforce-user-service';
import Profile from '@/models/Profile';
import Role from '@/models/Role';
import UserQuickCreateSettings from '@/models/UserQuickCreateSettings';

const SETTINGS_KEY = 'quick-create-user-settings';

const props = defineProps<{
    context: Context
}>();

const settingsModal = ref<InstanceType<typeof QuickCreateUserSettingsModal> | null>(null);

let userService: SalesforceUserService;
let toolingService: SalesforceToolingService;
let createdUserId = '';

const title = ref('');
const createAndCloseError = ref('');

const form = ref(new UserCreateForm());

const loading = ref(true);
const creating = ref(false);
const overlay = ref({
    visible: false,
    type: 'success',
    passwordResetSuccessful: true,
    passwordResetError: ''
});
const showUsernameTooltip = ref(false);
const showRoleTooltip = ref(false);

const isValidEmail = ref(false);

const settings = ref(new UserQuickCreateSettings());

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

const isValidForm = computed(() => {
    return userService.isValidEmail(form.value.email)
        && userService.isValidFirstName(form.value.firstName)
        && userService.isValidLastName(form.value.lastName)
        && userService.isValidAlias(form.value.alias)
        && userService.isValidEmail(form.value.username)
        && userService.isValidNickname(form.value.nickname);
});

onMounted(() => {
    // Initialise Salesforce services
    userService = new SalesforceUserService(props.context.serverHost, props.context.sessionId);
    toolingService = new SalesforceToolingService(props.context.serverHost, props.context.sessionId);

    loadData();
});

async function loadData() {
    title.value = `Quick Create User`;
    document.title = `Salesforce Niknax: ${title.value}`;

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
        const result = await userService.query('SELECT Id, Name, UserLicenseId, UserLicense.Name FROM Profile');
        if (!result.success) {
            profiles.value.error = result.error as string;
            return;
        }

        profiles.value.items = (result.data as Array<any>).map(record => new Profile(record.Id, record.Name, record.UserLicenseId, record.UserLicense.Name));

        // Attempt to find the default profile as defined in the settings, falling back to System Administrator if not found.
        const matchedDefaultProfiles = profiles.value.items.filter(profile => profile.name === settings.value.defaultProfile);
        if (matchedDefaultProfiles.length > 0) {
            form.value.profileId = matchedDefaultProfiles[0].id;
        } else {
            form.value.profileId = profiles.value.items.filter(profile => profile.name === 'System Administrator')[0].id;
        }
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

        // Attempt to find the default role as defined in the settings, falling back to None if not found.
        const matchedDefaultRoles = roles.value.items.filter(role => role.developerName === settings.value.defaultRole);
        if (matchedDefaultRoles.length > 0) {
            form.value.roleId = matchedDefaultRoles[0].id;
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

    const nameComponents = emailUsername.split('.');
    if (settings.value.extractFirstLastNameFromEmail && nameComponents.length > 1) {
        let firstName = nameComponents[0];
        let lastName = nameComponents[nameComponents.length - 1];

        firstName = firstName[0].toUpperCase() + firstName.slice(1);
        lastName = lastName[0].toUpperCase() + lastName.slice(1);

        if (!form.value.firstName) {
            form.value.firstName = firstName;
        }
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

async function onCreateAndCloseClick() {
    creating.value = true;
    createAndCloseError.value = '';

    try {
        const org = await userService.getOrganisation();

        // Create the user
        const userCreateResult = await userService.create('User', {
            FirstName: form.value.firstName,
            LastName: form.value.lastName,
            Email: form.value.email,
            Alias: form.value.alias,
            Username: form.value.username,
            CommunityNickname: form.value.nickname,
            LocaleSidKey: org.defaultLocaleSidKey,
            TimeZoneSidKey: org.timeZoneSidKey,
            ProfileId: form.value.profileId,
            UserRoleId: form.value.roleId,
            LanguageLocaleKey: org.languageLocaleKey,
            EmailEncodingKey: 'UTF-8'
        });
        if (!userCreateResult.success) {
            createAndCloseError.value = `Failed to create the user. ${userCreateResult.error}`;
            return;
        }

        createdUserId = userCreateResult.data.id;

        // Attempt to reset the password
        let allSuccessful = true;
        if (form.value.resetPassword) {
            const resetPasswordResult = await toolingService.executeAnonymous(`System.resetPassword('${createdUserId}', true);`);
            if (!resetPasswordResult.success) {
                overlay.value.type = 'warning';
                overlay.value.passwordResetSuccessful = false;
                overlay.value.passwordResetError = `Failed to reset the password. ${resetPasswordResult.error}`;

                allSuccessful = false;
            }
        }

        // Only auto-cloes the window if the user creation and password reset (if chosen) has succedded.
        if (allSuccessful) {
            setTimeout(closeWindow, 3000);
        }

        // Show the overlay
        overlay.value.visible = true;
    } finally {
        creating.value = false;
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
                        <span>{{ title }}</span>
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

                    <!-- Create & Close button -->
                    <button class="slds-button slds-button_brand"
                            @click="onCreateAndCloseClick"
                            :disabled="loading || creating || !isValidForm">
                        {{ creating ? 'Creating...' : 'Create & Close' }}
                    </button>

                    <!-- Error popover -->
                    <section id="create-popover" class="slds-popover slds-popover_error slds-nubbin_top-right slds-is-absolute" role="dialog" v-if="createAndCloseError">
                        <button class="slds-button slds-button_icon slds-button_icon-small slds-float_right slds-popover__close slds-button_icon-inverse slds-m-top_x-small slds-m-right_small" title="Close" @click="createAndCloseError = ''">
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
                            <p>{{ createAndCloseError }}</p>
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

                <fieldset class="slds-form-element">
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

    <QuickCreateUserSettingsModal ref="settingsModal" />

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
                created!
            </template>
            <template v-else>
                created but...
            </template>
        </div>
        <div class="slds-text-heading_small" v-if="!overlay.passwordResetSuccessful">{{ overlay.passwordResetError }}</div>
    </FullscreenOverlay>
</template>

<style scoped>
#create-popover {
    left: 200px;
    top: 55px;
}

.overlay-check-icon {
    fill: white;
}

.overlay-user-link {
    text-decoration: underline;
    cursor: pointer;
}
</style>