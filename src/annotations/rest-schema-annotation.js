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

    onBuildImplementation(schemaImplementation) {
        const type = getOrCreate(schemaImplementation, this.typeName);

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
    const resolver = (source, graphqlArgs) => {
        const method = restSchemaAnnotation.method || 'get',
            payloadField = method === 'get' ? 'qs' : 'body',
            clientMethod = request[method],
            requestArgs = Object.assign({}, requestDefaults, {
                url: restSchemaAnnotation.url,
                [payloadField]: filterEmptyParameters(graphqlArgs, restSchemaAnnotation.parameters || Object.keys(graphqlArgs))
            });

        return new Promise(resolve => {
                clientMethod(requestArgs, (error, response, body) => {
                    const result = restSchemaAnnotation.resultField ?
                        body[restSchemaAnnotation.resultField] :
                        body;

                    return resolve(result)
                });
            }
        );
    };

    return resolver;
}

function filterEmptyParameters(sourceParameters, targetParameterNames) {
    return targetParameterNames.reduce((parameters, parameterName) => {
        if (sourceParameters[parameterName] !== undefined) {
            parameters[parameterName] = sourceParameters[parameterName];
        }

        return parameters;
    }, {})
}

function getOrCreate(containerObject, propertyName) {
    let propertyValue = containerObject[propertyName];

    if (typeof propertyValue != 'object') {
        propertyValue = containerObject[propertyName] = {};
    }

    return propertyValue;
}
