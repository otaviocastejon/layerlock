import type { Application, NextFunction, Request, Response } from "express";
import type { GetUser } from "../../application/get-user.js";

export function registerUserRoutes(app: Application, getUser: GetUser): void {
  app.get("/api/users/:id", (req: Request, res: Response, next: NextFunction) => {
    void (async () => {
      const id = req.params.id;
      if (!id) {
        res.status(400).send("Missing id");
        return;
      }
      const user = await getUser.run(id);
      if (!user) {
        res.status(404).send("Not found");
        return;
      }
      res.json(user);
    })().catch(next);
  });
}
