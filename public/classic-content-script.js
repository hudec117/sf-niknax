window.addEventListener('load', function() {
    const safeChromeRuntime = chrome.runtime;

    const isInPopupIFrame = document.location.pathname.includes('emptyHtmlDoc.html');
    if (isInPopupIFrame) {
        return;
    }

    const pageTypeElements = document.getElementsByClassName('pageType');
    if (pageTypeElements.length === 0) {
        return;
    }

    const pageTypeText = pageTypeElements[0].innerText;

    const isOnUserDetailPage = pageTypeText === 'User';
    const isOnUserListPage = pageTypeText === 'All Users';
    const isOnCustomFieldPage = pageTypeText.includes('Custom Field');
    if (isOnUserDetailPage) {
        injectEditPublicGroupMembershipsButton();
        injectEditQueueMembershipsButton();
        injectCloneUserButton();
    } else if (isOnUserListPage) {
        // injectFreezeUsersButton();
    } else if (isOnCustomFieldPage) {
        injectPermissionSetEditFieldButton();
    }

    function injectEditPublicGroupMembershipsButton() {
        const editMembershipButton = document.createElement('input');
        editMembershipButton.id = 'sf-niknax-edit-public-group-memberships-button';
        editMembershipButton.value = 'Edit Memberships';
        editMembershipButton.title = `Salesforce Niknax: ${editMembershipButton.value}`;
        editMembershipButton.className = 'btn';
        editMembershipButton.type = 'button';
        editMembershipButton.style = 'margin-left: 5px; border: 1px solid #2574a9;';

        // Setup event listeners, we also need to handle the pop-up panel for the links at the top of the page.
        const rlPanelFrame = document.getElementById('RLPanelFrame');
        rlPanelFrame.contentDocument.addEventListener('click', onClick);
        document.addEventListener('click', onClick);

        function onClick(event) {
            if (event.target.id === editMembershipButton.id) {
                safeChromeRuntime.sendMessage({ operation: 'open-sf-niknax', page: 'edit-public-group-memberships' });
            }
        }

        // Find and inject
        const publicGroupMembershipSection = getElementByStaticID('_RelatedPublicGroupMemberList');
        if (!publicGroupMembershipSection) {
            console.error('sf-niknax: failed to find *_RelatedPublicGroupMemberList element.');
            return;
        }

        const buttonRow = publicGroupMembershipSection.querySelector('div.listRelatedObject.groupBlock > div > div.pbHeader > table > tbody > tr > td.pbButton');
        buttonRow.appendChild(editMembershipButton);
    }

    function injectEditQueueMembershipsButton() {
        const editMembershipButton = document.createElement('input');
        editMembershipButton.id = 'sf-niknax-edit-queue-memberships-button';
        editMembershipButton.value = 'Edit Memberships';
        editMembershipButton.title = `Salesforce Niknax: ${editMembershipButton.value}`;
        editMembershipButton.className = 'btn';
        editMembershipButton.type = 'button';
        editMembershipButton.style = 'margin-left: 5px; border: 1px solid #2574a9;';

        const rlPanelFrame = document.getElementById('RLPanelFrame');
        rlPanelFrame.contentDocument.addEventListener('click', onClick);
        document.addEventListener('click', onClick);

        function onClick(event) {
            if (event.target.id === editMembershipButton.id) {
                safeChromeRuntime.sendMessage({ operation: 'open-sf-niknax', page: 'edit-queue-memberships' });
            }
        }

        // Find and inject
        const queueMembershipSection = getElementByStaticID('_RelatedQueueMemberList');
        if (!queueMembershipSection) {
            console.error('sf-niknax: failed to find *_RelatedQueueMemberList element.');
            return;
        }

        const buttonRow = queueMembershipSection.querySelector('div.listRelatedObject.setupBlock > div > div.pbHeader > table > tbody > tr > td.pbButton');
        buttonRow.appendChild(editMembershipButton);
    }

    function injectCloneUserButton() {
        const cloneUserButton = document.createElement('input');
        cloneUserButton.value = 'Clone';
        cloneUserButton.title = `Salesforce Niknax: Clone this User`;
        cloneUserButton.className = 'btn';
        cloneUserButton.type = 'button';
        cloneUserButton.style = 'margin-left: 5px; border: 1px solid #2574a9;';
        cloneUserButton.addEventListener('click', () => {
            safeChromeRuntime.sendMessage({ operation: 'open-sf-niknax', page: 'quick-create-user' });
        });

        const topButtonRow = document.getElementById('topButtonRow');
        topButtonRow.appendChild(cloneUserButton);
    }

    function injectPermissionSetEditFieldButton() {
        const permissionSetEditFieldButton = document.createElement('input');
        permissionSetEditFieldButton.value = 'Set Field-Level Security (Permission Sets)';
        permissionSetEditFieldButton.title = `Salesforce Niknax: ${permissionSetEditFieldButton.value}`;
        permissionSetEditFieldButton.className = 'btn';
        permissionSetEditFieldButton.type = 'button';
        permissionSetEditFieldButton.style = 'margin-left: 5px; border: 1px solid #2574a9;';
        permissionSetEditFieldButton.addEventListener('click', () => {
            safeChromeRuntime.sendMessage({ operation: 'open-sf-niknax', page: 'permission-set-edit-field' });
        });

        const setFLSButtons = document.getElementsByName('fieldAccessEdit');
        if (setFLSButtons.length > 1) {
            console.error('sf-niknax: failed to inject the Permission Set Edit Field button, more than one "fieldAccessEdit" named button found.');
            return;
        }

        const profileSetFLSButton = setFLSButtons[0];
        profileSetFLSButton.value += ' (Profiles)';
        profileSetFLSButton.title += ' (Profiles)';

        profileSetFLSButton.parentNode.insertBefore(permissionSetEditFieldButton, profileSetFLSButton.nextSibling);
    }

    // function injectFreezeUsersButton() {
    //     const freezeUsersButton = document.createElement('input');
    //     freezeUsersButton.value = 'Bulk Freeze/Unfreeze';
    //     freezeUsersButton.title = `Salesforce Niknax: ${freezeUsersButton.value}`;
    //     freezeUsersButton.className = 'btn';
    //     freezeUsersButton.type = 'button';
    //     freezeUsersButton.style = 'margin-left: 5px; border: 1px solid #2574a9;';
    //     freezeUsersButton.addEventListener('click', () => {
    //         chrome.runtime.sendMessage({ operation: 'open-sf-niknax', page: 'bulk-freeze-users' });
    //     });

    //     const topButtonRow = document.querySelector('td.pbBottomButtons');
    //     topButtonRow.appendChild(freezeUsersButton);
    // }

    function getElementByStaticID(staticString) {
        const divElements = document.querySelectorAll('div');

        for (const element of divElements) {
            if (element.id && element.id.includes(staticString)) {
                return element;
            }
        }

        return null;
    }
});