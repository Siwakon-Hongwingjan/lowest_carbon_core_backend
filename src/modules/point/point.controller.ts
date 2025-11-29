import { Elysia, t } from "elysia"
import type { AuthenticatedUser } from "../../middlewares/auth"
import { evaluatePoints, getPointsBalance, getHistoryPoints } from "./point.service"

type PointContext = { user: AuthenticatedUser }

export const pointController = new Elysia({ prefix: "/points"})
    
    // POST /points/evaluate — evaluate points for the user
    .post("/evaluate" , async (ctx: any) => {
        const { user } = ctx as PointContext
        return await evaluatePoints(user)
    })
    
    // GET /points/history - get points transaction history
    .get("/history" , async (ctx: any) => {
        const { user } = ctx as PointContext
        return await getHistoryPoints(user)
    })

    // GET / points/balance - get points balance
    .get("/balance" , async (ctx: any) => {
        const { user } = ctx as PointContext
        return await getPointsBalance(user)
    })
