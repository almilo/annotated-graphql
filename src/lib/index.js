export function getOrCreate(containerObject, propertyName, initialValues) {
    let propertyValue = containerObject[propertyName];

    if (typeof propertyValue != 'object') {
        propertyValue = containerObject[propertyName] = initialValues ? Object.assign({}, initialValues) : {};
    }

    return propertyValue;
}

export function getType(schemaAnnotation, clientSchema) {
    const type = schemaAnnotation.typeName && clientSchema.getTypeMap()[schemaAnnotation.typeName];

    if (!type) {
        throw new Error(`No type specified in map schema annotation or type: '${typeName}' not found in schema.`);
    }

    return type;
}
