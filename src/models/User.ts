export default interface User {
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
}