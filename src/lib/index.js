export function getOrCreate(containerObject, propertyName, initialValues) {
    let propertyValue = containerObject[propertyName];

    if (typeof propertyValue != 'object') {
        propertyValue = containerObject[propertyName] = initialValues ? Object.assign({}, initialValues) : {};
    }

    return propertyValue;
}

export function invariant(condition, errorMessage) {
    if (!condition) {
        throw new Error(errorMessage);
    }
}
