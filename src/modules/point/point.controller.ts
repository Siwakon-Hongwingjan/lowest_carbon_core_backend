import { Elysia ,t } from 'elysia'
import {evaluatePoints , getPointsBalance , getHistoryPoints} from './point.service'

export const pointController = new Elysia({ prefix: "/points"})
    
    // POST /points/evaluate — evaluate points for the user
    .post("/evaluate" , async ({ user } : {user : any}) => {
        return await evaluatePoints(user!)
    })
    
    // GET /points/history - get points transaction history
    .get("/history" , async ({ user } : { user : any}) => {
        return await getHistoryPoints(user!)
    })

    // GET / points/balance - get points balance
    .get("/balance" , async ({ user } : { user : any}) => {
        return await getPointsBalance(user!)
    })

