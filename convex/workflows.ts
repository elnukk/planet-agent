// convex/workflows.ts
// PURPOSE: Convex query and mutation functions for saving and retrieving workflows.
// CONNECTS TO:
//   - schema.ts for the workflows table definition
//   - src/lib/agent/planner.ts calls these in M2 to save assembled workflows
//   - src/app/dashboard/page.tsx reads from here to list saved workflows
//   - src/app/workflow/[id]/page.tsx reads from here to load a single workflow

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ─────────────────────────────────────────────
// QUERIES
// ─────────────────────────────────────────────

export const getWorkflow = query({
  args: { id: v.id("workflows") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

export const getUserWorkflows = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("workflows")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

// ─────────────────────────────────────────────
// MUTATIONS
// ─────────────────────────────────────────────

export const createWorkflow = mutation({
  args: {
    userId: v.id("users"),
    useCase: v.string(),
    timeFrame: v.union(
      v.literal("3mo"), v.literal("6mo"), v.literal("1yr"),
      v.literal("2yr"), v.literal("5yr"), v.literal("custom")
    ),
    dataFrequency: v.union(
      v.literal("daily"), v.literal("weekly"),
      v.literal("monthly"), v.literal("quarterly")
    ),
    region: v.any(),
    dateRange: v.object({ start: v.string(), end: v.string() }),
    temporalResolution: v.optional(v.union(
      v.literal("daily"), v.literal("weekly"), v.literal("biweekly"),
      v.literal("monthly"), v.literal("seasonal"), v.literal("unknown")
    )),
    planetProduct: v.string(),
    inferredIntent: v.optional(v.string()),
    userDescription: v.optional(v.string()),
    constraints: v.optional(v.array(v.string())),
    followUpQA: v.array(v.object({ question: v.string(), answer: v.string() })),
    notebookCells: v.array(v.object({
      cellType: v.union(v.literal("code"), v.literal("markdown"), v.literal("text")),
      source: v.string(),
    })),
    // 1. Added packages validator to createWorkflow
    packages: v.optional(v.array(v.string())),
    sourceNotebooks: v.array(v.object({
      filename: v.string(),
      cellIndex: v.number(),
      content: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("workflows", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateWorkflow = mutation({
  args: {
    id: v.id("workflows"),
    notebookCells: v.array(v.object({
      cellType: v.union(v.literal("code"), v.literal("markdown"), v.literal("text")),
      source: v.string(),
    })),
    // 2. Added packages validator to updateWorkflow
    packages: v.optional(v.array(v.string())),
    sourceNotebooks: v.optional(v.array(v.object({
      filename: v.string(),
      cellIndex: v.number(),
      content: v.string(),
    }))),
  },
  handler: async (ctx, { id, notebookCells, sourceNotebooks, packages }) => {
    // 3. Build a dynamic patches payload depending on what args were passed
    const patches: any = {
      notebookCells,
      updatedAt: Date.now(),
    };

    if (sourceNotebooks !== undefined) {
      patches.sourceNotebooks = sourceNotebooks;
    }

    if (packages !== undefined) {
      patches.packages = packages;
    }

    await ctx.db.patch(id, patches);
  },
});

export const deleteWorkflow = mutation({
  args: { id: v.id("workflows") },
  handler: async (ctx, { id }) => {
    const conversations = await ctx.db
      .query("conversations")
      .withIndex("by_workflowId", (q) => q.eq("workflowId", id))
      .collect();
    for (const msg of conversations) {
      await ctx.db.delete(msg._id);
    }
    await ctx.db.delete(id);
  },
});