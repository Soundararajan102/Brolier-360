// ============================================================
// /api/account
//
//   GET   — current caller's account + role. Any member.
//   PATCH — rename the account.                  Admin+.
//
// Why both verbs share a route file
//   They speak about the same singular resource (the caller's
//   account) and reuse the same `requireRole` plumbing. Splitting
//   them across files would duplicate the `account_id` lookup
//   without buying anything.
// ============================================================

import { NextResponse } from "next/server";

import {
  requireRole,
  getCurrentAccount,
  toErrorResponse,
} from "@/lib/auth/account";
import {
  checkRateLimit,
  rateLimitResponse,
  RATE_LIMITS,
} from "@/lib/rate-limit";

export async function GET() {
  try {
    const ctx = await getCurrentAccount();
    return NextResponse.json({
      account: ctx.account,
      role: ctx.role,
    });
  } catch (err) {
    return toErrorResponse(err);
  }
}

const MAX_NAME_LEN = 80;

export async function PATCH(request: Request) {
  try {
    const ctx = await requireRole("admin");

    // Per-user limit on admin-class mutations. Bounds accidental
    // abuse (script run in a loop) and a compromised admin session
    // spamming renames. Each admin endpoint keys its own bucket so
    // one route doesn't starve another.
    const limit = checkRateLimit(
      `admin:rename:${ctx.userId}`,
      RATE_LIMITS.adminAction,
    );
    if (!limit.success) return rateLimitResponse(limit);

    const body = (await request.json().catch(() => null)) as
      | { name?: unknown }
      | null;
    const rawName = body?.name;

    if (typeof rawName !== "string") {
      return NextResponse.json(
        { error: "'name' must be a string" },
        { status: 400 },
      );
    }

    const name = rawName.trim();
    if (name.length === 0) {
      return NextResponse.json(
        { error: "Account name cannot be empty" },
        { status: 400 },
      );
    }
    if (name.length > MAX_NAME_LEN) {
      return NextResponse.json(
        { error: `Account name must be ${MAX_NAME_LEN} characters or fewer` },
        { status: 400 },
      );
    }

    // RLS allows this UPDATE because accounts_update requires
    // `is_account_member(id, 'admin')`, and requireRole already
    // guaranteed the caller is admin+.
    const { data, error } = await ctx.supabase
      .from("accounts")
      .update({ name })
      .eq("id", ctx.accountId)
      .select("id, name")
      .single();

    if (error) {
      console.error("[PATCH /api/account] update error:", error);
      return NextResponse.json(
        { error: "Failed to update account" },
        { status: 500 },
      );
    }

    return NextResponse.json({ account: data });
  } catch (err) {
    return toErrorResponse(err);
  }
}

import { createClient } from "@supabase/supabase-js";

export async function DELETE() {
  try {
    const ctx = await getCurrentAccount();
    const { userId, accountId, supabase } = ctx;

    const limit = checkRateLimit(
      `admin:delete_account:${userId}`,
      RATE_LIMITS.adminAction,
    );
    if (!limit.success) return rateLimitResponse(limit);

    const { data: account, error: accountErr } = await supabase
      .from("accounts")
      .select("owner_user_id")
      .eq("id", accountId)
      .single();

    if (accountErr || !account) {
      return NextResponse.json(
        { error: "Account not found" },
        { status: 404 },
      );
    }

    if (account.owner_user_id !== userId) {
      return NextResponse.json(
        { error: "Only the account owner can delete the entire account and user identity." },
        { status: 403 },
      );
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    // 1. Storage Cleanup (Postgres CASCADE doesn't touch S3/Storage)
    const buckets = ["chat-media", "flow-media"];
    for (const bucket of buckets) {
      const folderPath = `account-${accountId}`;
      const { data: files } = await supabaseAdmin.storage
        .from(bucket)
        .list(folderPath, { limit: 1000 });

      if (files && files.length > 0) {
        // filter out `.emptyFolderPlaceholder` if needed, but remove() handles it
        const filePaths = files.map((f) => `${folderPath}/${f.name}`);
        await supabaseAdmin.storage.from(bucket).remove(filePaths);
      }
    }

    // 2. Database Wipe
    // Deleting the accounts row cascades and destroys contacts, pipelines, etc.
    const { error: delAccountErr } = await supabaseAdmin
      .from("accounts")
      .delete()
      .eq("id", accountId);

    if (delAccountErr) {
      console.error("[DELETE /api/account] delete account error:", delAccountErr);
      return NextResponse.json(
        { error: "Failed to delete account data" },
        { status: 500 },
      );
    }

    // 3. Identity Wipe
    const { error: delUserErr } = await supabaseAdmin.auth.admin.deleteUser(
      userId,
    );

    if (delUserErr) {
      console.error("[DELETE /api/account] delete user error:", delUserErr);
      return NextResponse.json(
        { error: "Failed to delete user identity" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return toErrorResponse(err);
  }
}
