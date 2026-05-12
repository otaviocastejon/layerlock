import type { User } from "../domain/user.js";
import type { UserRepository } from "../ports/user-repository.port.js";

/** Adapter implementation of the persistence port (in-memory stub). */
export class InMemoryUserRepository implements UserRepository {
  private readonly store = new Map<string, User>();

  async findById(id: string): Promise<User | null> {
    return this.store.get(id) ?? null;
  }
}
