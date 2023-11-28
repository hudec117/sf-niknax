export default interface LightningTableColumn {
    type: 'text' | 'date';
    identifier: string;
    label: string;
    visible: boolean;
    sortable: boolean;

    dateFormatter?: ((value: string) => string);
}