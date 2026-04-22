import { describe, expect, it } from "vitest";
import {
  ageLabel,
  careStatus,
  deleteCalendarItemFromState,
  deleteCareItemFromState,
  daysTogether,
  estimateDataUrlBytes,
  eventCategory,
  eventCategoryColor,
  eventsForDate,
  eventsForMonth,
  getCareMoments,
  getUpcomingReminder,
  getUpcomingReminders,
  isFutureOrToday,
  latestWeight,
  normalizeState,
  prettyDate,
  recurrenceLabel,
  safeSetLocalStorage,
  saveCareRecordToState,
  saveReminderToState,
  taskTime,
  todayISO,
  updateTaskTime,
  visibleCareRecords,
  visibleReminders,
  withCareSchedule,
  withReminderRecurrence,
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
    expect(daysTogether("2026-04-01", new Date("2026-04-21T12:00:00"))).toBe("20");
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

  it("normalizes older reminders with no recurrence", () => {
    const oldReminder = { id: "med", title: "Heartgard", type: "Medication", date: "2026-05-01", time: "09:00", note: "" };

    expect(withReminderRecurrence(oldReminder).recurrence).toBe("none");
    expect(recurrenceLabel("monthly")).toBe("Every month");
    const normalized = normalizeState({
      tasks: [],
      diary: [],
      care: [],
      reminders: [oldReminder],
    } as unknown as Parameters<typeof normalizeState>[0]);

    expect(normalized.reminders).toEqual([]);
    expect(normalized.careEvents[0].recurrence).toBe("none");
  });

  it("normalizes shared care and calendar records into one care event", () => {
    const normalized = normalizeState({
      tasks: [],
      diary: [],
      care: [{ id: "care-med", type: "Medication", title: "Heartgard", date: "2026-05-01", note: "given", nextDueDate: "" }],
      reminders: [{ id: "rem-med", title: "Heartgard", type: "Medication", date: "2026-05-01", time: "09:00", note: "", recurrence: "monthly" }],
    });

    expect(normalized.care).toEqual([]);
    expect(normalized.reminders).toEqual([]);
    expect(normalized.careEvents).toHaveLength(1);
    expect(normalized.careEvents[0]).toMatchObject({
      title: "Heartgard",
      type: "Medication",
      time: "09:00",
      recurrence: "monthly",
      note: "given",
    });
  });

  it("keeps calendar-only reminders and care-only records separate", () => {
    const state = normalizeState({
      tasks: [],
      diary: [],
      care: [{ id: "weight", type: "Weight", title: "27 lb", date: "2026-04-21", note: "" }],
      reminders: [{ id: "groom", title: "Grooming", type: "Grooming", date: "2026-05-01", time: "11:00", note: "", recurrence: "none" }],
    });

    expect(state.careEvents).toEqual([]);
    expect(visibleCareRecords(state).map((record) => record.type)).toEqual(["Weight"]);
    expect(visibleReminders(state).map((reminder) => reminder.type)).toEqual(["Grooming"]);
  });

  it("syncs shared care records into calendar and shared calendar items into care", () => {
    let state = normalizeState(undefined);
    state = saveCareRecordToState(state, {
      id: "vaccine",
      type: "Vaccine",
      title: "Rabies",
      date: "2026-04-21",
      note: "next in 3 years",
      nextDueDate: "2029-04-21",
    });

    expect(visibleReminders(state)[0]).toMatchObject({ id: "vaccine", type: "Vaccine", title: "Rabies" });
    expect(visibleCareRecords(state)[0]).toMatchObject({ id: "vaccine", type: "Vaccine", title: "Rabies" });

    state = saveReminderToState(state, {
      id: "vet",
      title: "Annual checkup",
      type: "Vet",
      date: "2026-05-10",
      time: "10:00",
      note: "Dr. Lee",
      recurrence: "yearly",
    });

    expect(visibleCareRecords(state).some((record) => record.type === "Vet visit" && record.title === "Annual checkup")).toBe(true);
    expect(visibleReminders(state).some((reminder) => reminder.type === "Vet" && reminder.title === "Annual checkup")).toBe(true);
  });

  it("edits and deletes shared items from either side without duplicates", () => {
    let state = saveReminderToState(normalizeState(undefined), {
      id: "med",
      title: "Heartgard",
      type: "Medication",
      date: "2026-05-01",
      time: "09:00",
      note: "",
      recurrence: "monthly",
    });

    state = saveCareRecordToState(state, {
      id: "med",
      type: "Medication",
      title: "Heartgard Plus",
      date: "2026-05-01",
      note: "with food",
      nextDueDate: "2026-06-01",
    });

    expect(state.careEvents).toHaveLength(1);
    expect(visibleReminders(state)[0]).toMatchObject({ title: "Heartgard Plus" });

    expect(deleteCalendarItemFromState(state, "med").careEvents).toEqual([]);
    state = saveCareRecordToState(normalizeState(undefined), {
      id: "vet",
      type: "Vet visit",
      title: "Checkup",
      date: "2026-05-01",
      note: "",
      nextDueDate: "",
    });
    expect(deleteCareItemFromState(state, "vet").careEvents).toEqual([]);
  });

  it("normalizes older care records and calculates next due status", () => {
    const oldCareRecord = { id: "rabies", type: "Vaccine", title: "Rabies", date: "2026-04-21", note: "" } as CareRecord;

    expect(withCareSchedule(oldCareRecord).nextDueDate).toBe("");
    expect(
      normalizeState({
        tasks: [],
        diary: [],
        care: [oldCareRecord],
        reminders: [],
      }).careEvents[0].nextDueDate,
    ).toBe("");
    expect(careStatus({ ...oldCareRecord, nextDueDate: "2026-05-15" }, new Date("2026-04-21T12:00:00"))).toBe("Due soon");
    expect(careStatus({ ...oldCareRecord, nextDueDate: "2026-04-01" }, new Date("2026-04-21T12:00:00"))).toBe("Overdue");
    expect(careStatus({ ...oldCareRecord, nextDueDate: "2027-04-01" }, new Date("2026-04-21T12:00:00"))).toBe("OK");
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

  it("returns future upcoming reminders only, sorted by date and time", () => {
    const reminders: Reminder[] = [
      { id: "past", title: "Lyme 1", type: "Vaccine", date: "2026-04-17", time: "", note: "", recurrence: "none" },
      { id: "today-late", title: "Dinner meds", type: "Medication", date: "2026-04-22", time: "18:00", note: "", recurrence: "none" },
      { id: "today-early", title: "Morning meds", type: "Medication", date: "2026-04-22", time: "08:00", note: "", recurrence: "none" },
      { id: "2", title: "Grooming", type: "Grooming", date: "2026-05-02", time: "14:00", note: "", recurrence: "monthly" },
      { id: "1", title: "Vet", type: "Vet", date: "2026-04-30", time: "10:30", note: "", recurrence: "yearly" },
    ];

    expect(isFutureOrToday("2026-04-21", new Date("2026-04-22T12:00:00"))).toBe(false);
    expect(isFutureOrToday("2026-04-22", new Date("2026-04-22T12:00:00"))).toBe(true);
    expect(getUpcomingReminders(reminders, new Date("2026-04-22T12:00:00")).map((reminder) => reminder.title)).toEqual([
      "Morning meds",
      "Dinner meds",
      "Vet",
      "Grooming",
    ]);
    expect(getUpcomingReminder(reminders, new Date("2026-04-22T12:00:00"))?.title).toBe("Morning meds");
  });

  it("filters month events and maps event categories consistently", () => {
    const reminders: Reminder[] = [
      { id: "apr-med", title: "Heartgard", type: "Medication", date: "2026-04-22", time: "09:00", note: "", recurrence: "monthly" },
      { id: "apr-vet", title: "Vet", type: "Vet", date: "2026-04-23", time: "10:00", note: "", recurrence: "none" },
      { id: "may-groom", title: "Grooming", type: "Grooming", date: "2026-05-02", time: "14:00", note: "", recurrence: "none" },
    ];

    expect(eventsForMonth(reminders, new Date("2026-04-01T12:00:00")).map((reminder) => reminder.id)).toEqual(["apr-med", "apr-vet"]);
    expect(eventCategory("Medication")).toBe("medication");
    expect(eventCategory("Vaccine")).toBe("vaccine");
    expect(eventCategory("Vet")).toBe("vet");
    expect(eventCategory("Grooming")).toBe("grooming");
    expect(eventCategory("Walk")).toBe("walk");
    expect(eventCategory("Food")).toBe("food");
    expect(eventCategory("Other")).toBe("other");
    expect(eventCategoryColor("Vaccine")).toBe("green");
    expect(eventCategoryColor("Vet")).toBe("green");
    expect(eventCategoryColor("Medication")).toBe("blue");
  });

  it("returns selected day events sorted by time", () => {
    const reminders: Reminder[] = [
      { id: "late", title: "Dinner meds", type: "Medication", date: "2026-04-22", time: "18:00", note: "", recurrence: "none" },
      { id: "other-day", title: "Grooming", type: "Grooming", date: "2026-04-23", time: "08:00", note: "", recurrence: "none" },
      { id: "early", title: "Morning meds", type: "Medication", date: "2026-04-22", time: "08:00", note: "", recurrence: "none" },
      { id: "any", title: "Vet note", type: "Vet", date: "2026-04-22", time: "", note: "", recurrence: "none" },
    ];

    expect(eventsForDate(reminders, "2026-04-22").map((reminder) => reminder.id)).toEqual(["early", "late", "any"]);
    expect(eventsForDate(reminders, "2026-04-24")).toEqual([]);
  });

  it("derives care status and latest weight", () => {
    const records: CareRecord[] = [
      { id: "weight", type: "Weight", title: "27.8 lb", date: "2026-04-21", note: "" },
      { id: "med", type: "Medication", title: "Heartgard", date: "2026-04-21", note: "Next: May 1", nextDueDate: "" },
    ];

    expect(latestWeight(records, "26 lb")).toBe("27.8 lb");
    expect(careStatus(records[1])).toBe("Due soon");
    expect(careStatus(records[0])).toBe("OK");
  });

  it("estimates data URL size and catches localStorage save failures", () => {
    expect(estimateDataUrlBytes("data:image/jpeg;base64,AAAA")).toBe(3);
    expect(safeSetLocalStorage({ setItem: () => undefined }, "pawfolio", { ok: true })).toEqual({ ok: true });
    expect(
      safeSetLocalStorage(
        {
          setItem: () => {
            throw new DOMException("Quota exceeded", "QuotaExceededError");
          },
        },
        "pawfolio",
        { huge: true },
      ).ok,
    ).toBe(false);
  });
});
