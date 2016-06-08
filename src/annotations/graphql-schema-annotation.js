import BaseSchemaAnnotation from './base-schema-annotation';
import RegexpAnnotationExtractor  from './extractors/regexp-annotation-extractor';
import TypeAnnotationExtractor  from './extractors/type-annotation-extractor';
import FieldAnnotationExtractor  from './extractors/field-annotation-extractor';

const annotationTag = 'graphql';

export default class GraphQLSchemaAnnotation extends BaseSchemaAnnotation {
    static createExtractor() {
        return RegexpAnnotationExtractor.createCombinedExtractor([
            new TypeAnnotationExtractor(annotationTag, GraphQLSchemaAnnotation),
            new FieldAnnotationExtractor(annotationTag, GraphQLSchemaAnnotation)
        ]);
    }

    constructor(typeName, fieldName) {
        super(annotationTag, typeName, fieldName);
    }

    onAnnotateTypes(schemaTypes) {
        super.onAnnotateTypes(schemaTypes);
        
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
