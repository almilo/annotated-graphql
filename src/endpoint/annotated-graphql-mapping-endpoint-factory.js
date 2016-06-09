import request from 'request';
import queryInterceptorFactory from './annotated-graphql-query-interceptor-factory';

export default function (mapSchemaAnnotations, executableSchema, graphqlEndpoint) {
    const endpointUrl = extractEndpointUrl(mapSchemaAnnotations);

    return endpointUrl ?
        createMappingEndpoint(endpointUrl, mapSchemaAnnotations, executableSchema, graphqlEndpoint) :
        graphqlEndpoint;

    function extractEndpointUrl(mapSchemaAnnotations) {
        const endpointUrls = mapSchemaAnnotations
            .map(mapAnnotation => mapAnnotation.endpointUrl)
            .filter(endpoindUrl => !!endpoindUrl);

        if (endpointUrls.length > 1) {
            throw new Error(`Expected maximum one endpoint URL but found: '${endpointUrls}'.`);
        }

        return endpointUrls[0];
    }

    function createMappingEndpoint(endpointUrl, mapSchemaAnnotations, executableSchema, graphqlEndpoint) {
        const queryInterceptor = queryInterceptorFactory(mapSchemaAnnotations, executableSchema);

        return function (req, res) {
            return isJsonAndIsNotIntrospectionQuery(req) ?
                maybeRewriteQueryAndProxyRequest(req, res) :
                graphqlEndpoint.apply(undefined, arguments);

            function maybeRewriteQueryAndProxyRequest(req, res) {
                if (req.body.query) {
                    req.body.query = queryInterceptor(req.body.query);
                }

                request(createProxyRequest(endpointUrl, req), callback);

                function createProxyRequest(url, req) {
                    const method = req.method;

                    return {
                        url,
                        method,
                        [method === 'get' ? 'qs' : 'body']: method === 'get' ? req.query : req.body,
                        json: true
                    };
                }

                function callback(error, response, body) {
                    res.status(response ? response.statusCode : 500).send(error || body);
                }
            }

            function isJsonAndIsNotIntrospectionQuery(req) {
                return req.get('accept').match(/\/json/) && !(req.body.query && req.body.query.match(/query IntrospectionQuery/));
            }
        }
    }
}
