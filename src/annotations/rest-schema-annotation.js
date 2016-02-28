import { Client } from 'node-rest-client';
import FieldAnnotationExtractor  from './field-annotation-extractor';

const restClient = new Client();

export default class RestSchemaAnnotation {
    static createExtractor() {
        return new FieldAnnotationExtractor('rest', RestSchemaAnnotation);
    }

    constructor(typeName, fieldName) {
        this.typeName = typeName;
        this.fieldName = fieldName;
    }

    onBuildImplementation(schemaImplementation) {
        const type = getOrCreate(schemaImplementation, this.typeName);

        type[this.fieldName] = createResolver(restClient, this);
    }

    onAnnotateTypes(schemaTypes) {
        // noop
    }
}

function createResolver(restClient, restSchemaAnnotation) {
    const resolver = (source, graphqlArgs) => {
        const clientMethod = restClient[restSchemaAnnotation.method || 'get'],
            restArgs = {
                headers: {'User-Agent': 'annotated-graphql'},
                parameters: filterEmptyParameters(graphqlArgs, restSchemaAnnotation.parameters || Object.keys(graphqlArgs))
            };

        return new Promise(resolve => {
                clientMethod(restSchemaAnnotation.url, restArgs, responseData => {
                    const result = restSchemaAnnotation.resultField ? responseData[restSchemaAnnotation.resultField] : responseData;

                    return resolve(result)
                });
            }
        );
    };

    resolver.restClient = restClient;

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
