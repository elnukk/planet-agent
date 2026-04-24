import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getConversation = query({
  args: { workflowId: v.id("workflows") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("conversations")
      .withIndex("by_workflow_createdAt", (q) => q.eq("workflowId", args.workflowId))
      .collect();
  },
});

export const sendMessage = mutation({
  args: {
    workflowId: v.id("workflows"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("conversations", {
      workflowId: args.workflowId,
      role: args.role,
      content: args.content,
      createdAt: Date.now(),
    });
  },
});

export const clearConversation = mutation({
  args: { workflowId: v.id("workflows") },
  handler: async (ctx, args) => {
    let deleted = 0;
    while (true) {
      const messages = await ctx.db
        .query("conversations")
        .withIndex("by_workflow_createdAt", (q) => q.eq("workflowId", args.workflowId))
        .take(1000);
      if (messages.length === 0) break;
      for (const message of messages) {
        await ctx.db.delete(message._id);
        deleted++;
      }
    }
    return deleted;
  },
});
