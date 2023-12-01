export default interface LightningTableColumn {
    type: 'text' | 'date';
    identifier: string;
    label: string;
    visible: boolean;

    filter?: string;

    dateFormatter?: (value: string) => string;
}