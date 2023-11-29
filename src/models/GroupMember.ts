import type Group from './Group';

export default interface GroupMember {
    Id?: string;

    GroupId: string;
    Group?: Group;

    UserOrGroupId: string;
}