import { TypeMap, GraphQLObjectType } from 'graphql';
import BaseSchemaAnnotation, { DirectiveInfo, AnnotationFactory } from './base-schema-annotation';

/**
 * Schema annotation which allows providing extra information as for instance descriptions
 */
export default class GraphQLSchemaAnnotation extends BaseSchemaAnnotation {
    static TAG = 'graphql';

    static factory: AnnotationFactory<GraphQLSchemaAnnotation> = (directiveInfo: DirectiveInfo,
                                                                  typeName: string,
                                                                  fieldName: string): GraphQLSchemaAnnotation => {
        if (directiveInfo.tag === GraphQLSchemaAnnotation.TAG) {
            const argumentsMap: {description?: string} = BaseSchemaAnnotation.asArgumentsMap(directiveInfo.arguments);

            return new GraphQLSchemaAnnotation(typeName, fieldName, argumentsMap.description);
        }
    };

    description: string;

    constructor(typeName: string, fieldName: string, description?: string) {
        super(GraphQLSchemaAnnotation.TAG, typeName, fieldName);

        this.description = description;
    }

    onAnnotateTypes(schemaTypes: TypeMap) {
        if (this.description) {
            const definition = findDefinition(schemaTypes, this.typeName, this.fieldName);

            if (definition) {
                // description is not in the typings
                (<any>definition).description = this.description;
            }
        }
    }
}

function findDefinition(schemaTypes: TypeMap, typeName: string, fieldName: string) {
    const type = schemaTypes[typeName];

    if (type) {
        return fieldName ? (<GraphQLObjectType>type).getFields()[fieldName] : type;
    }
}
