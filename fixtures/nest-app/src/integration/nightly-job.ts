import { AppController } from "../app.controller";
import { UserRepository } from "../infrastructure/user.repository";

/**
 * Anti-pattern: “integration” layer reaches into HTTP (presentation) while also touching persistence.
 * Fix: drive this from orchestration use cases or application services, not controllers.
 */
export const nightlyCouplingMarker = [AppController, UserRepository];
