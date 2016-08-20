import { buildSchemaFromTypeDefinitions } from 'graphql-tools';
import GraphQLSchemaAnnotation from './graphql-schema-annotation';

describe('GraphQLSchemaAnnotation', function () {
    describe('factory', function () {
        it('should return undefined when the annotation info does not match', function () {
            (GraphQLSchemaAnnotation.factory({ tag: 'foo', arguments: [] }) === undefined).should.be.ok;
        });

        it('should create the corresponding annotation', function () {
            const annotation = GraphQLSchemaAnnotation.factory(
                {
                    tag: 'graphql',
                    arguments: [{ name: 'description', value: 'foo' }]
                },
                'bar',
                'baz'
            );

            annotation.should.be.instanceof(GraphQLSchemaAnnotation).and
                .deepEqual({
                    tag: 'graphql',
                    description: 'foo',
                    typeName: 'bar',
                    fieldName: 'baz'
                });
        });
    });

    describe('onAnnotateTypes', function () {
        it('should add a description to the corresponding type', function () {
            const schema = createSchema('type Foo {bar: String}');

            const annotation = new GraphQLSchemaAnnotation('Foo', undefined, 'bar');
            annotation.onAnnotateTypes(schema.getTypeMap());

            schema.getTypeMap()['Foo'].description.should.equal('bar');
        });

        it('should add a description to the corresponding field', function () {
            const schema = createSchema('type Foo {bar: String}');

            const annotation = new GraphQLSchemaAnnotation('Foo', 'bar', 'baz');
            annotation.onAnnotateTypes(schema.getTypeMap());

            schema.getTypeMap()['Foo'].getFields()['bar'].description.should.equal('baz');
        });
    });
});

function createSchema(schemaText) {
    const fakeSchema = 'type Query {foo: String} schema {query: Query}';

    return buildSchemaFromTypeDefinitions([fakeSchema, schemaText]);
}
