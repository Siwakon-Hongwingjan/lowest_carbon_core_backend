import type { Message } from "@line/bot-sdk"
import { replyMessage, type LineTextEvent } from "../../services/lineService"
import { findOrCreateUserByLineId } from "../../services/userService"
import { getPointsBalance } from "../point/point.service"
import { buildPointsFlex } from "../../utils/flexTemplates"
import { getCarbonSummary } from "../carbon/carbon.service"
import type { AuthenticatedUser } from "../../middlewares/auth"
import { rewardsList } from "../rewards/rewards.data"

const POINT_KEYWORDS = ["แต้ม", "คะแนน", "point"]
const ACTIVITY_KEYWORDS = ["กิจกรรม", "activity"]
const REWARD_KEYWORDS = ["รางวัล", "rewars", "reward", "rewards"]

export async function handleLineEvents(events: any[]) {
  await Promise.all(
    events.map(async (event: any) => {
      if (event.type !== "message" || event.message?.type !== "text") return
      await handleTextEvent(event as LineTextEvent)
    }),
  )
}

async function handleTextEvent(event: LineTextEvent) {
  const userId = event.source?.userId
  if (!userId) return

  const text = event.message?.text?.trim().toLowerCase() ?? ""
  const replyToken = event.replyToken

  try {
    const wantsPoints = POINT_KEYWORDS.includes(text)
    const wantsActivity = ACTIVITY_KEYWORDS.includes(text)
    const wantsReward = REWARD_KEYWORDS.includes(text)

    if (!wantsPoints && !wantsActivity && !wantsReward) {
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
    text: 'สวัสดี! คำสั่งที่ใช้ได้: "แต้ม" เช็คคะแนน, "กิจกรรม" เช็คความคืบหน้าวันนี้, "รางวัล" ดูของที่แลกได้',
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

  const progressLine = `เดินทาง ${categories.TRANSPORT}/2 • อาหาร ${categories.FOOD}/2 • อื่นๆ ${categories.OTHER}/2`
  const statusLine =
    remaining === 0
      ? "ครบเงื่อนไข รับคะแนนได้แล้ว! 🎉"
      : `เหลืออีก ${remaining} กิจกรรมเพื่อรับคะแนนวันนี้`

  return {
    type: "text",
    text: `วันนี้บันทึกแล้ว ${totalDone} รายการ\n${progressLine}\n${statusLine}`,
  }
}

function buildRewardsMessage(points: number): Message {
  const affordable = rewardsList.filter((r) => points >= r.cost)
  const next = rewardsList.find((r) => r.cost > points)

  const affordableLine =
    affordable.length > 0
      ? affordable.map((r) => `• ${r.name} (${r.cost} คะแนน)`).join("\n")
      : "ยังแลกไม่ได้ ลุยบันทึกกิจกรรมกันต่อ!"

  const nextLine = next ? `ต่อไป: ${next.name} อีก ${next.cost - points} คะแนน` : "ได้ทุกอย่างแล้ว!"

  return {
    type: "text",
    text: `คะแนนสะสม ${points} คะแนน\nของที่แลกได้:\n${affordableLine}\n${nextLine}`,
  }
}
