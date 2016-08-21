export function getOrCreate(containerObject: {[key: string]: any}, propertyName: string, initialValues?: {[key: string]: any}): {[key: string]: any} {
    let propertyValue = containerObject[propertyName];

    if (!(propertyValue instanceof Object)) {
        propertyValue = containerObject[propertyName] = initialValues ? Object.assign({}, initialValues) : {};
    }

    return propertyValue;
}

export function invariant(condition: any, errorMessage: string) {
    if (!condition) {
        throw new Error(errorMessage);
    }
}
