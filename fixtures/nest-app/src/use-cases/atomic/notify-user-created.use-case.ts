import { Injectable } from "@nestjs/common";

/** Small side-effect step composed by orchestration flows. */
@Injectable()
export class NotifyUserCreatedUseCase {
  async execute(userId: string): Promise<void> {
    void userId;
  }
}
