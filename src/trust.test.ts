import { describe, expect, it } from "vitest";
import {
  cloudSyncStatusLabel,
  googleCalendarStatusDetail,
  googleCalendarStatusLabel,
  notificationPreferencesEnabled,
  permissionLabel,
  trustDetailsMessage,
} from "./trust";

describe("trust helpers", () => {
  it("maps calendar status labels and details consistently", () => {
    expect(googleCalendarStatusLabel("disconnected", false, false)).toBe("Off");
    expect(googleCalendarStatusLabel("disconnected", true, true)).toBe("Needs setup");
    expect(googleCalendarStatusLabel("connected", true, true)).toBe("Connected");
    expect(googleCalendarStatusLabel("sync_error", true, true)).toBe("Issue");
    expect(
      googleCalendarStatusDetail({
        status: "connected",
        enabled: true,
        signedIn: true,
        lastSyncAt: "2026-04-24T09:15:00.000Z",
      }),
    ).toContain("Last synced");
  });

  it("keeps trust summary labels short and deterministic", () => {
    expect(cloudSyncStatusLabel(false, false)).toBe("Off");
    expect(cloudSyncStatusLabel(true, true)).toBe("Auto");
    expect(permissionLabel("granted")).toBe("Allowed");
    expect(permissionLabel("denied")).toBe("Blocked");
    expect(notificationPreferencesEnabled(null, "needs_setup", false)).toBe(false);
    expect(notificationPreferencesEnabled({} as never, "needs_setup", false)).toBe(true);
  });

  it("chooses the right trust details footer copy", () => {
    expect(
      trustDetailsMessage({
        cloudSyncMeta: {},
        calendarConnected: false,
        cloudStatus: "",
      }),
    ).toContain("deeper");
    expect(
      trustDetailsMessage({
        cloudSyncMeta: { lastUploadedAt: "2026-04-24T09:15:00.000Z" },
        calendarConnected: true,
        cloudStatus: "",
      }),
    ).toContain("device time zone");
    expect(
      trustDetailsMessage({
        cloudSyncMeta: {},
        calendarConnected: false,
        cloudStatus: "Cloud Pawfolio restored to this device.",
      }),
    ).toBe("Cloud Pawfolio restored to this device.");
  });
});
