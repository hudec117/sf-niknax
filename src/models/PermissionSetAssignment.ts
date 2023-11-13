import type UserLicense from './UserLicense';

export default interface PermissionSetAssignment {
    AssigneeId: string;
    PermissionSetId: string;

    License: UserLicense;
}