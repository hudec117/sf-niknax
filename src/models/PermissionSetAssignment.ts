import type PermissionSet from './PermissionSet';

export default interface PermissionSetAssignment {
    AssigneeId: string;

    PermissionSetId: string;
    PermissionSet?: PermissionSet;
}