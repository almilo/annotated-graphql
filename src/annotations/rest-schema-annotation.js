import request from 'request';
import DataLoader from 'dataloader';
import BaseSchemaAnnotation from './base-schema-annotation';
import RegexpAnnotationExtractor from './extractors/regexp-annotation-extractor';
import TypeAnnotationExtractor  from './extractors/type-annotation-extractor';
import FieldAnnotationExtractor  from './extractors/field-annotation-extractor';
import { getOrCreate, invariant }  from '../lib';

const requestDefaultsInitialValues = {
    json: true,
    jar: true
};

export default class RestSchemaAnnotation extends BaseSchemaAnnotation {
    static TAG = 'rest';

    static createExtractor() {
        return RegexpAnnotationExtractor.createCombinedExtractor([
            new TypeAnnotationExtractor(RestSchemaAnnotation.TAG, RestSchemaAnnotation),
            new FieldAnnotationExtractor(RestSchemaAnnotation.TAG, RestSchemaAnnotation)
        ]);
    }

    constructor(typeName, fieldName) {
        super(RestSchemaAnnotation.TAG, typeName, fieldName);
    }

    onCreateResolver(resolvers, resolversContext) {
        super.onCreateResolver(resolvers, resolversContext);

        const type = getOrCreate(resolvers, this.typeName),
            requestDefaults = getOrCreate(resolversContext, '_requestDefaults', requestDefaultsInitialValues);

        if (this.fieldName) {
            type[this.fieldName] = this._createResolver(request, requestDefaults);
        } else {
            this._applyToRequestDefaults(requestDefaults)
        }
    }

    _applyToRequestDefaults(requestDefaults) {
        if (this.basicAuthorization) {
            applyBasicAuthorization(this.basicAuthorization, requestDefaults);
        }

        if (this.baseUrl) {
            requestDefaults.baseUrl = this.baseUrl;
        }

        function applyBasicAuthorization(basicAuthorization, requestDefaults) {
            basicAuthorization = processEnvVariables(basicAuthorization);

            Object.assign(requestDefaults, {
                headers: {'Authorization': `Basic ${basicAuthorization}`}
            });

            function processEnvVariables(basicAuthorization) {
                const envVariableName = (basicAuthorization.match(/\{\{(.*)\}\}/) || [])[1];

                return envVariableName ? process.env[envVariableName] : basicAuthorization;
            }
        }
    }

    _createResolver(request, requestDefaults) {
        return (root, args, context) => {
            const nonEmptyParameters = filterEmptyParameters(args, this.parameters || Object.keys(args)),
                {url, parameters} = consumeUrlParameters(this.url, nonEmptyParameters),
                dataLoader = getDataLoader(context),
                requestKey = {
                    method: this.method || 'get',
                    url,
                    parameters,
                    resultField: this.resultField
                };

            return dataLoader ? dataLoader.load(requestKey) : makeRequest(requestKey);

            function makeRequest({method, url, parameters, resultField}) {
                const requestArgs = Object.assign({}, requestDefaults, {
                    url,
                    [method === 'get' ? 'qs' : 'body']: parameters
                });

                return new Promise(resolve => request[method](requestArgs, (error, response, body) => {
                    return resolve(resultField ? body[resultField] : body);
                }));
            }

            function getDataLoader(context) {
                if (context) {
                    let restDataLoader = context._restDataLoader;

                    if (!restDataLoader) {
                        restDataLoader = new DataLoader(
                            keys => Promise.all(keys.map(makeRequest)),
                            {
                                cacheKeyFn: serializeRequestKey
                            }
                        );

                        context._restDataLoader = restDataLoader;
                    }

                    return restDataLoader;
                } else {
                    console.info('No context provided to REST annotation resolver, so no REST data loader used.');
                }
            }

            function serializeRequestKey({method, url, parameters, resultField}) {
                const serializedParameters = Object.keys(parameters)
                    .map(parameterName => `${parameterName}=${parameters[parameterName]}`)
                    .join(':');

                return `${method}:${url}:${serializedParameters}:${resultField}`;
            }
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

            invariant(parameterValue !== undefined, `Replacement value for url parameter: '${parameterName}' not found.`);
            
            delete parameters[parameterName];

            return parameterValue;
        };
    }
}
