import { core } from "@acme/domain/core.js";
import { secret } from "@acme/infra/secret.js";

export const app = `${core}-${secret}`;
