
export enum RelationshipJSON{
    OneToOne,
    OneToMany,
    ManyToOne,
    ManyToMany
}

export interface Relationship {
    value: RelationshipJSON;
    viewValue: string;
}

export interface RelationshipField{
    label: string;
    relationship: RelationshipJSON;
    isWeak: boolean;
}
