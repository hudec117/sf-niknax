export default interface AuditLogEntry {
    Date: string;
    User: string;
    'Source Namespace Prefix': string;
    Action: string;
    Section: string;
    'Delegate User': string;
}