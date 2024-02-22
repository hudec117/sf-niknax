window.addEventListener('load', function() {
    const safeChromeRuntime = chrome.runtime;

    function setupPageChangeDetector() {
        let previousPageUrl = window.location.href;

        function handleMutation() {
            const newPageUrl = window.location.href;
            if (newPageUrl !== previousPageUrl) {
                previousPageUrl = newPageUrl;
                onPageChanged(newPageUrl);
            }
        }

        const titleElement = document.querySelector('title');

        const titleObserver = new MutationObserver(handleMutation);
        titleObserver.observe(
            titleElement,
            { childList: true }
        );
    }

    function onPageChanged(newUrl) {
        // If on the Fields & Relationships page
        if (newUrl.endsWith('FieldsAndRelationships/view')) {
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

    setupPageChangeDetector();
    onPageChanged(window.location.href);
});