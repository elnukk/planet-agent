import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// ─── Queries ──────────────────────────────────────────────────────────────────

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

// ─── Mutations ────────────────────────────────────────────────────────────────

export const createWorkflow = mutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
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
    region: v.any(),
    dateRange: v.object({ start: v.string(), end: v.string() }),
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
    followUpQA: v.array(v.object({ question: v.string(), answer: v.string() })),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("workflows", {
      ...args,
      notebookCells: [],
      sourceNotebooks: [],
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const deleteWorkflow = mutation({
  args: { id: v.id("workflows") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});
