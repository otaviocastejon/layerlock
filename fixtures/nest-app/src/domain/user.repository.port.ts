import type { User } from "./user.entity";

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
}
