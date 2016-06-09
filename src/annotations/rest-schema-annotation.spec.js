import sinon from 'sinon';
import request from 'request';
import RestSchemaAnnotation from './rest-schema-annotation';

describe('RestSchemaAnnotation', function () {
    describe('onCreateResolver()', function () {
        it('should add a resolver function to the field bar of the type foo', function () {
            const restSchemaAnnotation = new RestSchemaAnnotation('foo', 'bar'),
                resolvers = {}, resolversContext = {};

            restSchemaAnnotation.onCreateResolver(resolvers, resolversContext);

            resolvers.foo.bar.should.be.Function();
        });
    });

    describe('extract()', function () {
        it('should not modify anything when no annotations match', function () {
            const restSchemaAnnotationExtractor = RestSchemaAnnotation.createExtractor(),
                schemaAnnotations = [];

            const schemaText = restSchemaAnnotationExtractor.extract('foo bar', schemaAnnotations);

            schemaText.should.be.equal('foo bar');
            schemaAnnotations.should.be.deepEqual([]);
        });

        it('should extract the matching field annotation', function () {
            const restSchemaAnnotationExtractor = RestSchemaAnnotation.createExtractor(),
                schemaAnnotations = [];

            const schemaText = restSchemaAnnotationExtractor.extract(
                'type Foo { @rest(url:"http://foo.com")foo() }',
                schemaAnnotations
            );

            schemaText.should.be.equal('type Foo { foo() }');
            schemaAnnotations.should.be.deepEqual([
                {
                    tag: 'rest',
                    typeName: 'Foo',
                    fieldName: 'foo',
                    url: 'http://foo.com'
                }
            ]);
        });

        it('should extract the matching type annotation', function () {
            const restSchemaAnnotationExtractor = RestSchemaAnnotation.createExtractor(),
                schemaAnnotations = [];

            const schemaText = restSchemaAnnotationExtractor.extract(
                '@rest(url:"http://foo.com") type Foo { foo() }',
                schemaAnnotations
            );

            schemaText.should.be.equal('type Foo { foo() }');
            schemaAnnotations.should.be.deepEqual([
                {
                    tag: 'rest',
                    typeName: 'Foo',
                    fieldName: undefined,
                    url: 'http://foo.com'
                }
            ]);
        });

        it('should extract the basic authorization information', function () {
            const restSchemaAnnotationExtractor = RestSchemaAnnotation.createExtractor(),
                schemaAnnotations = [];

            const schemaText = restSchemaAnnotationExtractor.extract(
                '@rest(basicAuthorization:"foo:bar") type Foo { foo() }',
                schemaAnnotations
            );

            schemaText.should.be.equal('type Foo { foo() }');
            schemaAnnotations.should.be.deepEqual([
                {
                    tag: 'rest',
                    typeName: 'Foo',
                    fieldName: undefined,
                    basicAuthorization: 'foo:bar'
                }
            ]);
        });

        it('should extract the base URL information', function () {
            const restSchemaAnnotationExtractor = RestSchemaAnnotation.createExtractor(),
                schemaAnnotations = [];

            const schemaText = restSchemaAnnotationExtractor.extract(
                '@rest(baseUrl:"http://web.com") type Foo { foo() }',
                schemaAnnotations
            );

            schemaText.should.be.equal('type Foo { foo() }');
            schemaAnnotations.should.be.deepEqual([
                {
                    tag: 'rest',
                    typeName: 'Foo',
                    fieldName: undefined,
                    baseUrl: 'http://web.com'
                }
            ]);
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
            restSchemaAnnotation.url = 'http://foo.com/bar';

            const result = resolver(undefined, {});

            request.get.callArgWith(1, null, 'response', 'foo');

            sinon.assert.calledWith(request.get, extendWithDefaults({
                url: 'http://foo.com/bar',
                qs: {}
            }));

            return result.should.be.fulfilledWith('foo');
        });

        it('should call the POST method with all parameters and return the provided field of the data', function () {
            restSchemaAnnotation.url = 'http://foo.com/bar';
            restSchemaAnnotation.method = 'post';
            restSchemaAnnotation.parameters = ['bar', 'baz'];
            restSchemaAnnotation.resultField = 'foo';

            const result = resolver(undefined, {bar: 'bar', baz: 'baz'});

            request.post.callArgWith(1, null, 'response', {foo: 'foo'});

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
            restSchemaAnnotation.url = 'http://foo.com/bar';
            restSchemaAnnotation.parameters = ['bar', 'baz'];

            const result = resolver(undefined, {bar: undefined, baz: 'baz'});

            request.get.callArgWith(1, null, 'response', 'foo');

            sinon.assert.calledWith(request.get, extendWithDefaults({
                url: 'http://foo.com/bar',
                qs: {baz: 'baz'}
            }));

            return result.should.be.fulfilledWith('foo');
        });

        it('should call the GET method with only the non-empty requested parameters and return all the data', function () {
            restSchemaAnnotation.url = 'http://foo.com/bar';
            restSchemaAnnotation.parameters = ['bar', 'baz'];

            const result = resolver(undefined, {foo: 'foo', bar: undefined, baz: 'baz'});

            request.get.callArgWith(1, null, 'response', 'foo');

            sinon.assert.calledWith(request.get, extendWithDefaults({
                url: 'http://foo.com/bar',
                qs: {baz: 'baz'}
            }));

            return result.should.be.fulfilledWith('foo');
        });

        it('should call the GET method with replaced url parameters', function () {
            restSchemaAnnotation.url = 'http://example.com/{foo}/{bar}';
            restSchemaAnnotation.parameters = ['foo', 'bar', 'baz'];

            const result = resolver(undefined, {foo: 'foo1', bar: 'bar2', baz: 'baz3'});

            request.get.callArgWith(1, null, 'response', 'foo');

            sinon.assert.calledWith(request.get, extendWithDefaults({
                url: 'http://example.com/foo1/bar2',
                qs: {baz: 'baz3'}
            }));

            return result.should.be.fulfilledWith('foo');
        });

        it('should throw an error when no replacement value for url parameter is found', function () {
            restSchemaAnnotation.url = 'http://example.com/{foo}';
            restSchemaAnnotation.parameters = ['bar'];

            (_ => resolver(undefined, {bar: 'bar2'})).should.throw(/Replacement value .* 'foo'/);
        });
    });

    function extendWithDefaults(args) {
        return Object.assign({}, {json: true, jar: true}, args);
    }
});
