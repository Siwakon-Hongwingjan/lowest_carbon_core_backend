import jwt, { JwtPayload } from "jsonwebtoken"
import { env } from "../config/env"

export type AuthenticatedUser = {
  userId: string
  lineUserId: string
}

declare module "elysia" {
  type Context = {
    user: AuthenticatedUser
  }
}

type TokenPayload = JwtPayload & AuthenticatedUser

export const unauthorizedBody = {
  success: false,
  message: "Unauthorized",
  status: 401,
} as const

export const authMiddleware = (app: any) =>
  app.derive(({ request, error }: { request: Request; error: (status: number, body: object) => Error }) => {
    const authorization = request.headers.get("authorization")?.trim()

    if (!authorization || !authorization.toLowerCase().startsWith("bearer ")) {
      throw error(401, {
        success: false,
        message: "Unauthorized",
      })
    }

    const token = authorization.slice("bearer ".length).trim()

    try {
      const payload = jwt.verify(token, env.JWT_SECRET) as TokenPayload
      const { userId, lineUserId } = payload

      if (!userId || !lineUserId) {
        throw error(401, {
          success: false,
          message: "Unauthorized",
        })
      }

      return { user: { userId, lineUserId } }
    } catch {
      throw error(401, {
        success: false,
        message: "Invalid token",
      })
    }
  })
