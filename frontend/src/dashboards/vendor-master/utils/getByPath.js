export function getByPath(obj, path, fallback = undefined) {
  return path.split(".").reduce((acc, key) => {
    if (acc === null || acc === undefined) return fallback;
    return acc[key];
  }, obj);
}