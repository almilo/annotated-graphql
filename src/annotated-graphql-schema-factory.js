import { GraphQLSchema } from 'graphql';
import Type from './graph.ql/type';
import parse from './graph.ql/parse';
import AnnotatedGraphQLSchemaParser from './annotated-graphql-schema-parser';

export default class {
    constructor(annotationExtractors) {
        this.annotatedGraphQLSchemaParser = new AnnotatedGraphQLSchemaParser(annotationExtractors);
    }

    createSchema(annotatedSchema) {
        const {schemaText, schemaAnnotations} = this.annotatedGraphQLSchemaParser.parseSchema(annotatedSchema),
            query = Type(
                parse(schemaText),
                createImplementation(schemaAnnotations)
            ).objectTypes['Query'];

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
