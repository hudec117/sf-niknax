import type PermissionSet from './PermissionSet';

export default interface PermissionSetFLSEntry {
    permissionSet: PermissionSet;
    readAccess?: boolean;
    editAccess?: boolean;

    pinned: boolean;
    loading: boolean;
}