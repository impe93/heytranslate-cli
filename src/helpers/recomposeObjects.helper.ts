export default function recomposeObjects(
  currentObj: Record<string, unknown>,
  variations: Record<string, unknown>
) {
  for (const key in variations) {
    if (Object.prototype.hasOwnProperty.call(variations, key)) {
      if (variations[key] === null) {
        // If the value in obj2 is null, delete the key from obj1
        delete currentObj[key];
      } else if (isObject(variations[key])) {
        // If the value is an object, handle it recursively
        if (!Object.prototype.hasOwnProperty.call(currentObj, key)) {
          // If the key doesn't exist in obj1, add it
          currentObj[key] = {};
        }
        recomposeObjects(
          currentObj[key] as Record<string, unknown>,
          variations[key]
        );
      } else {
        currentObj[key] = variations[key];
      }
    }
  }
}

function isObject(obj: unknown): obj is Record<string, unknown> {
  return obj !== null && typeof obj === "object" && !Array.isArray(obj);
}
