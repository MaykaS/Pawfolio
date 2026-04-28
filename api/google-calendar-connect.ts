import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sendJson, userFromRequest, supabaseAdmin } from "./_supabase.js";

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== "POST") return sendJson(response, 405, { error: "Method not allowed" });

  const user = await userFromRequest(request);
  if (!user) return sendJson(response, 401, { error: "Sign in before connecting Google Calendar." });

  const { providerAccessToken, providerRefreshToken, scopes, providerEmail, providerUserId } = request.body || {};
  if (!providerAccessToken) {
    return sendJson(response, 400, { error: "Google Calendar access token was not returned." });
  }

  const { error } = await supabaseAdmin().from("integration_accounts").upsert(
    {
      user_id: user.id,
      provider: "google_calendar",
      provider_email: providerEmail || user.email || "",
      provider_user_id: providerUserId || user.id,
      access_token: providerAccessToken,
      refresh_token: providerRefreshToken || null,
      scopes: scopes ? String(scopes).split(/\s+/).filter(Boolean) : [],
      status: "connected",
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "user_id,provider",
    },
  );

  if (error) return sendJson(response, 500, { error: error.message });
  return sendJson(response, 200, { ok: true });
}
