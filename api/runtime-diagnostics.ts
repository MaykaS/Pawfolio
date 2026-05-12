import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sendJson, supabaseAdmin, userFromRequest } from "./_supabase.js";
import { normalizeState } from "../src/pawfolio.js";

function snapshotSummaryFromState(state: ReturnType<typeof normalizeState>, extra?: { photos?: number; docs?: number; updatedAt?: string | null }) {
  return {
    updatedAt: extra?.updatedAt || undefined,
    profile: Boolean(state.profile),
    reminders: state.reminders.length,
    care: state.care.length + state.careEvents.length,
    diary: state.diary.length,
    photos: extra?.photos ?? 0,
    docs: extra?.docs ?? 0,
  };
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  const env = {
    supabaseClient: Boolean(process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_ANON_KEY),
    vapidPublic: Boolean(process.env.VITE_VAPID_PUBLIC_KEY),
    serverSupabase: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
    serverVapid: Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_SUBJECT),
    cronSecret: Boolean(process.env.CRON_SECRET),
  };

  const diagnostics: {
    env: typeof env;
    expectations: { cronSchedule: "*/5 * * * *" };
    user?: {
      snapshot: ReturnType<typeof snapshotSummaryFromState> | null;
      pushSubscriptions: number;
    };
  } = {
    env,
    expectations: {
      cronSchedule: "*/5 * * * *",
    },
  };

  const user = await userFromRequest(request);
  if (!user || !env.serverSupabase) {
    return sendJson(response, 200, diagnostics);
  }

  const supabase = supabaseAdmin();
  const [{ data: snapshot, error: snapshotError }, { count, error: subscriptionError }] = await Promise.all([
    supabase
      .from("pawfolio_snapshots")
      .select("state,updated_at,photos,docs")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("push_subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
  ]);

  if (snapshotError) return sendJson(response, 500, { error: snapshotError.message });
  if (subscriptionError) return sendJson(response, 500, { error: subscriptionError.message });

  diagnostics.user = {
    snapshot: snapshot?.state
      ? snapshotSummaryFromState(normalizeState(snapshot.state), {
          updatedAt: snapshot.updated_at,
          photos: snapshot.photos?.length || 0,
          docs: snapshot.docs?.length || 0,
        })
      : null,
    pushSubscriptions: count || 0,
  };

  return sendJson(response, 200, diagnostics);
}
