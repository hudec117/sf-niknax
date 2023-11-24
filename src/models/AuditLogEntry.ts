export default interface AuditLogEntry {
    Date: string;
    User: boolean;
    'Source Namespace Prefix': boolean;
    Action: string;
    Section: string;
    'Delegate User': string;
}