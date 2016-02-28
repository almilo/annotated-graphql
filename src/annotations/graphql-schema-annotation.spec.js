import GraphQLSchemaAnnotation from './graphql-schema-annotation';

describe('GraphQLSchemaAnnotation', function () {
    describe('extractor', function () {
        it('should not modify anything when no annotations match', function () {
            const graphqlSchemaAnnotationExtractor = GraphQLSchemaAnnotation.createExtractor(),
                schemaAnnotations = [];

            const schemaText = graphqlSchemaAnnotationExtractor.extract('foo bar', schemaAnnotations);

            schemaText.should.be.equal('foo bar');
            schemaAnnotations.should.be.deepEqual([]);
        });

        it('should extract the matching annotation', function () {
            const graphqlSchemaAnnotationExtractor = GraphQLSchemaAnnotation.createExtractor(),
                schemaAnnotations = [];

            const schemaText = graphqlSchemaAnnotationExtractor.extract(
                '@graphql(role: "query") type Foo { foo() }',
                schemaAnnotations
            );

            schemaText.should.be.equal('type Foo { foo() }');
            schemaAnnotations.should.be.deepEqual([
                {
                    typeName: 'Foo',
                    role: 'query'
                }
            ]);
        });
    });
});
