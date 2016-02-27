import { Client } from 'node-rest-client';
import RegexpAnnotationExtractor from '../regexp-annotation-extractor';

const restClient = new Client();

export default class RestSchemaAnnotation {
    static createExtractor() {
        return new RestSchemaAnnotationExtractor();
    }

// TODO: support type extraction
    constructor(typeName = 'Query', fieldName) {
        this.typeName = typeName;
        this.fieldName = fieldName;
    }

    apply(schemaImplementation) {
        const type = getOrCreate(schemaImplementation, this.typeName);

        type[this.fieldName] = createResolver(restClient, this);
    }
}

function createResolver(restClient, restSchemaAnnotation) {
    const resolver = (source, graphqlArgs) => {
        const clientMethod = restClient[restSchemaAnnotation.method || 'get'],
            restArgs = {
                headers: { 'User-Agent': 'annotated-graphql' },
                parameters: filterEmptyParameters(graphqlArgs, restSchemaAnnotation.parameters || Object.keys(graphqlArgs))
            };

        return new Promise(resolve => {
                // TODO: error handling
                // TODO: support multiple result fields
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

class RestSchemaAnnotationExtractor extends RegexpAnnotationExtractor {
    constructor() {
        // TODO: support parent type extraction
        super('@rest\\s*\\(([\\S|\\s]*?)\\)\\s*(.*)\\(', extractorFactory);

        function extractorFactory(schemaAnnotations) {
            return function (match, attributes, fieldName) {
                const restSchemaAnnotation = new RestSchemaAnnotation(undefined, fieldName);

                Object.assign(restSchemaAnnotation, eval(`({${attributes}})`));
                schemaAnnotations.push(restSchemaAnnotation);

                return `${fieldName} (`;
            }
        }
    }
}
