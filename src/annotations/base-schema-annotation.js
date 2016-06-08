export default class BaseSchemaAnnotation {
    constructor(tag, typeName, fieldName) {
        this.tag = tag;
        this.typeName = typeName;
        this.fieldName = fieldName;
    }

    onCreateResolver(resolvers, resolversContext) {
        // noop
    }

    onAnnotateTypes(schemaTypes) {
        // noop
    }
}
