import { prisma } from "../db/prisma";
import { rewardsList } from "./rewards.data";

export async function redeemReward( rewardId: string, user : any) {
    // 1)) Find reward by ID

    const reward = rewardsList.find(r => r.id === rewardId)
    if (!reward) {
        return {
            success: false,
            message : "Reward not found",
            status: 404
        }
    }

    // 2)) Check if user has enough points
    const points = await prisma.pointsTransaction.aggregate({
        _sum: {
            points: true
        },
        where: {
            userId: user.userId
        }
    })

    const balance = points._sum.points ?? 0

    if (balance < reward.cost) {
        return {
            success: false,
            message: "Insufficient points",balance,
            required: reward.cost,
        }
    }

    // 3)) Deduct points and create transaction
    await prisma.pointsTransaction.create({
        data: {
            userId: user.userId,
            points: -reward.cost,
            reason: `Redeemed: ${reward.name}`
        }
    })

    // 4)) History transaction record
    const history = await prisma.rewardHistory.create({
        data: {
            userId : user.userId,
            rewardName : reward.name,
            rewardPoints : reward.cost
        }
    })

    return {
        success: true,
        message : "Reward redeemed successfully",
        reward,
        history,
        newBalance: balance - reward.cost
    }
}

export async function getRewardHistory(user:any) {
    const history = await prisma.rewardHistory.findMany({
        where: {
            userId: user.userId
        },
        orderBy: {
            date : "desc"
        }
    })

    return {
        success: true,
        history
    }
}
