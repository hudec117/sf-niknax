window.onload = function () {
    const QUICK_CREATE_USER_GLOBAL_ACTION_HTML = `
        <button id="sf-niknax-quick-create-user-button" type="button" class="slds-button slds-button slds-button_icon slds-button_icon slds-button_icon-container slds-button_icon-small slds-global-actions__item-action forceHeaderButton" title="Salesforce Niknax: Quick Create User">
            <lightning-icon icon-name="utility:adduser" class="slds-icon-utility-adduser slds-global-header__icon slds-button__icon slds-icon_container forceIcon">
                <lightning-primitive-icon>
                    <svg class="slds-icon slds-icon_xx-small" focusable="false" viewBox="0 0 52 52" part="icon">
                    <g>
                        <path fill="#2574a9" d="M21.9,37c0-2.7,0.9-5.8,2.3-8.2c1.7-3,3.6-4.2,5.1-6.4c2.5-3.7,3-9,1.4-13c-1.6-4.1-5.4-6.5-9.8-6.4
                            s-8,2.8-9.4,6.9c-1.6,4.5-0.9,9.9,2.7,13.3c1.5,1.4,2.9,3.6,2.1,5.7c-0.7,2-3.1,2.9-4.8,3.7c-3.9,1.7-8.6,4.1-9.4,8.7
                            C1.3,45.1,3.9,49,8,49h17c0.8,0,1.3-1,0.8-1.6C23.3,44.5,21.9,40.8,21.9,37z"/>
                        <path fill="#2574a9" d="M37.9,25c-6.6,0-12,5.4-12,12s5.4,12,12,12s12-5.4,12-12S44.5,25,37.9,25z M44,38c0,0.6-0.5,1-1.1,1H40v3
                            c0,0.6-0.5,1-1.1,1h-2c-0.6,0-0.9-0.4-0.9-1v-3h-3.1c-0.6,0-0.9-0.4-0.9-1v-2c0-0.6,0.3-1,0.9-1H36v-3c0-0.6,0.3-1,0.9-1h2
                            c0.6,0,1.1,0.4,1.1,1v3h2.9c0.6,0,1.1,0.4,1.1,1V38z"/>
                    </g>
                    </svg>
                </lightning-primitive-icon>
            </lightning-icon>
        </button>
    `;

    const CLONE_USER_GLOBAL_ACTION_HTML = `
        <button id="sf-niknax-clone-user-button" type="button" class="slds-button slds-button slds-button_icon slds-button_icon slds-button_icon-container slds-button_icon-small slds-global-actions__item-action forceHeaderButton" title="Salesforce Niknax: Clone any User">
            <lightning-icon icon-name="utility:adduser" class="slds-icon-utility-adduser slds-global-header__icon slds-button__icon slds-icon_container forceIcon">
                <lightning-primitive-icon>
                    <svg class="slds-icon slds-icon_xx-small" focusable="false" viewBox="0 0 52 52" part="icon">
                        <g id="Layer">
                            <path fill="#2574a9" d="m20.8 39.7c-2.5-1-2.9-1.9-2.9-2.9 0-0.9 0.7-1.9 1.6-2.6 1.4-1.3 2.3-3.1 2.3-5.2 0-3.9-2.6-7.2-7.2-7.2-4.5 0-7.1 3.3-7.1 7.2 0 2.1 0.8 3.9 2.3 5.2 0.8 0.7 1.5 1.7 1.5 2.6 0 1-0.3 2-2.9 2.9-3.8 1.5-7.4 3.2-7.4 6.4v0.2 0.7c0 1.7 1.3 3 3.1 3h20.6c1.7 0 3.1-1.3 3.1-3v-0.7-0.3c0-3.1-3.3-4.8-7-6.3z"/>
                            <path fill="#2574a9" d="m44.5 19.9c-2.5-1-2.9-1.9-2.9-2.8 0-1 0.7-1.9 1.6-2.6 1.4-1.3 2.2-3 2.2-5.1 0-3.8-2.5-7.1-7-7.1-4.5 0-7 3.3-7 7.1 0 2.1 0.8 3.8 2.3 5.1 0.8 0.7 1.5 1.6 1.5 2.6 0 0.9-0.4 1.9-2.9 2.8-3.7 1.5-7.3 3.2-7.3 6.3v0.2 0.7c0 1.6 1.3 2.9 3 2.9h20.3c1.7 0 3-1.3 3-2.9v-0.7-0.3c0-3-3.2-4.7-6.8-6.2z"/>
                            <path fill="#2574a9" d="m25 6.5l0.1-4.3 5.2 6.7-5.3 5.9-0.1-3.7c0 0-3.4 0-6.4 2.1-2.2 1.6-2.5 6.8-2.5 6.8h-4c0 0-2.1-4.8 3.7-10.4 3.5-3.5 9.3-3.1 9.3-3.1z"/>
                        </g>
                    </svg>
                </lightning-primitive-icon>
            </lightning-icon>
        </button>
    `;

    // The inject is unreliable due to LX's long loading and so different pages (e.g. normal vs setup)
    // would load differently requiring an interval timer to wait to find the right element to inject next to.
    // We wait for up to a minute to allow for super slow loading times.
    const MAX_TRIES = 240;
    const INTERVAL = 250;
    let tries = 0;
    let intervalTimer;

    intervalTimer = setInterval(() => {
        const helpListItemDiv = document.querySelector('li.slds-global-actions__item div.oneHelpAndTrainingExperience');
        if (helpListItemDiv) {
            clearInterval(intervalTimer);
            injectCloneUserButton(helpListItemDiv);
            injectQuickCreateUserButton(helpListItemDiv);
        } else {
            tries++;
            if (tries >= MAX_TRIES) {
                clearInterval(intervalTimer);
                console.warn('sf-niknax: failed to inject quick create user button.');
            }
        }
    }, INTERVAL);

    function injectQuickCreateUserButton(helpListItemDiv) {
        const quickCreateUserListItem = document.createElement('li');
        quickCreateUserListItem.className = 'slds-global-actions__item slds-dropdown-trigger slds-dropdown-trigger--click';
        quickCreateUserListItem.innerHTML = QUICK_CREATE_USER_GLOBAL_ACTION_HTML;

        // Go up to the "li" and insert ours after it.
        helpListItemDiv.parentNode.after(quickCreateUserListItem);

        const quickCreateUserButton = document.getElementById('sf-niknax-quick-create-user-button');
        quickCreateUserButton.addEventListener('click', function() {
            chrome.runtime.sendMessage({ operation: 'open-sf-niknax', page: 'quick-create-user' });
        });
    }

    function injectCloneUserButton(helpListItemDiv) {
        const cloneUserListItem = document.createElement('li');
        cloneUserListItem.className = 'slds-global-actions__item slds-dropdown-trigger slds-dropdown-trigger--click';
        cloneUserListItem.innerHTML = CLONE_USER_GLOBAL_ACTION_HTML;

        // Go up to the "li" and insert ours after it.
        helpListItemDiv.parentNode.after(cloneUserListItem);

        const cloneUserButton = document.getElementById('sf-niknax-clone-user-button');
        cloneUserButton.addEventListener('click', function() {
            chrome.runtime.sendMessage({ operation: 'open-sf-niknax', page: 'clone-user' });
        });
    }
}