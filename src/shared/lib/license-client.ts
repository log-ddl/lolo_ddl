import type { Session, User } from "@supabase/supabase-js";
import { AUTH_CALLBACK_URL, supabase } from "@/shared/lib/supabase-client";

export type LicensePlan = "free" | "pro" | "unlimited" | "dev";
export type AccountStatus = "active" | "blocked";

export type AccountAccessResult = {
  allowed: boolean;
  reason?: string;
  userId: string;
  email: string;
  displayName: string;
  registeredAt?: string;
  plan: LicensePlan;
  status: AccountStatus;
  expiresAt?: string;
  maxDevices: number;
};

type JsonRecord = Record<string, unknown>;

function asRecord(value: unknown): JsonRecord {
  if (Array.isArray(value)) return asRecord(value[0]);
  return value && typeof value === "object" ? value as JsonRecord : {};
}

function readString(record: JsonRecord, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
}

function readNumber(record: JsonRecord, fallback: number, ...keys: string[]): number {
  for (const key of keys) {
    const value = Number(record[key]);
    if (Number.isFinite(value)) return value;
  }
  return fallback;
}

export function normalizePlan(value: unknown): LicensePlan {
  return value === "pro" || value === "unlimited" || value === "dev" ? value : "free";
}

export function hasPlanAccess(current: LicensePlan | undefined, required: LicensePlan): boolean {
  const rank: Record<LicensePlan, number> = { free: 0, pro: 1, unlimited: 2, dev: 3 };
  return rank[current ?? "free"] >= rank[required];
}

export async function startGoogleSignIn(): Promise<void> {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: AUTH_CALLBACK_URL,
      skipBrowserRedirect: true,
      queryParams: { prompt: "select_account" },
    },
  });
  if (error) throw error;
  if (!data.url) throw new Error("Supabase did not return a Google sign-in URL.");

  if (window.authBridge) {
    const result = await window.authBridge.openExternal(data.url);
    if (!result.success) throw new Error(result.error || "Cannot open Google sign-in.");
    return;
  }
  window.location.assign(data.url);
}

export async function finishOAuthSignIn(callbackUrl: string): Promise<Session> {
  const parsed = new URL(callbackUrl);
  const oauthError = parsed.searchParams.get("error_description") || parsed.searchParams.get("error");
  if (oauthError) throw new Error(oauthError);
  const code = parsed.searchParams.get("code");
  if (!code) throw new Error("OAuth callback is missing its authorization code.");
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) throw error;
  return data.session;
}

export async function getStoredSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function signOutAccount(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function updateDisplayName(displayName: string): Promise<void> {
  const name = displayName.trim();
  if (!name) throw new Error("Display name cannot be empty.");
  const session = await getStoredSession();
  if (!session) throw new Error("You are not signed in.");
  const { error } = await supabase.from("profiles").update({ display_name: name }).eq("user_id", session.user.id);
  if (error) throw error;
}

function getGoogleDisplayName(user: User): string {
  const metadata = asRecord(user.user_metadata);
  return readString(metadata, "full_name", "name", "display_name") || "";
}

export async function checkAccountAndClaimDevice(params: {
  deviceHash: string;
  deviceName: string;
}): Promise<AccountAccessResult> {
  const session = await getStoredSession();
  if (!session) throw new Error("You are not signed in.");

  const { data: rpcData, error: rpcError } = await supabase.rpc("check_account_and_claim_device", {
    p_device_hash: params.deviceHash,
    p_device_name: params.deviceName,
  });
  if (rpcError) throw rpcError;

  const [{ data: profile, error: profileError }, { data: entitlement, error: entitlementError }] = await Promise.all([
    supabase.from("profiles").select("display_name,email,created_at").eq("user_id", session.user.id).maybeSingle(),
    supabase.from("entitlements").select("plan,status,expires_at,max_devices").eq("user_id", session.user.id).maybeSingle(),
  ]);
  if (profileError) throw profileError;
  if (entitlementError) throw entitlementError;

  const rpc = asRecord(rpcData);
  const entitlementRecord = asRecord(entitlement);
  const profileRecord = asRecord(profile);
  const reason = readString(rpc, "reason", "code", "error");
  const status = readString(entitlementRecord, "status") === "blocked" ? "blocked" : "active";
  const expiresAt = readString(entitlementRecord, "expires_at");
  const expired = Boolean(expiresAt && new Date(expiresAt).getTime() <= Date.now());
  const explicitAllowed = typeof rpc.allowed === "boolean"
    ? rpc.allowed
    : typeof rpc.ok === "boolean"
      ? rpc.ok
      : undefined;
  const deniedReason = reason === "blocked" || reason === "device_limit" || reason === "expired";
  const allowed = explicitAllowed ?? (!deniedReason && status === "active");

  return {
    allowed,
    reason,
    userId: session.user.id,
    email: readString(profileRecord, "email") || session.user.email || "",
    displayName: readString(profileRecord, "display_name") || getGoogleDisplayName(session.user),
    registeredAt: readString(profileRecord, "created_at"),
    plan: expired ? "free" : normalizePlan(entitlementRecord.plan ?? rpc.plan),
    status,
    expiresAt,
    maxDevices: Math.max(1, readNumber(entitlementRecord, 1, "max_devices")),
  };
}
