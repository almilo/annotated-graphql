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
            schemaDocument = parse(schemaText), schemaImplementation = {};

        buildImplementation(schemaAnnotations, schemaImplementation, schemaDocument);

        const schemaTypes = Type(schemaDocument, schemaImplementation),
            query = schemaTypes.objectTypes[findQueryTypeName(schemaAnnotations) || 'Query'];

        annotateTypes(schemaAnnotations, schemaTypes, schemaDocument);

        return new GraphQLSchema({
            query
        });
    }
}

function buildImplementation(schemaAnnotations, schemaImplementation, schemaDocument) {
    schemaAnnotations.reduce(applySchemaAnnotation, schemaImplementation);

    function applySchemaAnnotation(schemaImplementation, schemaAnnotation) {
        schemaAnnotation.onBuildImplementation(schemaImplementation, schemaDocument);

        return schemaImplementation;
    }
}

function annotateTypes(schemaAnnotations, schemaTypes, schemaDocument) {
    schemaAnnotations.forEach(schemaAnnotation => schemaAnnotation.onAnnotateTypes(schemaTypes, schemaDocument));
}

function findQueryTypeName(schemaAnnotations) {
    const queryAnnotation = schemaAnnotations.find(schemaAnnotation => {
        return schemaAnnotation instanceof GraphQLSchemaAnnotation && schemaAnnotation.role === 'query';
    });

    return queryAnnotation && queryAnnotation.typeName;
}
