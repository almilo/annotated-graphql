import sinon from 'sinon';
import request from 'request';
import RestSchemaAnnotation from './rest-schema-annotation';

describe('RestSchemaAnnotation', function () {
    describe('factory', function () {
        it('should return undefined when the annotation info does not match', function () {
            (RestSchemaAnnotation.factory({ tag: 'foo', arguments: [] }) === undefined).should.be.ok;
        });

        it('should create the corresponding annotation', function () {
            const annotation = RestSchemaAnnotation.factory(
                {
                    tag: 'rest',
                    arguments: [{ name: 'foo', value: 'bar' }]
                },
                'bar',
                'baz'
            );

            annotation.should.be.instanceof(RestSchemaAnnotation).and
                .deepEqual({
                    tag: 'rest',
                    typeName: 'bar',
                    fieldName: 'baz',
                    argumentMap: {
                        foo: 'bar'
                    }
                });
        });
    });

    describe('onCreateResolver()', function () {
        it('should add a resolver function to the field bar of the type foo', function () {
            const restSchemaAnnotation = new RestSchemaAnnotation('foo', 'bar'),
                resolvers = {}, resolversContext = {};

            restSchemaAnnotation.onCreateResolver(resolvers, resolversContext);

            resolvers.foo.bar.should.be.Function();
        });
    });

    describe('field annotation resolver', function () {
        let resolver, restSchemaAnnotation;

        beforeEach(function () {
            const resolvers = {}, resolversContext = {};

            restSchemaAnnotation = new RestSchemaAnnotation('foo', 'bar');
            restSchemaAnnotation.onCreateResolver(resolvers, resolversContext);

            resolver = resolvers.foo.bar;

            sinon.stub(request, 'get');
            sinon.stub(request, 'post');
        });

        afterEach(function () {
            request.get.restore();
            request.post.restore();
        });

        it('should call the GET method without parameters and return all the data', function () {
            restSchemaAnnotation.argumentMap.url = 'http://foo.com/bar';

            const result = resolver(undefined, {});

            request.get.callArgWith(1, null, 'response', 'foo');

            sinon.assert.calledWith(request.get, extendWithDefaults({
                url: 'http://foo.com/bar',
                qs: {}
            }));

            return result.should.be.fulfilledWith('foo');
        });

        it('should call the POST method with all parameters and return the provided field of the data', function () {
            restSchemaAnnotation.argumentMap.url = 'http://foo.com/bar';
            restSchemaAnnotation.argumentMap.method = 'post';
            restSchemaAnnotation.argumentMap.parameters = ['bar', 'baz'];
            restSchemaAnnotation.argumentMap.resultField = 'foo';

            const result = resolver(undefined, { bar: 'bar', baz: 'baz' });

            request.post.callArgWith(1, null, 'response', { foo: 'foo' });

            sinon.assert.calledWith(request.post, extendWithDefaults({
                url: 'http://foo.com/bar',
                body: {
                    bar: 'bar',
                    baz: 'baz'
                }
            }));

            return result.should.be.fulfilledWith('foo');
        });

        it('should call the GET method with all non-empty parameters and return all the data', function () {
            restSchemaAnnotation.argumentMap.url = 'http://foo.com/bar';
            restSchemaAnnotation.argumentMap.parameters = ['bar', 'baz'];

            const result = resolver(undefined, { bar: undefined, baz: 'baz' });

            request.get.callArgWith(1, null, 'response', 'foo');

            sinon.assert.calledWith(request.get, extendWithDefaults({
                url: 'http://foo.com/bar',
                qs: { baz: 'baz' }
            }));

            return result.should.be.fulfilledWith('foo');
        });

        it('should call the GET method with only the non-empty requested parameters and return all the data', function () {
            restSchemaAnnotation.argumentMap.url = 'http://foo.com/bar';
            restSchemaAnnotation.argumentMap.parameters = ['bar', 'baz'];

            const result = resolver(undefined, { foo: 'foo', bar: undefined, baz: 'baz' });

            request.get.callArgWith(1, null, 'response', 'foo');

            sinon.assert.calledWith(request.get, extendWithDefaults({
                url: 'http://foo.com/bar',
                qs: { baz: 'baz' }
            }));

            return result.should.be.fulfilledWith('foo');
        });

        it('should call the GET method with replaced url parameters', function () {
            restSchemaAnnotation.argumentMap.url = 'http://example.com/{foo}/{bar}';
            restSchemaAnnotation.argumentMap.parameters = ['foo', 'bar', 'baz'];

            const result = resolver(undefined, { foo: 'foo1', bar: 'bar2', baz: 'baz3' });

            request.get.callArgWith(1, null, 'response', 'foo');

            sinon.assert.calledWith(request.get, extendWithDefaults({
                url: 'http://example.com/foo1/bar2',
                qs: { baz: 'baz3' }
            }));

            return result.should.be.fulfilledWith('foo');
        });

        it('should throw an error when no replacement value for url parameter is found', function () {
            restSchemaAnnotation.argumentMap.url = 'http://example.com/{foo}';
            restSchemaAnnotation.argumentMap.parameters = ['bar'];

            (_ => resolver(undefined, { bar: 'bar2' })).should.throw(/Replacement value .* 'foo'/);
        });
    });

    function extendWithDefaults(args) {
        return Object.assign({}, { json: true, jar: true }, args);
    }
});
