import type EntityDefinition from './EntityDefinition';

export default interface FieldDefinition {
    EntityDefinition: EntityDefinition;

    QualifiedApiName: string;
}