import * as sinon from 'sinon';
import * as request from 'request';
import RestSchemaAnnotation from './rest-schema-annotation';
import { GraphQLFieldResolversMap } from './base-schema-annotation';
import { GraphQLFieldResolveFn } from 'graphql';
import SinonSpy = Sinon.SinonSpy;

describe('RestSchemaAnnotation', function () {
    describe('factory', function () {
        it('should return undefined when the annotation info does not match', function () {
            (RestSchemaAnnotation.factory({ tag: 'foo', arguments: [] }, 'foo', 'bar') === undefined).should.be.ok;
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
            const restSchemaAnnotation = new RestSchemaAnnotation('foo', 'bar');
            const resolvers: GraphQLFieldResolversMap = {};
            const resolversContext = {};

            restSchemaAnnotation.onCreateResolver(resolvers, resolversContext);

            (<any>resolvers).foo.bar.should.be.Function();
        });
    });

    describe('field annotation resolver', function () {
        let getSpy: SinonSpy;
        let postSpy: SinonSpy;
        let resolver: GraphQLFieldResolveFn;
        let restSchemaAnnotation: RestSchemaAnnotation;

        beforeEach(function () {
            const resolvers: GraphQLFieldResolversMap = {}, resolversContext = {};

            restSchemaAnnotation = new RestSchemaAnnotation('foo', 'bar');
            restSchemaAnnotation.onCreateResolver(resolvers, resolversContext);

            resolver = (<any>resolvers).foo.bar;

            getSpy = sinon.stub(request, 'get');
            postSpy = sinon.stub(request, 'post');
        });

        afterEach(function () {
            getSpy.restore();
            postSpy.restore();
        });

        it('should call the GET method without parameters and return all the data', function () {
            restSchemaAnnotation.argumentMap.url = 'http://foo.com/bar';

            const result = resolver(undefined, {});

            getSpy.callArgWith(1, null, 'response', 'foo');

            sinon.assert.calledWith(getSpy, extendWithDefaults({
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

            postSpy.callArgWith(1, null, 'response', { foo: 'foo' });

            sinon.assert.calledWith(postSpy, extendWithDefaults({
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

            getSpy.callArgWith(1, null, 'response', 'foo');

            sinon.assert.calledWith(getSpy, extendWithDefaults({
                url: 'http://foo.com/bar',
                qs: { baz: 'baz' }
            }));

            return result.should.be.fulfilledWith('foo');
        });

        it('should call the GET method with only the non-empty requested parameters and return all the data', function () {
            restSchemaAnnotation.argumentMap.url = 'http://foo.com/bar';
            restSchemaAnnotation.argumentMap.parameters = ['bar', 'baz'];

            const result = resolver(undefined, { foo: 'foo', bar: undefined, baz: 'baz' });

            getSpy.callArgWith(1, null, 'response', 'foo');

            sinon.assert.calledWith(getSpy, extendWithDefaults({
                url: 'http://foo.com/bar',
                qs: { baz: 'baz' }
            }));

            return result.should.be.fulfilledWith('foo');
        });

        it('should call the GET method with replaced url parameters', function () {
            restSchemaAnnotation.argumentMap.url = 'http://example.com/{foo}/{bar}';
            restSchemaAnnotation.argumentMap.parameters = ['foo', 'bar', 'baz'];

            const result = resolver(undefined, { foo: 'foo1', bar: 'bar2', baz: 'baz3' });

            getSpy.callArgWith(1, null, 'response', 'foo');

            sinon.assert.calledWith(getSpy, extendWithDefaults({
                url: 'http://example.com/foo1/bar2',
                qs: { baz: 'baz3' }
            }));

            return result.should.be.fulfilledWith('foo');
        });

        it('should throw an error when no replacement value for url parameter is found', function () {
            restSchemaAnnotation.argumentMap.url = 'http://example.com/{foo}';
            restSchemaAnnotation.argumentMap.parameters = ['bar'];

            (() => resolver(undefined, { bar: 'bar2' })).should.throw(/Replacement value .* 'foo'/);
        });
    });

    function extendWithDefaults(args: Object) {
        return Object.assign({}, { json: true, jar: true }, args);
    }
});
