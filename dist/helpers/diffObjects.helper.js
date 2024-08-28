"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = diffObjects;
function diffObjects(obj1, obj2) {
    if (Array.isArray(obj1) && Array.isArray(obj2)) {
        return diffArrays(obj1, obj2);
    }
    else if (isObject(obj1) && isObject(obj2)) {
        return diffObjectsHelper(obj1, obj2);
    }
    else if (obj1 !== obj2) {
        return obj2;
    }
    else {
        return undefined;
    }
}
function diffObjectsHelper(obj1, obj2) {
    const result = {};
    // Check properties in obj1 (to find removed properties)
    for (const key in obj1) {
        if (Object.prototype.hasOwnProperty.call(obj1, key)) {
            if (!Object.prototype.hasOwnProperty.call(obj2, key)) {
                result[key] = null;
            }
        }
    }
    // Check properties in obj2 (to find new or changed properties)
    for (const key in obj2) {
        if (Object.prototype.hasOwnProperty.call(obj2, key)) {
            if (!Object.prototype.hasOwnProperty.call(obj1, key)) {
                // Property is in obj2 but not in obj1, meaning it was added
                result[key] = obj2[key];
            }
            else if (isObject(obj2[key]) && isObject(obj1[key])) {
                // Recursively check for nested objects
                const diff = diffObjects(obj1[key], obj2[key]);
                if (diff !== undefined &&
                    diff !== null &&
                    ((typeof diff === "object" && Object.keys(diff).length > 0) ||
                        Array.isArray(diff))) {
                    result[key] = diff;
                }
            }
            else if (Array.isArray(obj2[key]) && Array.isArray(obj1[key])) {
                // Recursively check for arrays
                const diff = diffArrays(obj1[key], obj2[key]);
                if (diff.length > 0) {
                    result[key] = diff;
                }
            }
            else if (obj2[key] !== obj1[key]) {
                result[key] = obj2[key];
            }
        }
    }
    return result;
}
function diffArrays(arr1, arr2) {
    const result = [];
    const maxLength = Math.max(arr1.length, arr2.length);
    for (let i = 0; i < maxLength; i++) {
        if (i >= arr1.length) {
            // New element in arr2
            result.push(arr2[i]);
        }
        else if (i >= arr2.length) {
            // Element removed in arr2
            result.push(null);
        }
        else if (isObject(arr1[i]) && isObject(arr2[i])) {
            const diff = diffObjects(arr1[i], arr2[i]);
            if (diff !== undefined &&
                diff !== null &&
                ((typeof diff === "object" && Object.keys(diff).length > 0) ||
                    Array.isArray(diff))) {
                result.push(diff);
            }
            else {
                result.push(undefined);
            }
        }
        else if (arr1[i] !== arr2[i]) {
            result.push(arr2[i]);
        }
        else {
            result.push(undefined);
        }
    }
    return result.filter((item) => item !== undefined);
}
function isObject(obj) {
    return obj !== null && typeof obj === "object" && !Array.isArray(obj);
}
//# sourceMappingURL=diffObjects.helper.js.map