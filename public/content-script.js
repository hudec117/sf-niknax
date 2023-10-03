window.onload = function () {
    const isInPopupIFrame = document.location.pathname.includes('emptyHtmlDoc.html');
    if (isInPopupIFrame) {
        return;
    }

    const pageTypeElements = document.getElementsByClassName('pageType');
    if (pageTypeElements.length === 0) {
        return;
    }

    const isOnUserDetailPage = pageTypeElements[0].innerText === 'User';
    const isOnUserListPage = pageTypeElements[0].innerText === 'All Users';
    if (isOnUserDetailPage) {
        injectEditPublicGroupMembershipsButton();
        injectEditQueueMembershipsButton();
        injectCloneUserButton();
    } else if (isOnUserListPage) {
        // injectFreezeUsersButton();
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
                chrome.runtime.sendMessage({ operation: 'open-sf-niknax', page: 'edit-public-group-memberships' });
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
                chrome.runtime.sendMessage({ operation: 'open-sf-niknax', page: 'edit-queue-memberships' });
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
        cloneUserButton.title = `Salesforce Niknax: ${cloneUserButton.value}`;
        cloneUserButton.className = 'btn';
        cloneUserButton.type = 'button';
        cloneUserButton.style = 'margin-left: 5px; border: 1px solid #2574a9;';
        cloneUserButton.addEventListener('click', () => {
            chrome.runtime.sendMessage({ operation: 'open-sf-niknax', page: 'clone-user' });
        });

        const topButtonRow = document.getElementById('topButtonRow');
        topButtonRow.appendChild(cloneUserButton);
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
}