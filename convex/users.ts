import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export const getUser = query({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getUserByExternalId = query({
  args: { externalId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_externalId", (q) => q.eq("externalId", args.externalId))
      .unique();
  },
});

export const getUserByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const email = normalizeEmail(args.email);
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();
  },
});

export const createUser = mutation({
  args: { externalId: v.string(), name: v.string(), email: v.string() },
  handler: async (ctx, args) => {
    const existingByExternalId = await ctx.db
      .query("users")
      .withIndex("by_externalId", (q) => q.eq("externalId", args.externalId))
      .unique();
    if (existingByExternalId) return existingByExternalId._id;

    const email = normalizeEmail(args.email);
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, {
        externalId: args.externalId,
        name: args.name.trim(),
      });
      return existing._id;
    }

    const now = Date.now();
    return await ctx.db.insert("users", {
      externalId: args.externalId,
      name: args.name.trim(),
      email,
      createdAt: now,
    });
  },
});

export const updateUser = mutation({
  args: { id: v.id("users"), name: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.id);
    if (!user) return null;
    await ctx.db.patch(args.id, { name: args.name.trim() });
    return await ctx.db.get(args.id);
  },
});
