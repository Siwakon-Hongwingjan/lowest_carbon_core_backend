import { Elysia, t } from "elysia"
import type { AuthenticatedUser } from "../../middlewares/auth"
import { rewardsList } from "./rewards.data"
import { redeemReward, getRewardHistory } from "./rewards.service"

type RewardContext = { body: { rewardId: string }; user: AuthenticatedUser }

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
    async (ctx: any) => {
      const { body, user } = ctx as RewardContext
      return await redeemReward(body.rewardId, user)
    },
    {
      body: t.Object({
        rewardId: t.String(),
      })
    }
  )

  // ▶ GET /rewards/history
  .get("/history", async (ctx: any) => {
    const { user } = ctx as RewardContext
    return await getRewardHistory(user)
  })
