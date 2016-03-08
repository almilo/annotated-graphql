export default class {
    static createCombinedExtractor(extractors) {
        return {
            extract
        };

        function extract(schemaText, schemaAnnotations) {
            if (!extractors.length) {
                extractors = [extractors];
            }

            return extractors.reduce(applyExtractor, schemaText);

            function applyExtractor(schemaText, extractor) {
                let annotationsBefore = schemaAnnotations.length - 1;

                while (annotationsBefore < schemaAnnotations.length) {
                    annotationsBefore = schemaAnnotations.length;
                    schemaText = extractor.extract(schemaText, schemaAnnotations);
                }

                return schemaText;
            }
        }
    }

    constructor(regexpString, extractorFactory) {
        this.regexp = new RegExp(regexpString, 'g');
        this.extractorFactory = extractorFactory;
    }

    extract(schemaText, schemaAnnotations) {
        return schemaText.replace(
            this.regexp,
            this.extractorFactory(schemaAnnotations)
        );
    }
}
