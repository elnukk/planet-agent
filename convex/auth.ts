"use node";

import bcrypt from "bcryptjs";
import { action, internalAction } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";

type SignInResult = {
  convexId: string;
  name: string;
  email: string;
  username: string | undefined;
  phoneNumber: string | undefined;
  organizationName: string | undefined;
  roleInOrganization: string | undefined;
} | null;

export const signIn = action({
  args: { email: v.string(), password: v.string() },
  handler: async (ctx, { email, password }): Promise<SignInResult> => {
    const user: Doc<"users"> | null = await ctx.runQuery(api.users.getUserByEmail, {
      email: email.toLowerCase().trim(),
    });
    if (!user || !user.passwordHash) return null;
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return null;
    return {
      convexId: user._id as string,
      name: user.name,
      email: user.email,
      username: user.username,
      phoneNumber: user.phoneNumber,
      organizationName: user.organizationName,
      roleInOrganization: user.roleInOrganization,
    };
  },
});

export const createVerifiedAccount = action({
  args: {
    name: v.string(),
    email: v.string(),
    password: v.string(),
    username: v.optional(v.string()),
    phoneNumber: v.optional(v.string()),
    organizationName: v.optional(v.string()),
    roleInOrganization: v.optional(v.string()),
    apiKeyDescription: v.optional(v.string()),
    apiKeyValue: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ convexId: string } | { error: "exists" }> => {
    const email = args.email.toLowerCase().trim();
    const existing: Doc<"users"> | null = await ctx.runQuery(api.users.getUserByEmail, { email });
    if (existing) return { error: "exists" };
    const passwordHash = await bcrypt.hash(args.password, 10);
    const convexId: string = await ctx.runMutation(internal.users.createUserWithHash, {
      name: args.name.trim(),
      email,
      passwordHash,
      phoneNumber: args.phoneNumber,
      organizationName: args.organizationName,
      roleInOrganization: args.roleInOrganization,
      apiKeyDescription: args.apiKeyDescription,
      apiKeyValue: args.apiKeyValue,
    }) as string;
    await ctx.runMutation(internal.users.markEmailVerified, { email });
    return { convexId };
  },
});

export const sendVerificationCode = action({
  args: { email: v.string() },
  handler: async (ctx, { email }): Promise<{ devCode?: string }> => {
    const devCode: string | null = await ctx.runAction(internal.auth.sendCode, {
      email: email.toLowerCase().trim(),
    });
    return devCode ? { devCode } : {};
  },
});

export const sendCode = internalAction({
  args: { email: v.string() },
  handler: async (ctx, { email }): Promise<string | null> => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000;
    await ctx.runMutation(internal.verificationCodes.storeCode, { email, code, expiresAt });

    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM_EMAIL ?? "Project Centinela <noreply@planet-agent.com>";

    if (apiKey) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from,
          to: email,
          subject: "Your verification code",
          html: `<p>Your code: <strong style="font-size:24px;letter-spacing:4px">${code}</strong></p><p>Expires in 10 minutes.</p>`,
        }),
      });
      return null;
    }

    console.log(`[DEV] Verification code for ${email}: ${code}`);
    return code;
  },
});

export const changePassword = action({
  args: { email: v.string(), currentPassword: v.string(), newPassword: v.string() },
  handler: async (ctx, { email, currentPassword, newPassword }): Promise<boolean> => {
    const user: Doc<"users"> | null = await ctx.runQuery(api.users.getUserByEmail, {
      email: email.toLowerCase().trim(),
    });
    if (!user || !user.passwordHash) return false;
    const match = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!match) return false;
    const newHash = await bcrypt.hash(newPassword, 10);
    await ctx.runMutation(internal.users.updatePasswordHash, { id: user._id, passwordHash: newHash });
    return true;
  },
});

export const resetPassword = action({
  args: { email: v.string(), code: v.string(), newPassword: v.string() },
  handler: async (ctx, { email, code, newPassword }): Promise<boolean> => {
    const normalEmail = email.toLowerCase().trim();
    const valid: boolean = await ctx.runMutation(internal.verificationCodes.consumeCode, {
      email: normalEmail,
      code,
    });
    if (!valid) return false;
    const user: Doc<"users"> | null = await ctx.runQuery(api.users.getUserByEmail, { email: normalEmail });
    if (!user) return false;
    const newHash = await bcrypt.hash(newPassword, 10);
    await ctx.runMutation(internal.users.updatePasswordHash, { id: user._id, passwordHash: newHash });
    return true;
  },
});
