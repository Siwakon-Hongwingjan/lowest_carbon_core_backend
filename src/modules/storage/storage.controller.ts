import { Elysia, t } from "elysia"
import { Storage } from "@google-cloud/storage"
import path from "node:path"
import crypto from "node:crypto"
import fs from "node:fs"
import { env } from "../../config/env"

function parseServiceAccount(raw: string | undefined) {
  if (!raw) return null
  const trimmed = raw.trim()

  // Allow passing a path to a JSON key file (e.g. mounted secret)
  const maybePath = trimmed.replace(/^file:\/\//, "")
  if ((maybePath.startsWith("/") || maybePath.endsWith(".json")) && fs.existsSync(maybePath)) {
    try {
      const fileContents = fs.readFileSync(maybePath, "utf8")
      return JSON.parse(fileContents)
    } catch (err) {
      console.warn("[storage] Failed to read GCS service account file:", err)
      return null
    }
  }

  // Try parse as JSON string directly
  try {
    return JSON.parse(trimmed)
  } catch (_) {
    // fallthrough
  }

  // Try base64 decode (plain or data URL) then parse
  try {
    const base64Payload = trimmed.startsWith("data:") ? trimmed.split(",").pop() ?? "" : trimmed
    const decoded = Buffer.from(base64Payload, "base64").toString("utf8")
    return JSON.parse(decoded)
  } catch (err) {
    console.warn("[storage] Failed to parse GCS_SERVICE_ACCOUNT, please ensure it is JSON or base64 JSON:", err)
    return null
  }
}

const credentialsJson = parseServiceAccount(env.GCS_SERVICE_ACCOUNT)

if (!env.GCS_BUCKET) {
  console.warn("[storage] GCS_BUCKET is not configured; /storage/upload will fail")
}
if (!credentialsJson) {
  console.warn("[storage] GCS_SERVICE_ACCOUNT is not configured; /storage/upload will fail")
}

const storage = new Storage({
  credentials: credentialsJson ?? undefined,
  projectId: credentialsJson?.project_id,
})

const bucket = env.GCS_BUCKET ? storage.bucket(env.GCS_BUCKET) : null

function buildFileName(original?: string) {
  const ext = original ? path.extname(original) : ""
  const slug = crypto.randomBytes(6).toString("hex")
  return `${Date.now()}-${slug}${ext}`
}

export const storageController = new Elysia({ prefix: "/storage" }).post(
  "/upload",
  async ({ body, set }: { body: { file?: File }; set: { status?: number } }) => {
    if (!bucket) {
      set.status = 500
      return { success: false, message: "GCS is not configured" }
    }

    const file = body.file
    if (!file) {
      set.status = 400
      return { success: false, message: "File is required" }
    }

    const fileName = buildFileName(file.name)
    const blob = bucket.file(fileName)

    try {
      const buffer = Buffer.from(await file.arrayBuffer())
      await blob.save(buffer, {
        contentType: file.type || "application/octet-stream",
        resumable: false,
      })
    } catch (error) {
      set.status = 500
      return { success: false, message: "Failed to upload to GCS", detail: String(error) }
    }

    const fileUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`
    return { success: true, fileUrl, fileName }
  },
  {
    body: t.Object({
      file: t.File(),
    }),
  },
)
