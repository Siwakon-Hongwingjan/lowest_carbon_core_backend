import { Elysia } from "elysia"

export const metaController = new Elysia({ prefix: "/meta" })
  .get("/activity-types", () => ({
    success: true,
    transport: ["BTS", "MRT", "Bus", "Walk", "Motorbike", "Taxi", "Bike"],
    food: [
      "Beef", "Pork", "Chicken", "Fish", 
      "Vegan Meal", "Rice Bowl", "Noodles", "Fast Food"
    ],
    other: [
      "Running", "Walking", "Cycling", "Gym Workout",
      "Cleaning", "Yoga", "Swimming"
    ]
  }))
