import type { User } from "../domain/user.js";
import type { UserRepository } from "../ports/user-repository.port.js";

/** Application service orchestrating a port + domain model. */
export class GetUser {
  constructor(private readonly users: UserRepository) {}

  run(id: string): Promise<User | null> {
    return this.users.findById(id);
  }
}
