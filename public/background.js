// Note: async/await with the Chrome API seems to break the code.

const SF_NIKNAX_PAGE = 'sf-niknax.html';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.operation === 'open-sf-niknax') {
        // Get server host
        const serverUrl = new URL(sender.url);
        const serverHost = serverUrl.hostname;

        // Get user record ID from URL
        const path = serverUrl.pathname.substring(1);
        const userId = /[a-zA-Z0-9]{18}|[a-zA-Z0-9]{15}/.exec(path) ?? undefined;

        let queryOptions = { active: true, lastFocusedWindow: true };
        chrome.tabs.query(queryOptions, ([userTab]) => {
            // Construct page URL with server host
            let niknaxUrl = chrome.runtime.getURL(SF_NIKNAX_PAGE);
            niknaxUrl += `?host=${serverHost}&tab=${userTab.id}&page=${request.page}`;

            if (userId) {
                niknaxUrl += `&user=${userId}`;
            }

            chrome.windows.create({
                url: niknaxUrl,
                type: 'popup'
            });
        });
    } else if (request.operation == 'get-session-id') {
        const serverUrl = `https://${request.host}`;

        chrome.cookies.get({ name: 'sid', url: serverUrl }, function (cookie) {
            const sessionId = cookie ? cookie.value : '';

            sendResponse({ id: sessionId });
        });
    }

    return true;
});