import { describe, expect, it } from "vitest";
import { collectDueDeliveryCandidates } from "./_delivery";

describe("delivery candidates", () => {
  it("collects due reminder occurrences using the device time zone", () => {
    const candidates = collectDueDeliveryCandidates(
      {
        tasks: [],
        diary: [],
        care: [],
        cloudSyncMeta: {
          deviceTimeZone: "America/New_York",
        },
        reminders: [
          {
            id: "vet",
            title: "Annual checkup",
            type: "Vet",
            date: "2026-04-27",
            time: "12:00",
            note: "",
            recurrence: "none",
            notifyLeadMinutes: 60,
          },
        ],
      },
      new Date("2026-04-27T15:02:00Z"),
    );

    expect(candidates.map((item) => item!.itemId)).toContain("vet");
    expect(candidates.find((item) => item?.itemId === "vet")?.channelItemType).toBe("reminder");
  });

  it("collects missed routine task nudges after the local grace window", () => {
    const candidates = collectDueDeliveryCandidates(
      {
        tasks: [{ id: "walk", title: "Morning walk", time: "08:00", done: false, note: "" }],
        taskHistory: {},
        diary: [],
        care: [],
        reminders: [],
        cloudSyncMeta: {
          deviceTimeZone: "America/New_York",
        },
        routineCoachSettings: {
          enabled: true,
          missedRoutineNudges: true,
          missedRoutineGraceMinutes: 60,
        },
      },
      new Date("2026-04-27T13:01:00Z"),
    );

    expect(candidates.map((item) => item!.itemId)).toContain("walk");
    expect(candidates.find((item) => item?.itemId === "walk")?.channelItemType).toBe("task");
  });

  it("keeps the same one-time missed-task occurrence across nearby cron runs", () => {
    const state = {
      tasks: [{ id: "meal", title: "Evening meal", time: "19:00", done: false, note: "" }],
      taskHistory: {},
      diary: [],
      care: [],
      reminders: [],
      cloudSyncMeta: {
        deviceTimeZone: "America/New_York",
      },
      routineCoachSettings: {
        enabled: true,
        missedRoutineNudges: true,
        missedRoutineGraceMinutes: 60,
      },
    };

    const first = collectDueDeliveryCandidates(state, new Date("2026-04-28T00:04:00Z"));
    const second = collectDueDeliveryCandidates(state, new Date("2026-04-28T00:05:00Z"));

    expect(first.find((item) => item?.itemId === "meal")?.occurrenceAt).toBe("2026-04-28T00:00:00.000Z");
    expect(second.find((item) => item?.itemId === "meal")?.occurrenceAt).toBe("2026-04-28T00:00:00.000Z");
  });

  it("does not create a second missed-task nudge an hour later", () => {
    const candidates = collectDueDeliveryCandidates(
      {
        tasks: [{ id: "brush", title: "Brush coat", time: "19:00", done: false, note: "" }],
        taskHistory: {},
        diary: [],
        care: [],
        reminders: [],
        cloudSyncMeta: {
          deviceTimeZone: "America/New_York",
        },
        routineCoachSettings: {
          enabled: true,
          missedRoutineNudges: true,
          missedRoutineGraceMinutes: 60,
        },
      },
      new Date("2026-04-28T01:01:00Z"),
    );

    expect(candidates.find((item) => item?.itemId === "brush")).toBeUndefined();
  });

  it("does not fire the missed-task nudge before one hour has passed", () => {
    const candidates = collectDueDeliveryCandidates(
      {
        tasks: [{ id: "walk", title: "Morning walk", time: "08:00", done: false, note: "" }],
        taskHistory: {},
        diary: [],
        care: [],
        reminders: [],
        cloudSyncMeta: {
          deviceTimeZone: "America/New_York",
        },
        routineCoachSettings: {
          enabled: true,
          missedRoutineNudges: true,
          missedRoutineGraceMinutes: 60,
        },
      },
      new Date("2026-04-27T12:54:00Z"),
    );

    expect(candidates.find((item) => item?.itemId === "walk")).toBeUndefined();
  });

  it("does not create a missed-task nudge when the task is already marked done for today", () => {
    const candidates = collectDueDeliveryCandidates(
      {
        tasks: [{ id: "snacks", title: "Snacks", time: "13:00", done: false, note: "" }],
        taskHistory: { "2026-04-27": { snacks: true } },
        diary: [],
        care: [],
        reminders: [],
        cloudSyncMeta: {
          deviceTimeZone: "America/New_York",
        },
        routineCoachSettings: {
          enabled: true,
          missedRoutineNudges: true,
          missedRoutineGraceMinutes: 60,
        },
      },
      new Date("2026-04-27T18:05:00Z"),
    );

    expect(candidates.find((item) => item?.itemId === "snacks")).toBeUndefined();
  });

  it("does not create missed-task nudges when routine coach is disabled", () => {
    const candidates = collectDueDeliveryCandidates(
      {
        tasks: [{ id: "walk", title: "Morning walk", time: "08:00", done: false, note: "" }],
        taskHistory: {},
        diary: [],
        care: [],
        reminders: [],
        cloudSyncMeta: {
          deviceTimeZone: "America/New_York",
        },
        routineCoachSettings: {
          enabled: false,
          missedRoutineNudges: true,
          missedRoutineGraceMinutes: 60,
        },
      },
      new Date("2026-04-27T13:01:00Z"),
    );

    expect(candidates.find((item) => item?.itemId === "walk")).toBeUndefined();
  });
});
