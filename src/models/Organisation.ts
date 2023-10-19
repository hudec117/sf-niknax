export default class Organisation {
    defaultLocaleSidKey: string;
    timeZoneSidKey: string;
    languageLocaleKey: string;
    organizationType: string;
    isSandbox: boolean;

    constructor(defaultLocaleSidKey: string, timeZoneSidKey: string, languageLocaleKey: string, organizationType: string, isSandbox: boolean) {
        this.defaultLocaleSidKey = defaultLocaleSidKey;
        this.timeZoneSidKey = timeZoneSidKey;
        this.languageLocaleKey = languageLocaleKey;
        this.organizationType = organizationType;
        this.isSandbox = isSandbox;
    }
}