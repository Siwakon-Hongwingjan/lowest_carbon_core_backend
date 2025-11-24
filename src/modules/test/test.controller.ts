import { Elysia } from "elysia";
import { prisma } from "../../lib/prisma";

export const testController = new Elysia({ prefix: "/test" })

  // ✔️ Test 1: Create User
  .get("/customer", async () => {
    try {
      const newUser = await prisma.customer.create({
        data: {
          name: "Test User " + Math.random().toString(36).substring(5),
          email: "user_" + Math.random().toString(36).substring(5) + "@example.com"
        }
      });

      return {
        success: true,
        message: "User created successfully!",
        newUser
      };
    } catch (e) {
      return {
        success: false,
        error: e instanceof Error ? e.message : e
      };
    }
  })
