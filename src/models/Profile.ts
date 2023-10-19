export default class Profile {
    id: string;
    name: string;
    userLicenseId: string;
    userLicenseName: string;

    constructor(id: string, name: string, userLicenseId: string, userLicenseName: string) {
        this.id = id;
        this.name = name;
        this.userLicenseId = userLicenseId;
        this.userLicenseName = userLicenseName;
    }
}