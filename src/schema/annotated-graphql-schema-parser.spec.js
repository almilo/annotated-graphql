import { GraphQLSchema } from 'graphql';
import RestSchemaAnnotation from '../annotations/rest-schema-annotation';
import AnnotatedGraphQLSchemaParser from './annotated-graphql-schema-parser';

const annotatedGraphQLSchemaParser = new AnnotatedGraphQLSchemaParser(
    [
        RestSchemaAnnotation.createExtractor()
    ]
);

describe('AnnotatedGraphQLSchemaParser', function () {
    it('should return the same schema and no annotations when no annotations match', function () {
        const validGraphQLSchema = `
            type Query {
                foo: String
            }
        `;

        const {schemaText, schemaAnnotations} =  annotatedGraphQLSchemaParser.parse(validGraphQLSchema);

        schemaText.should.equal(validGraphQLSchema);
        schemaAnnotations.should.deepEqual([]);
    });

    it('should return a schema without annotations and the annotations when the annotations match', function () {
        const validAnnotatedGraphQLSchema = `type Query { @rest( url: 'http://foo.com' ) foo(): String }`;

        const {schemaText, schemaAnnotations} =  annotatedGraphQLSchemaParser.parse(validAnnotatedGraphQLSchema);

        schemaText.should.equal(`type Query {  foo(): String }`);
        schemaAnnotations.should.have.length(1);
        schemaAnnotations[0].should.be.instanceOf(RestSchemaAnnotation);
    });
});
