import { Injectable } from "@nestjs/common";
import { CompleteRegistrationUseCase } from "../orchestration/complete-registration.use-case";

/**
 * Anti-pattern: an atomic step reaches upward into an orchestration workflow.
 * Fix: lift shared logic to domain, or call only sibling atomic use cases from here.
 */
@Injectable()
export class BreakLayeringUseCase {
  constructor(private readonly registration: CompleteRegistrationUseCase) {}

  async runWrong(userId: string): Promise<void> {
    await this.registration.run(userId);
  }
}
