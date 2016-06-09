import { parse, visit, print } from 'graphql';
import QueryFieldNameRewriter from './rewriters/query-fieldname-rewriter';

export default function (mapSchemaAnnotations, clientSchema) {
    const visitor = createQueryRewriteVisitor(mapSchemaAnnotations, clientSchema);

    return function (query) {
        if (query) {
            console.log('QUERY BEFORE:', query);
            query = print(visit(parse(query), visitor));
            console.log('QUERY AFTER:', query);
        }

        return query;
    };

    function createQueryRewriteVisitor(mapSchemaAnnotations, clientSchema) {
        const queryRewriters = mapSchemaAnnotations.reduce(extendQueryRewriters, []);

        return {
            OperationDefinition(operationDefinitionNode) {
                if (operationDefinitionNode.operation === 'query') {
                    queryRewriters.forEach(queryRewriter => queryRewriter(operationDefinitionNode));
                }
            }
        };

        function extendQueryRewriters(queryRewriters, mapSchemaAnnotation) {
            [
                QueryFieldNameRewriter
            ].forEach(rewriterClass => {
                const queryRewriter = rewriterClass.apply(mapSchemaAnnotation, clientSchema);

                if (queryRewriter) {
                    queryRewriters.push(queryRewriter);
                }
            });

            return queryRewriters;
        }
    }
}
