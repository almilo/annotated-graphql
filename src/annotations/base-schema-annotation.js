/**
 * Base class for schema annotations
 *
 * An annotation can be placed in the GraphQL schema at two different levels:
 *  * Type: it will have typeName defined
 *  * Field: it will have typeName and fieldName defined
 *
 *  Note: argument level is not yet supported
 *
 */
export default class BaseSchemaAnnotation {
    static asArgumentsMap(argumentsList) {
        return argumentsList.reduce((argumentsMap, argument) => {
            argumentsMap[argument.name] = argument.value;

            return argumentsMap;
        }, {});
    }

    constructor(tag, typeName, fieldName) {
        // TODO: add validation
        this.tag = tag;
        this.typeName = typeName;
        this.fieldName = fieldName;
    }

    /**
     * This is a lifecycle method which is called to give this annotation the chance of generating a resolver
     *
     * @param resolvers current map of resolvers where to add new resolvers
     * @param resolversContext context object to be used by the resolvers
     */
    onCreateResolver(resolvers, resolversContext) {
        // noop
    }

    /**
     * This is a lifecycle method which is called to give this annotation the chance of modfiying the schema types
     * (i.e. adding documentation)
     *
     * @param schemaTypes map of the schema types to annotate
     */
    onAnnotateTypes(schemaTypes) {
        // noop
    }
}
