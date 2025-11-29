import { Elysia, t } from "elysia"
import type { AuthenticatedUser } from "../../middlewares/auth"
import { getCarbonSummary } from "./carbon.service"

type CarbonContext = { query: { date: string }; user: AuthenticatedUser }

export const carbonController = new Elysia({ prefix: "/carbon" })
  .get(
    "/summary",
    async (ctx: any) => {
      const { query, user } = ctx as CarbonContext
      return await getCarbonSummary(query.date, user)
    },
    {
      query: t.Object({
        date: t.String()
      })
    }
  )
