// Note: async/await with the Chrome API seems to break the code.

const SF_USER_PAGE = 'sf-user.html';

const USER_POPUP_DIMENSIONS = {
    'edit-public-group-memberships':    { width: 673, height: 537 },
    'edit-queue-memberships':           { width: 673, height: 537 },
    'clone-user':                       { width: 620, height: 694 },
    'bulk-freeze-users':                { width: 620, height: 630 }
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.operation === 'open-user-popup') {
        // Get server host
        const serverUrl = new URL(sender.url);
        const serverHost = serverUrl.hostname;

        // Get user record ID from URL
        const path = serverUrl.pathname.substring(1);
        const userId = /[a-zA-Z0-9]{18}|[a-zA-Z0-9]{15}/.exec(path) ?? undefined;

        let queryOptions = { active: true, lastFocusedWindow: true };
        chrome.tabs.query(queryOptions, ([userTab]) => {
            // Construct page URL with server host
            let niknaxUrl = chrome.runtime.getURL(SF_USER_PAGE);
            niknaxUrl += `?host=${serverHost}&tab=${userTab.id}&page=${request.page}`;

            if (userId) {
                niknaxUrl += `&user=${userId}`;
            }

            // Note: width/height here must always be larger than the resizeTo dimensions
            // in each popup. Otherwise the scrollbars introduced by a small width/height
            // will affect the resizeTo.
            chrome.windows.create({
                url: niknaxUrl,
                type: 'popup',
                width: USER_POPUP_DIMENSIONS[request.page].width,
                height: USER_POPUP_DIMENSIONS[request.page].height
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