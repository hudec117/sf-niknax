import type PermissionSet from './PermissionSet';

export default interface PermissionSetFLSEntry {
    permissionSet: PermissionSet;
    readAccess?: boolean;
    editAccess?: boolean;

    loading: boolean;
}