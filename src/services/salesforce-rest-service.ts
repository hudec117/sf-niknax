import ServiceResult from './result';

export default class SalesforceRESTService {
    QUERY_ENDPOINT = '/services/data/v58.0/query';
    OBJECT_ENDPOINT = '/services/data/v58.0/sobjects';

    serverBaseUrl: string;
    sessionId: string;

    constructor(domain: string, sessionId: string) {
        this.serverBaseUrl = `https://${domain}`;
        this.sessionId = sessionId;
    }

    // async isSessionExpired(): Promise<boolean> {
    //   const requestUrl = new URL('/services/data/v58.0', this.serverBaseUrl);

    //   const response = await this.authFetch(requestUrl);

    //   return !response.ok;
    // }

    protected authFetch(requestUrl: URL, requestInfo: any = { method: 'GET' }): Promise<Response> {
        const actualRequestUrl = requestUrl.toString().replace(/\+/g, '%20');

        if (!requestInfo.headers)
            requestInfo.headers = {};
        requestInfo.headers['Authorization'] = 'Bearer ' + this.sessionId

        return fetch(actualRequestUrl, requestInfo);
    }

    async get(object: string, id: string): Promise<ServiceResult> {
        const requestUrl = new URL(`${this.OBJECT_ENDPOINT}/${object}/${id}`, this.serverBaseUrl);

        try {
            const response = await this.authFetch(requestUrl, {
                method: 'GET'
            });
            const responseBody = await response.json();

            if (response.ok) {
                return ServiceResult.success(responseBody.records);
            } else {
                return ServiceResult.fail(
                    responseBody.map((error: Error) => error.message).join('\n')
                );
            }
        } catch (error) {
            return ServiceResult.fail((error as Error).message);
        }
    }

    async query(soql: string): Promise<ServiceResult> {
        const requestUrl = new URL(this.QUERY_ENDPOINT, this.serverBaseUrl);
        requestUrl.searchParams.set('q', soql);

        try {
            const response = await this.authFetch(requestUrl);
            const responseBody = await response.json();

            if (response.ok) {
                return ServiceResult.success(responseBody.records);
            } else {
                return ServiceResult.fail(
                    responseBody.map((error: Error) => error.message).join('\n')
                );
            }
        } catch (error) {
            return ServiceResult.fail((error as Error).message);
        }
    }

    async create(object: string, data: Object): Promise<ServiceResult> {
        const requestUrl = new URL(`${this.OBJECT_ENDPOINT}/${object}`, this.serverBaseUrl);

        delete (data as any).Id;
        delete (data as any).attributes;
        const jsonData = JSON.stringify(data);

        try {
            const response = await this.authFetch(requestUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: jsonData
            });
            const responseBody = await response.json();

            if (response.ok) {
                return ServiceResult.success(responseBody);
            } else {
                return ServiceResult.fail(
                    responseBody.map((error: Error) => error.message).join('\n')
                );
            }
        } catch (error) {
            return ServiceResult.fail((error as Error).message);
        }
    }

    async delete(object: string, id: string): Promise<ServiceResult> {
        const requestUrl = new URL(`${this.OBJECT_ENDPOINT}/${object}/${id}`, this.serverBaseUrl);

        try {
            const response = await this.authFetch(requestUrl, {
                method: 'DELETE'
            });

            return { success: response.ok };
        } catch (error) {
            return ServiceResult.fail((error as Error).message);
        }
    }

    async getOrganisation(): Promise<ServiceResult> {
        const result = await this.query('SELECT DefaultLocaleSidKey, TimeZoneSidKey, LanguageLocaleKey, OrganizationType, IsSandbox FROM Organization');
        if (!result.success) {
            return ServiceResult.fail(result.error);
        }

        return ServiceResult.success((result.data as Array<any>)[0]);
    }
}