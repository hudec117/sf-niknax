window.addEventListener('load', function() {
    const safeChromeRuntime = chrome.runtime;

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

    const SETUP_PLUS_GLOBAL_ACTION_HTML = `
        <button id="sf-niknax-setup-plus-button" type="button" class="slds-button slds-button slds-button_icon slds-button_icon slds-button_icon-container slds-button_icon-small slds-global-actions__item-action forceHeaderButton" title="Salesforce Niknax: Setup+">
            <lightning-icon icon-name="utility:adduser" class="slds-icon-utility-adduser slds-global-header__icon slds-button__icon slds-icon_container forceIcon">
                <lightning-primitive-icon>
                    <svg class="slds-icon slds-icon_xx-small" focusable="false" viewBox="0 0 52 52" part="icon">
                    <g>
                    <path fill="#2574a9" d="M47.6,37.6c-0.5-0.1-1.1-0.1-1.6-0.2c-0.1,0-0.2-0.1-0.2-0.2c-0.2-0.6-0.5-1.2-0.7-1.7c0-0.1,0-0.2,0-0.3
                        c0.3-0.4,0.7-0.9,1-1.3c0.2-0.3,0.2-0.6-0.1-0.9c-0.6-0.6-1.2-1.2-1.8-1.8c-0.1-0.1-0.3-0.2-0.4-0.2s-0.3,0.1-0.4,0.2
                        c-0.4,0.3-0.9,0.7-1.3,1c-0.1,0-0.1,0.1-0.1,0.1h-0.1c-0.6-0.2-1.1-0.5-1.7-0.7c-0.1,0-0.2-0.1-0.2-0.2c-0.1-0.5-0.1-1-0.2-1.5
                        c0-0.3-0.1-0.5-0.4-0.7c-0.1-0.1-0.2-0.1-0.2-0.1c-0.9,0-1.7,0-2.6,0c-0.2,0-0.3,0-0.4,0.1c-0.2,0.2-0.4,0.4-0.4,0.7
                        c0,0.5-0.1,1-0.2,1.5c0,0.1-0.1,0.2-0.2,0.2c-0.6,0.2-1.1,0.5-1.7,0.7h-0.1c-0.1,0-0.1,0-0.2-0.1c-0.4-0.3-0.8-0.7-1.3-1
                        C32,31.1,31.9,31,31.7,31s-0.3,0.1-0.5,0.2c-0.6,0.6-1.2,1.2-1.8,1.8c-0.3,0.3-0.3,0.6-0.1,0.9c0.3,0.4,0.7,0.8,1,1.3
                        c0.1,0.1,0.1,0.2,0,0.3c-0.2,0.6-0.5,1.1-0.7,1.7c0,0.1-0.1,0.2-0.2,0.2c-0.5,0.1-1,0.1-1.5,0.2c-0.3,0-0.6,0.2-0.7,0.5c0,1,0,2,0,3
                        c0.2,0.3,0.4,0.4,0.7,0.5c0.5,0,1,0.1,1.5,0.2c0.1,0,0.2,0.1,0.2,0.2c0.2,0.6,0.5,1.1,0.7,1.7c0,0.1,0.1,0.2,0,0.3
                        c-0.3,0.4-0.7,0.9-1,1.3c-0.2,0.3-0.2,0.6,0.1,0.9c0.6,0.6,1.2,1.2,1.8,1.8c0.2,0.2,0.3,0.2,0.5,0.2c0.1,0,0.3-0.1,0.4-0.2
                        c0.4-0.3,0.8-0.7,1.3-1c0.1,0,0.1-0.1,0.2-0.1h0.1c0.6,0.2,1.1,0.5,1.7,0.7c0.1,0,0.2,0.1,0.2,0.2c0.1,0.5,0.1,1.1,0.2,1.6
                        c0,0.4,0.3,0.6,0.7,0.6s0.9,0,1.3,0c0.4,0,0.8,0,1.2,0s0.6-0.2,0.7-0.6c0.1-0.5,0.1-1.1,0.2-1.6c0-0.1,0.1-0.2,0.2-0.2
                        c0.6-0.2,1.2-0.5,1.7-0.7h0.1c0,0,0.1,0,0.1,0.1c0.4,0.3,0.9,0.7,1.3,1c0.1,0.1,0.3,0.2,0.4,0.2c0.2,0,0.3-0.1,0.5-0.2
                        c0.6-0.6,1.2-1.2,1.8-1.8c0.3-0.3,0.3-0.6,0.1-0.9c-0.3-0.4-0.7-0.8-1-1.3c-0.1-0.1-0.1-0.2,0-0.3c0.2-0.6,0.5-1.1,0.7-1.7
                        c0-0.1,0.1-0.2,0.2-0.2c0.5-0.1,1.1-0.1,1.6-0.2c0.4,0,0.6-0.3,0.6-0.7c0-0.8,0-1.7,0-2.5C48.2,37.9,48,37.7,47.6,37.6z M37.8,43.6
                        C37.8,43.6,37.7,43.6,37.8,43.6c-2.3,0-4-1.8-4-4s1.8-4,4-4l0,0c2.2,0,4,1.8,4,4C41.7,41.8,39.9,43.6,37.8,43.6z"/>
                    <path fill="#2574a9" d="M38.7,20.7c-0.2-0.8-0.8-1.3-1.6-1.3c-3.2,0-6.4,0-9.6,0l0,0c-1.2,0-0.6-1-0.6-1c0.2-0.4,0.4-0.7,0.5-1.1
                        c2.2-4.3,4.3-8.6,6.5-12.9c0.8-1.2,0-2.4-1.4-2.4c-6,0-11.9,0-17.9,0c-0.9,0-1.3,0.3-1.7,1.1c-3,7.6-6,15.1-8.9,22.7
                        c0,0.2-0.1,0.4-0.1,0.5c-0.1,1,0.6,1.7,1.7,1.7c3.2,0,6.5,0,9.7,0c0.7,0.1,2.1,0.4,1.4,2.2c-1.2,3.1-2.4,6.1-3.6,9.2
                        c-1.2,2.8-2.3,5.6-3.4,8.4c-0.4,1,0,1.9,1,2.2c0.7,0.2,1.2-0.1,1.7-0.6c4-4.2,8-8.4,12-12.7c0.5-0.5,0.9-1,1.4-1.5
                        c0.6-0.6,0.5-1.6,0.5-1.6l0,0c0-1,0.3-1.9,1.1-2.7c0.6-0.6,1.2-1.2,1.8-1.8c0.7-0.7,1.6-1.1,2.6-1.1c0.7,0,1.1-0.3,1.3-0.4l0.1-0.1
                        l0,0l0,0c1.7-1.8,3.5-3.7,5.2-5.5C38.7,21.7,38.9,21.2,38.7,20.7z"/>
                    </g>
                    </svg>
                </lightning-primitive-icon>
            </lightning-icon>
        </button>
    `;

    // The inject is unreliable due to LX's long loading and so different pages (e.g. normal vs setup)
    // would load differently requiring an interval timer to wait to find the right element to inject next to.
    // We wait for up to a minute to allow for super slow loading times.
    const MAX_TRIES = 300;
    const INTERVAL = 100;
    let tries = 0;
    const intervalTimer = setInterval(() => {
        const helpListItemDiv = document.querySelector('li.slds-global-actions__item div.oneHelpAndTrainingExperience');
        if (helpListItemDiv) {
            clearInterval(intervalTimer);
            injectSetupPlusButton(helpListItemDiv);
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
            safeChromeRuntime.sendMessage({ operation: 'open-sf-niknax', page: 'quick-create-user' });
        });
    }

    function injectSetupPlusButton(helpListItemDiv) {
        const setupPlusListItem = document.createElement('li');
        setupPlusListItem.className = 'slds-global-actions__item slds-dropdown-trigger slds-dropdown-trigger--click';
        setupPlusListItem.innerHTML = SETUP_PLUS_GLOBAL_ACTION_HTML;

        // Go up to the "li" and insert ours after it.
        helpListItemDiv.parentNode.after(setupPlusListItem);

        const setupPlusButton = document.getElementById('sf-niknax-setup-plus-button');
        setupPlusButton.addEventListener('click', function() {
            safeChromeRuntime.sendMessage({ operation: 'open-sf-niknax', page: 'setup-plus' });
        });
    }
});