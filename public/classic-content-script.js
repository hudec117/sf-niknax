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

    const locationParams = new URLSearchParams(window.location.search);
    const pageType = pageTypeElements[0].innerText;

    function isOnUserDetailPage() {
        return pageType === 'User';
    }

    function isOnFieldPage() {
        const isOnStandardFieldPage = window.location.pathname.includes('_ui/common/config/field/StandardFieldAttributes/d');

        const isOnCustomFieldPage = pageType.includes(' Custom Field');

        return isOnStandardFieldPage || isOnCustomFieldPage;
    }

    function isOnPermissionSetObjectSettingsPage() {
        if (!locationParams.has('s')) {
            return false;
        }

        if (!locationParams.has('o')) {
            return false;
        }

        const permissionSetSubPage = locationParams.get('s');

        return pageType === 'Permission Set' && permissionSetSubPage === 'EntityPermissions';
    }

    if (isOnUserDetailPage()) {
        injectEditPublicGroupMembershipsButton();
        injectEditQueueMembershipsButton();
        injectCloneUserButton();
    } else if (isOnFieldPage()) {
        injectSetFLSPermissionSetButton();
    } else if (isOnPermissionSetObjectSettingsPage()) {
        injectViewFieldsAndRelationshipsButton();
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
        const publicGroupMembershipSection = getElementByStaticID('div', '_RelatedPublicGroupMemberList');
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
        const queueMembershipSection = getElementByStaticID('div', '_RelatedQueueMemberList');
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

    function injectSetFLSPermissionSetButton() {
        const setFLSPermissionSetButton = document.createElement('input');
        setFLSPermissionSetButton.value = 'Set Field-Level Security (Permission Sets)';
        setFLSPermissionSetButton.title = `Salesforce Niknax: ${setFLSPermissionSetButton.value}`;
        setFLSPermissionSetButton.className = 'btn';
        setFLSPermissionSetButton.type = 'button';
        setFLSPermissionSetButton.style = 'margin-left: 5px; border: 1px solid #2574a9;';
        setFLSPermissionSetButton.addEventListener('click', () => {
            safeChromeRuntime.sendMessage({ operation: 'open-sf-niknax', page: 'permission-set-edit-field' });
        });

        const setFLSButtons = document.getElementsByName('fieldAccessEdit');
        if (setFLSButtons.length > 1) {
            console.error('sf-niknax: failed to inject the Set Field-Level Security (Permission Sets) button, more than one "fieldAccessEdit" named button found.');
            return;
        }

        const existingSetFLSButton = setFLSButtons[0];
        existingSetFLSButton.parentNode.insertBefore(setFLSPermissionSetButton, existingSetFLSButton.nextSibling);
    }

    function injectViewFieldsAndRelationshipsButton() {
        const buttonRow = document.querySelector('.pbHeader .pbButton');

        const isEditButton = buttonRow.firstChild.textContent === 'Edit';
        if (!isEditButton) {
            return;
        }

        const viewFieldsAndRelationshipsButton = document.createElement('a');
        viewFieldsAndRelationshipsButton.textContent = 'View Object Fields & Relationships';
        viewFieldsAndRelationshipsButton.title = `Salesforce Niknax: View Object Fields & Relationships`;
        viewFieldsAndRelationshipsButton.className = 'btn pc_buttonLink';
        viewFieldsAndRelationshipsButton.style = 'margin-left: 5px; border: 1px solid #2574a9;';
        // viewFieldsAndRelationshipsButton.addEventListener('click', () => {
        //     safeChromeRuntime.sendMessage({ operation: 'open-sf-niknax', page: 'permission-set-edit-field' });
        // });

        buttonRow.appendChild(viewFieldsAndRelationshipsButton);
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

    function getElementByStaticID(elementType, staticString) {
        const elements = document.querySelectorAll(elementType);

        for (const element of elements) {
            if (element.id && element.id.includes(staticString)) {
                return element;
            }
        }

        return null;
    }
});