import { Inject, Injectable } from "@nestjs/common";
import type { IUserRepository } from "../../domain/user.repository.port";
import { NotifyUserCreatedUseCase } from "../atomic/notify-user-created.use-case";

/** Orchestrates steps; may depend on atomic use cases (outer → inner). */
@Injectable()
export class CompleteRegistrationUseCase {
  constructor(
    @Inject("USER_REPO") private readonly users: IUserRepository,
    private readonly notify: NotifyUserCreatedUseCase,
  ) {}

  async run(userId: string): Promise<void> {
    await this.users.findById(userId);
    await this.notify.execute(userId);
  }
}
