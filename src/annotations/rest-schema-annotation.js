import request from 'request';
import RegexpAnnotationExtractor from './extractors/regexp-annotation-extractor';
import TypeAnnotationExtractor  from './extractors/type-annotation-extractor';
import FieldAnnotationExtractor  from './extractors/field-annotation-extractor';

const requestDefaults = {
    json: true,
    headers: {'User-Agent': 'annotated-graphql'}
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
            type[this.fieldName] = createResolver(request, this);
        } else {
            apply(requestDefaults, this)
        }
    }

    onAnnotateTypes(schemaTypes) {
        // noop
    }
}

function apply(requestDefaults, restSchemaAnnotation) {
    let basicAuthorization = restSchemaAnnotation.basicAuthorization;

    if (basicAuthorization) {
        const envVariableName = (basicAuthorization.match(/\{\{(GRAPHQL_.*)\}\}/) || [])[1];

        if (envVariableName) {
            basicAuthorization = process.env[envVariableName];
        }

        Object.assign(requestDefaults, {
            headers: {'Authorization': `Basic ${basicAuthorization}`},
            jar: true
        });
    }
}

function createResolver(request, restSchemaAnnotation) {
    return (source, graphqlArgs) => {
        const method = restSchemaAnnotation.method || 'get',
            clientMethod = request[method],
            nonEmptyParameters = filterEmptyParameters(graphqlArgs, restSchemaAnnotation.parameters || Object.keys(graphqlArgs)),
            {url, parameters} = consumeUrlParameters(restSchemaAnnotation.url, nonEmptyParameters),
            requestArgs = Object.assign({}, requestDefaults, {
                url,
                [method === 'get' ? 'qs' : 'body']: parameters
            });

        return new Promise(resolve => {
                clientMethod(requestArgs, callback);

                function callback(error, response, body) {
                    const result = restSchemaAnnotation.resultField ?
                        body[restSchemaAnnotation.resultField] :
                        body;

                    return resolve(result);
                }
            }
        );
    };
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
