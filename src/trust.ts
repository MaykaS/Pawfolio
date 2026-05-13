import type { Session } from "@supabase/supabase-js";
import type { PawfolioState } from "./pawfolio";
import { prettySyncTime, type CloudSyncMeta } from "./pawfolio";
import type { BackupDiagnostics, PushHealth, RestoreSummary, TrustState } from "./hooks/useCloudAccount";
import type { RuntimeDiagnostics } from "./cloud";

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

export function backupDiagnosticsDetail(backupDiagnostics: BackupDiagnostics) {
  if (backupDiagnostics.lastOutcome === "upload_blocked_sign_in") return "Sign in before uploading this Pawfolio backup.";
  if (backupDiagnostics.lastOutcome === "upload_blocked_env") return "Cloud backup env is missing in this deployment.";
  if (backupDiagnostics.lastOutcome === "upload_failed") return "The latest upload did not finish cleanly.";
  if (backupDiagnostics.lastOutcome === "uploaded") return "Latest upload finished successfully.";
  if (backupDiagnostics.lastOutcome === "restore_empty") return "No cloud backup was found for this account.";
  if (backupDiagnostics.lastOutcome === "restore_failed") return "Restore found a backup, but this device could not finish it cleanly.";
  if (backupDiagnostics.lastOutcome === "restored") return "Restore completed on this device.";
  return "Backup has not reported a recent action yet.";
}

export function pushHealthDetail(pushHealth: PushHealth) {
  if (!pushHealth.supported) return "This browser does not support service worker push.";
  if (pushHealth.permission === "denied") return "Notifications are blocked in browser or phone settings.";
  if (!pushHealth.localEnabled) return "Phone reminders are turned off on this device.";
  if (pushHealth.permission !== "granted") return "Notifications still need permission on this phone.";
  if (pushHealth.localRemindersAvailable && !pushHealth.envConfigured) {
    return "Local phone reminders are available here, but cloud push env is incomplete in this deployment.";
  }
  if (pushHealth.localRemindersAvailable && !pushHealth.hasSubscription) {
    return "Local phone reminders are available here, but this phone has not been saved for cloud push yet.";
  }
  if (pushHealth.hasSubscription && pushHealth.subscriptionCount === 0) {
    return "This phone has a local subscription, but cloud does not show a saved device yet.";
  }
  if (!pushHealth.envConfigured) return "Push env is incomplete in this deployment.";
  return "Push looks healthy on this phone and in cloud.";
}

export function runtimeDiagnosticsDetail(runtimeDiagnostics: RuntimeDiagnostics | null) {
  if (!runtimeDiagnostics) return "Runtime diagnostics are not available right now.";
  const blockers: string[] = [];
  if (!runtimeDiagnostics.env.supabaseClient) blockers.push("client Supabase env");
  if (!runtimeDiagnostics.env.serverSupabase) blockers.push("server Supabase env");
  if (!runtimeDiagnostics.env.vapidPublic) blockers.push("public VAPID key");
  if (!runtimeDiagnostics.env.serverVapid) blockers.push("server VAPID keys");
  if (!runtimeDiagnostics.env.cronSecret) blockers.push("cron secret");
  if (blockers.length === 0) {
    return `Deployment env looks complete for backup and push. Scheduled delivery expects ${runtimeDiagnostics.expectations.deliveryScheduler}.`;
  }
  return `Deployment is missing: ${blockers.join(", ")}.`;
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
