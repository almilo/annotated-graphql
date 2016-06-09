import BaseSchemaAnnotation from './base-schema-annotation';
import RegexpAnnotationExtractor from './extractors/regexp-annotation-extractor';
import TypeAnnotationExtractor  from './extractors/type-annotation-extractor';
import FieldAnnotationExtractor  from './extractors/field-annotation-extractor';
import { getOrCreate } from '../lib';

export default class MapSchemaAnnotation extends BaseSchemaAnnotation {
    static TAG = 'map';

    static createExtractor() {
        return RegexpAnnotationExtractor.createCombinedExtractor([
            new TypeAnnotationExtractor(MapSchemaAnnotation.TAG, MapSchemaAnnotation),
            new FieldAnnotationExtractor(MapSchemaAnnotation.TAG, MapSchemaAnnotation)
        ]);
    }

    constructor(typeName, fieldName) {
        super(MapSchemaAnnotation.TAG, typeName, fieldName);
    }

    onCreateResolver(resolvers, resolversContext) {
        const type = getOrCreate(resolvers, this.typeName);

        // add a dummy resolver to satisfy executable schema constraints
        if (this.fieldName) {
            type[this.fieldName] = () => ({});
        }
    }
}
