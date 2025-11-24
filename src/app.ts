import { Elysia } from "elysia"
import cors from "@elysiajs/cors"
import { authController } from "./modules/auth/auth.controller"
import { testController } from "./modules/test/test.controller"
// import { carbonController } from "./modules/carbon/carbon.controller";
// import { activitesController } from "./modules/activities/activities.controller";

export const app = new Elysia()
  .use(
    cors({
      origin: "*",
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  )
  .use(authController)
  .use(testController)
  .get("/health", () => "Lowest Carbon Core Backend")
