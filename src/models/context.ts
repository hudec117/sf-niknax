export default class Context {
    serverHost: string;
    originalTabId: number;
    sessionId: string;
    recordId?: string;
    object?: string;

    constructor(domain: string, originalTabId: number, sessionId: string, recordId?: string, object?: string) {
        this.serverHost = domain;
        this.originalTabId = originalTabId;
        this.sessionId = sessionId;
        this.recordId = recordId;
        this.object = object;
    }
}