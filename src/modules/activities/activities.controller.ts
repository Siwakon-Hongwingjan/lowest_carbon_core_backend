import { Elysia } from "elysia"
import { type AuthenticatedUser, unauthorizedBody } from "../../middlewares/auth"
import { createActivity, getActivitiesByDate , updateActivity } from "./activities.service"
import {
  activitiesQuerySchema,
  createActivityBodySchema,
  updateActivityBodySchema,
  updateActivityParamsSchema,
  type ActivitiesQuery,
  type CreateActivityBody,
  type UpdateActivityBody,
  type UpdateActivityParams,
} from "./activities.schema"



export const activitiesController = new Elysia({ prefix: "/activities" })
  // ▶ POST /activities  — create new activity
  .post(
    "/",
    async ({ body, user, set }: { body: CreateActivityBody; user?: AuthenticatedUser; set: any }) => {
      if (!user) {
        set.status = 401
        return unauthorizedBody
      }
      return await createActivity(body, user)
    },
    {
      body: createActivityBodySchema,
    },
  )

  // ▶ GET /activities?date=YYYY-MM-DD — list activity of that day
  .get(
    "/",
    async ({ query, user, set }: { query: ActivitiesQuery; user?: AuthenticatedUser; set: any }) => {
      if (!user) {
        set.status = 401
        return unauthorizedBody
      }
      return await getActivitiesByDate(query.date, user)
    },
    {
      query: activitiesQuerySchema,
    },
  )

  .patch(
    "/:id/co2",
    async ({ params , body , user , set}: { params: UpdateActivityParams; body: UpdateActivityBody; user?: AuthenticatedUser; set: any }) => {
      if (!user) {
        set.status = 401
        return unauthorizedBody
      }
      return await updateActivity(params.id , body.co2 , user!)
    },
    {
      params: updateActivityParamsSchema,
      body: updateActivityBodySchema,
    }
  )
