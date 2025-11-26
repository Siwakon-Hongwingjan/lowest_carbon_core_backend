import { Static, t } from "elysia"

export const loginBodySchema = t.Object({
  userId: t.String(),
})

export type LoginBody = Static<typeof loginBodySchema>
