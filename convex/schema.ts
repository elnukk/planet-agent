// schema.ts
// PURPOSE: Defines the Convex database schema for the entire app.
// CONNECTS TO: all convex/*.ts files, all src/lib/agent/*.ts files
//
// TABLES NEEDED:
//
// users
//   - unique id, full name, email address, createdAt, password (encrypted???), phone number, community organization name, your role in organization, API key description, API key value
//
// workflows
//   - belongs to a user (unique id)
//- what is your use case (stores the use case)
//- time frame of analysis (Past 3 Months/3mo, Past 6 Months/6mo, Past Year/1yr, Past 2 Years/2yr, Past 5 Years/5yr, Custom Range)
//- data frequency (daily, weekly, monthly, quarterly)
//   - stores the full region intakeJson (it's a json, geojson, or KML file - see intake_bot.py for the schema shape)
//- follow up question 1 (we ask that, so don't store) and user answer 1 (store this)
//- follow up question 2 (we ask that, so don't store) and user answer 2 (store this)
//- follow up question 3 (we ask that, so don't store) and user answer 3 (store this)
//   - stores the assembled notebook as an array of cells (cell_type, source)
//   - stores which source notebook cells were used (notebook filename, cell_index, content)
//   - createdAt, updatedAt
//
// conversations
//   - belongs to a workflow
//   - one row per message
//   - role: "user" or "assistant"
//   - content: message text
//   - createdAt
//
// RESOURCES:
// https://docs.convex.dev/database/schemas



import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ─────────────────────────────────────────────
  // USERS
  // ─────────────────────────────────────────────
  users: defineTable({
    createdAt: v.float64(),

    // identity
    email: v.string(),
    username: v.optional(v.string()),
    externalId: v.optional(v.string()),
    name: v.string(),

    // ⚠️ DO NOT store raw passwords
    // use auth provider or hashed password only
    passwordHash: v.optional(v.string()),

    // org info
    phoneNumber: v.optional(v.string()),
    organizationName: v.optional(v.string()),
    roleInOrganization: v.optional(v.string()),

    // API keys (IMPORTANT: store hashed or encrypted in real apps)
    apiKeyDescription: v.optional(v.string()),
    apiKeyValue: v.optional(v.string()),
  })
    .index("by_email", ["email"])
    .index("by_externalId", ["externalId"]),

  // ─────────────────────────────────────────────
  // WORKFLOWS (core intake → analysis unit)
  // ─────────────────────────────────────────────
  workflows: defineTable({
    createdAt: v.float64(),
    updatedAt: v.float64(),

    // ownership
    userId: v.id("users"),

    // display
    name: v.string(),

    // ─── Layer 1 + Intake core fields ───
    useCase: v.string(),

    timeFrame: v.union(
      v.literal("3mo"),
      v.literal("6mo"),
      v.literal("1yr"),
      v.literal("2yr"),
      v.literal("5yr"),
      v.literal("custom")
    ),

    dataFrequency: v.union(
      v.literal("daily"),
      v.literal("weekly"),
      v.literal("monthly"),
      v.literal("quarterly")
    ),

    // region intake (GeoJSON / KML / structured object from intake_bot.py)
    region: v.any(),

    dateRange: v.object({
      start: v.string(),
      end: v.string(),
    }),

    temporalResolution: v.optional(
      v.union(
        v.literal("daily"),
        v.literal("weekly"),
        v.literal("biweekly"),
        v.literal("monthly"),
        v.literal("seasonal"),
        v.literal("unknown")
      )
    ),

    planetProduct: v.string(),

    inferredIntent: v.optional(v.string()),
    userDescription: v.optional(v.string()),

    constraints: v.optional(v.array(v.string())),

    // ─── Layer 2 Q&A (explicitly stored answers only) ───
    followUpQA: v.array(
      v.object({
        question: v.string(),
        answer: v.string(),
      })
    ),

    // ─── Notebook assembly output ───
    notebookCells: v.array(
      v.object({
        cellType: v.union(
          v.literal("code"),
          v.literal("markdown"),
          v.literal("text")
        ),
        source: v.string(),
      })
    ),

    // provenance tracking (which notebooks contributed)
    sourceNotebooks: v.array(
      v.object({
        filename: v.string(),
        cellIndex: v.number(),
        content: v.string(),
      })
    ),
  })
    .index("by_userId", ["userId"])
    .index("by_createdAt", ["createdAt"]),

  // ─────────────────────────────────────────────
  // CONVERSATIONS (chat history per workflow)
  // ─────────────────────────────────────────────
  // ─────────────────────────────────────────────
  // VERIFICATION CODES (short-lived email OTPs)
  // ─────────────────────────────────────────────
  verificationCodes: defineTable({
    email: v.string(),
    code: v.string(),
    expiresAt: v.float64(),
  }).index("by_email", ["email"]),

  // ─────────────────────────────────────────────
  // CONVERSATIONS (chat history per workflow)
  // ─────────────────────────────────────────────
  conversations: defineTable({
    createdAt: v.float64(),

    workflowId: v.id("workflows"),

    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
  })
    .index("by_workflowId", ["workflowId"])
    .index("by_createdAt", ["createdAt"])
    .index("by_workflow_createdAt", ["workflowId", "createdAt"]),
});

