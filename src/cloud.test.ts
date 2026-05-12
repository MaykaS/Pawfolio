import { describe, expect, it } from "vitest";
import { cleanupAuthCallbackUrl, parseAuthCallbackUrl, snapshotSummaryFromSnapshot, snapshotSummaryFromState } from "./cloud";
import { initialState } from "./pawfolio";

describe("cloud auth callback helpers", () => {
  it("parses auth callback state from a signed-in return URL", () => {
    expect(
      parseAuthCallbackUrl("https://pawfolio-zeta.vercel.app/?tab=profile&auth-return=1&code=abc123&state=xyz"),
    ).toEqual({
      requestedTab: "profile",
      authReturn: true,
      code: "abc123",
      error: "",
      intent: "",
    });
  });

  it("keeps non-auth query params while cleaning auth callback URL noise", () => {
    expect(
      cleanupAuthCallbackUrl(
        "https://pawfolio-zeta.vercel.app/?tab=profile&auth-return=1&code=abc123&state=xyz&view=compact",
      ),
    ).toBe("/?tab=profile&view=compact");
  });

  it("surfaces auth provider errors cleanly", () => {
    expect(
      parseAuthCallbackUrl(
        "https://pawfolio-zeta.vercel.app/?tab=profile&error=access_denied&error_description=Provider%20disabled",
      ),
    ).toEqual({
      requestedTab: "profile",
      authReturn: false,
      code: "",
      error: "Provider disabled",
      intent: "",
    });
  });

  it("keeps integration intent during auth callback parsing and cleans it after return", () => {
    expect(
      parseAuthCallbackUrl(
        "https://pawfolio-zeta.vercel.app/?tab=profile&auth-return=1&intent=calendar&code=abc123",
      ),
    ).toEqual({
      requestedTab: "profile",
      authReturn: true,
      code: "abc123",
      error: "",
      intent: "calendar",
    });

    expect(
      cleanupAuthCallbackUrl(
        "https://pawfolio-zeta.vercel.app/?tab=profile&auth-return=1&intent=calendar&code=abc123",
      ),
    ).toBe("/?tab=profile");
  });

  it("summarizes current state for backup diagnostics", () => {
    const summary = snapshotSummaryFromState({
      ...initialState,
      profile: { ...initialState.profile!, name: "Dylan" },
      reminders: [{ id: "r1", title: "Walk", type: "Other", date: "2026-05-12", time: "09:00", note: "", recurrence: "none", notifyLeadMinutes: 0 }],
      diary: [{ id: "d1", title: "Park", body: "", date: "2026-05-12", photos: [], photo: "" }],
    }, { photos: 2, docs: 1, updatedAt: "2026-05-12T12:00:00.000Z" });

    expect(summary.profile).toBe(true);
    expect(summary.reminders).toBe(1);
    expect(summary.photos).toBe(2);
    expect(summary.docs).toBe(1);
  });

  it("summarizes a restored snapshot for trust diagnostics", () => {
    const summary = snapshotSummaryFromSnapshot({
      state: {
        ...initialState,
        profile: { ...initialState.profile!, name: "Dylan" },
        reminders: [{ id: "r1", title: "Walk", type: "Other", date: "2026-05-12", time: "09:00", note: "", recurrence: "none", notifyLeadMinutes: 0 }],
      },
      updated_at: "2026-05-12T12:00:00.000Z",
      photos: [{ id: "p1" }],
      docs: [{ id: "doc1" }],
    });

    expect(summary?.updatedAt).toBe("2026-05-12T12:00:00.000Z");
    expect(summary?.profile).toBe(true);
    expect(summary?.photos).toBe(1);
    expect(summary?.docs).toBe(1);
  });
});
