export default class {
    constructor(regexpString, extractorFactory) {
        this.regexp = new RegExp(regexpString, 'gi');
        this.extractorFactory = extractorFactory;
    }

    extract(schemaText, schemaAnnotations) {
        return schemaText.replace(
            this.regexp,
            this.extractorFactory(schemaAnnotations)
        );
    }
}
