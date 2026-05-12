import type { User } from "../domain/user.js";

/** Outbound port: persistence contract. */
export interface UserRepository {
  findById(id: string): Promise<User | null>;
}
