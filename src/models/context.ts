export default class Context {
    serverHost: string;
    originalTabId: number;
    sessionId: string;
    recordId?: string;

    constructor(domain: string, originalTabId: number, sessionId: string, recordId?: string) {
        this.serverHost = domain;
        this.originalTabId = originalTabId;
        this.sessionId = sessionId;
        this.recordId = recordId;
    }
}