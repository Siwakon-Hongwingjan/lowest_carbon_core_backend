import { app } from "../src/app"

// Run on the Edge so we can use the Fetch handler from Elysia.
export const config = {
  runtime: "edge",
}

export default {
  async fetch(request: Request) {
    return app.handle(request)
  },
}
