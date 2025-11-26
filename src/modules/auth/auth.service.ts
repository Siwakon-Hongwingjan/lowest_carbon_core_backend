import jwt from "jsonwebtoken"
import { env } from "../../config/env"
import { prisma } from "../db/prisma"
import { LoginBody } from "./auth.schema"

if (!env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required for auth service")
}

export async function loginWithLine({ userId }: LoginBody) {
  if (!userId || typeof userId !== "string") {
    throw new Error("userId is required")
  }

  // upsert ตรงนี้เลย
  const user = await prisma.user.upsert({
    where: { lineUserId: userId },   // ต้องมี @unique ใน schema
    create: { lineUserId: userId },
    update: {},
  })

  const token = jwt.sign(
    {
      userId: user.id,
      lineUserId: user.lineUserId,
    },
    env.JWT_SECRET,
    { expiresIn: "30d" }
  )

  return {
    success: true,
    message: "Logged in with Line",
    user: {
      id: user.id,
      lineUserId: user.lineUserId,
    },
    token,
  }
}
