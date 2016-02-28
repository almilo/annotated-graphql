import { GraphQLSchema } from 'graphql';
import Type from './graph.ql/type';
import parse from './graph.ql/parse';
import AnnotatedGraphQLSchemaParser from './annotated-graphql-schema-parser';
import GraphQLSchemaAnnotation from './annotations/graphql-schema-annotation';

export default class {
    constructor(annotationExtractors) {
        this.annotatedGraphQLSchemaParser = new AnnotatedGraphQLSchemaParser(annotationExtractors);
    }

    createSchema(annotatedSchema) {
        const {schemaText, schemaAnnotations} = this.annotatedGraphQLSchemaParser.parseSchema(annotatedSchema),
            query = Type(
                parse(schemaText),
                createImplementation(schemaAnnotations)
            ).objectTypes[findQueryTypeName(schemaAnnotations)];

        return new GraphQLSchema({
            query
        });
    }
}

function createImplementation(schemaAnnotations) {
    return schemaAnnotations.reduce(applySchemaAnnotation, {});

    function applySchemaAnnotation(implementation, schemaAnnotation) {
        schemaAnnotation.apply(implementation);

        return implementation;
    }
}

function findQueryTypeName(schemaAnnotations) {
    const queryAnnotation = schemaAnnotations.find(schemaAnnotation => {
        return schemaAnnotation instanceof GraphQLSchemaAnnotation && schemaAnnotation.role === 'query';
    });

    if (!queryAnnotation) {
        throw new Error('No GraphQL query schema annotation found in schema.');
    }

    return queryAnnotation.typeName;
}
