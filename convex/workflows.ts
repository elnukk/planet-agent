import { mutation, query } from "./_generated/server";
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

async function deleteWorkflowAndConversations(
  ctx: { db: any },
  workflowId: any
): Promise<boolean> {
  const workflow = await ctx.db.get(workflowId);
  if (!workflow) return false;

  while (true) {
    const messages = await ctx.db
      .query("conversations")
      .withIndex("by_workflow_createdAt", (q: any) => q.eq("workflowId", workflowId))
      .take(1000);
    if (messages.length === 0) break;
    for (const message of messages) {
      await ctx.db.delete(message._id);
    }
  }

  await ctx.db.delete(workflowId);
  return true;
}

export const getWorkflow = query({
  args: { id: v.id("workflows") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getUserWorkflows = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("workflows")
      .withIndex("by_user_updatedAt", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("deletedAt"), 0))
      .order("desc")
      .collect();
  },
});

export const createWorkflow = mutation({
  args: {
    userId: v.string(),
    name: v.optional(v.string()),
    intakeJson: v.any(),
    notebookCells: v.array(notebookCell),
    sourceCells: v.array(sourceCell),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("workflows", {
      userId: args.userId,
      name: (args.name ?? "New Workflow").trim(),
      intakeJson: args.intakeJson,
      notebookCells: args.notebookCells,
      sourceCells: args.sourceCells,
      deletedAt: 0,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateWorkflow = mutation({
  args: { id: v.id("workflows"), notebookCells: v.array(notebookCell) },
  handler: async (ctx, args) => {
    const workflow = await ctx.db.get(args.id);
    if (!workflow) return null;
    await ctx.db.patch(args.id, {
      notebookCells: args.notebookCells,
      updatedAt: Date.now(),
    });
    return await ctx.db.get(args.id);
  },
});

export const deleteWorkflow = mutation({
  args: { id: v.id("workflows") },
  handler: async (ctx, args) => {
    return await deleteWorkflowAndConversations(ctx, args.id);
  },
});

export const getDeletedWorkflows = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("workflows")
      .withIndex("by_user_updatedAt", (q) => q.eq("userId", args.userId))
      .filter((q) => q.neq(q.field("deletedAt"), 0))
      .order("desc")
      .collect();
  },
});

export const softDeleteWorkflow = mutation({
  args: { id: v.id("workflows") },
  handler: async (ctx, args) => {
    const workflow = await ctx.db.get(args.id);
    if (!workflow) return false;
    await ctx.db.patch(args.id, { deletedAt: Date.now(), updatedAt: Date.now() });
    return true;
  },
});

export const restoreWorkflow = mutation({
  args: { id: v.id("workflows") },
  handler: async (ctx, args) => {
    const workflow = await ctx.db.get(args.id);
    if (!workflow) return false;
    await ctx.db.patch(args.id, { deletedAt: 0, updatedAt: Date.now() });
    return true;
  },
});

export const permanentlyDeleteWorkflow = mutation({
  args: { id: v.id("workflows") },
  handler: async (ctx, args) => {
    return await deleteWorkflowAndConversations(ctx, args.id);
  },
});

export const purgeExpiredWorkflows = mutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    let purged = 0;

    while (true) {
      const candidates = await ctx.db
        .query("workflows")
        .filter((q) =>
          q.and(q.neq(q.field("deletedAt"), 0), q.lt(q.field("deletedAt"), cutoff))
        )
        .take(50);
      if (candidates.length === 0) break;
      for (const wf of candidates) {
        await deleteWorkflowAndConversations(ctx, wf._id);
        purged++;
      }
    }

    return purged;
  },
});
