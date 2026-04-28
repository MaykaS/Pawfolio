import { describe, expect, it } from "vitest";
import { collectDueDeliveryCandidates } from "./_delivery";

describe("delivery candidates", () => {
  it("collects due reminder occurrences using local reminder timing", () => {
    const candidates = collectDueDeliveryCandidates(
      {
        tasks: [],
        diary: [],
        care: [],
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
      new Date("2026-04-27T11:02:00"),
    );

    expect(candidates.map((item) => item.itemId)).toContain("vet");
    expect(candidates.find((item) => item.itemId === "vet")?.channelItemType).toBe("reminder");
  });

  it("collects missed routine task nudges after the local grace window", () => {
    const candidates = collectDueDeliveryCandidates(
      {
        tasks: [{ id: "walk", title: "Morning walk", time: "08:00", done: false, note: "" }],
        taskHistory: {},
        diary: [],
        care: [],
        reminders: [],
        routineCoachSettings: {
          enabled: true,
          missedRoutineNudges: true,
          missedRoutineGraceMinutes: 30,
        },
      },
      new Date(2026, 3, 27, 8, 45),
    );

    expect(candidates.map((item) => item.itemId)).toContain("walk");
    expect(candidates.find((item) => item.itemId === "walk")?.channelItemType).toBe("task");
  });
});
