import { describe, expect, it } from "vitest";
import {
  backupDiagnosticsDetail,
  formatCalendarSyncSummary,
  notificationsSheetMessage,
  pushHealthDetail,
  restoreStatusDetail,
  restoreSummaryLabel,
  runtimeDiagnosticsDetail,
  trustDetailsMessage,
  googleCalendarStatusDetail,
} from "./trust";
import type { BackupDiagnostics, PushHealth, RestoreSummary } from "./hooks/useCloudAccount";

const restoredSummary: RestoreSummary = {
  outcome: "restored",
  profile: true,
  reminders: 3,
  care: 2,
  diary: 1,
  photos: 4,
  docs: 2,
};

const backupDiagnostics: BackupDiagnostics = {
  snapshot: null,
  lastOutcome: "uploaded",
};

const pushHealth: PushHealth = {
  supported: true,
  permission: "granted",
  hasSubscription: true,
  envConfigured: true,
  subscriptionCount: 1,
};

describe("trust copy helpers", () => {
  it("keeps the notifications sheet copy aligned with the shipped behavior", () => {
    expect(notificationsSheetMessage()).toContain("saved device");
    expect(notificationsSheetMessage()).toContain("cloud backup path");
    expect(notificationsSheetMessage()).not.toContain("backend push hardening");
  });

  it("explains restore outcomes clearly", () => {
    expect(restoreSummaryLabel(restoredSummary)).toContain("3 reminders");
    expect(
      restoreStatusDetail({
        status: "restored",
        lastRestoredAt: "2026-04-28T13:45:00.000Z",
        summary: restoredSummary,
      }),
    ).toContain("Last restore");
    expect(restoreStatusDetail({ status: "empty" })).toContain("No cloud backup");
    expect(restoreStatusDetail({ status: "failed" })).toContain("did not finish");
  });

  it("prefers explicit restore messaging in account details", () => {
    expect(
      trustDetailsMessage({
        cloudSyncMeta: { lastUploadedAt: "2026-04-28T13:45:00.000Z" },
        calendarConnected: true,
        cloudStatus: "",
        restoreState: "restored",
        restoreSummary: restoredSummary,
      }),
    ).toContain("Restored profile");

    expect(
      trustDetailsMessage({
        cloudSyncMeta: {},
        calendarConnected: false,
        cloudStatus: "",
        restoreState: "empty",
      }),
    ).toContain("No cloud backup");
  });

  it("shows concrete Google Calendar sync results", () => {
    expect(formatCalendarSyncSummary({ created: 2, updated: 1, deleted: 0 })).toBe("2 created, 1 updated, 0 removed.");
    expect(
      googleCalendarStatusDetail({
        status: "connected",
        enabled: true,
        signedIn: true,
        lastSyncAt: "2026-05-08T14:00:00.000Z",
        lastSyncSummary: { created: 2, updated: 1, deleted: 0 },
      }),
    ).toContain("2 created, 1 updated, 0 removed.");
  });

  it("describes backup, push, and runtime diagnostics concretely", () => {
    expect(backupDiagnosticsDetail(backupDiagnostics)).toContain("successfully");
    expect(pushHealthDetail(pushHealth)).toContain("healthy");
    expect(runtimeDiagnosticsDetail({
      env: {
        supabaseClient: true,
        vapidPublic: false,
        serverSupabase: true,
        serverVapid: false,
        cronSecret: true,
      },
      expectations: {
        deliveryScheduler: "external cron every 5 minutes",
      },
    })).toContain("public VAPID key");
  });
});
