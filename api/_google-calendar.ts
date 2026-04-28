const googleTokenUrl = "https://oauth2.googleapis.com/token";
const googleCalendarBaseUrl = "https://www.googleapis.com/calendar/v3";

export type StoredGoogleIntegration = {
  id: string;
  user_id: string;
  provider: string;
  provider_email?: string | null;
  provider_user_id?: string | null;
  access_token?: string | null;
  refresh_token?: string | null;
  scopes?: string[] | null;
  status?: string | null;
};

function requiredGoogleEnv(name: "GOOGLE_CLIENT_ID" | "GOOGLE_CLIENT_SECRET") {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

export async function refreshGoogleAccessToken(refreshToken: string) {
  const response = await fetch(googleTokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: requiredGoogleEnv("GOOGLE_CLIENT_ID"),
      client_secret: requiredGoogleEnv("GOOGLE_CLIENT_SECRET"),
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const payload = (await response.json().catch(() => ({}))) as {
    access_token?: string;
    error?: string;
    error_description?: string;
  };
  if (!response.ok || !payload.access_token) {
    throw new Error(payload.error_description || payload.error || "Could not refresh Google Calendar access.");
  }
  return payload.access_token as string;
}

export async function googleCalendarRequest<T>(
  path: string,
  accessToken: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${googleCalendarBaseUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  const payload = (await response.json().catch(() => ({}))) as {
    error?: { message?: string };
    error_description?: string;
  } & T;
  if (!response.ok) {
    throw new Error(payload.error?.message || payload.error_description || "Google Calendar request failed.");
  }
  return payload as T;
}

export async function resolveGoogleAccessToken(account: StoredGoogleIntegration) {
  if (account.refresh_token) {
    return refreshGoogleAccessToken(account.refresh_token);
  }
  if (account.access_token) return account.access_token;
  throw new Error("Google Calendar needs to be reconnected.");
}
