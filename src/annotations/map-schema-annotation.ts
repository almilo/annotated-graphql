import { getOrCreate } from '../lib';
import BaseSchemaAnnotation, { AnnotationFactory, DirectiveInfo, GraphQLFieldResolversMap } from './base-schema-annotation';
import { GraphQLFieldResolveFn } from 'graphql';

// TODO: document
export default class MapSchemaAnnotation extends BaseSchemaAnnotation {
    static TAG = 'map';

    static factory: AnnotationFactory<MapSchemaAnnotation> = (directiveInfo: DirectiveInfo,
                                                              typeName: string,
                                                              fieldName: string) => {
        if (directiveInfo.tag === MapSchemaAnnotation.TAG) {
            return new MapSchemaAnnotation(typeName, fieldName);
        }
    };

    constructor(typeName: string, fieldName: string) {
        super(MapSchemaAnnotation.TAG, typeName, fieldName);
    }

    onCreateResolver(resolvers: GraphQLFieldResolversMap, resolversContext: Object) {
        const typeResolver = <{[key: string]: GraphQLFieldResolveFn}>getOrCreate(resolvers, this.typeName);

        // add a dummy resolver to satisfy executable schema constraints
        if (this.fieldName) {
            typeResolver[this.fieldName] = () => ({});
        }
    }
}
