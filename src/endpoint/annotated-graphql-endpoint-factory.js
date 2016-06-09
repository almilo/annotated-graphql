import graphqlHttp from 'express-graphql';
import { makeExecutableSchema } from 'graphql-tools';
import MapSchemaAnnotation from '../annotations/map-schema-annotation';
import AnnotatedGraphQLSchemaParser from '../schema/annotated-graphql-schema-parser';
import annotatedGraphQLMappingEndpointFactory from './annotated-graphql-mapping-endpoint-factory';

export default class {
    constructor(annotationExtractors) {
        this.annotatedGraphQLSchemaParser = new AnnotatedGraphQLSchemaParser(annotationExtractors);
    }

    createEndpoint(annotatedSchemaText) {
        const {schemaText, schemaAnnotations} = this.annotatedGraphQLSchemaParser.parse(annotatedSchemaText),
            executableSchema = createExecutableSchema(schemaText, createResolvers(schemaAnnotations)),
            mapSchemaAnnotations = schemaAnnotations.filter(schemaAnnotation => schemaAnnotation.tag === MapSchemaAnnotation.TAG);

        return annotatedGraphQLMappingEndpointFactory(
            mapSchemaAnnotations,
            executableSchema,
            graphqlHttp(createEndpointOptionsProvider(executableSchema))
        );
    }
}

function createExecutableSchema(schemaText, resolvers) {
    return makeExecutableSchema({
        typeDefs: schemaText,
        resolvers,
        resolverValidationOptions: {
            requireResolversForNonScalar: false
        }
    });
}

function createEndpointOptionsProvider(executableSchema) {
    return req => ({
        schema: executableSchema,
        pretty: true,
        graphiql: true,
        context: {}
    });
}

function createResolvers(schemaAnnotations) {
    const resolversContext = {};

    return schemaAnnotations.reduce(createResolver, {});

    function createResolver(resolvers, schemaAnnotation) {
        schemaAnnotation.onCreateResolver(resolvers, resolversContext);

        return resolvers;
    }
}
