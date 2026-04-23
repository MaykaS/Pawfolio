import webpush from "web-push";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requiredEnv, sendJson, supabaseAdmin } from "./_supabase.js";

type ReminderLike = {
  id: string;
  title: string;
  type: string;
  date: string;
  time?: string;
  recurrence?: string;
  notifyLeadMinutes?: number;
};

function localISO(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

function reminderDateTime(reminder: ReminderLike) {
  const [hours = "9", minutes = "0"] = (reminder.time || "09:00").split(":");
  const date = new Date(`${reminder.date}T00:00:00.000Z`);
  date.setUTCHours(Number(hours), Number(minutes), 0, 0);
  if (reminder.notifyLeadMinutes === 720) {
    date.setUTCHours(9, 0, 0, 0);
  } else {
    date.setUTCMinutes(date.getUTCMinutes() - (reminder.notifyLeadMinutes || 0));
  }
  return date;
}

function dueReminders(state: { reminders?: ReminderLike[]; careEvents?: ReminderLike[] }, now = new Date()) {
  const start = new Date(now.getTime() - 5 * 60 * 1000);
  const end = new Date(now.getTime() + 10 * 60 * 1000);
  return [...(state.reminders || []), ...(state.careEvents || [])].filter((reminder) => {
    if (!reminder.date) return false;
    const alertAt = reminderDateTime(reminder);
    return alertAt >= start && alertAt <= end && localISO(alertAt) === localISO(now);
  });
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.authorization !== `Bearer ${secret}`) {
    return sendJson(response, 401, { error: "Unauthorized" });
  }

  const required = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "VAPID_SUBJECT", "VAPID_PUBLIC_KEY", "VAPID_PRIVATE_KEY"];
  const missing = required.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    return sendJson(response, 200, { ok: true, configured: false, missing });
  }

  webpush.setVapidDetails(
    requiredEnv("VAPID_SUBJECT"),
    requiredEnv("VAPID_PUBLIC_KEY"),
    requiredEnv("VAPID_PRIVATE_KEY"),
  );

  const supabase = supabaseAdmin();
  const { data: snapshots, error: snapshotError } = await supabase
    .from("pawfolio_snapshots")
    .select("user_id,state")
    .order("updated_at", { ascending: false });
  if (snapshotError) return sendJson(response, 500, { error: snapshotError.message });

  let sent = 0;
  for (const snapshot of snapshots || []) {
    const reminders = dueReminders(snapshot.state || {});
    if (reminders.length === 0) continue;

    const { data: subscriptions } = await supabase
      .from("push_subscriptions")
      .select("id,subscription")
      .eq("user_id", snapshot.user_id);

    for (const reminder of reminders) {
      for (const subscription of subscriptions || []) {
        await webpush
          .sendNotification(
            subscription.subscription,
            JSON.stringify({
              title: "Pawfolio reminder",
              body: `${reminder.title} is due ${reminder.time || "today"}.`,
              tag: `pawfolio-${reminder.id}-${reminder.date}`,
              url: "/",
            }),
          )
          .then(() => {
            sent += 1;
          })
          .catch(() => undefined);
      }
    }
  }

  return sendJson(response, 200, { ok: true, sent });
}
