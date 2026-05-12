export type LayerlockErrorCode = "NO_CONFIG" | "INVALID_CLI";

/**
 * Typed error for predictable handling in scripts and tests.
 * Prefer `layerlockCheck()` / `loadArchitectureConfigFile()` which surface these consistently.
 */
export class LayerlockError extends Error {
  readonly code: LayerlockErrorCode;

  constructor(code: LayerlockErrorCode, message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "LayerlockError";
    this.code = code;
  }
}

/** @deprecated Use {@link LayerlockError} */
export const ArchCheckError = LayerlockError;
/** @deprecated Use {@link LayerlockErrorCode} */
export type ArchCheckErrorCode = LayerlockErrorCode;
