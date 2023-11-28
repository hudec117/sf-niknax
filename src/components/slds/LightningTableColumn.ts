export default interface LightningTableColumn {
    type: 'text' | 'date';
    identifier: string;
    label: string;
    visible: boolean;

    sortDirection?: 'asc' | 'desc';
    onSortDirectionChanged?: (() => void);

    dateFormatter?: ((value: string) => string);
}