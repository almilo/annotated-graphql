import sinon from 'sinon';
import request from 'request';
import RestSchemaAnnotation from './rest-schema-annotation';

const httpHeaders = {
    'User-Agent': 'annotated-graphql'
};

describe('RestSchemaAnnotation', function () {
    describe('onBuildImplementation()', function () {
        it('should add a resolver function to the field bar of the type foo', function () {
            const restSchemaAnnotation = new RestSchemaAnnotation('foo', 'bar'), implementation = {};

            restSchemaAnnotation.onBuildImplementation(implementation);

            implementation.foo.bar.should.be.Function();
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
                    typeName: 'Foo',
                    fieldName: undefined,
                    basicAuthorization: 'foo:bar'
                }
            ]);
        });
    });

    describe('field annotation resolver', function () {
        let resolver, restSchemaAnnotation;

        beforeEach(function () {
            const implementation = {};

            restSchemaAnnotation = new RestSchemaAnnotation('foo', 'bar');
            restSchemaAnnotation.onBuildImplementation(implementation);

            resolver = implementation.foo.bar;

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
    });

    function extendWithDefaults(args) {
        return Object.assign({}, {json: true, headers: httpHeaders}, args);
    }
});
