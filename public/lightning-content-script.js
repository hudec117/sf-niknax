window.addEventListener('load', function() {
    const safeChromeRuntime = chrome.runtime;

    function setupProfilePanelDetector() {
        function handleMutation(mutationsList) {
            for (const mutation of mutationsList) {
                if (mutation.addedNodes.length > 0 && mutation.addedNodes[0].classList.contains('userProfilePanel')) {
                    const userProfilePanel = mutation.addedNodes[0];

                    onPanelOpened(userProfilePanel);
                    return;
                }
            }
        }

        const uiContainerManagerObserver = new MutationObserver(handleMutation);

        // TODO: refactor
        const MAX_TRIES = 300;
        const INTERVAL = 100;
        let tries = 0;
        const intervalTimer = setInterval(() => {
            const uiContainerManagerDiv = document.querySelector('div.DESKTOP.uiContainerManager');
            if (uiContainerManagerDiv) {
                clearInterval(intervalTimer);
                uiContainerManagerObserver.observe(
                    uiContainerManagerDiv,
                    { childList: true }
                );
            } else {
                tries++;
                if (tries >= MAX_TRIES) {
                    clearInterval(intervalTimer);
                    console.warn('sf-niknax: failed to inject');
                }
            }
        }, INTERVAL);
    }

    function onPanelOpened(userProfilePanel) {
        injectUserDetailAnchor(userProfilePanel);
    }

    function injectUserDetailAnchor(userProfilePanel) {
        const linksWrapperElements = userProfilePanel.getElementsByClassName('profile-card-toplinks');
        if (linksWrapperElements.length < 1) {
            // TODO: handle
            return;
        }

        const linksWrapper = linksWrapperElements[0];

        const userDetailAnchor = document.createElement('a');
        userDetailAnchor.textContent = 'User Detail';
        userDetailAnchor.title = 'Salesforce Niknax: Open your User detail page';
        userDetailAnchor.href = '#';
        userDetailAnchor.className = 'profile-link-label';

        linksWrapper.insertBefore(userDetailAnchor, linksWrapper.firstChild);
    }

    function setupPageChangeDetector() {
        let previousPageUrl = window.location.href;

        function handleMutation() {
            const newPageUrl = window.location.href;
            if (newPageUrl !== previousPageUrl) {
                previousPageUrl = newPageUrl;

                onPageChanged(window.location);
            }
        }

        const titleElement = document.querySelector('title');

        const titleObserver = new MutationObserver(handleMutation);
        titleObserver.observe(
            titleElement,
            { childList: true }
        );
    }

    function onPageChanged(newLocation) {
        // If on the Fields & Relationships page
        if (newLocation.pathname.endsWith('/FieldsAndRelationships/view')) {
            injectEditPermissionSetObjectSettings();
        }
    }

    function injectEditPermissionSetObjectSettings() {
        // Note: To insert this button, the MutationObserver was not detecting the existing buttons
        // re-appearing after subsequent visits to the Field & Relationships page, so setInterval had to be used.

        const objectSettingsInPermissionSetButton = document.createElement('button');
        objectSettingsInPermissionSetButton.className = 'slds-button slds-button--neutral uiButton';
        objectSettingsInPermissionSetButton.textContent = 'Edit Object Settings in Permission Set';
        objectSettingsInPermissionSetButton.title = 'Edit Object Settings in a selected Permission Set';
        objectSettingsInPermissionSetButton.style = 'border: 1px solid #2574a9;';
        objectSettingsInPermissionSetButton.addEventListener('click', function() {
            safeChromeRuntime.sendMessage({ operation: 'open-sf-niknax', page: 'permission-set-object-settings-redirect' });
        });

        // Insert after the "Set History Tracking" button
        const MAX_TRIES = 300;
        const INTERVAL = 100;
        let tries = 0;
        const intervalTimer = setInterval(() => {
            const buttons = document.evaluate('//button[text()="Set History Tracking"]', document, null, XPathResult.ANY_TYPE, null);
            const setHistoryTrackingButton = buttons.iterateNext();
            if (setHistoryTrackingButton) {
                clearInterval(intervalTimer);

                setHistoryTrackingButton.parentNode.appendChild(objectSettingsInPermissionSetButton);
            } else {
                tries++;
                if (tries >= MAX_TRIES) {
                    clearInterval(intervalTimer);
                    console.warn('sf-niknax: failed to inject');
                }
            }
        }, INTERVAL);
    }

    // Execute on load
    setupProfilePanelDetector();
    setupPageChangeDetector();
    onPageChanged(window.location);
});