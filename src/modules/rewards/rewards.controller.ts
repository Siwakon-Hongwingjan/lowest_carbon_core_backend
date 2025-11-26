import { Elysia, t } from "elysia"
import { rewardsList } from "./rewards.data"
import { redeemReward, getRewardHistory } from "./rewards.service"

export const rewardsPublicController = new Elysia({ prefix: "/rewards" })

  // ▶ GET /rewards/list
  .get("/list", () => ({
    success: true,
    rewards: rewardsList
  }))

export const rewardsPrivateController = new Elysia({ prefix: "/rewards" })
  // ▶ POST /rewards/redeem
  .post(
    "/redeem",
    async ({ body, user }: { body: { rewardId: string }; user: any }) => {
      return await redeemReward(body.rewardId, user!)
    },
    {
      body: t.Object({
        rewardId: t.String(),
      })
    }
  )

  // ▶ GET /rewards/history
  .get("/history", async ({ user } : {user : any}) => {
    return await getRewardHistory(user!)
  })
