export default class Group {
    id: string;
    name: string;
    developerName: string;

    constructor(id: string, name: string, developerName: string) {
        this.id = id;
        this.name = name;
        this.developerName = developerName;
    }
}