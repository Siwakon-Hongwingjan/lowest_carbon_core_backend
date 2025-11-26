import { getCarbonSummary } from "../carbon/carbon.service"
import { prisma } from "../db/prisma"

const DAILY_POINT = 10

const DEV_MODE_POINTS = true

export async function evaluatePoints(user: any) {
    const today = new Date()
    today.setHours(0,0,0,0)

    if(!DEV_MODE_POINTS) {
    // เช็คว่ามีบันทึกแต้มวันนี้แล้วหรือยัง
    const existing = await prisma.pointsTransaction.findFirst({
        where: {
            userId: user.userId,
            date: {
                gte: today
            }
        }
    })

     // summary of today's carbon footprint
    if (existing) {
        return {
            success: true,
            message : "Points already awarded for today",
            alreadyClaimed: true
        }
    }
}

    if (DEV_MODE_POINTS) {
    const record = await prisma.pointsTransaction.create({
      data: {
        userId: user.userId,
        points: DAILY_POINT,
        reason: "Dev Mode: Points granted without conditions",
      }
    })

    return {
      success: true,
      devMode: true,
      points: DAILY_POINT,
      record
    }
  }

    const dateSring = today.toISOString().split('T')[0]
    const summary = await getCarbonSummary(dateSring, user)

    const canClaim = 
        summary.categories.TRANSPORT >= 2 &&
        summary.categories.FOOD >= 2 &&
        summary.categories.OTHER >= 2 &&
        summary.isBelowAverage

    if(!canClaim) {
        return {
            success: false,
            message : "Not eligible for points today", summary,
            alreadyClaimed: false
        }
    }

    const record = await prisma.pointsTransaction.create({
        data : {
            userId: user.userId,
            points: DAILY_POINT,
            reason: "Daily carbon footprint reduction",
        }
    })

    return {
        success: true,
        message : "Points awarded",
        points : DAILY_POINT,
        record
    }
}

export async function getPointsBalance(user : any) {
    const totalPoints = await prisma.pointsTransaction.aggregate({
        _sum : {
            points : true
        },
        where : {
            userId : user.userId
        }
    })

    return {
        success: true,
        balance : totalPoints._sum.points ?? 0
    }
}

export async function getHistoryPoints(user : any) {
    const history = await prisma.pointsTransaction.findMany({
        where : {
            userId : user.userId
        },
        orderBy : {
            date : "desc"
        }
    })

    return {
        success: true,
        history
    }
}
