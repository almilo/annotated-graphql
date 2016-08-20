import RestSchemaAnnotation from '../annotations/rest-schema-annotation';
import AnnotatedGraphQLEndpointFactory from './annotated-graphql-endpoint-factory';

const annotatedGraphQLEndpointFactory = new AnnotatedGraphQLEndpointFactory([RestSchemaAnnotation]);

describe('AnnotatedGraphQLEndpointFactory', function () {
    it('should throw an error when the schema text is not valid', function () {
        (_ => annotatedGraphQLEndpointFactory.createEndpoint('foo')).should.throw(/Syntax Error GraphQL/);

        (_ => annotatedGraphQLEndpointFactory.createEndpoint(`
            type Query {
                foo: String
            }
        `)).should.throw(/Must provide a schema definition/);
    });

    it('should return a valid endpoint when the schema text is valid', function () {
        const validGraphQLSchema = `
            type Query {
                foo: String
            }
            
            schema {
                query: Query
            }
        `;

        const endpoint = annotatedGraphQLEndpointFactory.createEndpoint(validGraphQLSchema);

        endpoint.should.be.instanceof(Function);
    });

    it('should return a valid endpoint when the schema text is a valid annotated schema', function () {
        const validAnnotatedGraphQLSchema = `
            type Query {
                foo(id: Int): String
                @rest(
                    url: "http://foo.com"
                )
            }

            schema {
                query: Query
            }
        `;

        const endpoint = annotatedGraphQLEndpointFactory.createEndpoint(validAnnotatedGraphQLSchema);

        endpoint.should.be.instanceof(Function);
    });

    it('should throw an error when the annotated schema text is not executable', function () {
        const validAnnotatedGraphQLSchema = `
            type Query {
                foo(id: Int): String
                @rest(
                    url: "http://foo.com"
                )

                bar(id: Int): String
            }

            schema {
                query: Query
            }
        `;

        (_ => annotatedGraphQLEndpointFactory.createEndpoint(validAnnotatedGraphQLSchema)).should.throw(/Resolve function missing for "Query.bar"/);
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
                 foos(id: Int): [Foo]
                 @rest(
                     url: "http://foo.com"
                 )
             }
 
             schema {
                 query: Query
             }
         `;

        (_ => annotatedGraphQLEndpointFactory.createEndpoint(validAnnotatedGraphQLSchema)).should.not.throw;
    });
});
