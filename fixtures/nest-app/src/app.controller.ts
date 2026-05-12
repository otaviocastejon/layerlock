import { Controller, Get } from "@nestjs/common";
import { AppService } from "./app.service";
import { UserRepository } from "./infrastructure/user.repository";

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    /** Anti-pattern: HTTP surface depends on persistence directly instead of a use case. */
    private readonly users: UserRepository,
  ) {}

  @Get()
  getHello(): string {
    void this.users;
    return this.appService.getHello();
  }
}
