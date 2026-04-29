import webpush from "web-push";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requiredEnv, sendJson, supabaseAdmin } from "./_supabase.js";
import { collectDueDeliveryCandidates, type DeliveryCandidate } from "./_delivery.js";

type StoredSubscription = {
  id: string;
  endpoint: string;
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } };
};

async function alreadyDelivered(
  userId: string,
  channel: "push" | "email",
  candidate: DeliveryCandidate,
) {
  const { data } = await supabaseAdmin()
    .from("notification_deliveries")
    .select("id,status")
    .eq("user_id", userId)
    .eq("channel", channel)
    .eq("item_type", candidate.channelItemType)
    .eq("item_id", candidate.itemId)
    .eq("occurrence_at", candidate.occurrenceAt)
    .maybeSingle();

  return data?.status === "sent";
}

async function recordDelivery(
  userId: string,
  channel: "push" | "email",
  candidate: DeliveryCandidate,
  status: "sent" | "failed",
  error?: string,
) {
  await supabaseAdmin().from("notification_deliveries").upsert(
    {
      user_id: userId,
      channel,
      item_type: candidate.channelItemType,
      item_id: candidate.itemId,
      occurrence_at: candidate.occurrenceAt,
      status,
      error: error || null,
      sent_at: status === "sent" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "user_id,channel,item_type,item_id,occurrence_at",
    },
  );
}

async function sendPushCandidate(userId: string, subscriptions: StoredSubscription[], candidate: DeliveryCandidate) {
  let sent = 0;
  for (const subscription of subscriptions) {
    try {
      await webpush.sendNotification(
        subscription.subscription,
        JSON.stringify({
          title: candidate.title,
          body: candidate.body,
          tag: `pawfolio-${candidate.channelItemType}-${candidate.itemId}-${candidate.occurrenceAt}`,
          url: candidate.url,
        }),
      );
      sent += 1;
    } catch (error) {
      const statusCode = (error as { statusCode?: number }).statusCode;
      if (statusCode === 404 || statusCode === 410) {
        await supabaseAdmin().from("push_subscriptions").delete().eq("id", subscription.id);
      }
    }
  }
  return sent;
}

async function sendEmailCandidate(userId: string, candidate: DeliveryCandidate) {
  const apiKey = process.env.RESEND_API_KEY;
  const emailFrom = process.env.EMAIL_FROM;
  if (!apiKey || !emailFrom) {
    return { ok: false, error: "Missing RESEND_API_KEY or EMAIL_FROM." };
  }

  const { data: userData, error: userError } = await supabaseAdmin().auth.admin.getUserById(userId);
  if (userError || !userData.user?.email) {
    return { ok: false, error: userError?.message || "Signed-in account email was not found." };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "User-Agent": "pawfolio/0.1",
      "Idempotency-Key": `pawfolio-${userId}-${candidate.channelItemType}-${candidate.itemId}-${candidate.occurrenceAt}`,
    },
    body: JSON.stringify({
      from: emailFrom,
      to: [userData.user.email],
      subject: candidate.title,
      html: `<p>${candidate.body}</p><p><a href="https://pawfolio-zeta.vercel.app${candidate.url}">Open Pawfolio</a></p>`,
    }),
  });

  if (response.ok) {
    return { ok: true as const };
  }

  const payload = await response.json().catch(() => ({})) as { message?: string; error?: string };
  return {
    ok: false as const,
    error: payload.message || payload.error || `Resend request failed with ${response.status}.`,
  };
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
  let emailed = 0;
  for (const snapshot of snapshots || []) {
    const preferences = snapshot.state?.notificationPreferences || {};
    if (!preferences.push && !preferences.email) continue;

    const candidates = collectDueDeliveryCandidates(snapshot.state || {});
    if (candidates.length === 0) continue;

    const subscriptions = preferences.push
      ? await supabase
          .from("push_subscriptions")
          .select("id,endpoint,subscription")
          .eq("user_id", snapshot.user_id)
      : { data: [] };

    for (const candidate of candidates) {
      if (preferences.push) {
        const skipPush = await alreadyDelivered(snapshot.user_id, "push", candidate);
        if (!skipPush) {
          const sentCount = await sendPushCandidate(snapshot.user_id, (subscriptions.data || []) as StoredSubscription[], candidate);
          if (sentCount > 0) {
            sent += sentCount;
            await recordDelivery(snapshot.user_id, "push", candidate, "sent");
          } else {
            await recordDelivery(snapshot.user_id, "push", candidate, "failed", "No valid push subscriptions accepted the notification.");
          }
        }
      }

      if (preferences.email) {
        const skipEmail = await alreadyDelivered(snapshot.user_id, "email", candidate);
        if (!skipEmail) {
          const result = await sendEmailCandidate(snapshot.user_id, candidate);
          if (result.ok) {
            emailed += 1;
            await recordDelivery(snapshot.user_id, "email", candidate, "sent");
          } else {
            await recordDelivery(snapshot.user_id, "email", candidate, "failed", result.error || "Email send failed.");
          }
        }
      }
    }
  }

  return sendJson(response, 200, { ok: true, sent, emailed });
}
