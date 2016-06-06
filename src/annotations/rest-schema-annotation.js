import request from 'request';
import RegexpAnnotationExtractor from './extractors/regexp-annotation-extractor';
import TypeAnnotationExtractor  from './extractors/type-annotation-extractor';
import FieldAnnotationExtractor  from './extractors/field-annotation-extractor';

const requestDefaults = {
    headers: {'User-Agent': 'annotated-graphql'},
    json: true,
    jar: true
};

export default class RestSchemaAnnotation {
    static createExtractor() {
        return RegexpAnnotationExtractor.createCombinedExtractor([
            new TypeAnnotationExtractor('rest', RestSchemaAnnotation),
            new FieldAnnotationExtractor('rest', RestSchemaAnnotation)
        ]);
    }

    constructor(typeName, fieldName) {
        this.typeName = typeName;
        this.fieldName = fieldName;
    }

    onCreateResolver(resolvers) {
        const type = getOrCreate(resolvers, this.typeName);

        if (this.fieldName) {
            type[this.fieldName] = this._createResolver(request);
        } else {
            this._applyToRequestDefaults(requestDefaults)
        }
    }

    onAnnotateTypes(schemaTypes) {
        // noop
    }

    _applyToRequestDefaults(requestDefaults) {
        if (this.basicAuthorization) {
            applyBasicAuthorization(this.basicAuthorization, requestDefaults);
        }

        if (this.baseUrl) {
            requestDefaults.baseUrl = this.baseUrl;
        }

        function applyBasicAuthorization(basicAuthorization, requestDefaults) {
            const envVariableName = (basicAuthorization.match(/\{\{(GRAPHQL_.*)\}\}/) || [])[1];

            if (envVariableName) {
                basicAuthorization = process.env[envVariableName];
            }

            Object.assign(requestDefaults, {
                headers: {'Authorization': `Basic ${basicAuthorization}`}
            });
        }
    }

    _createResolver(request) {
        return (source, graphqlArgs) => {
            const method = this.method || 'get',
                clientMethod = request[method],
                nonEmptyParameters = filterEmptyParameters(graphqlArgs, this.parameters || Object.keys(graphqlArgs)),
                {url, parameters} = consumeUrlParameters(this.url, nonEmptyParameters),
                requestArgs = Object.assign({}, requestDefaults, {
                    url,
                    [method === 'get' ? 'qs' : 'body']: parameters
                });

            return new Promise(resolve => {
                    clientMethod(requestArgs, callback.bind(this));

                    function callback(error, response, body) {
                        const result = this.resultField ?
                            body[this.resultField] :
                            body;

                        return resolve(result);
                    }
                }
            );
        };
    }
}

function filterEmptyParameters(sourceParameters, targetParameterNames) {
    return targetParameterNames.reduce(filterEmptyParameter, {});

    function filterEmptyParameter(nonEmptyParameters, parameterName) {
        if (sourceParameters[parameterName] !== undefined) {
            nonEmptyParameters[parameterName] = sourceParameters[parameterName];
        }

        return nonEmptyParameters;
    }
}

function consumeUrlParameters(url, parameters) {
    return {
        url: url.replace(/(\{(.*?)\})/g, createParameterReplacer(parameters)),
        parameters
    };

    function createParameterReplacer(parameters) {
        return (match, parameterTemplate, parameterName) => {
            const parameterValue = parameters[parameterName];

            if (parameterValue === undefined) {
                throw new Error(`Replacement value for url parameter: '${parameterName}' not found.`);
            }
            delete parameters[parameterName];

            return parameterValue;
        };
    }
}

function getOrCreate(containerObject, propertyName) {
    let propertyValue = containerObject[propertyName];

    if (typeof propertyValue != 'object') {
        propertyValue = containerObject[propertyName] = {};
    }

    return propertyValue;
}
