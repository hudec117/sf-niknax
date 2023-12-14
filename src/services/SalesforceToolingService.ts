import { Result } from './Results';

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

    async executeAnonymous(code: string): Promise<Result> {
        const urlEncodedCode = encodeURIComponent(code);
        const requestUrl = new URL(`${this.EXECUTE_ANONYMOUS_ENDPOINT}?anonymousBody=${urlEncodedCode}`, this.serverBaseUrl);

        try {
            const response = await this.authFetch(requestUrl);
            const responseBody = await response.json();

            const successfullyExecuted = response.ok && !responseBody.exceptionMessage && !responseBody.compileProblem;
            if (successfullyExecuted) {
                return Result.success();
            } else {
                return Result.fail(responseBody.exceptionMessage || responseBody.compileProblem);
            }
        } catch (error) {
            return Result.fail((error as Error).message);
        }
    }
}