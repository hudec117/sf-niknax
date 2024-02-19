// Note: async/await with the Chrome API seems to break the code.

const SF_NIKNAX_PAGE = 'sf-niknax.html';

const PAGE_DIMENSIONS = {
    'edit-public-group-memberships':    { width: 673, height: 537 },
    'edit-queue-memberships':           { width: 673, height: 537 },
    'permission-set-edit-field':        { width: 673, height: 537 },
    'quick-create-user':                { width: 616, height: 605 },
    'setup-plus':                       { width: 1280, height: 835 },
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.operation === 'open-sf-niknax') {
        const serverUrl = new URL(sender.url);

        // Get server host
        // Only the session ID against the ".my.salesforce.com" domain is valid for API requests.
        const serverHost = serverUrl.hostname.replace('.lightning.force.com', '.my.salesforce.com');

        // Try to get the record ID from the URL
        const path = serverUrl.pathname.substring(1);
        const recordId = /[a-zA-Z0-9]{18}|[a-zA-Z0-9]{15}/.exec(path) ?? undefined;

        let queryOptions = { active: true, lastFocusedWindow: true };
        chrome.tabs.query(queryOptions, ([currentTab]) => {
            // Construct page URL with server host
            let niknaxUrl = chrome.runtime.getURL(SF_NIKNAX_PAGE);
            niknaxUrl += `?host=${serverHost}&tab=${currentTab.id}&page=${request.page}`;

            if (recordId) {
                niknaxUrl += `&record=${recordId}`;
            }

            // Note: width/height here must always be larger than the resizeTo dimensions
            // in each popup. Otherwise the scrollbars introduced by a small width/height
            // will affect the resizeTo.
            chrome.windows.create({
                url: niknaxUrl,
                type: 'popup',
                width: PAGE_DIMENSIONS[request.page].width,
                height: PAGE_DIMENSIONS[request.page].height
            });
        });
    } else if (request.operation == 'get-session-id') {
        const serverUrl = `https://${request.host}`;

        chrome.cookies.get({ name: 'sid', url: serverUrl }, (cookie) => {
            const sessionId = cookie ? cookie.value : '';

            sendResponse({ id: sessionId });
        });
    }

    return true;
});