import { createClient, type Session } from "@supabase/supabase-js";
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
        detectSessionInUrl: true,
      },
    })
  : undefined;

export function missingCloudConfigMessage() {
  if (cloudConfigured) return "";
  return "Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel to enable accounts.";
}

export async function signInWithGoogle() {
  if (!supabase) throw new Error(missingCloudConfigMessage());
  const redirectTo = window.location.origin;
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo },
  });
  if (error) throw error;
}

export async function uploadLocalPawfolioToAccount(state: PawfolioState) {
  if (!supabase) throw new Error(missingCloudConfigMessage());
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  const user = userData.user;
  if (!user) throw new Error("Sign in before uploading Pawfolio.");

  const { error } = await supabase.from("pawfolio_snapshots").upsert({
    user_id: user.id,
    state,
    local_storage_key: storageKey,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

function urlBase64ToUint8Array(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = `${value}${padding}`.replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map((char) => char.charCodeAt(0)));
}

export async function subscribeDeviceToPush(session: Session) {
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

  const response = await fetch("/api/push-subscriptions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ subscription }),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Could not save this phone for push notifications.");
  }
}
