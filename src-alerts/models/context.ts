export default class Context {
    serverHost: string;
    originalTabId: number;
    sessionId: string;
    userId?: string;

    constructor(domain: string, originalTabId: number, sessionId: string, userId?: string) {
        this.serverHost = domain;
        this.originalTabId = originalTabId;
        this.sessionId = sessionId;
        this.userId = userId;
    }
}