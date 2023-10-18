<script setup lang="ts">
import { onMounted, ref } from 'vue';

import PopoutCardFooter from './PopoutCardFooter.vue';
import SalesforceRESTService from '@/services/salesforce-rest-service';
import SalesforceToolingService from '@/services/salesforce-tooling-service';
import Context from '@/models/context';
import UserCloneForm from '@/models/UserCloneForm';
import type User from '@/models/User';

const props = defineProps<{
    context: Context
}>();

let restService: SalesforceRESTService;
let toolingService: SalesforceToolingService;

const originalUser = ref<User>();

const title = ref('');

const form = ref(new UserCloneForm());

const loading = ref(true);
const cloning = ref(false);

onMounted(() => {
    // Initialise Salesforce services
    restService = new SalesforceRESTService(props.context.serverHost, props.context.sessionId);
    toolingService = new SalesforceToolingService(props.context.serverHost, props.context.sessionId);

    loadData();
});

async function loadData() {
    if (!props.context.userId) {
        // TODO: handle
        return;
    }

    const getUserResult = await restService.get('User', props.context.userId);
    if (!getUserResult.success) {
        // TODO: handle
        return;
    }

    originalUser.value = getUserResult.data as User;

    title.value = `Clone ${originalUser.value.Username}`;
    document.title = `Salesforce Niknax: ${title.value}`;

    loading.value = false;
}

function onLastNameUnfocused() {
    const alias = form.value.alias.trim();
    const firstName = form.value.firstName.trim();
    const lastName = form.value.lastName.trim();

    if (alias.length === 0 && lastName.length > 0) {
        let defaultAlias = '';
        if (firstName.length > 0) {
            defaultAlias += firstName[0].toLowerCase();
        }

        defaultAlias += lastName.substring(0, 4).toLowerCase();

        form.value.alias = defaultAlias;
    }
}

function onEmailUnfocused() {
    const email = form.value.email.trim();

    if (email.length > 0) {
        form.value.username = email;
    }
}

function onUsernameFocusChange() {
    const username = form.value.username.trim();
    const nickname = form.value.nickname.trim();

    if (username.length > 0 && nickname.length === 0) {
        let generatedNickname = 'User';

        for (let i = 0; i < 20; i++) {
            generatedNickname += Math.floor(Math.random() * 10).toString();
        }

        form.value.nickname = generatedNickname;
    }
}

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

    if (form.value.resetPassword) {
        const resetPasswordResult = await toolingService.executeAnonymous(`System.resetPassword('0058d0000085kN6', true);`);
        if (!resetPasswordResult.success) {
            // TODO: handle
            return;
        }
    }

    cloning.value = false;

    // const currentPopup = await chrome.windows.getCurrent();
    // await chrome.windows.remove(currentPopup.id!);
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
                        <span>{{ title }}</span>
                    </h2>
                </div>
                <div class="slds-no-flex">
                    <button class="slds-button slds-button_brand" @click="onCloneAndCloseClick"
                        :disabled="loading || cloning">
                        {{ cloning ? 'Cloning...' : 'Clone & Close' }}
                    </button>
                </div>
            </header>
        </div>
        <div class="slds-card__body slds-card__body_inner">
            <form class="slds-form" role="list">
                <div class="slds-form__row slds-p-horizontal_xx-small">
                    <div class="slds-form__item" role="listitem">
                        <div class="slds-form-element slds-form-element_horizontal slds-is-editing">
                            <label class="slds-form-element__label" for="first-name-input">First Name</label>
                            <div class="slds-form-element__control">
                                <input type="text" id="first-name-input" class="slds-input" v-model="form.firstName" autofocus />
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
                                <input type="text" id="last-name-input" class="slds-input" v-model="form.lastName" @focusout="onLastNameUnfocused" required />
                            </div>
                        </div>
                    </div>
                </div>

                <div class="slds-form-element slds-form-element_stacked">
                    <label class="slds-form-element__label" for="alias-input">
                        <abbr class="slds-required" title="required">* </abbr>
                        Alias
                    </label>
                    <div class="slds-form-element__control">
                        <input type="text" id="alias-input" class="slds-input" v-model="form.alias" required />
                    </div>
                </div>

                <div class="slds-form-element slds-form-element_stacked">
                    <label class="slds-form-element__label" for="email-input">
                        <abbr class="slds-required" title="required">* </abbr>
                        Email
                    </label>
                    <div class="slds-form-element__control">
                        <input type="text" id="email-input" class="slds-input" v-model="form.email" @focusout="onEmailUnfocused" required />
                    </div>
                </div>

                <div class="slds-form-element slds-form-element_stacked">
                    <label class="slds-form-element__label" for="username-input">
                        <abbr class="slds-required" title="required">* </abbr>
                        Username
                    </label>
                    <div class="slds-form-element__control">
                        <input type="text"
                               id="username-input"
                               class="slds-input"
                               v-model="form.username"
                              @focusin="onUsernameFocusChange"
                              @focusout="onUsernameFocusChange"
                               required />
                    </div>
                </div>

                <div class="slds-form-element slds-form-element_stacked">
                    <label class="slds-form-element__label" for="nickname-input">
                        <abbr class="slds-required" title="required">* </abbr>
                        Nickname
                    </label>
                    <div class="slds-form-element__control">
                        <input type="text" id="nickname-input" class="slds-input" v-model="form.nickname" required />
                    </div>
                </div>

                <div class="slds-form-element slds-form-element_stacked">
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
            </form>
        </div>
        <PopoutCardFooter />
    </article>
</template>