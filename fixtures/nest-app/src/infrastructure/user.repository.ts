import { Injectable } from "@nestjs/common";
import { User } from "../domain/user.entity";
import type { IUserRepository } from "../domain/user.repository.port";

@Injectable()
export class UserRepository implements IUserRepository {
  async findById(id: string): Promise<User | null> {
    return new User(id, "user@example.com");
  }
}
