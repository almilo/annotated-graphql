import { Kind, astFromValue } from 'graphql';
import { getType } from '../../lib';

export default class QueryFieldNameRewriter {
    static apply(mapSchemaAnnotation, clientSchema) {
        if (getType(mapSchemaAnnotation, clientSchema) === clientSchema.getQueryType()) {
            const sourceQueryFieldName = mapSchemaAnnotation.fieldName;

            if (sourceQueryFieldName) {
                const targetQueryFieldName = mapSchemaAnnotation.targetFieldName;

                if (!targetQueryFieldName) {
                    throw new Error(`Invalid map schema annotation. If type is query and field name is present, 'targetFieldName' is required.`);
                }

                return QueryFieldNameRewriter.create(sourceQueryFieldName, targetQueryFieldName, mapSchemaAnnotation.defaultArguments);
            }
        }
    }

    static create(sourceQueryFieldName, targetQueryFieldName, defaultArguments) {
        return function (queryOperationNode) {
            const queryField = selectQueryField(queryOperationNode, sourceQueryFieldName);

            if (queryField) {
                queryField.name.value = targetQueryFieldName;

                queryField.alias = {
                    kind: Kind.NAME,
                    value: sourceQueryFieldName
                };


                if (defaultArguments) {
                    queryField.arguments = applyDefaultArguments(queryField.arguments, defaultArguments);
                }
            }
        };

        function selectQueryField(queryOperationNode, fieldName) {
            const matchingQueryFieldSelections = queryOperationNode.selectionSet.selections.filter(
                selection => selection.name.value === fieldName
            );

            if (matchingQueryFieldSelections.length > 1) {
                throw new Error(`Expected maximum one match but found:'${matchingQueryFieldSelections}'.`);
            }

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

                // TODO: extract invariants
                if (matchingArguments.length > 1) {
                    throw new Error(`Expected only one argument with name: '${argumentName}' but found: '${matchingArguments}'`);
                }

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
