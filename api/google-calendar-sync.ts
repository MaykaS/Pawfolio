import type { VercelRequest, VercelResponse } from "@vercel/node";
import { buildGoogleCalendarEvent, normalizeState, visibleReminders } from "../src/pawfolio.js";
import { googleCalendarRequest, resolveGoogleAccessToken, type StoredGoogleIntegration } from "./_google-calendar.js";
import { sendJson, userFromRequest, supabaseAdmin } from "./_supabase.js";

type CalendarEventLink = {
  id: string;
  local_item_type: string;
  local_item_id: string;
  google_event_id: string;
  last_synced_fingerprint?: string | null;
};

function fingerprintEvent(body: unknown) {
  return JSON.stringify(body);
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== "POST") return sendJson(response, 405, { error: "Method not allowed" });

  const user = await userFromRequest(request);
  if (!user) return sendJson(response, 401, { error: "Sign in before syncing Google Calendar." });

  const supabase = supabaseAdmin();
  const { data: account, error: accountError } = await supabase
    .from("integration_accounts")
    .select("*")
    .eq("user_id", user.id)
    .eq("provider", "google_calendar")
    .maybeSingle();
  if (accountError) return sendJson(response, 500, { error: accountError.message });
  if (!account) return sendJson(response, 400, { error: "Google Calendar is not connected yet." });

  const { data: snapshot, error: snapshotError } = await supabase
    .from("pawfolio_snapshots")
    .select("state")
    .eq("user_id", user.id)
    .maybeSingle();
  if (snapshotError) return sendJson(response, 500, { error: snapshotError.message });
  if (!snapshot?.state) return sendJson(response, 400, { error: "No cloud Pawfolio backup was found to sync." });

  const accessToken = await resolveGoogleAccessToken(account as StoredGoogleIntegration);
  const state = normalizeState(snapshot.state);
  const petName = state.profile?.name || "Pawfolio";
  const reminders = visibleReminders(state);
  const { data: links, error: linkError } = await supabase
    .from("calendar_event_links")
    .select("*")
    .eq("user_id", user.id);
  if (linkError) return sendJson(response, 500, { error: linkError.message });

  const linksByLocalId = new Map((links || []).map((link: CalendarEventLink) => [`${link.local_item_type}:${link.local_item_id}`, link]));
  const activeKeys = new Set<string>();
  let synced = 0;

  for (const reminder of reminders) {
    const body = {
      ...buildGoogleCalendarEvent(reminder, petName),
      eventType: "default",
    };
    const key = `reminder:${reminder.id}`;
    activeKeys.add(key);
    const fingerprint = fingerprintEvent(body);
    const link = linksByLocalId.get(key);

    if (!link) {
      const created = await googleCalendarRequest<{ id: string }>(
        "/calendars/primary/events",
        accessToken,
        {
          method: "POST",
          body: JSON.stringify(body),
        },
      );
      await supabase.from("calendar_event_links").insert({
        user_id: user.id,
        local_item_type: "reminder",
        local_item_id: reminder.id,
        google_event_id: created.id,
        last_synced_fingerprint: fingerprint,
        last_synced_at: new Date().toISOString(),
      });
      synced += 1;
      continue;
    }

    if (link.last_synced_fingerprint !== fingerprint) {
      await googleCalendarRequest(
        `/calendars/primary/events/${encodeURIComponent(link.google_event_id)}`,
        accessToken,
        {
          method: "PUT",
          body: JSON.stringify(body),
        },
      );
      await supabase
        .from("calendar_event_links")
        .update({
          last_synced_fingerprint: fingerprint,
          last_synced_at: new Date().toISOString(),
        })
        .eq("id", link.id);
      synced += 1;
    }
  }

  let deleted = 0;
  for (const link of (links || []) as CalendarEventLink[]) {
    const key = `${link.local_item_type}:${link.local_item_id}`;
    if (activeKeys.has(key)) continue;
    await googleCalendarRequest(
      `/calendars/primary/events/${encodeURIComponent(link.google_event_id)}`,
      accessToken,
      {
        method: "DELETE",
      },
    ).catch(() => undefined);
    await supabase.from("calendar_event_links").delete().eq("id", link.id);
    deleted += 1;
  }

  const lastSyncAt = new Date().toISOString();
  await supabase
    .from("integration_accounts")
    .update({
      status: "connected",
      last_synced_at: lastSyncAt,
      last_error: null,
      updated_at: lastSyncAt,
    })
    .eq("user_id", user.id)
    .eq("provider", "google_calendar");

  return sendJson(response, 200, { ok: true, synced, deleted, lastSyncAt });
}
