import { createClient, type Session } from "@supabase/supabase-js";
import { collectSnapshotHealthDocRecords, restoreSnapshotHealthDocs, type HealthDocRecord } from "./docStore";
import { collectSnapshotPhotoRecords, restoreSnapshotPhotos, type PhotoRecord } from "./photoStore";
import { storageKey, type PawfolioState } from "./pawfolio";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

export const cloudConfigured = Boolean(supabaseUrl && supabaseAnonKey);
export const pushConfigured = Boolean(vapidPublicKey);

export const supabase = cloudConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        flowType: "pkce",
      },
    })
  : undefined;

type AuthCallbackState = {
  requestedTab: string;
  authReturn: boolean;
  code: string;
  error: string;
  intent: string;
};

export function parseAuthCallbackUrl(input: string): AuthCallbackState {
  const url = new URL(input, "https://pawfolio.local");
  return {
    requestedTab: url.searchParams.get("tab") || "",
    authReturn: url.searchParams.get("auth-return") === "1",
    code: url.searchParams.get("code") || "",
    error: url.searchParams.get("error_description") || url.searchParams.get("error") || "",
    intent: url.searchParams.get("intent") || "",
  };
}

export function cleanupAuthCallbackUrl(input: string) {
  const url = new URL(input, "https://pawfolio.local");
  ["auth-return", "code", "state", "error", "error_description", "intent"].forEach((key) => url.searchParams.delete(key));
  const search = url.searchParams.toString();
  return `${url.pathname}${search ? `?${search}` : ""}`;
}

export function missingCloudConfigMessage() {
  if (cloudConfigured) return "";
  return "Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel to enable accounts.";
}

type GoogleSignInOptions = {
  intent?: string;
  scopes?: string;
  forceConsent?: boolean;
};

export async function signInWithGoogle(options: GoogleSignInOptions = {}) {
  if (!supabase) throw new Error(missingCloudConfigMessage());
  const redirectUrl = new URL(`${window.location.origin}/`);
  redirectUrl.searchParams.set("tab", "profile");
  redirectUrl.searchParams.set("auth-return", "1");
  if (options.intent) redirectUrl.searchParams.set("intent", options.intent);
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: redirectUrl.toString(),
      scopes: options.scopes,
      queryParams: {
        prompt: options.forceConsent ? "consent select_account" : "select_account",
        ...(options.forceConsent ? { access_type: "offline" } : {}),
        ...(options.scopes ? { include_granted_scopes: "true" } : {}),
      },
    },
  });
  if (error) throw error;
}

export async function uploadLocalPawfolioToAccount(state: PawfolioState) {
  if (!supabase) throw new Error(missingCloudConfigMessage());
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  const user = userData.user;
  if (!user) throw new Error("Sign in before uploading Pawfolio.");

  const photos = await collectSnapshotPhotoRecords(state);
  const docs = await collectSnapshotHealthDocRecords(state);
  const payload = {
    user_id: user.id,
    state,
    photos,
    docs,
    local_storage_key: storageKey,
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabase.from("pawfolio_snapshots").upsert({
    ...payload,
    push_enabled: Boolean(state.notificationPreferences?.push),
    email_enabled: Boolean(state.notificationPreferences?.email),
  });
  if (error && usesLegacySnapshotSchema(error.message)) {
    const fallback = await supabase.from("pawfolio_snapshots").upsert(payload);
    if (fallback.error) throw fallback.error;
    return;
  }
  if (error) throw error;
}

export async function downloadCloudPawfolioToLocal() {
  if (!supabase) throw new Error(missingCloudConfigMessage());
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  const user = userData.user;
  if (!user) throw new Error("Sign in before restoring Pawfolio.");

  const { data, error } = await supabase
    .from("pawfolio_snapshots")
    .select("state,updated_at,photos,docs")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function hydrateSnapshotPhotos(photos?: PhotoRecord[] | null) {
  await restoreSnapshotPhotos(photos || []);
}

export async function hydrateSnapshotHealthDocs(docs?: HealthDocRecord[] | null) {
  await restoreSnapshotHealthDocs(docs || []);
}

export async function getCloudSession() {
  if (!supabase) throw new Error(missingCloudConfigMessage());
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function connectGoogleCalendar(
  session: Session,
  providerAccessToken: string,
  providerRefreshToken?: string,
) {
  const response = await fetch("/api/google-calendar-connect", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      providerAccessToken,
      providerRefreshToken,
      scopes: "https://www.googleapis.com/auth/calendar",
      providerEmail: session.user.email || "",
      providerUserId: session.user.user_metadata?.sub || session.user.id,
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "Could not connect Google Calendar.");
  return payload;
}

export async function syncGoogleCalendar(session: Session) {
  const response = await fetch("/api/google-calendar-sync", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "Could not sync Google Calendar.");
  return payload as { ok: true; synced: number; created: number; updated: number; deleted: number; lastSyncAt?: string };
}

function urlBase64ToUint8Array(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = `${value}${padding}`.replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map((char) => char.charCodeAt(0)));
}

export async function subscribeDeviceToPush(session: Session) {
  if (!supabase) throw new Error(missingCloudConfigMessage());
  if (!pushConfigured || !vapidPublicKey) {
    throw new Error("Add VITE_VAPID_PUBLIC_KEY in Vercel to enable phone push.");
  }
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    throw new Error("This browser does not support PWA push notifications.");
  }
  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error("Phone notifications are not allowed yet.");

  const registration = await navigator.serviceWorker.ready;
  const existing = await registration.pushManager.getSubscription();
  const subscription =
    existing ||
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    }));

  const { error } = await supabase.from("push_subscriptions").upsert({
    user_id: session.user.id,
    endpoint: subscription.endpoint,
    subscription,
    user_agent: navigator.userAgent || "",
    updated_at: new Date().toISOString(),
  }, {
    onConflict: "endpoint",
  });
  if (error) throw new Error(error.message || "Could not save this phone for push notifications.");
}

function usesLegacySnapshotSchema(message = "") {
  return message.includes("push_enabled") || message.includes("email_enabled") || message.includes("docs");
}
