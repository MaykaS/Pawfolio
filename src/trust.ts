import type { Session } from "@supabase/supabase-js";
import type { PawfolioState } from "./pawfolio";
import { prettySyncTime, type CloudSyncMeta } from "./pawfolio";
import type { RestoreSummary, TrustState } from "./hooks/useCloudAccount";

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
  lastSyncSummary,
}: {
  status: TrustState["calendar"];
  enabled: boolean;
  signedIn: boolean;
  lastSyncAt?: string;
  lastSyncSummary?: {
    created: number;
    updated: number;
    deleted: number;
  };
}) {
  if (!signedIn) return "Sign in to connect Google Calendar.";
  if (status === "sync_error") return "Calendar setup needs attention. Open Account details for the exact fix.";
  if (status === "connected") {
    const summary = formatCalendarSyncSummary(lastSyncSummary);
    return lastSyncAt
      ? `Last synced ${prettySyncTime(lastSyncAt)}.${summary ? ` ${summary}` : ""}`
      : "Connected and ready to sync.";
  }
  if (enabled) return "Connect Google Calendar for one-way reminder sync.";
  return "Off";
}

export function formatCalendarSyncSummary(summary?: {
  created: number;
  updated: number;
  deleted: number;
}) {
  if (!summary) return "";
  return `${summary.created} created, ${summary.updated} updated, ${summary.deleted} removed.`;
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

export function notificationsSheetMessage() {
  return "Phone notifications are active from this saved device. Near-term alerts can appear here, and some scheduled reminders are also delivered from your cloud backup path.";
}

export function restoreStatusDetail({
  status,
  lastRestoredAt,
  summary,
}: {
  status: TrustState["restore"];
  lastRestoredAt?: string;
  summary?: RestoreSummary | null;
}) {
  if (status === "restoring") return "Pulling the latest private backup onto this device...";
  if (status === "empty") return "No cloud backup was found for this account yet.";
  if (status === "failed") return "Restore did not finish. Open Account details for the exact status note.";
  if (summary?.outcome === "restored") {
    return `${restoreSummaryLabel(summary)} ${lastRestoredAt ? `Last restore ${prettySyncTime(lastRestoredAt)}.` : ""}`.trim();
  }
  if (!lastRestoredAt) return "This phone has not restored from cloud yet.";
  return `Last restore ${prettySyncTime(lastRestoredAt)}.`;
}

export function restoreSummaryLabel(summary?: RestoreSummary | null) {
  if (!summary || summary.outcome !== "restored") return "";
  const restored: string[] = [];
  if (summary.profile) restored.push("profile");
  if (summary.reminders) restored.push(formatCount(summary.reminders, "reminder"));
  if (summary.care) restored.push(formatCount(summary.care, "care record"));
  if (summary.diary) restored.push(formatCount(summary.diary, "diary entry"));
  if (summary.photos) restored.push(formatCount(summary.photos, "photo"));
  if (summary.docs) restored.push(formatCount(summary.docs, "health doc"));
  if (restored.length === 0) return "Restored your Pawfolio to this device.";
  return `Restored ${joinHumanList(restored)}.`;
}

export function trustDetailsMessage({
  cloudSyncMeta,
  calendarConnected,
  cloudStatus,
  restoreState,
  restoreSummary,
}: {
  cloudSyncMeta: CloudSyncMeta;
  calendarConnected: boolean;
  cloudStatus: string;
  restoreState: TrustState["restore"];
  restoreSummary?: RestoreSummary | null;
}) {
  if (restoreState === "restored" && restoreSummary?.outcome === "restored") {
    return `${restoreSummaryLabel(restoreSummary)} New reminders use this device time zone by default.`;
  }
  if (restoreState === "empty") {
    return "No cloud backup was found for this account yet. You can keep going on this device or sign into a different account.";
  }
  if (restoreState === "failed") {
    return "Restore did not finish cleanly. Check the status note above, then try again when you're ready.";
  }
  if (cloudStatus) return cloudStatus;
  if (calendarConnected && cloudSyncMeta.lastUploadedAt) {
    return "New reminders use this device time zone by default.";
  }
  return "Account, backup, push, and calendar details live here.";
}

function formatCount(count: number, singular: string) {
  return `${count} ${count === 1 ? singular : `${singular}s`}`;
}

function joinHumanList(items: string[]) {
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}
