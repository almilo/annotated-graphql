import { GraphQLSchema } from 'graphql';
import RestSchemaAnnotation from './annotations/rest-schema-annotation';
import AnnotatedGraphQLSchemaFactory from './annotated-graphql-schema-factory';

const annotatedGraphQLSchemaFactory = new AnnotatedGraphQLSchemaFactory(
    [
        RestSchemaAnnotation.createExtractor()
    ]
);

describe('AnnotatedGraphQLSchemaFactory', function () {
    it('should throw an error when the schema is an invalid graphql schema', function () {
        (_ => annotatedGraphQLSchemaFactory.createSchema('')).should.throw(/query must be Object/);
    });

    it('should return a valid executable graphql schema when the schema is a valid executable graphql schema', function () {
        const validGraphQLSchema = `
            type Query {
                foo: String
            }
        `;

        const schema = annotatedGraphQLSchemaFactory.createSchema(validGraphQLSchema);

        schema.should.be.instanceof(GraphQLSchema);
    });

    it('should return a valid executable graphql schema when the schema is a valid annotated graphql schema', function () {
        const validAnnotatedGraphQLSchema = `
            type Query {
                @rest(
                    url: 'http://foo.com'
                )
                foo(): String
            }
        `;

        const schema = annotatedGraphQLSchemaFactory.createSchema(validAnnotatedGraphQLSchema);

        schema.should.be.instanceof(GraphQLSchema);
    });

    it('should throw an error when the annotated graphql schema is not executable', function () {
        const validAnnotatedGraphQLSchema = `
            type Query {
                @rest(
                    url: 'http://foo.com'
                )
                foo(): String

                bar(): String
            }
        `;

        (_ => annotatedGraphQLSchemaFactory.createSchema(validAnnotatedGraphQLSchema)).should.throw(/bar is calculated/);
    });
});
