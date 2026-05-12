import picomatch from "picomatch";
import { relativePosixWithinRoot } from "./path-globs.js";

/** First matching layer wins; layer order follows `Object.keys(layers)`. */
export function assignLayer(
  absoluteFile: string,
  root: string,
  layers: Record<string, string[]>,
): string | null {
  const rel = relativePosixWithinRoot(root, absoluteFile);
  if (rel === null) return null;
  for (const layerName of Object.keys(layers)) {
    const globs = layers[layerName]!;
    for (const g of globs) {
      if (picomatch(g, { dot: true })(rel)) return layerName;
    }
  }
  return null;
}
