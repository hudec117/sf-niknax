window.onload = function () {
    const pageTypeElements = document.getElementsByClassName('pageType');

    const canAddButton = pageTypeElements.length > 0 && pageTypeElements[0].innerText === 'User';
    if (canAddButton) {
        injectEditPublicGroupMembershipsButton();
        injectEditQueueMembershipsButton();
    }

    function injectEditPublicGroupMembershipsButton() {
        const editMembershipButton = document.createElement('input');
        editMembershipButton.value = 'Edit Memberships';
        editMembershipButton.title = `Salesforce Niknax: ${editMembershipButton.value}`;
        editMembershipButton.className = 'btn';
        editMembershipButton.type = 'button';
        editMembershipButton.style = 'margin-left: 5px; border: 1px solid #2574a9;';
        editMembershipButton.addEventListener('click', () => {
            chrome.runtime.sendMessage({ operation: 'open-sf-niknax', page: 'edit-public-group-memberships' });
        });

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
        editMembershipButton.value = 'Edit Memberships';
        editMembershipButton.title = `Salesforce Niknax: ${editMembershipButton.value}`;
        editMembershipButton.className = 'btn';
        editMembershipButton.type = 'button';
        editMembershipButton.style = 'margin-left: 5px; border: 1px solid #2574a9;';
        editMembershipButton.addEventListener('click', () => {
            chrome.runtime.sendMessage({ operation: 'open-sf-niknax', page: 'edit-queue-memberships' });
        });

        const queueMembershipSection = getElementByStaticID('_RelatedQueueMemberList');
        if (!queueMembershipSection) {
            console.error('sf-niknax: failed to find *_RelatedQueueMemberList element.');
            return;
        }

        const buttonRow = queueMembershipSection.querySelector('div.listRelatedObject.setupBlock > div > div.pbHeader > table > tbody > tr > td.pbButton');
        buttonRow.appendChild(editMembershipButton);
    }

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