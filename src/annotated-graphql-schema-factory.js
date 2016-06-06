import { makeExecutableSchema } from 'graphql-tools';
import AnnotatedGraphQLSchemaParser from './annotated-graphql-schema-parser';

export default class {
    constructor(annotationExtractors) {
        this.annotatedGraphQLSchemaParser = new AnnotatedGraphQLSchemaParser(annotationExtractors);
    }

    createSchema(annotatedSchema) {
        const {schemaText, schemaAnnotations} = this.annotatedGraphQLSchemaParser.parseSchema(annotatedSchema);

        return makeExecutableSchema({
            typeDefs: schemaText,
            resolvers: createResolvers(schemaAnnotations),
            resolverValidationOptions: {
                requireResolversForNonScalar: false
            }
        });
    }
}

function createResolvers(schemaAnnotations) {
    const resolversContext = {};

    return schemaAnnotations.reduce(createResolver, {});

    function createResolver(resolvers, schemaAnnotation) {
        schemaAnnotation.onCreateResolver(resolvers, resolversContext);

        return resolvers;
    }
}
