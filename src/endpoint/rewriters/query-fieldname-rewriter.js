import { Kind, astFromValue } from 'graphql';
import { invariant } from '../../lib';

export default class QueryFieldNameRewriter {
    static apply(mapSchemaAnnotation, clientSchema) {
        if (isQueryType(mapSchemaAnnotation.typeName, clientSchema)) {
            const sourceQueryFieldName = mapSchemaAnnotation.fieldName;

            if (sourceQueryFieldName) {
                const targetQueryFieldName = mapSchemaAnnotation.targetFieldName;

                invariant(targetQueryFieldName, `Invalid map schema annotation. If type is query and field name is present, 'targetFieldName' is required.`);

                return QueryFieldNameRewriter.create(sourceQueryFieldName, targetQueryFieldName, mapSchemaAnnotation.defaultArguments);
            }
        }
    }

    static create(sourceQueryFieldName, targetQueryFieldName, defaultArguments) {
        return function (queryOperationNode) {
            const queryField = selectQueryField(queryOperationNode, sourceQueryFieldName);

            if (queryField) {
                queryField.name.value = targetQueryFieldName;

                if (!queryField.alias) {
                    queryField.alias = {
                        kind: Kind.NAME,
                        value: sourceQueryFieldName
                    };
                }

                if (defaultArguments) {
                    queryField.arguments = applyDefaultArguments(queryField.arguments, defaultArguments);
                }
            }
        };

        function selectQueryField(queryOperationNode, fieldName) {
            const matchingQueryFieldSelections = queryOperationNode.selectionSet.selections.filter(
                selection => selection.name.value === fieldName
            );

            invariant(matchingQueryFieldSelections.length <= 1, `Expected maximum one match but found:'${matchingQueryFieldSelections}'.`);

            return matchingQueryFieldSelections[0];
        }

        function applyDefaultArguments(fieldArguments, defaultArguments) {
            Object.keys(defaultArguments).forEach(maybeAddDefaultArgument);

            return fieldArguments;

            function maybeAddDefaultArgument(defaultArgumentName) {
                if (!hasArgument(fieldArguments, defaultArgumentName)) {
                    fieldArguments.push(createArgument(defaultArgumentName, defaultArguments[defaultArgumentName]));
                }
            }

            function hasArgument(fieldArguments, argumentName) {
                const matchingArguments = fieldArguments.filter(fieldArgument => fieldArgument.name.value === argumentName);

                invariant(matchingArguments.length <= 1, `Expected only one argument with name: '${argumentName}' but found: '${matchingArguments}'`);

                return !!matchingArguments[0];
            }

            function createArgument(name, value) {
                return {
                    kind: Kind.ARGUMENT,
                    name: {
                        kind: Kind.NAME,
                        value: name
                    },
                    value: astFromValue(value)
                };
            }
        }
    }
}

function isQueryType(typeName, clientSchema) {
    const type = clientSchema.getType(typeName);

    invariant(type, `No type specified or type: '${typeName}' not found in schema.`);

    return type === clientSchema.getQueryType();
}
