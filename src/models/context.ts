export default class Context {
    serverHost: string;
    userId: string;
    originalTabId: number;
    sessionId: string;

    constructor(domain: string, userId: string, originalTabId: number, sessionId: string) {
        this.serverHost = domain;
        this.userId = userId;
        this.originalTabId = originalTabId;
        this.sessionId = sessionId;
    }
}