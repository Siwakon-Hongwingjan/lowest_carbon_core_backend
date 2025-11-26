import { Elysia } from "elysia"
import { loginWithLine } from "./auth.service"
import { LoginBody, loginBodySchema } from "./auth.schema"

export const authController = new Elysia({ prefix: "/auth" }).post(
  "/line",
  async ({ body }: { body: LoginBody }) => {
    const result = await loginWithLine(body)
    return result
  },
  {
    body: loginBodySchema,
  },
)
