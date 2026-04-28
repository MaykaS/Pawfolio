import type { Session } from "@supabase/supabase-js";
import type { PawfolioState } from "./pawfolio";
import { prettySyncTime, type CloudSyncMeta } from "./pawfolio";
import type { TrustState } from "./hooks/useCloudAccount";

export function permissionLabel(permission: string) {
  if (permission === "granted") return "Allowed";
  if (permission === "denied") return "Blocked";
  if (permission === "default") return "Not decided yet";
  return "Not supported here";
}

export function googleCalendarStatusLabel(
  status: TrustState["calendar"],
  enabled: boolean,
  signedIn: boolean,
) {
  if (status === "sync_error") return "Issue";
  if (status === "connected") return "Connected";
  if (enabled && signedIn) return "Needs setup";
  return "Off";
}

export function googleCalendarStatusDetail({
  status,
  enabled,
  signedIn,
  lastSyncAt,
}: {
  status: TrustState["calendar"];
  enabled: boolean;
  signedIn: boolean;
  lastSyncAt?: string;
}) {
  if (!signedIn) return "Sign in to connect your primary Google Calendar.";
  if (status === "sync_error") return "Calendar setup hit an issue. Check Trust details for the exact fix.";
  if (status === "connected") {
    return lastSyncAt
      ? `Last synced ${prettySyncTime(lastSyncAt)}.`
      : "Connected and ready for your first sync.";
  }
  if (enabled) return "Connect your primary Google Calendar for one-way reminder sync.";
  return "Off";
}

export function cloudSyncStatusLabel(signedIn: boolean, enabled: boolean) {
  if (!signedIn) return "Off";
  return enabled ? "Auto" : "Off";
}

export function notificationPreferencesEnabled(
  session: Session | null,
  calendarSetting: PawfolioState["integrationSettings"]["googleCalendar"],
  connected: boolean,
) {
  if (connected) return true;
  if (!session) return false;
  return calendarSetting === "needs_setup";
}

export function trustDetailsMessage({
  cloudSyncMeta,
  calendarConnected,
  cloudStatus,
}: {
  cloudSyncMeta: CloudSyncMeta;
  calendarConnected: boolean;
  cloudStatus: string;
}) {
  if (cloudStatus) return cloudStatus;
  if (calendarConnected && cloudSyncMeta.lastUploadedAt) {
    return "This device time zone is the default for new reminders and backend delivery.";
  }
  return "This view keeps deeper account, backup, push, and calendar details out of the main Profile screen.";
}
