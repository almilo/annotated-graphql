import BaseSchemaAnnotation from './base-schema-annotation';

/**
 * Schema annotation which allows providing extra information as for instance descriptions
 */
export default class GraphQLSchemaAnnotation extends BaseSchemaAnnotation {
    static TAG = 'graphql';

    static factory = (directiveInfo, typeName, fieldName) => {
        if (directiveInfo.tag === GraphQLSchemaAnnotation.TAG) {
            const argumentsMap = BaseSchemaAnnotation.asArgumentsMap(directiveInfo.arguments);

            return new GraphQLSchemaAnnotation(typeName, fieldName, argumentsMap.description);
        }
    };

    constructor(typeName, fieldName, description) {
        super(GraphQLSchemaAnnotation.TAG, typeName, fieldName);

        this.description = description;
    }

    onAnnotateTypes(schemaTypes) {
        super.onAnnotateTypes(schemaTypes);

        if (this.description) {
            const definition = findDefinition(schemaTypes, this.typeName, this.fieldName);

            if (definition) {
                definition.description = this.description;
            }
        }
    }
}

function findDefinition(schemaTypes, typeName, fieldName) {
    const type = schemaTypes[typeName];

    if (type) {
        return fieldName ? type.getFields()[fieldName] : type;
    }
}
