"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = recomposeObjects;
function recomposeObjects(currentObj, variations) {
    for (const key in variations) {
        if (Object.prototype.hasOwnProperty.call(variations, key)) {
            if (variations[key] === null) {
                // If the value in obj2 is null, delete the key from obj1
                delete currentObj[key];
            }
            else if (isObject(variations[key])) {
                // If the value is an object, handle it recursively
                if (!Object.prototype.hasOwnProperty.call(currentObj, key)) {
                    // If the key doesn't exist in obj1, add it
                    currentObj[key] = {};
                }
                recomposeObjects(currentObj[key], variations[key]);
            }
            else {
                currentObj[key] = variations[key];
            }
        }
    }
}
function isObject(obj) {
    return obj !== null && typeof obj === "object" && !Array.isArray(obj);
}
//# sourceMappingURL=recomposeObjects.helper.js.map