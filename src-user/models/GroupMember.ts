export default class GroupMember {
    groupId: string;
    userOrGroupId: string;
    id?: string;

    constructor(groupId: string, userOrGroupId: string, id?: string) {
        this.groupId = groupId;
        this.userOrGroupId = userOrGroupId;
        this.id = id;
    }
}