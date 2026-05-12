import express from "express";
import { GetUser } from "../application/get-user.js";
import { InMemoryUserRepository } from "../infrastructure/in-memory-user-repository.js";
import { registerUserRoutes } from "./http/user-routes.js";

/** Wires ports to adapters for a runnable HTTP surface (fixture stub). */
export function createConfiguredApp(): express.Application {
  const app = express();
  const users = new InMemoryUserRepository();
  const getUser = new GetUser(users);
  registerUserRoutes(app, getUser);
  return app;
}
