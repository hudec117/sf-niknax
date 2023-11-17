import type Record from '@/models/Record';
import { Result } from './Results';
import type Organisation from '@/models/Organisation';
import type Field from '@/models/Field';

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

    // async get(object: string, id: string): Promise<Result<Array<Record>>> {
    //     const requestUrl = new URL(`${this.OBJECT_ENDPOINT}/${object}/${id}`, this.serverBaseUrl);

    //     try {
    //         const response = await this.authFetch(requestUrl, {
    //             method: 'GET'
    //         });
    //         const responseBody = await response.json();

    //         if (response.ok) {
    //             return Result.success(responseBody.records as Array<Record>);
    //         } else {
    //             return Result.fail(
    //                 responseBody.map((error: Error) => error.message).join('\n')
    //             );
    //         }
    //     } catch (error) {
    //         return Result.fail((error as Error).message);
    //     }
    // }

    async query<T = Record>(soql: string): Promise<Result<Array<T>>> {
        const requestUrl = new URL(this.QUERY_ENDPOINT, this.serverBaseUrl);
        requestUrl.searchParams.set('q', soql);

        try {
            const response = await this.authFetch(requestUrl);
            const responseBody = await response.json();

            if (response.ok) {
                return Result.success<Array<T>>(responseBody.records);
            } else {
                return Result.fail(
                    responseBody.map((error: Error) => error.message).join('\n')
                );
            }
        } catch (error) {
            return Result.fail((error as Error).message);
        }
    }

    async create(object: string, record: object): Promise<Result<string>> {
        const requestUrl = new URL(`${this.OBJECT_ENDPOINT}/${object}`, this.serverBaseUrl);

        delete (record as any).Id;
        delete (record as any).attributes;
        const jsonData = JSON.stringify(record);

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
                return Result.success<string>(responseBody.id);
            } else {
                return Result.fail(
                    responseBody.map((error: Error) => error.message).join('\n')
                );
            }
        } catch (error) {
            return Result.fail((error as Error).message);
        }
    }

    async delete(object: string, id: string): Promise<Result> {
        const requestUrl = new URL(`${this.OBJECT_ENDPOINT}/${object}/${id}`, this.serverBaseUrl);

        try {
            const response = await this.authFetch(requestUrl, {
                method: 'DELETE'
            });

            return Result.conditional(response.ok);
        } catch (error) {
            return Result.fail((error as Error).message);
        }
    }

    async getOrganisation(): Promise<Result<Organisation>> {
        const result = await this.query<Organisation>('SELECT DefaultLocaleSidKey, TimeZoneSidKey, LanguageLocaleKey, OrganizationType, IsSandbox FROM Organization');
        if (!result.success) {
            return Result.fail(result.error);
        }

        return Result.success<Organisation>(result.guardedData[0]);
    }

    async getObjectFields(object: string): Promise<Result<Array<Field>>> {
        const requestUrl = new URL(`${this.OBJECT_ENDPOINT}/${object}/describe`, this.serverBaseUrl);

        try {
            const response = await this.authFetch(requestUrl);
            const responseBody = await response.json();

            if (response.ok) {
                return Result.success<Array<Field>>(responseBody.fields as Array<Field>);
            } else {
                return Result.fail(
                    responseBody.map((error: Error) => error.message).join('\n')
                );
            }
        } catch (error) {
            return Result.fail((error as Error).message);
        }
    }
}