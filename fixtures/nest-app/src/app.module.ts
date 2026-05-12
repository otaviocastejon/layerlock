import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { UserRepository } from "./infrastructure/user.repository";
import { NotifyUserCreatedUseCase } from "./use-cases/atomic/notify-user-created.use-case";
import { BreakLayeringUseCase } from "./use-cases/atomic/break-layering.use-case";
import { CompleteRegistrationUseCase } from "./use-cases/orchestration/complete-registration.use-case";

@Module({
  imports: [],
  controllers: [AppController],
  providers: [
    AppService,
    UserRepository,
    { provide: "USER_REPO", useExisting: UserRepository },
    NotifyUserCreatedUseCase,
    CompleteRegistrationUseCase,
    BreakLayeringUseCase,
  ],
})
export class AppModule {}
