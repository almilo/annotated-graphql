import GraphQLSchemaAnnotation from './graphql-schema-annotation';

describe('GraphQLSchemaAnnotation', function () {
    describe('extractor', function () {
        it('should not modify anything when no annotations match', function () {
            const graphqlSchemaAnnotationExtractors = GraphQLSchemaAnnotation.createExtractor(),
                schemaAnnotations = [];

            const schemaText = graphqlSchemaAnnotationExtractors.reduce((schemaText, extractor) => {
                return extractor.extract(schemaText, schemaAnnotations);
            }, 'foo bar');

            schemaText.should.be.equal('foo bar');
            schemaAnnotations.should.be.deepEqual([]);
        });

        it('should extract the matching annotations', function () {
            const graphqlSchemaAnnotationExtractors = GraphQLSchemaAnnotation.createExtractor();

            let schemaAnnotations = [], schemaText = graphqlSchemaAnnotationExtractors.reduce((schemaText, extractor) => {
                return extractor.extract(schemaText, schemaAnnotations);
            }, '@graphql(role: "query") type Foo { foo() }');

            schemaText.should.be.equal('type Foo { foo() }');
            schemaAnnotations.should.be.deepEqual([
                {
                    typeName: 'Foo',
                    fieldName: undefined,
                    role: 'query'
                }
            ]);

            schemaAnnotations = [];
            schemaText = graphqlSchemaAnnotationExtractors.reduce((schemaText, extractor) => {
                return extractor.extract(schemaText, schemaAnnotations);
            }, 'type Foo { @graphql(description: "description") foo() }');

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
