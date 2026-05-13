import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sendJson, supabaseAdmin, userFromRequest } from "./_supabase.js";
import { normalizeState } from "../src/pawfolio.js";

type SnapshotRow = {
  state?: Record<string, unknown> | null;
  updated_at?: string | null;
  photos?: unknown[] | null;
  docs?: unknown[] | null;
};

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
    expectations: { deliveryScheduler: "external cron every 5 minutes" };
    user?: {
      snapshot: ReturnType<typeof snapshotSummaryFromState> | null;
      pushSubscriptions: number;
    };
  } = {
    env,
    expectations: {
      deliveryScheduler: "external cron every 5 minutes",
    },
  };

  const user = await userFromRequest(request);
  if (!user || !env.serverSupabase) {
    return sendJson(response, 200, diagnostics);
  }

  const supabase = supabaseAdmin();
  const [{ data: snapshot, error: snapshotError }, { count, error: subscriptionError }] = await Promise.all([
    selectSnapshotWithLegacyFallback(supabase, user.id),
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

async function selectSnapshotWithLegacyFallback(
  supabase: ReturnType<typeof supabaseAdmin>,
  userId: string,
) {
  const selectVariants = [
    "state,updated_at,photos,docs",
    "state,updated_at,photos",
    "state,updated_at",
  ];

  let lastError: { message?: string } | null = null;
  for (const fields of selectVariants) {
    const result = await supabase
      .from("pawfolio_snapshots")
      .select(fields)
      .eq("user_id", userId)
      .maybeSingle<SnapshotRow>();

    if (!result.error) {
      const row = result.data;
      return {
        data: row
          ? {
              state: row.state || null,
              updated_at: row.updated_at || null,
              photos: Array.isArray(row.photos) ? row.photos : [],
              docs: Array.isArray(row.docs) ? row.docs : [],
            }
          : null,
        error: null,
      };
    }

    lastError = result.error;
    if (!usesLegacySnapshotSchema(result.error.message)) {
      return { data: null, error: result.error };
    }
  }

  return { data: null, error: lastError };
}

function usesLegacySnapshotSchema(message = "") {
  return message.includes("docs") || message.includes("photos");
}
