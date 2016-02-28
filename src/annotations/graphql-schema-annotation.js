import TypeAnnotationExtractor  from './type-annotation-extractor';

export default class GraphQLSchemaAnnotation {
    static createExtractor() {
        return new TypeAnnotationExtractor('graphql', GraphQLSchemaAnnotation);
    }

    constructor(typeName) {
        this.typeName = typeName;
    }

    apply(schemaImplementation) {
        // noop
    }
}
