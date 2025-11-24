import { Elysia } from "elysia"
import {loginWithLine } from "./auth.service"
import { LoginSchema } from "./auth.schema"

export const authController = new Elysia({ prefix: "/auth" }).post(
  "/line",
  async ({ body }: { body: any }) => {
    return await loginWithLine(body)
  },
  {
    body: LoginSchema,
  },
)
