import sinon from 'sinon';
import RestSchemaAnnotation from './rest-schema-annotation';

const httpHeaders = {
    'User-Agent': 'annotated-graphql'
};

describe('RestSchemaAnnotation', function () {
    describe('apply()', function () {
        it('should add a resolver function to the field bar of the type foo', function () {
            const restSchemaAnnotation = new RestSchemaAnnotation('foo', 'bar'), implementation = {};

            restSchemaAnnotation.apply(implementation);

            implementation.foo.bar.should.be.Function();
        });
    });

    describe('extractor', function () {
        it('should not modify anything when no annotations match', function () {
            const restSchemaAnnotationExtractor = RestSchemaAnnotation.createExtractor(),
                schemaAnnotations = [];

            const schemaText = restSchemaAnnotationExtractor.extract('foo bar', schemaAnnotations);

            schemaText.should.be.equal('foo bar');
            schemaAnnotations.should.be.deepEqual([]);
        });

        it('should extract the matching annotation', function () {
            const restSchemaAnnotationExtractor = RestSchemaAnnotation.createExtractor(),
                schemaAnnotations = [];

            const schemaText = restSchemaAnnotationExtractor.extract(
                '@rest(url:"http://foo.com")foo()',
                schemaAnnotations
            );

            schemaText.should.be.equal('foo ()');
            schemaAnnotations.should.be.deepEqual([
                {
                    fieldName: 'foo',
                    typeName: 'Query',
                    url: 'http://foo.com'
                }
            ]);
        });
    });

    describe('resolver', function () {
        let resolver, restSchemaAnnotation, restClient;

        beforeEach(function () {
            const implementation = {};

            restSchemaAnnotation = new RestSchemaAnnotation('foo', 'bar');
            restSchemaAnnotation.apply(implementation);

            resolver = implementation.foo.bar;

            if (!restClient) {
                restClient = resolver.restClient;
                sinon.stub(restClient, 'get');
                sinon.stub(restClient, 'post');
            }

            restClient.get.reset();
            restClient.post.reset();
        });

        it('should call the GET method without parameters and return all the data', function () {
            restSchemaAnnotation.url = 'http://foo.com/bar';

            const result = resolver(undefined, {});

            restClient.get.callArgWith(2, 'foo');

            sinon.assert.calledWith(restClient.get, 'http://foo.com/bar', extendWithDefaults({parameters: {}}));

            return result.should.be.fulfilledWith('foo');
        });

        it('should call the POST method with all parameters and return the provided field of the data', function () {
            const restClient = resolver.restClient;

            restSchemaAnnotation.url = 'http://foo.com/bar';
            restSchemaAnnotation.method = 'post';
            restSchemaAnnotation.parameters = ['bar', 'baz'];
            restSchemaAnnotation.resultField = 'foo';

            const result = resolver(undefined, {bar: 'bar', baz: 'baz'});

            restClient.post.callArgWith(2, {foo: 'foo'});

            sinon.assert.calledWith(restClient.post, 'http://foo.com/bar', extendWithDefaults({parameters: {bar: 'bar', baz: 'baz'}}));

            return result.should.be.fulfilledWith('foo');
        });

        it('should call the GET method with all non-empty parameters and return all the data', function () {
            const restClient = resolver.restClient;

            restSchemaAnnotation.url = 'http://foo.com/bar';
            restSchemaAnnotation.parameters = ['bar', 'baz'];

            const result = resolver(undefined, {bar: undefined, baz: 'baz'});

            restClient.get.callArgWith(2, 'foo');

            sinon.assert.calledWith(restClient.get, 'http://foo.com/bar', extendWithDefaults({parameters: {baz: 'baz'}}));

            return result.should.be.fulfilledWith('foo');
        });

        it('should call the GET method with only the non-empty requested parameters and return all the data', function () {
            const restClient = resolver.restClient;

            restSchemaAnnotation.url = 'http://foo.com/bar';
            restSchemaAnnotation.parameters = ['bar', 'baz'];

            const result = resolver(undefined, {foo: 'foo', bar: undefined, baz: 'baz'});

            restClient.get.callArgWith(2, 'foo');

            sinon.assert.calledWith(restClient.get, 'http://foo.com/bar', extendWithDefaults({parameters: {baz: 'baz'}}));

            return result.should.be.fulfilledWith('foo');
        });
    });

    function extendWithDefaults(restClientArgs) {
        return Object.assign({}, {headers: httpHeaders}, restClientArgs);
    }
});
