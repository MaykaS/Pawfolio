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
          missedRoutineGraceMinutes: 30,
        },
      },
      new Date("2026-04-27T12:31:00Z"),
    );

    expect(candidates.map((item) => item!.itemId)).toContain("walk");
    expect(candidates.find((item) => item?.itemId === "walk")?.channelItemType).toBe("task");
  });

  it("does not create a fresh missed-task delivery on every cron run within the same hour", () => {
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
        missedRoutineGraceMinutes: 30,
      },
    };

    const first = collectDueDeliveryCandidates(state, new Date("2026-04-27T23:34:00Z"));
    const second = collectDueDeliveryCandidates(state, new Date("2026-04-27T23:35:00Z"));

    expect(first.find((item) => item?.itemId === "meal")?.occurrenceAt).toBe("2026-04-27T23:30:00.000Z");
    expect(second.find((item) => item?.itemId === "meal")?.occurrenceAt).toBe("2026-04-27T23:30:00.000Z");
  });

  it("creates the next missed-task nudge one hour later if the task is still unchecked", () => {
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
          missedRoutineGraceMinutes: 30,
        },
      },
      new Date("2026-04-28T00:31:00Z"),
    );

    expect(candidates.find((item) => item?.itemId === "brush")?.occurrenceAt).toBe("2026-04-28T00:30:00.000Z");
  });
});
