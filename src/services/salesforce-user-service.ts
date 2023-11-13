import SalesforceRESTService from './salesforce-rest-service';
import type PermissionSetAssignment from '@/models/PermissionSetAssignment';
import type GroupMember from '@/models/GroupMember';
import ServiceResult from './result';

export default class SalesforceUserService extends SalesforceRESTService {
    isValidEmail(email: string): boolean {
        return /^[a-zA-Z0-9][a-zA-Z0-9._%+-]*@[^.@][a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
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

    async clonePermissionSetAssignments(fromUserId: string, toUserId: string): Promise<ServiceResult> {
        const permissionSetAssignmentQueryResult = await this.query(`SELECT AssigneeId, PermissionSetId FROM PermissionSetAssignment WHERE AssigneeId = '${fromUserId}' AND PermissionSet.IsOwnedByProfile = false`);
        if (!permissionSetAssignmentQueryResult.success) {
            return ServiceResult.fail(permissionSetAssignmentQueryResult.error);
        }

        for (const permissionSetAssignment of (permissionSetAssignmentQueryResult.data as Array<PermissionSetAssignment>)) {
            permissionSetAssignment.AssigneeId = toUserId;
            const clonePermissionSetAssignmentResult = await this.create('PermissionSetAssignment', permissionSetAssignment);
            if (!clonePermissionSetAssignmentResult.success) {
                // TODO: handle
            }
        }

        return ServiceResult.success();
    }

    async cloneGroupMemberships(fromUserId: string, toUserId: string, groupType: string): Promise<ServiceResult> {
        const groupMembershipsQueryResult = await this.query(`SELECT Id, GroupId, UserOrGroupId FROM GroupMember WHERE UserOrGroupId = '${fromUserId}' AND Group.Type = '${groupType}'`);
        if (!groupMembershipsQueryResult.success) {
            return ServiceResult.fail(groupMembershipsQueryResult.error);
        }

        for (const groupMember of (groupMembershipsQueryResult.data as Array<GroupMember>)) {
            groupMember.UserOrGroupId = toUserId;
            const cloneGroupResult = await this.create('GroupMember', groupMember);
            if (!cloneGroupResult.success) {
                // TODO: handle
            }
        }

        return ServiceResult.success();
    }
}