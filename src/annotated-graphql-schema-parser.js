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
            annotationExtractors = annotationExtractors.reduce((annotationExtractors, annotationExtractor) => {
                if (annotationExtractor.length > 0) {
                    annotationExtractors = annotationExtractors.concat(annotationExtractor);
                } else {
                    annotationExtractors.push(annotationExtractor);
                }

                return annotationExtractors;
            }, []);

            return annotationExtractors.reduce(
                (schemaText, annotationExtractor) => applyExtractor(annotationExtractor, schemaText, schemaAnnotations),
                annotatedSchemaText
            );

            function applyExtractor(annotationExtractor, schemaText, schemaAnnotations) {
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
