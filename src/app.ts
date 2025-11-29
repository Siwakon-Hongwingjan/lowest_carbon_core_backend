import { Elysia } from "elysia"
import cors from "@elysiajs/cors"
import { authController } from "./modules/auth/auth.controller"
import { authMiddleware } from "./middlewares/auth"
import { activitiesController } from "./modules/activities/activities.controller"
import { carbonController } from "./modules/carbon/carbon.controller"
import { aiController } from "./modules/ai/ai.controller"
import { testController } from "./modules/test/test.controller"
import { pointController } from "./modules/point/point.controller"
import { rewardsPrivateController } from "./modules/rewards/rewards.controller"
import { rewardsPublicController } from "./modules/rewards/rewards.controller"
import { profileController } from "./modules/profile/profile.service"
import { metaController } from "./modules/meta/meta.controller"
import { storageController } from "./modules/storage/storage.controller"
import { lineController } from "./modules/line/line.controller"

export const app = new Elysia()
  .use(
    cors({
      origin: "*",
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      maxAge: 600,
    })
  )
  .get("/health", () => "Lowest Carbon ElysiaJS")
  .use(lineController)
  .use(authController) // public
  .use(rewardsPublicController)
  .use(authMiddleware) // protected below
  .get("/me", ({ user }: { user?: any }) => ({ message: "Authenticated", user }))
  .use(activitiesController)
  .use(aiController)
  .use(carbonController)
  .use(pointController)
  .use(rewardsPrivateController)
  .use(profileController)
  .use(testController)
  .use(metaController)
  .use(storageController)
