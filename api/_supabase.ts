import { createClient } from "@supabase/supabase-js";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

export function supabaseAdmin() {
  return createClient(requiredEnv("SUPABASE_URL"), requiredEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false },
  });
}

export async function userFromRequest(request: VercelRequest) {
  const header = request.headers.authorization || "";
  const token = header.replace(/^Bearer\s+/i, "");
  if (!token) return undefined;
  const { data, error } = await supabaseAdmin().auth.getUser(token);
  if (error) return undefined;
  return data.user;
}

export function sendJson(response: VercelResponse, status: number, data: unknown) {
  response.status(status).json(data);
}
