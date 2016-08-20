import BaseSchemaAnnotation from './base-schema-annotation';
import { getOrCreate } from '../lib';

// TODO: document
export default class MapSchemaAnnotation extends BaseSchemaAnnotation {
    static TAG = 'map';

    static factory = (directiveInfo, typeName, fieldName) => {
        if (directiveInfo.tag === MapSchemaAnnotation.TAG) {
            return new MapSchemaAnnotation(typeName, fieldName);
        }
    };

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
