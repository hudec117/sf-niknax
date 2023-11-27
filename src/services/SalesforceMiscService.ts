import { Result } from './Results';
import type AuditLogEntry from '@/models/AuditLogEntry';
import Papa from 'papaparse';

export default class SalesforceRESTService {
    serverBaseUrl: string;
    sessionId: string;

    constructor(domain: string, sessionId: string) {
        this.serverBaseUrl = `https://${domain}`;
        this.sessionId = sessionId;
    }

    async getAuditLog(orgId: string): Promise<Result<Array<AuditLogEntry>>> {
        // First load the Audit Trail page
        const pageRequestUrl = `${this.serverBaseUrl}/setup/org/orgsetupaudit.jsp?setupid=SecurityEvents`;
        const pageResponse = await fetch(pageRequestUrl, {
            method: 'GET',
            headers: {
                Cookie: `sid=${this.sessionId};`
            }
        });

        const auditTrailPageContent = await pageResponse.text();

        const confirmationTokenMatch = /<a href="\/servlet\/servlet\.SetupAuditTrail\?id=.+?&amp;_CONFIRMATIONTOKEN=(.+?)" target="_top">download<\/a>/.exec(auditTrailPageContent);
        if (!confirmationTokenMatch) {
            return Result.fail('Failed to find _CONFIRMATIONTOKEN in Audit Trail page.');
        }
        const confirmationToken = confirmationTokenMatch[1];

        // Request the Audit Trail file
        const auditTrailRequestUrl = `${this.serverBaseUrl}/servlet/servlet.SetupAuditTrail?id=${orgId}&_CONFIRMATIONTOKEN=${confirmationToken}&isdtp=p1`;
        const auditTrailResponse = await fetch(auditTrailRequestUrl, {
            method: 'GET',
            headers: {
                Cookie: `sid=${this.sessionId};`
            }
        });

        const auditTrailContent = await auditTrailResponse.text();

        const parseResult = Papa.parse(auditTrailContent, {
            header: true,
            delimiter: ',',
            skipEmptyLines: true
        });

        return Result.success(parseResult.data as Array<AuditLogEntry>);
    }
}