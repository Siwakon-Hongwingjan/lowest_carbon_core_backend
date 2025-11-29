import { createHmac } from "crypto"
import { Elysia } from "elysia"
import { handleLineEvents } from "./line.handlers"

const channelSecret = process.env.LINE_CHANNEL_SECRET || ""

export const lineController = new Elysia({ prefix: "/line" }).post(
  "/webhook",
  async (ctx: any) => {
    const { request, set } = ctx
    const signature = request.headers.get("x-line-signature") || ""
    const rawBody = await request.text()

    if (!channelSecret) {
      console.warn("LINE_CHANNEL_SECRET is not set; skipping signature validation")
    } else {
      const hash = createHmac("sha256", channelSecret).update(rawBody).digest("base64")
      if (hash !== signature) {
        set.status = 401
        return { success: false, message: "Invalid signature" }
      }
    }

    const body = rawBody ? JSON.parse(rawBody) : { events: [] }
    const events = body?.events ?? []

    await handleLineEvents(events)

    return { success: true }
  }
)
