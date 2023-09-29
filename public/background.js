const SF_NIKNAX_PAGE = 'sf-niknax.html';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.operation === 'open-sf-niknax') {
        // Get server host
        const serverUrl = new URL(sender.url);
        const serverHost = serverUrl.hostname;

        // Get user record ID from URL
        const path = serverUrl.pathname.substring(1);
        const userId = /[a-zA-Z0-9]{18}|[a-zA-Z0-9]{15}/.exec(path);
        if (userId === null) {
            // TODO: handle
        }

        let queryOptions = { active: true, lastFocusedWindow: true };
        chrome.tabs.query(queryOptions, ([userTab]) => {
            // Construct page URL with server host
            let niknaxUrl = chrome.runtime.getURL(SF_NIKNAX_PAGE);
            niknaxUrl += `?host=${serverHost}&user=${userId}&tab=${userTab.id}`;

            chrome.windows.create({
                url: niknaxUrl,
                type: 'popup',
                width: 595,
                height: 505
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