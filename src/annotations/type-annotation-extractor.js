import RegexpAnnotationExtractor from './regexp-annotation-extractor';

export default class extends RegexpAnnotationExtractor {
    constructor(annotationTypeName, AnnotationClass) {
        super(`@${annotationTypeName}\\s*\\(([\\s|\\S]*?)\\)\\s*(type\\s*(\\w*)\\s*\{[\\s|\\S]*?\\})`, extractorFactory);

        function extractorFactory(annotations) {
            return function (match, attributes, typeDeclaration, typeName) {
                const annotation = new AnnotationClass(typeName);

                Object.assign(annotation, eval(`({${attributes}})`));
                annotations.push(annotation);

                return typeDeclaration;
            }
        }
    }
}
