import * as EmailValidator from 'email-validator';

import SalesforceRESTService from './SalesforceRESTService';
import type PermissionSetAssignment from '@/models/PermissionSetAssignment';
import type GroupMember from '@/models/GroupMember';
import { ItemCloneResult, Result } from './Results';
import type Field from '@/models/Field';
import type User from '@/models/User';

export default class SalesforceUserService extends SalesforceRESTService {
    isValidEmail(email: string): boolean {
        return EmailValidator.validate(email);
    }

    isValidFirstName(firstName: string): boolean {
        if (firstName.trim().length === 0) {
            return true;
        }

        return /^[a-zA-Z0-9]+$/.test(firstName);
    }

    isValidLastName(lastName: string): boolean {
        return lastName.trim().length > 0;
    }

    isValidAlias(alias: string): boolean {
        return alias.trim().length > 0;
    }

    isValidNickname(nickname: string): boolean {
        return nickname.trim().length > 0;
    }

    generateAlias(firstName: string, lastName: string): string {
        let alias = '';
        if (firstName.length > 0) {
            alias += firstName[0].toLowerCase();
        }

        return alias + lastName.substring(0, 4).toLowerCase();
    }

    generateUsername(usernamePrefix?: string, domainPrefix?: string): string {
        let username = this.generateRandomString(5, false, true, true);
        if (usernamePrefix) {
            username = `${usernamePrefix}.${username}`;
        }

        let domain = this.generateRandomString(5, false, true, false);
        if (domainPrefix) {
            domain = `${domainPrefix}.${domain}`;
        } else {
            domain += '.com';
        }

        return `${username}@${domain}`;
    }

    generateNickname(): string {
        let generatedNickname = 'User';

        for (let i = 0; i < 20; i++) {
            generatedNickname += Math.floor(Math.random() * 10).toString();
        }

        return generatedNickname;
    }

    private generateRandomString(
        length: number,
        includeUppercase: boolean = true,
        includeLowercase: boolean = true,
        includeNumbers: boolean = true
    ): string {
        const uppercaseCharacters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const lowercaseCharacters = 'abcdefghijklmnopqrstuvwxyz';
        const numberCharacters = '0123456789';

        let allowedCharacters = '';

        if (includeUppercase) {
            allowedCharacters += uppercaseCharacters;
        }
        if (includeLowercase) {
            allowedCharacters += lowercaseCharacters;
        }
        if (includeNumbers) {
            allowedCharacters += numberCharacters;
        }

        if (allowedCharacters.length === 0) {
            console.error('No character types selected for the random string.');
            return '';
        }

        let result = '';

        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * allowedCharacters.length);
            result += allowedCharacters.charAt(randomIndex);
        }

        return result;
    }

    async cloneUser(userId: string, overridenFieldValues: Map<string, unknown>): Promise<Result<User>> {
        const getUserFieldsResult = await this.getObjectFields('User');
        if (!getUserFieldsResult.success) {
            return Result.fail(getUserFieldsResult.error);
        }

        // Get all the original user's field values (apart from the ones given in the form)
        let userFields = getUserFieldsResult.data as Array<Field>;
        userFields = userFields.filter(field => field.createable && !overridenFieldValues.has(field.name));
        const userFieldNames = userFields.map(field => field.name);

        // Get the original user's data
        const origUserQuery = `SELECT ${userFieldNames.join(', ')} FROM User WHERE Id = '${userId}'`;
        const origUserQueryResult = await this.query<User>(origUserQuery);
        if (!origUserQueryResult.success) {
            return Result.fail(origUserQueryResult.error);
        }

        const origUser = origUserQueryResult.guardedData[0];

        // Modify the origUser to include the overridenFieldValues therefore making it the cloned user.
        for (const field of overridenFieldValues.keys()) {
            const value = overridenFieldValues.get(field);

            origUser[field] = value;
        }

        // Create the new User record
        const createUserResult = await this.create('User', origUser);
        if (!createUserResult.success) {
            return Result.fail(createUserResult.error);
        }

        origUser['Id'] = createUserResult.guardedData;

        return Result.success<User>(origUser);
    }

    async clonePermissionSetAssignments(fromUserId: string, toUserId: string): Promise<Result<Array<ItemCloneResult>>> {
        const permissionSetAssignmentQueryResult = await this.query<PermissionSetAssignment>(`SELECT AssigneeId, PermissionSet.Label, PermissionSetId FROM PermissionSetAssignment WHERE AssigneeId = '${fromUserId}' AND PermissionSet.IsOwnedByProfile = false`);
        if (!permissionSetAssignmentQueryResult.success) {
            return Result.fail(permissionSetAssignmentQueryResult.error);
        }

        const cloneResults = new Array<ItemCloneResult>();
        for (const permissionSetAssignment of permissionSetAssignmentQueryResult.guardedData) {
            const cloneResult = new ItemCloneResult(permissionSetAssignment.PermissionSet!.Label, 'Permission Set');

            // Create the new permission set assignment.
            permissionSetAssignment.AssigneeId = toUserId;
            delete permissionSetAssignment.PermissionSet;
            const clonePermissionSetAssignmentResult = await this.create('PermissionSetAssignment', permissionSetAssignment);

            // Create the clone result
            if (!clonePermissionSetAssignmentResult.success) {
                cloneResult.error = clonePermissionSetAssignmentResult.error;
            }
            cloneResults.push(cloneResult);
        }

        return Result.success(cloneResults);
    }

    async cloneGroupMemberships(fromUserId: string, toUserId: string, groupType: string): Promise<Result<Array<ItemCloneResult>>> {
        const groupMembershipsQueryResult = await this.query<GroupMember>(`SELECT Group.Name, GroupId, UserOrGroupId FROM GroupMember WHERE UserOrGroupId = '${fromUserId}' AND Group.Type = '${groupType}'`);
        if (!groupMembershipsQueryResult.success) {
            return Result.fail(groupMembershipsQueryResult.error);
        }

        const cloneResults = new Array<ItemCloneResult>();
        for (const groupMember of groupMembershipsQueryResult.guardedData) {
            const groupTypeLabel = this.getCloneTypeLabelForGroup(groupType);
            const cloneResult = new ItemCloneResult(groupMember.Group!.Name, groupTypeLabel);

            // Create the new group
            groupMember.UserOrGroupId = toUserId;
            delete groupMember.Group;
            const cloneGroupResult = await this.create('GroupMember', groupMember);

            // Create the clone result
            if (!cloneGroupResult.success) {
                cloneResult.error = cloneGroupResult.error;
            }
            cloneResults.push(cloneResult);
        }

        return Result.success(cloneResults);
    }

    private getCloneTypeLabelForGroup(groupType: string): string {
        switch (groupType) {
            case 'Regular':
                return 'Public Group';
            case 'Queue':
                return 'Queue';
            default:
                return groupType;
        }
    }
}