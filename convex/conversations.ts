// conversations.ts
// PURPOSE: Convex query and mutation functions for managing chat history
// per workflow. One message per row.
// CONNECTS TO:
//   - schema.ts for the conversations table definition
//   - src/components/workflow/ChatSidebar.tsx reads and writes from here
//   - src/lib/agent/chatAssistant.ts loads conversation history from here
//     to maintain context across messages (M3)
//
// FUNCTIONS NEEDED:
//
// queries (read):
//   - getConversation(workflowId)
//       returns all messages for a workflow in chronological order
//       used by ChatSidebar to render the chat history on load
//
// mutations (write):
//   - sendMessage(workflowId, role, content)
//       called every time a user or assistant sends a message
//       role is either "user" or "assistant"
//       returns the new message id
//
//   - clearConversation(workflowId)
//       deletes all messages for a workflow
//       used if the user wants to reset the chat
//
// RESOURCES:
// https://docs.convex.dev/functions/queries
// https://docs.convex.dev/functions/mutations

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getConversation = query({
  args: { workflowId: v.id("workflows") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("conversations")
      .withIndex("by_workflow_createdAt", (q) => q.eq("workflowId", args.workflowId))
      .order("asc")
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