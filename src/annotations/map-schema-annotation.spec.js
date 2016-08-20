import { buildSchemaFromTypeDefinitions } from 'graphql-tools';
import MapSchemaAnnotation from './map-schema-annotation';

describe('MapSchemaAnnotation', function () {
    describe('factory', function () {
        it('should return undefined when the annotation info does not match', function () {
            (MapSchemaAnnotation.factory({ tag: 'foo', arguments: [] }) === undefined).should.be.ok;
        });

        it('should create the corresponding annotation', function () {
            const annotation = MapSchemaAnnotation.factory(
                {
                    tag: 'map',
                    arguments: []
                },
                'bar',
                'baz'
            );

            annotation.should.be.instanceof(MapSchemaAnnotation).and
                .deepEqual({
                    tag: 'map',
                    typeName: 'bar',
                    fieldName: 'baz'
                });
        });
    });

    describe('onCreateResolver', function () {
        it('should add a dummy object resolver to the corresponding type', function () {
            const resolvers = {};

            const annotation = new MapSchemaAnnotation('Foo', undefined);
            annotation.onCreateResolver(resolvers);

            resolvers['Foo'].should.be.Object();
        });

        it('should add a dummy resolver to the corresponding field', function () {
            const resolvers = {};

            const annotation = new MapSchemaAnnotation('Foo', 'bar');
            annotation.onCreateResolver(resolvers);

            resolvers['Foo']['bar']().should.be.Object();
        });
    });
});
