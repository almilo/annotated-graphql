import GraphQLSchemaAnnotation from './graphql-schema-annotation';

describe('GraphQLSchemaAnnotation', function () {
    describe('extractor', function () {
        it('should not modify anything when no annotations match', function () {
            const schemaAnnotations = [],
                schemaText = GraphQLSchemaAnnotation.createExtractor().extract(
                    'foo bar',
                    schemaAnnotations
                );

            schemaText.should.be.equal('foo bar');
            schemaAnnotations.should.be.deepEqual([]);
        });

        it('should extract the matching annotations', function () {
            let schemaAnnotations = [],
                schemaText = GraphQLSchemaAnnotation.createExtractor().extract(
                    '@graphql(role: "query") type Foo { foo() }',
                    schemaAnnotations
                );

            schemaText.should.be.equal('type Foo { foo() }');
            schemaAnnotations.should.be.deepEqual([
                {
                    typeName: 'Foo',
                    fieldName: undefined,
                    role: 'query'
                }
            ]);

            schemaAnnotations = [];
            schemaText = GraphQLSchemaAnnotation.createExtractor().extract(
                'type Foo { @graphql(description: "description") foo() }',
                schemaAnnotations
            );

            schemaText.should.be.equal('type Foo {  foo() }');
            schemaAnnotations.should.be.deepEqual([
                {
                    typeName: 'Foo',
                    fieldName: 'foo',
                    description: 'description'
                }
            ]);
        });
    });
});
