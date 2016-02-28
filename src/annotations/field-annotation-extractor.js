import RegexpAnnotationExtractor from './regexp-annotation-extractor';

export default class extends RegexpAnnotationExtractor {
    constructor(annotationTypeName, AnnotationClass) {
        super(
            `\\btype\\s*(\\w*)\\s*\\{[^}]*?(@${annotationTypeName}\\s*\\(([\\s|\\S]*?)\\))\\s*(@\\w*\\s*\\([\\s|\\S]*?\\)\\s*)*(\\w*).*`,
            extractorFactory
        );

        function extractorFactory(annotations) {
            return function (match, typeName, wholeAnnotation, attributes, otherAnnotations, fieldName) {
                const annotation = new AnnotationClass(typeName, fieldName);

                Object.assign(annotation, eval(`({${attributes}})`));
                annotations.push(annotation);

                return match.replace(wholeAnnotation, '');
            }
        }
    }
}
