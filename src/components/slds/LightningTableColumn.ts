export default interface LightningTableColumn {
    type: 'text' | 'date';
    identifier: string;
    label: string;
    visible: boolean;

    filter?: string;

    sortDirection?: 'asc' | 'desc';
    onSortDirectionChanged?: (() => void);

    dateFormatter?: ((value: string) => string);
}