export default class SalesforceToolingService {
    EXECUTE_ANONYMOUS_ENDPOINT = '/services/data/v58.0/tooling/executeAnonymous';

    serverBaseUrl: string;
    sessionId: string;

    constructor(domain: string, sessionId: string) {
        this.serverBaseUrl = `https://${domain}`;
        this.sessionId = sessionId;
    }

    private authFetch(requestUrl: URL, requestInfo: any = { method: 'GET' }) {
        const actualRequestUrl = requestUrl.toString().replace('+', '%20');

        if (!requestInfo.headers) {
            requestInfo.headers = {};
        }
        requestInfo.headers['Authorization'] = 'Bearer ' + this.sessionId

        return fetch(actualRequestUrl, requestInfo);
    }

    async executeAnonymous(code: string) {
        const urlEncodedCode = encodeURIComponent(code);
        const requestUrl = new URL(`${this.EXECUTE_ANONYMOUS_ENDPOINT}?anonymousBody=${urlEncodedCode}`, this.serverBaseUrl);

        const response = await this.authFetch(requestUrl);
        const responseBody = await response.json();

        const successfullyExecuted = response.ok && !responseBody.exceptionMessage && !responseBody.compileProblem;
        if (successfullyExecuted) {
            return { success: true };
        } else {
            return {
                success: false,
                error: responseBody.exceptionMessage || responseBody.compileProblem
            };
        }
    }
}