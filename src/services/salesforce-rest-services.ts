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

    private authFetch(requestUrl: URL, requestInfo: any = { method: 'GET' }) {
        const actualRequestUrl = requestUrl.toString().replace('+', '%20');

        if (!requestInfo.headers)
            requestInfo.headers = {};
        requestInfo.headers['Authorization'] = 'Bearer ' + this.sessionId

        return fetch(actualRequestUrl, requestInfo);
    }

    async query(soql: string) {
        const requestUrl = new URL(this.QUERY_ENDPOINT, this.serverBaseUrl);
        requestUrl.searchParams.set('q', soql);

        const response = await this.authFetch(requestUrl);
        const responseBody = await response.json();

        if (response.ok) {
            return {
                success: true,
                records: responseBody.records
            };
        } else {
            return {
                success: false,
                error: responseBody.map((error: Error) => error.message).join('\n')
            };
        }
    }

    async create(object: string, data: Object) {
        const requestUrl = new URL(`${this.OBJECT_ENDPOINT}/${object}`, this.serverBaseUrl);

        const jsonData = JSON.stringify(data);

        const response = await this.authFetch(requestUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: jsonData
        });
        const responseBody = await response.json();

        if (response.ok) {
            return { success: true };
        } else {
            return {
                success: false,
                error: responseBody.map((error: Error) => error.message).join('\n')
            };
        }
    }

    async delete(object: string, id: string) {
        const requestUrl = new URL(`${this.OBJECT_ENDPOINT}/${object}/${id}`, this.serverBaseUrl);

        const response = await this.authFetch(requestUrl, {
            method: 'DELETE'
        });

        return { success: response.ok }
    }
}