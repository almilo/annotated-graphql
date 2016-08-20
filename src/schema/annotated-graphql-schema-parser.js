import { parse, visit } from 'graphql';

/**
 * Given a list of annotation classes, parses a GraphQL schema text and returns a list of the recognised annotations
 */
export default class {
    constructor(annotationClasses) {
        this.annotationFactories = annotationClasses.reduce(asObjectProperty, {});

        function asObjectProperty(annotationFactoriesByTag, annotationClass) {
            annotationFactoriesByTag[annotationClass.TAG] = annotationClass.factory;

            return annotationFactoriesByTag;
        }
    }

    /**
     * Parses a given schema text and extracts the annotations matching the annotation classes
     *
     * @param schemaText the GraphQL schema in text
     * @returns a list with the recognised schema annotations
     */
    parse(schemaText) {
        return extractDirectiveContexts(parse(schemaText))
            .reduce(applyAnnotationFactories(this.annotationFactories), []);

        function extractDirectiveContexts(schemaAst) {
            const directiveContexts = [];

            visit(schemaAst, {
                enter(targetNode, key, parent, path, ancestors) {
                    if (targetNode.directives) {
                        targetNode.directives.forEach(directiveNode => directiveContexts.push({
                            directiveNode,
                            targetNode,
                            ancestorNodes: Array.from(ancestors).reverse()
                        }));
                    }
                }
            });

            return directiveContexts;
        }

        function applyAnnotationFactories(annotationFactories) {
            return (annotations, directiveContext) => {
                const annotationType = directiveContext.directiveNode.name.value;
                const annotationFactory = annotationFactories[annotationType];

                if (annotationFactory) {
                    const directiveInfo = extractDirectiveInfo(directiveContext.directiveNode);
                    const { typeName, fieldName } = extractTypeAndFieldNames(
                        directiveContext.ancestorNodes,
                        directiveContext.targetNode
                    );
                    const annotation = annotationFactory(directiveInfo, typeName, fieldName);

                    if (annotation) {
                        annotations.push(annotation);
                    }
                }

                return annotations;

                function extractDirectiveInfo(directiveNode) {
                    return {
                        tag: directiveNode.name.value,
                        arguments: directiveNode.arguments.map(parseArgument)
                    };
                }

                function extractTypeAndFieldNames(ancestorNodes, targetNode) {
                    const fieldName = targetNode.kind === 'FieldDefinition' ? targetNode.name.value : undefined;
                    const typeNode = fieldName ? findTypeNode(ancestorNodes) : targetNode;
                    const typeName = typeNode.name.value;

                    return { typeName, fieldName };

                    function findTypeNode(ancestorNodes) {
                        return ancestorNodes.find(ancestorNode => ancestorNode.kind.endsWith('TypeDefinition'));
                    }
                }
            }
        }
    }
}

/**
 * Convenience function used when the type needs no coercion
 *
 * @param value any value which will be itself returned without modification
 */
const identity = value => value;

/**
 * Map with the converters supported to convert a GraphQL value to a JS value
 */
const converters = {
    StringValue: identity,
    BooleanValue: identity,
    IntValue: parseInt,
    FloatValue: parseFloat
};

/**
 * Function which, given a GraphQL argument value, returns a JS value or throws an exception if there is no converter
 * for it
 *
 * @param argumentNode AST node with a GraphQL argument value which should be transformed into the corresponding JS value
 * @returns an object with name and value
 */
function parseArgument(argumentNode) {
    return {
        name: argumentNode.name.value,
        value: toJSON(argumentNode.value.kind, argumentNode.value.value)
    };

    function toJSON(kind, value) {
        const converter = converters[kind];

        if (!converter) {
            throw new Error(`Conversion for values of type: '${kind}' not supported.`);
        }

        return converter(value);
    }
}
