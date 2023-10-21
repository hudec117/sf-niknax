<script setup lang="ts">
import { onMounted, ref } from 'vue';

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

const overlay = ref<InstanceType<typeof FullscreenOverlay> | null>(null);
const settingsModal = ref<InstanceType<typeof QuickCreateUserSettingsModal> | null>(null);

let userService: SalesforceUserService;
let toolingService: SalesforceToolingService;

const title = ref('');
const error = ref('');

const form = ref(new UserCreateForm());

const loading = ref(true);
const creating = ref(false);

const showUsernameTooltip = ref(false);

const settings = ref(new UserQuickCreateSettings());

const profiles = ref<Array<Profile>>([]);
const roles = ref<Array<Role>>([]);

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

    // Load profiles/roles
    await Promise.all([loadProfiles(), loadRoles()]);

    loading.value = false;
}

async function loadProfiles() {
    form.value.profileId = 'loading';

    const result = await userService.query('SELECT Id, Name, UserlicenseId, UserLicense.Name FROM Profile');
    if (!result.success) {
        // TODO: handle
        return;
    }

    profiles.value = (result.data as Array<any>).map(record => new Profile(record.Id, record.Name, record.UserLicenseId, record.UserLicense.Name));
    form.value.profileId = profiles.value.filter(profile => profile.name === 'System Administrator')[0].id;
}

async function loadRoles() {
    form.value.roleId = 'loading';

    const result = await userService.query('SELECT Id, Name FROM UserRole');
    if (!result.success) {
        // TODO: handle
        return;
    }

    roles.value = (result.data as Array<any>).map(record => new Role(record.Id, record.Name));
    form.value.roleId = '';
}

async function onEmailEntered() {
    if (!(form.value.emailValid = userService.isValidEmail(form.value.email))) {
        return;
    }

    const emailUsername = form.value.email.substring(0, form.value.email.indexOf('@'));

    const nameComponents = emailUsername.split('.');
    if (settings.value.getFirstLastNameFromEmail && nameComponents.length > 1) {
        let firstName = nameComponents[0];
        let lastName = nameComponents[nameComponents.length - 1];

        firstName = firstName[0].toUpperCase() + firstName.slice(1);
        lastName = lastName[0].toUpperCase() + lastName.slice(1);

        form.value.firstName = firstName;
        form.value.lastName = lastName;
    } else {
        form.value.firstName = '';
        form.value.lastName = emailUsername;
    }

    form.value.alias = userService.generateAlias(form.value.firstName, form.value.lastName);
    form.value.username = userService.generateUsername(emailUsername, settings.value.usernameDomain);
    form.value.nickname = userService.generateNickname();
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

    try {
        const org = await userService.getOrganisation();

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
            error.value = `Failed to create the user. ${userCreateResult.error}`;
            return;
        }

        if (form.value.resetPassword) {
            const resetPasswordResult = await toolingService.executeAnonymous(`System.resetPassword('${userCreateResult.data.id}', true);`);
            if (!resetPasswordResult.success) {
                error.value = `Failed to reset the password. ${resetPasswordResult.error}`;
                return;
            }
        }

        // Show overlay
        const message = form.value.resetPassword ? 'User created and password reset sent!' : 'User created!';
        await overlay.value?.show(message, 2000);

        // Close window
        const currentPopup = await chrome.windows.getCurrent();
        await chrome.windows.remove(currentPopup.id!);
    } finally {
        creating.value = false;
    }
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

                        <!-- Save & Close button -->
                        <button class="slds-button slds-button_brand"
                               @click="onCreateAndCloseClick"
                               :disabled="loading || creating">
                            {{ creating ? 'Creating...' : 'Create & Close' }}
                        </button>

                        <!-- Error popover -->
                        <section id="save-popover" class="slds-popover slds-popover_error slds-nubbin_top-right slds-is-absolute" role="dialog" v-if="error">
                            <button class="slds-button slds-button_icon slds-button_icon-small slds-float_right slds-popover__close slds-button_icon-inverse slds-m-top_x-small slds-m-right_small" title="Close" @click="error = ''">
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
                                <p>{{ error }}</p>
                            </div>
                        </section>
                    </div>
                </header>
            </div>
        <div class="slds-card__body slds-card__body_inner">
            <p class="slds-m-bottom_x-small">Enter an email address and the rest of the form will auto-populate.</p>

            <div class="slds-form slds-m-top_x-small" role="list">

                <!-- Email field -->
                <div :class="`slds-form-element slds-m-bottom_x-small ${form.emailValid ? '' : 'slds-has-error'}`">
                    <label class="slds-form-element__label" for="email-input">
                        <abbr class="slds-required" title="required">* </abbr>
                        Email
                    </label>
                    <div class="slds-form-element__control">
                        <input type="text"
                               id="email-input"
                               class="slds-input"
                               v-model="form.email"
                               @keyup="onEmailEntered"
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
                                <input type="text" id="first-name-input" class="slds-input" v-model="form.firstName" />
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
                                <input type="text" id="last-name-input" class="slds-input" v-model="form.lastName" required />
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Profile/Role fields -->
                <div class="slds-form__row">
                    <div class="slds-form__item" role="listitem">
                        <div class="slds-form-element slds-form-element_horizontal slds-is-editing">
                            <label class="slds-form-element__label" for="profile-input">
                                <abbr class="slds-required" title="required">* </abbr>
                                Profile
                            </label>
                            <div class="slds-form-element__control">
                                <div class="slds-select_container">
                                <select id="profile-input" class="slds-select" :disabled="profiles.length === 0" v-model="form.profileId">
                                    <option v-if="profiles.length === 0" value="loading">Loading...</option>
                                    <option v-for="profile of profiles"
                                           :key="profile.id"
                                           :value="profile.id">
                                           {{ profile.name }}
                                    </option>
                                </select>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="slds-form__item" role="listitem">
                        <div class="slds-form-element slds-form-element_horizontal slds-is-editing">
                            <label class="slds-form-element__label" for="role-input">Role</label>
                            <div class="slds-form-element__control">
                                <div class="slds-select_container">
                                <select class="slds-select" id="role-input" :disabled="profiles.length === 0" v-model="form.roleId">
                                    <option value="">None</option>
                                    <option v-if="roles.length === 0" value="loading">Loading...</option>
                                    <option v-for="role of roles"
                                           :key="role.id"
                                           :value="role.id">
                                           {{ role.name }}
                                    </option>
                                </select>
                                </div>
                            </div>
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
                        <input type="text" id="alias-input" class="slds-input" v-model="form.alias" required />
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
                        <input type="text" id="username-input" class="slds-input" v-model="form.username" required />
                    </div>
                </div>

                <!-- Nickname field -->
                <div class="slds-form-element slds-m-bottom_x-small">
                    <label class="slds-form-element__label" for="nickname-input">
                        <abbr class="slds-required" title="required">* </abbr>
                        Nickname
                    </label>
                    <div class="slds-form-element__control">
                        <input type="text" id="nickname-input" class="slds-input" v-model="form.nickname" required />
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
    <FullscreenOverlay ref="overlay" />
</template>

<style scoped>
#save-popover {
    left: 200px;
    top: 54px;
}
</style>