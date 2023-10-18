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
        const actualRequestUrl = requestUrl.toString().replace('+', '%20');

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
                return {
                    success: true,
                    data: responseBody.records
                };
            } else {
                return {
                    success: false,
                    error: responseBody.map((error: Error) => error.message).join('\n')
                };
            }
        } catch (error) {
            return {
                success: false,
                error: (error as Error).message
            };
        }
    }

    async query(soql: string): Promise<ServiceResult> {
        const requestUrl = new URL(this.QUERY_ENDPOINT, this.serverBaseUrl);
        requestUrl.searchParams.set('q', soql);

        try {
            const response = await this.authFetch(requestUrl);
            const responseBody = await response.json();

            if (response.ok) {
                return {
                    success: true,
                    data: responseBody.records
                };
            } else {
                return {
                    success: false,
                    error: responseBody.map((error: Error) => error.message).join('\n')
                };
            }
        } catch (error) {
            return {
                success: false,
                error: (error as Error).message
            };
        }
    }

    async create(object: string, data: Object): Promise<ServiceResult> {
        const requestUrl = new URL(`${this.OBJECT_ENDPOINT}/${object}`, this.serverBaseUrl);

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
                return {
                    success: true,
                    data: responseBody
                };
            } else {
                return {
                    success: false,
                    error: responseBody.map((error: Error) => error.message).join('\n')
                };
            }
        } catch (error) {
            return {
                success: false,
                error: (error as Error).message
            };
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
            return {
                success: false,
                error: (error as Error).message
            };
        }
    }
}