import { prisma } from "../db/prisma"

const AVERAGE_CO2_THAI = 6.5 // kg/day (ปรับได้ทีหลัง)

export async function getCarbonSummary(date: string, user: any) {
  const target = new Date(date)
  const start = new Date(target)
  start.setHours(0, 0, 0, 0)

  const end = new Date(target)
  end.setHours(23, 59, 59, 999)

  // 1) ดึงกิจกรรมทั้งหมดของวันนั้น
  const activities = await prisma.activity.findMany({
    where: {
      userId: user.userId,
      date: {
        gte: start,
        lte: end
      }
    }
  })

  // นับจำนวนประเภท
  const categoryCounts = {
    TRANSPORT: activities.filter(a => a.category === "TRANSPORT").length,
    FOOD: activities.filter(a => a.category === "FOOD").length,
    OTHER: activities.filter(a => a.category === "OTHER").length
  }

  // 2) รวมคาร์บอน (ยังไม่คำนวณ co2 → null → ให้ AI คำนวณทีหลัง)
  const totalCo2 = activities.reduce((sum, item) => sum + (item.co2 ?? 0), 0)

  const activitiesCompleted =
    categoryCounts.TRANSPORT >= 2 &&
    categoryCounts.FOOD >= 2 &&
    categoryCounts.OTHER >= 2

  const isBelowAverage = totalCo2 < AVERAGE_CO2_THAI

  // 3) Update หรือ Create DailyCarbonRecord
  const daily = await prisma.dailyCarbonRecord.upsert({
    where: {
      userId_date: {
        userId: user.userId,
        date: start
      }
    },
    create: {
      userId: user.userId,
      date: start,
      totalCo2,
      activityCount: activities.length
    },
    update: {
      totalCo2,
      activityCount: activities.length
    }
  })

  return {
    success: true,
    date,
    totalCo2,
    averageCo2: AVERAGE_CO2_THAI,
    isBelowAverage,
    categories: categoryCounts,
    activitiesCompleted
  }
}
