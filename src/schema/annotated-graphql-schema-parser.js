export default class {
    constructor(annotationExtractors) {
        this.annotationExtractors = annotationExtractors;
    }

    parse(annotatedSchemaText) {
        const schemaAnnotations = [];

        return {
            schemaText: extractAnnotations(this.annotationExtractors, annotatedSchemaText, schemaAnnotations),
            schemaAnnotations
        };

        function extractAnnotations(annotationExtractors, annotatedSchemaText, schemaAnnotations) {
            return annotationExtractors
                .reduce(flatten, [])
                .reduce(applyExtractor, annotatedSchemaText);

            function flatten(items, item) {
                if (item.length > 0) {
                    items = items.concat(item);
                } else {
                    items.push(item);
                }

                return items;
            }

            function applyExtractor(schemaText, annotationExtractor) {
                let previousAnnotationCount = schemaAnnotations.length,
                    newSchemaText = annotationExtractor.extract(schemaText, schemaAnnotations);

                while (schemaAnnotations.length > previousAnnotationCount) {
                    previousAnnotationCount = schemaAnnotations.length;
                    newSchemaText = annotationExtractor.extract(newSchemaText, schemaAnnotations);
                }

                return newSchemaText;
            }
        }
    }
}
