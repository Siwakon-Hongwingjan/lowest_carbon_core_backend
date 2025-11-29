import type { FlexMessage } from "@line/bot-sdk"

type PointsPayload = {
  points: number
  description?: string
}

type ActivitySummaryPayload = {
  categories: { TRANSPORT: number; FOOD: number; OTHER: number }
  remaining: number
  totalDone: number
}

type RewardsPayload = {
  points: number
  affordable: { name: string; cost: number }[]
  next?: { name: string; cost: number }
}

export function buildPointsFlex({ points, description }: PointsPayload): FlexMessage {
  return {
    type: "flex",
    altText: "Green Points ของคุณ",
    contents: {
      type: "bubble",
      size: "mega",
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        paddingAll: "20px",
        contents: [
          {
            type: "text",
            text: "🌿 Green Points ของคุณ",
            weight: "bold",
            size: "lg",
            color: "#2E7D32",
          },
          {
            type: "separator",
            margin: "md",
            color: "#A5D6A7",
          },
          {
            type: "box",
            layout: "vertical",
            paddingAll: "16px",
            backgroundColor: "#E8F5E9",
            cornerRadius: "12px",
            contents: [
              {
                type: "text",
                text: "คุณมี",
                size: "sm",
                color: "#1B5E20",
              },
              {
                type: "text",
                text: `${points.toLocaleString()} คะแนน ✨`,
                weight: "bold",
                size: "xxl",
                color: "#1B5E20",
                margin: "sm",
              },
            ],
          },
          {
            type: "text",
            text: description ?? "ขอบคุณที่ช่วยลดคาร์บอนต่อไปนะ!",
            size: "sm",
            color: "#4CAF50",
            wrap: true,
            margin: "md",
          },
        ],
      },
    },
  }
}

export function buildActivityFlex(payload: ActivitySummaryPayload): FlexMessage {
  const { categories, remaining, totalDone } = payload
  const status =
    remaining === 0 ? "ครบเงื่อนไข รับคะแนนได้แล้ว! 🎉" : `เหลืออีก ${remaining} กิจกรรมเพื่อรับคะแนนวันนี้`

  return {
    type: "flex",
    altText: "สรุปกิจกรรมวันนี้",
    contents: {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        paddingAll: "16px",
        spacing: "md",
        contents: [
          {
            type: "text",
            text: "กิจกรรมวันนี้",
            weight: "bold",
            size: "lg",
            color: "#1B5E20",
          },
          {
            type: "text",
            text: `บันทึกแล้ว ${totalDone} รายการ`,
            size: "sm",
            color: "#2E7D32",
          },
          {
            type: "box",
            layout: "vertical",
            backgroundColor: "#E8F5E9",
            cornerRadius: "12px",
            paddingAll: "12px",
            spacing: "xs",
            contents: [
              {
                type: "text",
                text: `เดินทาง ${categories.TRANSPORT}/2`,
                size: "sm",
                color: "#1B5E20",
              },
              {
                type: "text",
                text: `อาหาร ${categories.FOOD}/2`,
                size: "sm",
                color: "#1B5E20",
              },
              {
                type: "text",
                text: `อื่นๆ ${categories.OTHER}/2`,
                size: "sm",
                color: "#1B5E20",
              },
            ],
          },
          {
            type: "text",
            text: status,
            wrap: true,
            size: "sm",
            color: "#4CAF50",
          },
        ],
      },
    },
  }
}

export function buildRewardsFlex(payload: RewardsPayload): FlexMessage {
  const { points, affordable, next } = payload

  const affordableRows =
    affordable.length > 0
      ? affordable.map((item) => ({
          type: "box" as const,
          layout: "baseline" as const,
          spacing: "sm",
          contents: [
            { type: "text" as const, text: "•", size: "sm", color: "#1B5E20", flex: 1 },
            { type: "text" as const, text: item.name, size: "sm", color: "#1B5E20", flex: 8, wrap: true },
            { type: "text" as const, text: `${item.cost}`, size: "sm", color: "#2E7D32", flex: 3, align: "end" as const },
          ],
        }))
      : [
          {
            type: "text" as const,
            text: "ยังแลกไม่ได้ ลุยบันทึกกิจกรรมกันต่อ!",
            size: "sm",
            color: "#4CAF50",
          },
        ]

  return {
    type: "flex",
    altText: "ของรางวัลที่แลกได้",
    contents: {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        paddingAll: "16px",
        spacing: "md",
        contents: [
          {
            type: "text",
            text: "🎁 ของรางวัล",
            weight: "bold",
            size: "lg",
            color: "#1B5E20",
          },
          {
            type: "text",
            text: `คุณมี ${points} คะแนน`,
            size: "sm",
            color: "#2E7D32",
          },
          {
            type: "box",
            layout: "vertical",
            spacing: "sm",
            backgroundColor: "#E8F5E9",
            cornerRadius: "12px",
            paddingAll: "12px",
            contents: affordableRows,
          },
          next
            ? {
                type: "text",
                text: `ต่อไป: ${next.name} อีก ${next.cost - points} คะแนน`,
                size: "sm",
                color: "#4CAF50",
                wrap: true,
              }
            : {
                type: "text",
                text: "คุณได้ทุกอย่างแล้ว!",
                size: "sm",
                color: "#4CAF50",
              },
        ],
      },
    },
  }
}
