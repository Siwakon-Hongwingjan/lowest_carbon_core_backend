import { Elysia } from "elysia"
import type { AuthenticatedUser } from "../../middlewares/auth"
import { getUserProfile } from "./profile.controller"

type ProfileContext = { user: AuthenticatedUser }

export const profileController = new Elysia({ prefix: "/profile" })
  .get("/", async (ctx: any) => {
    const { user } = ctx as ProfileContext
    return await getUserProfile(user)
  })
