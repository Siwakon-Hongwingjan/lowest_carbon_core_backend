import { prisma } from "../db/prisma"
import { getCarbonSummary } from "../carbon/carbon.service"
import { rewardsList } from "../rewards/rewards.data"

export async function getUserProfile(user: any) {
  // 1) user info
  const today = new Date()
  const dateString = today.toISOString().split("T")[0]

  // 2) carbon summary
  const summary = await getCarbonSummary(dateString, user)

  // 3) points balance
  const points = await prisma.pointsTransaction.aggregate({
    _sum: { points: true },
    where: { userId: user.userId },
  })

  const balance = points._sum.points ?? 0

  // 4) next affordable reward
  const sortedRewards = rewardsList.sort((a, b) => a.cost - b.cost)
  const nextReward = sortedRewards.find(r => r.cost > balance) || null

  // 5) today activity list
  const activities = await prisma.activity.findMany({
    where: {
      userId: user.userId,
      date: {
        gte: new Date(dateString + "T00:00:00"),
        lte: new Date(dateString + "T23:59:59"),
      }
    },
    orderBy: { createdAt: "desc" }
  })

  return {
    success: true,
    user: {
      userId: user.userId,
      lineUserId: user.lineUserId
    },
    balance,
    carbonSummary: summary,
    nextReward,
    todayActivities: activities
  }
}
