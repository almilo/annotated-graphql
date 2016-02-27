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
                (schemaText, annotationExtractor) => annotationExtractor.extract(schemaText, schemaAnnotations),
                annotatedSchemaText
            );
        }
    }
}
