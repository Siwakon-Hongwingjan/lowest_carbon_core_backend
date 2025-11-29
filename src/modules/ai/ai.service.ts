import { env } from "../../config/env"
import { prisma } from "../db/prisma"

type ActivityPayload = {
  id: string
  category: string
  type: string
  value: number
  date: string
}

type AiActivityResult = {
  id: string
  co2: number
  description?: string | null
}

type IdentifiedFood = {
  name: string
  tags?: string[] | null
  confidence: number
  explanation?: string | null
  sourceModel?: string | null
}

type FoodImageResult = {
  item: IdentifiedFood
}

type DailyPlannerResponse = {
  analysis: {
    original: string
    current_co2: number
    alternative: string
    alternative_co2: number
    reduced: number
  }[]
  travel_analysis: {
    origin: string
    destination: string
    distance_km: number
    current_mode: string
    current_co2: number
    recommended_mode: string
    recommended_co2: number
    reduced: number
  }[]
  summary_reduction: number
}

const AI_CALC_CO2_URL = env.AI_URL ? `${env.AI_URL}/ai/calc_co2` : null
const AI_IDENTIFY_IMAGE_URL = env.AI_URL ? `${env.AI_URL}/tools/identify_food_image` : null
const AI_DAILY_PLANNER_URL = env.AI_URL ? `${env.AI_URL}/ai/daily_planner` : null

async function callAiBackend(activities: ActivityPayload[]) {
  if (!AI_CALC_CO2_URL) {
    return {
      success: false,
      message: "AI_URL is not configured",
      status: 500,
    }
  }

  let response: Response
  try {
    response = await fetch(AI_CALC_CO2_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ activities }),
    })
  } catch (error) {
    return {
      success: false,
      message: "Failed to reach AI backend",
      status: 502,
      detail: String(error),
    }
  }

  if (!response.ok) {
    const text = await response.text()
    return {
      success: false,
      message: "AI backend error",
      status: response.status,
      detail: text,
    }
  }

  const data = await response.json()

  return {
    success: true,
    result: data,
  }
}

async function callFoodImageIdentify(imageUrl: string) {
  if (!AI_IDENTIFY_IMAGE_URL) {
    return {
      success: false,
      message: "AI_URL is not configured",
      status: 500,
    }
  }

  let response: Response
  try {
    response = await fetch(AI_IDENTIFY_IMAGE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ imageUrl }),
    })
  } catch (error) {
    return {
      success: false,
      message: "Failed to reach AI backend",
      status: 502,
      detail: String(error),
    }
  }

  if (!response.ok) {
    const text = await response.text()
    return {
      success: false,
      message: "AI backend error",
      status: response.status,
      detail: text,
    }
  }

  const data: FoodImageResult = await response.json()

  return {
    success: true,
    result: data,
  }
}

export async function calcCo2WithAI(activities: ActivityPayload[], userId: string) {
  const aiResponse = await callAiBackend(activities)
  if (!aiResponse.success) {
    return aiResponse
  }

  const aiActivities = (aiResponse.result?.activities ?? []) as AiActivityResult[]
  const ids = aiActivities.map((a: AiActivityResult) => a.id)

  const ownedActivities = await prisma.activity.findMany({
    where: {
      userId,
      id: { in: ids },
    },
    select: { id: true },
  })
  const ownedSet = new Set(ownedActivities.map((a) => a.id))

  const updates = aiActivities
    .filter((a: AiActivityResult) => ownedSet.has(a.id) && Number.isFinite(a.co2))
    .map((a: AiActivityResult) =>
      prisma.activity.update({
        where: { id: a.id },
        data: {
          co2: a.co2,
        },
      }),
    )

  if (updates.length > 0) {
    await prisma.$transaction(updates)
  }

  return {
    success: true,
    result: aiResponse.result,
    updatedCount: updates.length,
  }
}

export async function identifyFoodImage(imageUrl: string, userId?: string) {
  const response = await callFoodImageIdentify(imageUrl)

  if (!response.success) {
    return response
  }

  // ถ้า user ส่ง imageUrl เข้ามาและเคยสร้าง activity แบบ pending ไว้ ให้เปลี่ยน type ให้เลย
  const identifiedName = response.result?.item?.name?.trim()
  if (identifiedName && userId) {
    const pending = await prisma.activity.findFirst({
      where: {
        userId,
        imageUrl,
        type: "PENDING_IMAGE",
      },
      orderBy: { createdAt: "desc" },
    })

    if (pending) {
      await prisma.activity.update({
        where: { id: pending.id },
        data: { type: identifiedName },
      })
    }
  }

  return response
}

export async function dailyPlanner(data: { activities?: string[]; travel?: { origin: string; destination: string }[] }) {
  if (!AI_DAILY_PLANNER_URL) {
    return {
      success: false,
      message: "AI_URL is not configured",
      status: 500,
    }
  }

  let response: Response
  try {
    response = await fetch(AI_DAILY_PLANNER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        activities: data.activities ?? [],
        travel: data.travel ?? [],
      }),
    })
  } catch (error) {
    return {
      success: false,
      message: "Failed to reach AI backend",
      status: 502,
      detail: String(error),
    }
  }

  if (!response.ok) {
    const text = await response.text()
    return {
      success: false,
      message: "AI backend error",
      status: response.status,
      detail: text,
    }
  }

  const result: DailyPlannerResponse = await response.json()

  return {
    success: true,
    result,
  }
}
