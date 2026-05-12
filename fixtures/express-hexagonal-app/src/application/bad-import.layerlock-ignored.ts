/**
 * Intentionally violates layering (application → adapters), but the path matches
 * `ignoreFileGlobs` in `layerlock.config.ts`, so layerlock skips this file entirely.
 */
import { InMemoryUserRepository } from "../infrastructure/in-memory-user-repository.js";

export function ignoredDemoRepo(): InMemoryUserRepository {
  return new InMemoryUserRepository();
}
