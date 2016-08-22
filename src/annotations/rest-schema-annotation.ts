import * as request from 'request';
import { RequestAPI, RequiredUriUrl, CoreOptions, Request } from 'request';
import * as DataLoader from 'dataloader';
import { GraphQLFieldResolveFn } from 'graphql';
import { getOrCreate, invariant } from '../lib';
import BaseSchemaAnnotation, {
    AnnotationFactory,
    DirectiveInfo,
    GraphQLFieldResolversMap
} from './base-schema-annotation';

// TODO: workaround for import problem with es6 class exported as default
interface IDataLoader {
    load(key: Object): any;
}

const requestDefaultsInitialValues = {
    json: true,
    jar: true
};

export type IArgumentMap =  {
    baseUrl?: string,
    basicAuthorization?: string,
    url?: string,
    parameters?: Array<string>,
    method?: string,
    resultField?: string
};

// TODO: document
export default class RestSchemaAnnotation extends BaseSchemaAnnotation {
    static TAG = 'rest';

    static factory: AnnotationFactory<RestSchemaAnnotation> = (directiveInfo: DirectiveInfo,
                                                               typeName: string,
                                                               fieldName: string): RestSchemaAnnotation => {
        if (directiveInfo.tag === RestSchemaAnnotation.TAG) {
            return new RestSchemaAnnotation(typeName, fieldName, BaseSchemaAnnotation.asArgumentsMap(directiveInfo.arguments));
        }
    };

    argumentMap: IArgumentMap;

    constructor(typeName: string, fieldName: string, argumentMap: IArgumentMap = {}) {
        super(RestSchemaAnnotation.TAG, typeName, fieldName);
        this.argumentMap = argumentMap;
    }

    onCreateResolver(resolvers: GraphQLFieldResolversMap, resolversContext: Object): void {
        const typeResolver = <{[key: string]: GraphQLFieldResolveFn}>getOrCreate(resolvers, this.typeName);
        const requestDefaults = getOrCreate(resolversContext, '_requestDefaults', requestDefaultsInitialValues);

        if (this.fieldName) {
            typeResolver[this.fieldName] = this._createResolver(request, requestDefaults);
        } else {
            this._applyToRequestDefaults(requestDefaults);
        }
    }

    private _applyToRequestDefaults(requestDefaults: {baseUrl?: string}): void {
        if (this.argumentMap.basicAuthorization) {
            applyBasicAuthorization(this.argumentMap.basicAuthorization, requestDefaults);
        }

        if (this.argumentMap.baseUrl) {
            requestDefaults.baseUrl = this.argumentMap.baseUrl;
        }

        function applyBasicAuthorization(basicAuthorization: string, requestDefaults: Object): void {
            basicAuthorization = processEnvVariables(basicAuthorization);

            Object.assign(requestDefaults, {
                headers: { 'Authorization': `Basic ${basicAuthorization}` }
            });

            function processEnvVariables(basicAuthorization: string): string {
                const envVariableName: string = (basicAuthorization.match(/\{\{(.*)\}\}/) || [])[1];

                return envVariableName ? process.env[envVariableName] : basicAuthorization;
            }
        }
    }

    private _createResolver(request: RequestAPI<Request, CoreOptions, RequiredUriUrl>, requestDefaults: Object): GraphQLFieldResolveFn {
        return (source, args, context) => {
            const nonEmptyParameters = filterEmptyParameters(args, this.argumentMap.parameters || Object.keys(args));
            const { url, parameters } = consumeUrlParameters(this.argumentMap.url, nonEmptyParameters);
            const dataLoader = getDataLoader(context);
            const requestKey = {
                method: this.argumentMap.method || 'get',
                url,
                parameters,
                resultField: this.argumentMap.resultField
            };

            return dataLoader ? dataLoader.load(requestKey) : makeRequest(requestKey);

            function makeRequest({ method, url, parameters, resultField }) {
                const requestArgs = Object.assign(
                    {},
                    requestDefaults,
                    { url, [method === 'get' ? 'qs' : 'body']: parameters }
                );

                return new Promise(resolve => {
                    if (method === 'get') {
                        request.get(requestArgs, callback);
                    } else {
                        request.post(requestArgs, callback);
                    }

                    function callback(error: string, response: Object, body: {[key: string]: any}) {
                        resolve(resultField ? body[resultField] : body);
                    }
                });
            }

            function getDataLoader(context?: {_restDataLoader: IDataLoader}): IDataLoader {
                if (context) {
                    let restDataLoader = context._restDataLoader;

                    if (!restDataLoader) {
                        restDataLoader = new DataLoader(
                            keys => Promise.all(keys.map(makeRequest)),
                            { cacheKeyFn: serializeRequestKey }
                        );

                        context._restDataLoader = restDataLoader;
                    }

                    return restDataLoader;
                } else {
                    console.info('No context provided to REST annotation resolver, so no REST data loader used.');
                }
            }

            function serializeRequestKey({ method, url, parameters, resultField }): string {
                const serializedParameters = Object.keys(parameters)
                    .map(parameterName => `${parameterName}=${parameters[parameterName]}`)
                    .join(':');

                return `${method}:${url}:${serializedParameters}:${resultField}`;
            }
        };
    }
}

function filterEmptyParameters(sourceParameters: {[key: string]: any}, targetParameterNames: Array<string>) {
    return targetParameterNames.reduce(filterEmptyParameter, {});

    function filterEmptyParameter(nonEmptyParameters: {[key: string]: any}, parameterName: string) {
        if (sourceParameters[parameterName] !== undefined) {
            nonEmptyParameters[parameterName] = sourceParameters[parameterName];
        }

        return nonEmptyParameters;
    }
}

function consumeUrlParameters(url: string, parameters: {[key: string]: any}) {
    return {
        url: url.replace(/(\{(.*?)\})/g, createParameterReplacer(parameters)),
        parameters
    };

    function createParameterReplacer(parameters: {[key: string]: any}) {
        return (match: string, parameterTemplate: string, parameterName: string) => {
            const parameterValue = parameters[parameterName];

            invariant(parameterValue !== undefined, `Replacement value for url parameter: '${parameterName}' not found.`);

            delete parameters[parameterName];

            return parameterValue;
        };
    }
}
