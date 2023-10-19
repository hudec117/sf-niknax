import ServiceResult from './result';

export default class SalesforceToolingService {
    EXECUTE_ANONYMOUS_ENDPOINT = '/services/data/v58.0/tooling/executeAnonymous';

    serverBaseUrl: string;
    sessionId: string;

    constructor(domain: string, sessionId: string) {
        this.serverBaseUrl = `https://${domain}`;
        this.sessionId = sessionId;
    }

    protected authFetch(requestUrl: URL, requestInfo: any = { method: 'GET' }): Promise<Response> {
        const actualRequestUrl = requestUrl.toString().replace(/\+/g, '%20');

        if (!requestInfo.headers)
            requestInfo.headers = {};
        requestInfo.headers['Authorization'] = 'Bearer ' + this.sessionId

        return fetch(actualRequestUrl, requestInfo);
    }

    async executeAnonymous(code: string): Promise<ServiceResult> {
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