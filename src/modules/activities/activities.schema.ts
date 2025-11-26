import { Static, t } from "elysia"

export const activityCategoryEnum = t.Enum({
  TRANSPORT: "TRANSPORT",
  FOOD: "FOOD",
  OTHER: "OTHER",
})

export const createActivityBodySchema = t.Object({
  category: activityCategoryEnum,
  type: t.String(),
  value: t.Number(),
  date: t.String(),
  imageUrl: t.Optional(t.String()),
  slipUrl: t.Optional(t.String()),
})

export const activitiesQuerySchema = t.Object({
  date: t.String(),
})

export const updateActivityParamsSchema = t.Object({
  id: t.String(),
})

export const updateActivityBodySchema = t.Object({
  co2: t.Number(),
})

export type CreateActivityBody = Static<typeof createActivityBodySchema>
export type ActivitiesQuery = Static<typeof activitiesQuerySchema>
export type UpdateActivityParams = Static<typeof updateActivityParamsSchema>
export type UpdateActivityBody = Static<typeof updateActivityBodySchema>
