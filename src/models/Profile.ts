import type UserLicense from './UserLicense';

export default interface Profile {
    Id: string;
    Name: string;
    UserLicenseId: string;
    UserLicense: UserLicense;
}