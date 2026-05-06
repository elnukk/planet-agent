import { v } from "convex/values";
<<<<<<< HEAD
import { query, mutation } from "./_generated/server";
=======
import { mutation, query } from "./_generated/server";
>>>>>>> e6e828c193ab807cabe5fbf0f685dc1ccd22b861

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

export const createWorkflow = mutation({
  args: {
    userId: v.id("users"),
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
    notebookCells: v.array(
      v.object({
        cellType: v.union(v.literal("code"), v.literal("markdown"), v.literal("text")),
        source: v.string(),
      })
    ),
    sourceNotebooks: v.array(
      v.object({ filename: v.string(), cellIndex: v.number(), content: v.string() })
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("workflows", {
      ...args,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const updateWorkflow = mutation({
  args: {
    id: v.id("workflows"),
    notebookCells: v.array(
      v.object({
        cellType: v.union(v.literal("code"), v.literal("markdown"), v.literal("text")),
        source: v.string(),
      })
    ),
  },
  handler: async (ctx, { id, notebookCells }) => {
    await ctx.db.patch(id, { notebookCells, updatedAt: Date.now() });
  },
});

export const deleteWorkflow = mutation({
  args: { id: v.id("workflows") },
  handler: async (ctx, { id }) => {
    const conversations = await ctx.db
      .query("conversations")
      .withIndex("by_workflowId", (q) => q.eq("workflowId", id))
      .collect();

<<<<<<< HEAD
    await Promise.all(conversations.map((c) => ctx.db.delete(c._id)));
=======
// mutations (write):
//   - createWorkflow(userId, intakeJson, notebookCells, sourceCells)
//       called after assembly is complete in M2
//       saves the full workflow to the database
//       returns the new workflow id
//
//   - updateWorkflow(id, notebookCells)
//       called when the user edits a workflow via chat in M3
//       updates the notebook cells in place
//
//   - deleteWorkflow(id)
//       deletes a workflow and its associated conversations
//
// RESOURCES:
// https://docs.convex.dev/functions/queries
// https://docs.convex.dev/functions/mutations

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
  },
  handler: async (ctx, { id, notebookCells }) => {
    await ctx.db.patch(id, { notebookCells, updatedAt: Date.now() });
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
>>>>>>> e6e828c193ab807cabe5fbf0f685dc1ccd22b861
    await ctx.db.delete(id);
  },
});
