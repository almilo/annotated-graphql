export default class {
    constructor(annotationExtractors) {
        this.annotationExtractors = annotationExtractors;
    }

    parseSchema(annotatedSchemaText) {
        const schemaAnnotations = [];

        return {
            schemaText: extractAnnotations(this.annotationExtractors, annotatedSchemaText, schemaAnnotations),
            schemaAnnotations
        };

        function extractAnnotations(annotationExtractors, annotatedSchemaText, schemaAnnotations) {
            return annotationExtractors.reduce(
                (schemaText, annotationExtractor) => applyExtractor(annotationExtractor, schemaText, schemaAnnotations),
                annotatedSchemaText
            );

            function applyExtractor(annotationExtractor, schemaText, schemaAnnotations) {
                let previousAnnotationCount = schemaAnnotations.length,
                    newSchemaText = annotationExtractor.extract(schemaText, schemaAnnotations);

                while(schemaAnnotations.length > previousAnnotationCount) {
                    previousAnnotationCount = schemaAnnotations.length;
                    newSchemaText = annotationExtractor.extract(newSchemaText, schemaAnnotations);
                }

                return newSchemaText;
            }
        }
    }
}
