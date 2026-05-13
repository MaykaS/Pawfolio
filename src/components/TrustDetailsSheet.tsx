import type { Session } from "@supabase/supabase-js";
import type { RuntimeDiagnostics } from "../cloud";
import {
  canUseBrowserNotifications,
  cloudBackupStatusLabel,
  prettySyncTime,
  pushStatusDetail,
  pushStatusLabel,
  resolvedScheduleTimeZone,
  timeZoneAbbreviation,
  type CloudSyncMeta,
  type PawfolioNotificationStatus,
  type PawfolioState,
} from "../pawfolio";
import type { RestoreSummary, TrustState } from "../hooks/useCloudAccount";
import type { BackupDiagnostics, PushHealth } from "../hooks/useCloudAccount";
import {
  backupDiagnosticsDetail,
  googleCalendarStatusDetail,
  googleCalendarStatusLabel,
  notificationPreferencesEnabled,
  permissionLabel,
  pushHealthDetail,
  restoreSummaryLabel,
  runtimeDiagnosticsDetail,
  trustDetailsMessage,
} from "../trust";
import { Sheet } from "./Sheet";

export function TrustDetailsSheet({
  session,
  cloudConfigured: isCloudConfigured,
  pushConfigured: isPushConfigured,
  pushPermission,
  hasPushSubscription,
  cloudSyncMeta,
  googleCalendarSyncState,
  visibleLastUploadedAt,
  visibleLastCalendarSyncAt,
  visibleLastCalendarSyncSummary,
  trustState,
  cloudStatus,
  restoreSummary,
  backupDiagnostics,
  pushHealth,
  runtimeDiagnostics,
  integrationSettings,
  onClose,
}: {
  session: Session | null;
  cloudConfigured: boolean;
  pushConfigured: boolean;
  pushPermission: PawfolioNotificationStatus;
  hasPushSubscription: boolean;
  cloudSyncMeta: CloudSyncMeta;
  googleCalendarSyncState: PawfolioState["googleCalendarSyncState"];
  visibleLastUploadedAt?: string;
  visibleLastCalendarSyncAt?: string;
  visibleLastCalendarSyncSummary?: PawfolioState["googleCalendarSyncState"]["lastSyncSummary"];
  trustState: TrustState;
  cloudStatus: string;
  restoreSummary: RestoreSummary | null;
  backupDiagnostics: BackupDiagnostics;
  pushHealth: PushHealth;
  runtimeDiagnostics: RuntimeDiagnostics | null;
  integrationSettings: PawfolioState["integrationSettings"];
  onClose: () => void;
}) {
  const pushStatus = pushStatusLabel({
    configured: isPushConfigured,
    supported: canUseBrowserNotifications(globalThis.Notification),
    permission: pushPermission,
    hasSubscription: hasPushSubscription,
  });
  const currentTimeZone = resolvedScheduleTimeZone(cloudSyncMeta);

  return (
    <Sheet title="Account details" onClose={onClose}>
      <section className="notice-card">
        <div>
          <p className="label no-margin">Status</p>
          <h3>{pushStatus}</h3>
        </div>
        <span className={pushStatus === "Active now" ? "badge badge-green" : pushStatus === "Blocked" ? "badge badge-red" : "badge badge-gray"}>
          {pushStatus}
        </span>
      </section>
      <p className="notice-copy">{pushStatusDetail({
        configured: isPushConfigured,
        supported: canUseBrowserNotifications(globalThis.Notification),
        permission: pushPermission,
        hasSubscription: hasPushSubscription,
      })}</p>

      <section className="card diagnostics-card">
        <div className="diagnostic-row">
          <span>This device</span>
          <strong>This phone/browser</strong>
        </div>
        <div className="diagnostic-row">
          <span>Private account</span>
          <strong>{session ? session.user.email || "Connected" : "Not signed in"}</strong>
        </div>
        <div className="diagnostic-row">
          <span>Cloud backup</span>
          <strong>{cloudBackupStatusLabel({ signedIn: Boolean(session), lastUploadedAt: visibleLastUploadedAt || cloudSyncMeta.lastUploadedAt })}</strong>
        </div>
        <div className="diagnostic-row">
          <span>Cloud sync</span>
          <strong>{!session ? "Off" : integrationSettings.cloudSync === "enabled" ? "Auto" : isCloudConfigured ? "Off" : "Missing env"}</strong>
        </div>
        <div className="diagnostic-row">
          <span>Notification permission</span>
          <strong>{permissionLabel(pushPermission)}</strong>
        </div>
        <div className="diagnostic-row">
          <span>Phone push</span>
          <strong>{hasPushSubscription ? "Saved for push" : "Not saved yet"}</strong>
        </div>
        <div className="diagnostic-row">
          <span>Local reminders</span>
          <strong>{pushHealth.localRemindersAvailable ? "Available on this phone" : pushHealth.localEnabled ? "Needs permission" : "Turned off"}</strong>
        </div>
        <div className="diagnostic-row">
          <span>Push health</span>
          <strong>{pushHealthDetail(pushHealth)}</strong>
        </div>
        <div className="diagnostic-row">
          <span>Saved devices</span>
          <strong>{pushHealth.subscriptionCount}</strong>
        </div>
        <div className="diagnostic-row">
          <span>Last cloud upload</span>
          <strong>{prettySyncTime(visibleLastUploadedAt || cloudSyncMeta.lastUploadedAt)}</strong>
        </div>
        <div className="diagnostic-row">
          <span>Backup detail</span>
          <strong>{backupDiagnosticsDetail(backupDiagnostics)}</strong>
        </div>
        <div className="diagnostic-row">
          <span>Last restore</span>
          <strong>{prettySyncTime(cloudSyncMeta.lastRestoredAt)}</strong>
        </div>
        <div className="diagnostic-row">
          <span>Last phone save</span>
          <strong>{prettySyncTime(cloudSyncMeta.lastPushRegisteredAt)}</strong>
        </div>
        {restoreSummary?.outcome === "restored" && (
          <div className="diagnostic-row">
            <span>Restore result</span>
            <strong>{restoreSummaryLabel(restoreSummary)}</strong>
          </div>
        )}
        {backupDiagnostics.snapshot && (
          <>
            <div className="diagnostic-row">
              <span>Snapshot reminders</span>
              <strong>{backupDiagnostics.snapshot.reminders}</strong>
            </div>
            <div className="diagnostic-row">
              <span>Snapshot care</span>
              <strong>{backupDiagnostics.snapshot.care}</strong>
            </div>
            <div className="diagnostic-row">
              <span>Snapshot diary</span>
              <strong>{backupDiagnostics.snapshot.diary}</strong>
            </div>
            <div className="diagnostic-row">
              <span>Snapshot photos</span>
              <strong>{backupDiagnostics.snapshot.photos}</strong>
            </div>
            <div className="diagnostic-row">
              <span>Snapshot docs</span>
              <strong>{backupDiagnostics.snapshot.docs}</strong>
            </div>
          </>
        )}
        <div className="diagnostic-row">
          <span>Google Calendar</span>
          <strong>{googleCalendarStatusLabel(trustState.calendar, notificationPreferencesEnabled(session, integrationSettings.googleCalendar, googleCalendarSyncState.connected), Boolean(session))}</strong>
        </div>
        <div className="diagnostic-row">
          <span>Time zone</span>
          <strong>{timeZoneAbbreviation(currentTimeZone)}</strong>
        </div>
        <div className="diagnostic-row">
          <span>Last calendar sync</span>
          <strong>{prettySyncTime(visibleLastCalendarSyncAt || googleCalendarSyncState.lastSyncAt)}</strong>
        </div>
        <div className="diagnostic-row">
          <span>Calendar detail</span>
          <strong>{googleCalendarStatusDetail({
            status: trustState.calendar,
            enabled: notificationPreferencesEnabled(session, integrationSettings.googleCalendar, googleCalendarSyncState.connected),
            signedIn: Boolean(session),
            lastSyncAt: visibleLastCalendarSyncAt || googleCalendarSyncState.lastSyncAt,
            lastSyncSummary: visibleLastCalendarSyncSummary || googleCalendarSyncState.lastSyncSummary,
          })}</strong>
        </div>
        <div className="diagnostic-row">
          <span>Delivery scheduler</span>
          <strong>{runtimeDiagnostics?.expectations.deliveryScheduler || "External cron every 5 minutes"}</strong>
        </div>
        <div className="diagnostic-row">
          <span>Deployment</span>
          <strong>{runtimeDiagnosticsDetail(runtimeDiagnostics)}</strong>
        </div>
        {cloudStatus && (
          <div className="diagnostic-row">
            <span>Status note</span>
            <strong>{cloudStatus}</strong>
          </div>
        )}
      </section>

      <p className="notice-copy">
        {trustDetailsMessage({
          cloudSyncMeta,
          calendarConnected: googleCalendarSyncState.connected,
          cloudStatus,
          restoreState: trustState.restore,
          restoreSummary,
        })}
      </p>
    </Sheet>
  );
}
