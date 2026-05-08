import { describe, expect, it } from "vitest";
import {
  notificationsSheetMessage,
  restoreStatusDetail,
  restoreSummaryLabel,
  trustDetailsMessage,
} from "./trust";
import type { RestoreSummary } from "./hooks/useCloudAccount";

const restoredSummary: RestoreSummary = {
  outcome: "restored",
  profile: true,
  reminders: 3,
  care: 2,
  diary: 1,
  photos: 4,
  docs: 2,
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
});
