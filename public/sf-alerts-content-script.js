window.onload = function () {
    // const DEPLOY_BAR_HTML = /*html*/ `
    // <div id="sf-niknax-deploy-bar" aria-live="polite" data-index="0" class="slds-notify_alert system-message level-info slds-theme_info slds-p-horizontal_small">
    //     <div class="slds-grid slds-gutters slds-grid_vertical-align-center">
    //         <div class="slds-col slds-grow-none">
    //             Deployment in progress
    //         </div>
    //         <div class="slds-col">
    //             <div class="slds-progress-bar" role="progressbar">
    //                 <span class="slds-progress-bar__value" style="width:25%">
    //                     <span class="slds-assistive-text">Progress: 25%</span>
    //                 </span>
    //             </div>
    //         </div>
    //     </div>
    // </div>
    // `;

    // The inject is unreliable due to LX's long loading and so different pages (e.g. normal vs setup)
    // would load differently requiring an interval timer to wait to find the right element to inject next to.
    // We wait for up to a minute to allow for super slow loading times.
    const MAX_TRIES = 100;
    const INTERVAL = 100;
    let tries = 0;
    let intervalTimer;

    intervalTimer = setInterval(() => {
        const elements = document.getElementsByClassName('oneSystemMessage');
        if (elements.length > 0) {
            clearInterval(intervalTimer);
            injectDeployBar(elements[0]);
        } else {
            tries++;
            if (tries >= MAX_TRIES) {
                clearInterval(intervalTimer);
                console.warn('sf-niknax: failed to inject deploy bar.');
            }
        }
    }, INTERVAL);

    function injectDeployBar(oneSystemMessage) {
        // oneSystemMessage.innerHTML = DEPLOY_BAR_HTML + oneSystemMessage.innerHTML;

        var iframe = document.createElement('iframe');
        iframe.id = 'sf-deploy-bar-frame';
        iframe.src = chrome.runtime.getURL('test.html');

        oneSystemMessage.appendChild(iframe);
    }
}