import UserCreateForm from './UserCreateForm';

export default class UserCloneForm extends UserCreateForm {
    clonePermissionSetAssignments = true;
    clonePublicGroupMemberships = true;
    cloneQueueMemberships = true;
    clonePermissionSetLicenseAssignments = true;
}