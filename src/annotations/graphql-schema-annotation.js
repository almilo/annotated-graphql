import TypeAnnotationExtractor  from './type-annotation-extractor';
import FieldAnnotationExtractor  from './field-annotation-extractor';

export default class GraphQLSchemaAnnotation {
    static createExtractor() {
        return [
            new TypeAnnotationExtractor('graphql', GraphQLSchemaAnnotation),
            new FieldAnnotationExtractor('graphql', GraphQLSchemaAnnotation)
        ];
    }

    constructor(typeName, fieldName) {
        this.typeName = typeName;
        this.fieldName = fieldName;
    }

    onBuildImplementation(schemaImplementation) {
        // noop
    }

    onAnnotateTypes(schemaTypes) {
        if (this.description) {
            const itemNode = findNode(schemaTypes, this.typeName, this.fieldName);

            if (itemNode) {
                // TODO: description does not work for fields
                itemNode.description = this.description;
            } else {
                console.log(`Document node for 'typeName': ${this.typeName}, 'fieldName': ${fieldName}.`);
            }
        }
    }
}

function findNode(schemaTypes, typeName, fieldName) {
    const type = schemaTypes.objectTypes[typeName];

    if (type) {
        if (fieldName) {
            return type['_typeConfig'].fields()[fieldName];
        } else {
            return type;
        }
    }
}