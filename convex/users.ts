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

// Returns the user's saved API keys array. Use this in notebook execution
// code to inject the correct Planet API key without exposing the full user doc.
export const getUserApiKeys = query({
  args: { id: v.id("users") },
  handler: async (ctx, { id }) => {
    const user = await ctx.db.get(id);
    if (!user) return [];
    return user.apiKeys ?? [];
  },
});

// ─────────────────────────────────────────────
// MUTATIONS
// ─────────────────────────────────────────────

export const createUser = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    username: v.optional(v.string()),
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
      username: args.username,
      externalId: undefined,
      passwordHash: undefined,
      phoneNumber: undefined,
      organizationName: undefined,
      roleInOrganization: undefined,
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

export const addApiKey = mutation({
  args: {
    id: v.id("users"),
    description: v.string(),
    value: v.string(),
  },
  handler: async (ctx, { id, description, value }) => {
    const user = await ctx.db.get(id);
    if (!user) throw new Error("User not found");
    const existing = user.apiKeys ?? [];
    await ctx.db.patch(id, {
      apiKeys: [
        ...existing,
        { id: crypto.randomUUID(), description, value, createdAt: Date.now() },
      ],
    });
  },
});

export const deleteApiKey = mutation({
  args: { id: v.id("users"), keyId: v.string() },
  handler: async (ctx, { id, keyId }) => {
    const user = await ctx.db.get(id);
    if (!user) throw new Error("User not found");
    await ctx.db.patch(id, {
      apiKeys: (user.apiKeys ?? []).filter((k) => k.id !== keyId),
    });
  },
});

export const setApiKey = mutation({
  args: {
    id: v.id("users"),
    apiKeyValue: v.string(),
    apiKeyDescription: v.optional(v.string()),
  },
  handler: async (ctx, { id, apiKeyValue, apiKeyDescription }) => {
    const user = await ctx.db.get(id);
    if (!user) throw new Error("User not found");
    await ctx.db.patch(id, {
      apiKeyValue,
      apiKeyDescription: apiKeyDescription ?? "Planet API Key",
    });
  },
});

export const removeApiKey = mutation({
  args: { id: v.id("users") },
  handler: async (ctx, { id }) => {
    const user = await ctx.db.get(id);
    if (!user) throw new Error("User not found");
    await ctx.db.patch(id, { apiKeyValue: undefined, apiKeyDescription: undefined });
  },
});