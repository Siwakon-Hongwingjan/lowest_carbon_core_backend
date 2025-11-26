import { Elysia } from "elysia"
import { getUserProfile } from "./profile.controller"

export const profileController = new Elysia({ prefix: "/profile" })
  .get("/", async ({ user } : { user : any}) => {
    return await getUserProfile(user!)
  })
