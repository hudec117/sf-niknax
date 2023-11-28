export default interface LightningTableColumn {
    type: 'text' | 'date';
    identifier: string;
    label: string;
    visible: boolean;
    orderable: boolean;

    dateFormatter?: ((value: string) => string);
}