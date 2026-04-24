import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const notebookCell = v.object({
  cell_type: v.string(),
  source: v.string(),
});

const sourceCell = v.object({
  notebook: v.string(),
  cell_index: v.number(),
  content: v.string(),
});

export default defineSchema({
  users: defineTable({
    externalId: v.string(),
    name: v.string(),
    email: v.string(),
    createdAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_externalId", ["externalId"]),

  workflows: defineTable({
    userId: v.string(),
    name: v.string(),
    intakeJson: v.any(),
    notebookCells: v.array(notebookCell),
    sourceCells: v.array(sourceCell),
    deletedAt: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_user_updatedAt", ["userId", "updatedAt"]),

  conversations: defineTable({
    workflowId: v.id("workflows"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    createdAt: v.number(),
  }).index("by_workflow_createdAt", ["workflowId", "createdAt"]),
});
