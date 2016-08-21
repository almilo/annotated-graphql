import { TypeMap, GraphQLFieldResolveFn } from 'graphql';

export type AnnotationArgument = {name: string, value: any};

export type DirectiveInfo = {
    tag: string,
    arguments: Array<AnnotationArgument>
}

export type AnnotationFactory<T> = {
    (directiveInfo: DirectiveInfo, typeName: string, fieldName: string): T
}

export type GraphQLFieldResolversMap = {[key: string]: GraphQLFieldResolveFn};

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
abstract class BaseSchemaAnnotation {
    static asArgumentsMap(argumentsList: Array<AnnotationArgument>): Object {
        return argumentsList.reduce((argumentsMap: {[key: string]: any}, argument: AnnotationArgument) => {
            argumentsMap[argument.name] = argument.value;

            return argumentsMap;
        }, {});
    }

    constructor(protected tag: string, protected typeName: string, protected fieldName: string) {
        // TODO: add validation
    }

    /**
     * This is a lifecycle method which is called to give this annotation the chance of generating a resolver
     *
     * @param resolvers current map of resolvers where to add new resolvers
     * @param resolversContext context object to be used by the resolvers
     */
    onCreateResolver(resolvers: GraphQLFieldResolversMap, resolversContext: Object) {
        // noop
    }

    /**
     * This is a lifecycle method which is called to give this annotation the chance of modfiying the schema types
     * (i.e. adding documentation)
     *
     * @param schemaTypes map of the schema types to annotate
     */
    onAnnotateTypes(schemaTypes: TypeMap) {
        // noop
    }
}

// bug in TS parser not allowing export default abstract...
export default BaseSchemaAnnotation;
