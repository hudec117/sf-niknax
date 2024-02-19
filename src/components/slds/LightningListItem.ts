export default class LightningListItem {
    value: string;
    label: string;
    sublabel?: string;

    constructor(value: string, label: string, sublabel?: string) {
        this.value = value;
        this.label = label;
        this.sublabel = sublabel;
    }
}