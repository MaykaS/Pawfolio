import { describe, expect, it } from "vitest";
import {
  ageLabel,
  careStatus,
  getCareMoments,
  getUpcomingReminder,
  latestWeight,
  normalizeState,
  prettyDate,
  taskTime,
  todayISO,
  updateTaskTime,
  withTaskTime,
  type CareRecord,
  type DailyTask,
  type Reminder,
} from "./pawfolio";

describe("pawfolio helpers", () => {
  it("formats dates without timezone drift", () => {
    expect(prettyDate("2026-04-21")).toBe("Apr 21");
    expect(todayISO(new Date("2026-04-21T15:30:00.000Z"))).toBe("2026-04-21");
  });

  it("calculates dog age labels from a supplied current date", () => {
    expect(ageLabel("2021-05-12", new Date("2026-04-21T12:00:00"))).toBe("4 years old");
    expect(ageLabel("", new Date("2026-04-21T12:00:00"))).toBe("Birthday not set");
  });

  it("assigns expected routine times from task ids and titles", () => {
    expect(taskTime({ id: "breakfast", title: "Breakfast", time: "7:15 AM", done: false, note: "" })).toBe("7:15 AM");
    expect(taskTime({ id: "custom", title: "Heartgard pill", time: "", done: false, note: "" })).toBe("9:00 AM");
    expect(taskTime({ id: "custom-2", title: "Puzzle toy", time: "", done: false, note: "" })).toBe("Anytime");
  });

  it("normalizes older tasks with missing times", () => {
    const oldTask = { id: "breakfast", title: "Breakfast", done: false, note: "" };

    expect(withTaskTime(oldTask).time).toBe("7:00 AM");
    expect(
      normalizeState({
        tasks: [oldTask],
        diary: [],
        care: [],
        reminders: [],
      } as unknown as Parameters<typeof normalizeState>[0]).tasks[0].time,
    ).toBe("7:00 AM");
  });

  it("updates task times immutably", () => {
    const tasks: DailyTask[] = [
      { id: "walk", title: "Morning walk", time: "8:00 AM", done: false, note: "" },
    ];

    expect(updateTaskTime(tasks, "walk", "8:45 AM")[0]).toEqual({
      id: "walk",
      title: "Morning walk",
      time: "8:45 AM",
      done: false,
      note: "",
    });
    expect(tasks[0].time).toBe("8:00 AM");
  });

  it("summarizes quick log care moments from completed tasks", () => {
    const tasks: DailyTask[] = [
      { id: "meal", title: "Morning meal", time: "7:00 AM", done: true, note: "" },
      { id: "walk", title: "Morning walk", time: "8:00 AM", done: false, note: "" },
      { id: "med", title: "Heartgard pill", time: "9:00 AM", done: true, note: "" },
    ];

    expect(getCareMoments(tasks)).toEqual([
      { label: "Fed", active: true },
      { label: "Walked", active: false },
      { label: "Medicated", active: true },
    ]);
  });

  it("returns the earliest dated reminder", () => {
    const reminders: Reminder[] = [
      { id: "2", title: "Grooming", type: "Grooming", date: "2026-05-02", time: "14:00", note: "" },
      { id: "1", title: "Vet", type: "Vet", date: "2026-04-30", time: "10:30", note: "" },
    ];

    expect(getUpcomingReminder(reminders)?.title).toBe("Vet");
  });

  it("derives care status and latest weight", () => {
    const records: CareRecord[] = [
      { id: "weight", type: "Weight", title: "27.8 lb", date: "2026-04-21", note: "" },
      { id: "med", type: "Medication", title: "Heartgard", date: "2026-04-21", note: "Next: May 1" },
    ];

    expect(latestWeight(records, "26 lb")).toBe("27.8 lb");
    expect(careStatus(records[1])).toBe("Due soon");
    expect(careStatus(records[0])).toBe("OK");
  });
});
