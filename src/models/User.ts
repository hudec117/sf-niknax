import type Record from './Record';
import type Profile from './Profile';

export default interface User extends Record {
    Id: string;
    FirstName?: string;
    LastName: string;
    Email: string;
    Alias: string;
    Username: string;
    CommunityNickname: string;
    LocaleSidKey: string;
    TimeZoneSidKey: string;
    ProfileId: string;
    UserRoleId?: string;
    LanguageLocaleKey: string;
    EmailEncodingKey: string;
    Profile: Profile;
}