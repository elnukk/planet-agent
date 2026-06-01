// users.ts
// PURPOSE: Convex query and mutation functions for managing user profiles.
// CONNECTS TO:
//   - schema.ts for the users table definition
//   - src/app/page.tsx calls createUser on first sign in
//   - convex/workflows.ts references userId when creating workflows
//   - src/app/dashboard/page.tsx calls getUser to load profile
//
// FUNCTIONS NEEDED:
//
// queries (read):
//   - getUser(id)
//       returns a single user by id
//       used by dashboard and workflow pages to load user context
//
//   - getUserByEmail(email)
//       looks up a user by email
//       used on sign in to check if user already exists
//
// mutations (write):
//   - createUser(name, email)
//       called on first sign in
//       checks if user already exists before creating
//       returns the new user id
//
//   - updateUser(id, name)
//       called if the user updates their profile
//
// NOTE ON AUTH:
//   Convex has built-in auth integrations — check out Clerk or Auth0
//   as the easiest options to wire up with Next.js + Convex
//   See: https://docs.convex.dev/auth
//
// RESOURCES:
// https://docs.convex.dev/functions/queries
// https://docs.convex.dev/functions/mutations

// ----------------

// users.ts
// PURPOSE: User CRUD operations for Convex
// CONNECTS TO: schema.ts (users table)

import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ─────────────────────────────────────────────
// QUERIES
// ─────────────────────────────────────────────

export const getUser = query({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getUserByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();
  },
});

// ─────────────────────────────────────────────
// MUTATIONS
// ─────────────────────────────────────────────

export const createUser = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    passwordHash: v.optional(v.string()),
    phoneNumber: v.optional(v.string()),
    organizationName: v.optional(v.string()),
    roleInOrganization: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    if (existing) {
      return existing._id;
    }

    const userId = await ctx.db.insert("users", {
      createdAt: Date.now(),
      email: args.email,
      name: args.name,
      externalId: undefined,
      passwordHash: args.passwordHash,
      phoneNumber: args.phoneNumber,
      organizationName: args.organizationName,
      roleInOrganization: args.roleInOrganization,
      apiKeyDescription: undefined,
      apiKeyValue: undefined,
    });

    return userId;
  },
});

export const updateUser = mutation({
  args: {
    id: v.id("users"),
    name: v.optional(v.string()),
    phoneNumber: v.optional(v.string()),
    organizationName: v.optional(v.string()),
    roleInOrganization: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    const user = await ctx.db.get(id);
    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(id, updates);
    return await ctx.db.get(id);
  },
});

export const deleteUser = mutation({
  args: { id: v.id("users") },
  handler: async (ctx, { id }) => {
    const user = await ctx.db.get(id);
    if (!user) return;
    const workflows = await ctx.db
      .query("workflows")
      .withIndex("by_userId", (q) => q.eq("userId", id))
      .collect();
    for (const wf of workflows) {
      const messages = await ctx.db
        .query("conversations")
        .withIndex("by_workflowId", (q) => q.eq("workflowId", wf._id))
        .collect();
      for (const msg of messages) await ctx.db.delete(msg._id);
      await ctx.db.delete(wf._id);
    }
    await ctx.db.delete(id);
  },
});

export const updateUserPassword = mutation({
  args: { id: v.id("users"), passwordHash: v.string() },
  handler: async (ctx, { id, passwordHash }) => {
    const user = await ctx.db.get(id);
    if (!user) throw new Error("User not found");
    await ctx.db.patch(id, { passwordHash });
  },
});

export const setApiKey = mutation({
  args: {
    id: v.id("users"),
    apiKeyDescription: v.optional(v.string()),
    apiKeyValue: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const user = await ctx.db.get(id);
    if (!user) throw new Error("User not found");
    await ctx.db.patch(id, updates);
  },
});

export const clearApiKey = mutation({
  args: { id: v.id("users") },
  handler: async (ctx, { id }) => {
    const user = await ctx.db.get(id);
    if (!user) throw new Error("User not found");
    await ctx.db.patch(id, { apiKeyValue: undefined, apiKeyDescription: undefined });
  },
});