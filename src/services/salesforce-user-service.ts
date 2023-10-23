import SalesforceRESTService from './salesforce-rest-service';

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
}