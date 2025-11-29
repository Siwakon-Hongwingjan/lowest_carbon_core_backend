import "dotenv/config"
import { app } from "./app"

const port = Number(process.env.PORT || 4000)

const server = app.listen(port)

if (server) {
  console.log(`ElysiaJS server running on ${port}`)
}
