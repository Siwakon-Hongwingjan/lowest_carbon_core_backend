import type { Message } from "@line/bot-sdk"
import { replyMessage, type LineTextEvent, markMessageAsRead } from "../../services/lineService"
import { findOrCreateUserByLineId } from "../../services/userService"
import { getPointsBalance } from "../point/point.service"
import { buildActivityFlex, buildDailyPlannerFlex, buildPointsFlex, buildRewardsFlex } from "../../utils/flexTemplates"
import { getCarbonSummary } from "../carbon/carbon.service"
import type { AuthenticatedUser } from "../../middlewares/auth"
import { rewardsList } from "../rewards/rewards.data"
import { dailyPlanner } from "../ai/ai.service"
import { prisma } from "../db/prisma"

const POINT_KEYWORDS = ["แต้ม", "คะแนน", "point"]
const ACTIVITY_KEYWORDS = ["กิจกรรม", "activity"]
const REWARD_KEYWORDS = ["รางวัล", "rewars", "reward", "rewards"]
const PLANNER_KEYWORDS = ["แผน", "แผนวันนี้", "planner", "plan", "daily"]
const RESET_KEYWORDS = ["เริ่มใหม่", "start"]

export async function handleLineEvents(events: any[]) {
  await Promise.all(
    events.map(async (event: any) => {
      if (event.type === "follow") {
        await handleFollowEvent(event)
        return
      }
      if (event.type !== "message" || event.message?.type !== "text") return
      await handleTextEvent(event as LineTextEvent)
    }),
  )
}

async function handleFollowEvent(event: any) {
  const replyToken = event.replyToken
  if (!replyToken) return

  await replyMessage(replyToken, welcomeMessage())
}

async function handleTextEvent(event: LineTextEvent) {
  const userId = event.source?.userId
  if (!userId) return

  const text = event.message?.text?.trim().toLowerCase() ?? ""
  const replyToken = event.replyToken
  const markAsReadToken = event.message?.markAsReadToken

  try {
    void markMessageAsRead(markAsReadToken)

    const wantsPoints = POINT_KEYWORDS.includes(text)
    const wantsActivity = ACTIVITY_KEYWORDS.includes(text)
    const wantsReward = REWARD_KEYWORDS.includes(text)
    const wantsPlanner = PLANNER_KEYWORDS.includes(text)
    const wantsWelcome = RESET_KEYWORDS.includes(text)

    if (wantsWelcome) {
      await replyMessage(replyToken, welcomeMessage())
      return
    }

    if (!wantsPoints && !wantsActivity && !wantsReward && !wantsPlanner) {
      await replyMessage(replyToken, defaultHelpMessage())
      return
    }

    const user = await findOrCreateUserByLineId(userId)

    if (wantsPoints) {
      const balanceResult = await getPointsBalance({ userId: user.id })
      const balance = balanceResult.balance ?? 0
      await replyMessage(replyToken, buildPointsMessage(balance))
      return
    }

    if (wantsActivity) {
      const authUser: AuthenticatedUser = { userId: user.id, lineUserId: user.lineUserId }
      const today = new Date()
      const dateString = today.toISOString().split("T")[0]
      const summary = await getCarbonSummary(dateString, authUser)
      await replyMessage(replyToken, buildActivityMessage(summary))
      return
    }

    if (wantsReward) {
      await replyMessage(replyToken, buildRewardsMessage(user.points))
      return
    }

    if (wantsPlanner) {
      const activitiesToday = await getTodayActivities(user.id)
      const aiRequest = {
        activities: activitiesToday.map((a) => `${a.category}: ${a.type}`),
        travel: [],
      }

      const plan = await dailyPlanner(aiRequest)
      if (!plan.success) {
        await replyMessage(replyToken, {
          type: "text",
          text: "เรียก AI planner ไม่สำเร็จ ลองใหม่อีกครั้งนะ",
        })
        return
      }

      if (!plan.result) {
        await replyMessage(replyToken, {
          type: "text",
          text: "ยังไม่ได้รับผลลัพธ์จาก AI planner",
        })
        return
      }

      await replyMessage(replyToken, buildDailyPlannerMessage(plan.result))
      return
    }
  } catch (error) {
    console.error("LINE webhook error:", error)
    await replyMessage(replyToken, errorMessage())
  }
}

function buildPointsMessage(balance: number): Message {
  return buildPointsFlex({
    points: balance,
    description: "ขอบคุณที่ช่วยลดคาร์บอนต่อไปนะ! ✨",
  })
}

function defaultHelpMessage(): Message {
  return {
    type: "text",
    text: 'สวัสดี! คำสั่ง: "แต้ม" เช็คคะแนน, "กิจกรรม" ความคืบหน้า, "รางวัล" ของแลกได้, "แผน" ให้ AI วางแผนลดคาร์บอน',
  }
}

function welcomeMessage(): Message {
  return {
    type: "text",
    text: [
      "ยินดีต้อนรับสู่บัญชี {AccountName} 🌿",
      "บันทึกกิจกรรม/การเดินทาง/อาหาร แล้วให้ AI คำนวณคาร์บอน + รับแต้มแลกของรางวัล",
      "",
      'คำสั่งที่ใช้ได้: "แต้ม", "กิจกรรม", "รางวัล", "แผนวันนี้"',
      "หรือเปิด Mini App เพื่อล็อกอินและเริ่มบันทึกได้เลย",
    ].join("\n"),
  }
}

function errorMessage(): Message {
  return {
    type: "text",
    text: "ขออภัย ระบบขัดข้องชั่วคราว ลองใหม่อีกครั้งนะ",
  }
}

function buildActivityMessage(summary: Awaited<ReturnType<typeof getCarbonSummary>>): Message {
  if (!summary?.categories) {
    return {
      type: "text",
      text: "ยังดึงข้อมูลกิจกรรมไม่ได้ ลองใหม่อีกครั้งนะ",
    }
  }

  const targets = { TRANSPORT: 2, FOOD: 2, OTHER: 2 }
  const categories = summary.categories
  const totalDone = categories.TRANSPORT + categories.FOOD + categories.OTHER
  const remaining =
    Math.max(0, targets.TRANSPORT - categories.TRANSPORT) +
    Math.max(0, targets.FOOD - categories.FOOD) +
    Math.max(0, targets.OTHER - categories.OTHER)

  return buildActivityFlex({
    categories,
    remaining,
    totalDone,
  })
}

function buildRewardsMessage(points: number): Message {
  const affordable = rewardsList.filter((r) => points >= r.cost)
  const next = rewardsList.find((r) => r.cost > points)

  return buildRewardsFlex({
    points,
    affordable,
    next: next ?? undefined,
  })
}

function buildDailyPlannerMessage(result: NonNullable<Awaited<ReturnType<typeof dailyPlanner>>["result"]>): Message {
  return buildDailyPlannerFlex({
    title: "AI Daily Planner",
    summaryReduction: result.summary_reduction,
    activities: result.analysis,
    travel: result.travel_analysis,
  })
}

async function getTodayActivities(userId: string) {
  const today = new Date()
  const dateString = today.toISOString().split("T")[0]
  return prisma.activity.findMany({
    where: {
      userId,
      date: {
        gte: new Date(`${dateString}T00:00:00`),
        lte: new Date(`${dateString}T23:59:59`),
      },
    },
    orderBy: { createdAt: "desc" },
  })
}
