import { mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";

const CODE_TTL_MS = 15 * 60 * 1000; // 15 minutes

export const generateCode = mutation({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = Date.now() + CODE_TTL_MS;

    // Delete any existing code for this email before inserting
    const existing = await ctx.db
      .query("verificationCodes")
      .withIndex("by_email", (q) => q.eq("email", email.toLowerCase()))
      .unique();
    if (existing) await ctx.db.delete(existing._id);

    await ctx.db.insert("verificationCodes", {
      email: email.toLowerCase(),
      code,
      expiresAt,
    });

    return { code };
  },
});

export const verifyCode = mutation({
  args: { email: v.string(), code: v.string() },
  handler: async (ctx, { email, code }) => {
    const record = await ctx.db
      .query("verificationCodes")
      .withIndex("by_email", (q) => q.eq("email", email.toLowerCase()))
      .unique();

    if (!record) return { valid: false, reason: "no_code" as const };
    if (Date.now() > record.expiresAt) {
      await ctx.db.delete(record._id);
      return { valid: false, reason: "expired" as const };
    }
    if (record.code !== code.trim()) {
      return { valid: false, reason: "wrong_code" as const };
    }

    await ctx.db.delete(record._id);
    return { valid: true, reason: null };
  },
});

// ─────────────────────────────────────────────
// INTERNAL (used by auth.ts actions)
// ─────────────────────────────────────────────

export const storeCode = internalMutation({
  args: { email: v.string(), code: v.string(), expiresAt: v.float64() },
  handler: async (ctx, { email, code, expiresAt }) => {
    const existing = await ctx.db
      .query("verificationCodes")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();
    if (existing) await ctx.db.delete(existing._id);
    await ctx.db.insert("verificationCodes", { email, code, expiresAt });
  },
});

export const consumeCode = internalMutation({
  args: { email: v.string(), code: v.string() },
  handler: async (ctx, { email, code }): Promise<boolean> => {
    const record = await ctx.db
      .query("verificationCodes")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();
    if (!record) return false;
    if (Date.now() > record.expiresAt) {
      await ctx.db.delete(record._id);
      return false;
    }
    if (record.code !== code.trim()) return false;
    await ctx.db.delete(record._id);
    return true;
  },
});
