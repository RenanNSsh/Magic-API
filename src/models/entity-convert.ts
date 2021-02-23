import { RelationshipField } from './relationship';

export interface EntityConvert{
    name: string;
    basePackage: string;
    appName: string;
    json: string;
    relationships: RelationshipField[];
}
