import { Elysia } from "elysia"
import { prisma } from "../db/prisma"

const createCustomer = async () => {
  const newUser = await prisma.user.create({
    data: {
      lineUserId: "test_" + Math.random().toString(36).substring(2, 10),
    },
  })

  return {
    success: true,
    message: "User created successfully!",
    newUser,
  }
}

export const testController = new Elysia()
  .group("/test", (app) =>
    app.get("/customer", async ({ set }: { set: { status?: number } }) => {
      try {
        return await createCustomer()
      } catch (e) {
        set.status = 500
        return {
          success: false,
          error: e instanceof Error ? e.message : e,
        }
      }
    }),
  )
  .get("/customer", async ({ set }: { set: { status?: number } }) => {
    try {
      return await createCustomer()
    } catch (e) {
      set.status = 500
      return {
        success: false,
        error: e instanceof Error ? e.message : e,
      }
    }
  })
