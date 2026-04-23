import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sendJson, supabaseAdmin, userFromRequest } from "./_supabase";

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== "POST") return sendJson(response, 405, { error: "Method not allowed" });

  const user = await userFromRequest(request);
  if (!user) return sendJson(response, 401, { error: "Sign in before enabling push." });

  const body = request.body || {};
  const subscription = body.subscription;
  if (!subscription?.endpoint) return sendJson(response, 400, { error: "Missing push subscription." });

  const { error } = await supabaseAdmin().from("push_subscriptions").upsert({
    user_id: user.id,
    endpoint: subscription.endpoint,
    subscription,
    user_agent: request.headers["user-agent"] || "",
    updated_at: new Date().toISOString(),
  });

  if (error) return sendJson(response, 500, { error: error.message });
  return sendJson(response, 200, { ok: true });
}
