import { GraphQLSchema } from 'graphql';
import RestSchemaAnnotation from './annotations/rest-schema-annotation';
import AnnotatedGraphQLSchemaFactory from './annotated-graphql-schema-factory';

const annotatedGraphQLSchemaFactory = new AnnotatedGraphQLSchemaFactory(
    [
        RestSchemaAnnotation.createExtractor()
    ]
);

describe('AnnotatedGraphQLSchemaFactory', function () {
    it('should throw an error when the schema text is not valid', function () {
        (_ => annotatedGraphQLSchemaFactory.createSchema('')).should.throw(/Must provide typeDefinitions/);

        (_ => annotatedGraphQLSchemaFactory.createSchema('foo')).should.throw(/Syntax Error GraphQL/);

        (_ => annotatedGraphQLSchemaFactory.createSchema(`
            type Query {
                foo: String
            }
        `)).should.throw(/Must provide a schema definition/);
    });

    it('should return a valid schema when the schema text is valid', function () {
        const validGraphQLSchema = `
            type Query {
                foo: String
            }
            
            schema {
                query: Query
            }
        `;

        const schema = annotatedGraphQLSchemaFactory.createSchema(validGraphQLSchema);

        schema.should.be.instanceof(GraphQLSchema);
    });

    it('should return a valid schema when the schema text is a valid annotated schema', function () {
        const validAnnotatedGraphQLSchema = `
            type Query {
                @rest(
                    url: 'http://foo.com'
                )
                foo(id: Int): String
            }

            schema {
                query: Query
            }
        `;

        const schema = annotatedGraphQLSchemaFactory.createSchema(validAnnotatedGraphQLSchema);

        schema.should.be.instanceof(GraphQLSchema);
    });

    it('should throw an error when the annotated schema text is not executable', function () {
        const validAnnotatedGraphQLSchema = `
            type Query {
                @rest(
                    url: 'http://foo.com'
                )
                foo(id: Int): String

                bar(id: Int): String
            }

            schema {
                query: Query
            }
        `;

        (_ => annotatedGraphQLSchemaFactory.createSchema(validAnnotatedGraphQLSchema)).should.throw(/Resolve function missing for "Query.bar"/);
    });

    it('should not throw an error when the annotated schema has non-scalar types without resolvers', function () {
        const validAnnotatedGraphQLSchema = `
            type Bar {
                 name: String
            }
                 
            type Foo {
                 bar: Bar
            }
                 
            type Query {
                 @rest(
                     url: 'http://foo.com'
                 )
                 foos(id: Int): [Foo]
             }
 
             schema {
                 query: Query
             }
         `;

        (_ => annotatedGraphQLSchemaFactory.createSchema(validAnnotatedGraphQLSchema)).should.not.throw;
    });
});
