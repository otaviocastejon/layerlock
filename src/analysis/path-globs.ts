import path from "node:path";
import picomatch from "picomatch";

/** Relative POSIX path from `root` to `absoluteFile`, or `null` if outside `root`. */
export function relativePosixWithinRoot(root: string, absoluteFile: string): string | null {
  const rel = path.relative(root, absoluteFile).replace(/\\/g, "/");
  if (rel.startsWith("..") || rel === "") return null;
  return rel;
}

export function matchesAnyGlob(relPath: string, globs: readonly string[] | undefined): boolean {
  if (!globs?.length) return false;
  return globs.some((g) => picomatch(g, { dot: true })(relPath));
}
