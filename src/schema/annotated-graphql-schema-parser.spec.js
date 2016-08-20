import AnnotatedGraphQLSchemaParser from './annotated-graphql-schema-parser';

const factory = (directiveInfo, typeName, fieldName) => Object.assign({ typeName, fieldName }, directiveInfo);

const annotatedGraphQLSchemaParser = new AnnotatedGraphQLSchemaParser([
    class {
        static TAG = 'bar';
        static factory = factory;
    },
    class {
        static TAG = 'baz';
        static factory = factory;
    }
]);

describe.only('AnnotatedGraphQLSchemaParser', function () {
    it('should return no annotations when no annotations are present', function () {
        const schema = `
            type Query {
                foo: String
            }
        `;

        const schemaAnnotations = annotatedGraphQLSchemaParser.parse(schema);

        schemaAnnotations.should.deepEqual([]);
    });

    it('should return no annotations when no annotations are matched', function () {
        const schema = `
            type Query {
                foo: String @foo
            }
        `;

        const schemaAnnotations = annotatedGraphQLSchemaParser.parse(schema);

        schemaAnnotations.should.deepEqual([]);
    });

    it('should return the annotations when the annotations match', function () {
        let schema = `
            type Query {
                foo: String @bar( string: "hello world!", int: 42, float: 32.5, boolean: true )
            }
        `;

        let schemaAnnotations = annotatedGraphQLSchemaParser.parse(schema);

        schemaAnnotations.should.deepEqual([{
            typeName: 'Query',
            fieldName: 'foo',
            tag: 'bar',
            arguments: [
                { name: 'string', value: 'hello world!' },
                { name: 'int', value: 42 },
                { name: 'float', value: 32.5 },
                { name: 'boolean', value: true }
            ]
        }]);

        schema = `
            type Query {
                foo: String
                @bar
            }
        `;

        schemaAnnotations = annotatedGraphQLSchemaParser.parse(schema);

        schemaAnnotations.should.deepEqual([{
            typeName: 'Query',
            fieldName: 'foo',
            tag: 'bar',
            arguments: []
        }]);

        schema = `
            type Query @bar {
                foo: String
            }
        `;

        schemaAnnotations = annotatedGraphQLSchemaParser.parse(schema);

        schemaAnnotations.should.deepEqual([{
            typeName: 'Query',
            fieldName: undefined,
            tag: 'bar',
            arguments: []
        }]);

        schema = `
            type Query {
                foo(id: Int): String
                @bar( foo: "baz" )
            }
        `;

        schemaAnnotations = annotatedGraphQLSchemaParser.parse(schema);

        schemaAnnotations.should.deepEqual([{
            typeName: 'Query',
            fieldName: 'foo',
            tag: 'bar',
            arguments: [{ name: 'foo', value: 'baz' }]
        }]);

        schema = `
            type Query {
                foo(id: Int): String
                @bar( foo: "baz" )
                @baz( baz: "foo" )
            }
        `;

        schemaAnnotations = annotatedGraphQLSchemaParser.parse(schema);

        schemaAnnotations.should.deepEqual([
            {
                typeName: 'Query',
                fieldName: 'foo',
                tag: 'bar',
                arguments: [{ name: 'foo', value: 'baz' }]
            },
            {
                typeName: 'Query',
                fieldName: 'foo',
                tag: 'baz',
                arguments: [{ name: 'baz', value: 'foo' }]
            }
        ]);
    });
});
