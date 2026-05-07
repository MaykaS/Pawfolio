import { describe, expect, it } from "vitest";
import {
  ageLabel,
  applyCoachSuggestion,
  breedCareSignals,
  buildPawPalFeed,
  buildPawPalDigest,
  buildPawPalPlannerPrompt,
  buildTodayAttentionItems,
  buildGoogleCalendarEvent,
  bottomNavTabs,
  careEmptyState,
  careStatus,
  cloudBackupStatusDetail,
  cloudBackupStatusLabel,
  cloudRestoreDetail,
  cloudUploadDetail,
  deleteCalendarItemFromState,
  deleteCareItemFromState,
  daysTogether,
  estimateDataUrlBytes,
  effectiveReminderTimeZone,
  eventCategory,
  eventCategoryColor,
  eventsForDate,
  eventsForMonth,
  getCareMoments,
  getSeasonForDate,
  getUpcomingReminder,
  getUpcomingReminders,
  getUpcomingCalendarItems,
  initialState,
  isStoredPhotoRef,
  isFutureOrToday,
  latestWeight,
  medicationConsistency,
  medicationPlanDateSummary,
  medicationPlanStatus,
  medicationPlanSummary,
  medicationPlanSupportDetail,
  missedRoutineTasks,
  nextOccurrenceDate,
  normalizeState,
  notificationBody,
  notificationPermissionStatus,
  parseMedicationRecurrence,
  prettyDate,
  prettySyncTime,
  recurrenceLabel,
  reminderCompletionStatus,
  reminderLeadOptions,
  reminderTypes,
  safeSetLocalStorage,
  saveCareRecordToState,
  saveReminderToState,
  snoozePawPalThread,
  resolvePawPalThread,
  setReminderCompletionForDate,
  setTaskDoneForDate,
  sortDiaryEntries,
  taskTime,
  tasksForDate,
  todayISO,
  toLocalISO,
  updateTaskTime,
  validateCareRecord,
  visibleCareRecords,
  visibleReminders,
  wellnessSummary,
  weightTrend,
  weightTrendPlot,
  weightTrendSeries,
  routineCoachInsights,
  withCareSchedule,
  withReminderRecurrence,
  withTaskTime,
  canUseBrowserNotifications,
  collectPhotoRefs,
  compareTasksByTime,
  defaultReminderLeadMinutes,
  diaryEntryPhotos,
  formatTaskTime,
  getNotificationGroups,
  limitDiaryPhotos,
  maxDiaryPhotos,
  formatMedicationDose,
  formatMedicationFrequency,
  medicationFrequencyToRecurrence,
  notificationLeadLabel,
  normalizeMedicationDose,
  normalizeMedicationFrequency,
  parseTaskTimeMinutes,
  pushStatusDetail,
  pushStatusLabel,
  reminderAlertDate,
  regionFromCoordinates,
  regionalCareSignals,
  sortTasksByTime,
  taskTimeFromParts,
  taskTimeParts,
  toTimeInputValue,
  type CareRecord,
  type DailyTask,
  type PawfolioState,
  type Reminder,
  type Tab,
} from "./pawfolio";

describe("pawfolio helpers", () => {
  it("formats dates without timezone drift", () => {
    expect(prettyDate("2026-04-21")).toBe("Apr 21");
    expect(todayISO(new Date("2026-04-21T15:30:00.000Z"))).toBe("2026-04-21");
    const localLateNight = new Date(2026, 3, 22, 23, 30);
    expect(toLocalISO(localLateNight)).toBe("2026-04-22");
    expect(todayISO(localLateNight)).toBe("2026-04-22");
  });

  it("calculates dog age labels from a supplied current date", () => {
    expect(ageLabel("2021-05-12", new Date("2026-04-21T12:00:00"))).toBe("4 years old");
    expect(ageLabel("", new Date("2026-04-21T12:00:00"))).toBe("Birthday not set");
    expect(daysTogether("2026-04-01", new Date("2026-04-21T12:00:00"))).toBe("20");
  });

  it("assigns expected routine times from task ids and titles", () => {
    expect(taskTime({ id: "breakfast", title: "Breakfast", time: "07:15", done: false, note: "" })).toBe("7:15 AM");
    expect(taskTime({ id: "custom", title: "Heartgard pill", time: "", done: false, note: "" })).toBe("9:00 AM");
    expect(taskTime({ id: "custom-2", title: "Puzzle toy", time: "", done: false, note: "" })).toBe("Anytime");
    expect(parseTaskTimeMinutes("8:00 pM")).toBe(20 * 60);
    expect(parseTaskTimeMinutes("08:00")).toBe(8 * 60);
    expect(formatTaskTime("20:00")).toBe("8:00 PM");
    expect(toTimeInputValue("8:00 PM")).toBe("20:00");
    expect(taskTimeParts("8:00 pM")).toEqual({ hour: "8", minute: "00", meridiem: "PM" });
    expect(taskTimeFromParts("8", "00", "PM")).toBe("20:00");
  });

  it("normalizes older tasks with missing times", () => {
    const oldTask = { id: "breakfast", title: "Breakfast", done: false, note: "" };

    expect(withTaskTime(oldTask).time).toBe("07:00");
    expect(
      normalizeState({
        tasks: [oldTask],
        diary: [],
        care: [],
        reminders: [],
      } as unknown as Parameters<typeof normalizeState>[0]).tasks[0].time,
    ).toBe("07:00");
  });

  it("clears stale same-day routine checks when migrating older local data", () => {
    const migrated = normalizeState({
      tasks: [{ id: "walk", title: "Morning walk", time: "08:00", done: true, note: "" }],
      taskHistory: { [todayISO()]: { walk: true } },
      diary: [],
      care: [],
      reminders: [],
    });

    expect(migrated.schemaVersion).toBe(initialState.schemaVersion);
    expect(tasksForDate(migrated.tasks, migrated.taskHistory, todayISO())[0].done).toBe(false);
  });

  it("preserves current routine checks after the latest schema is saved", () => {
    const normalized = normalizeState({
      ...initialState,
      taskHistory: { [todayISO()]: { "morning-walk": true } },
    });

    expect(tasksForDate(normalized.tasks, normalized.taskHistory, todayISO()).find((task) => task.id === "morning-walk")?.done).toBe(true);
  });

  it("sorts daily tasks by structured time and keeps anytime tasks last", () => {
    const tasks: DailyTask[] = [
      { id: "night", title: "Night walk", time: "22:00", done: false, note: "" },
      { id: "treat", title: "Treat", time: "8:00 pM", done: false, note: "" },
      { id: "dinner", title: "Dinner", time: "18:00", done: false, note: "" },
      { id: "puzzle", title: "Puzzle", time: "Anytime", done: false, note: "" },
    ];

    expect(sortTasksByTime(tasks).map((task) => task.id)).toEqual(["dinner", "treat", "night", "puzzle"]);
    expect(compareTasksByTime(tasks[1], tasks[2])).toBeGreaterThan(0);
    expect(normalizeState({ tasks, diary: [], care: [], reminders: [] }).tasks.map((task) => task.time)).toEqual([
      "18:00",
      "20:00",
      "22:00",
      "Anytime",
    ]);
  });

  it("tracks daily routine completion by date", () => {
    const tasks: DailyTask[] = [
      { id: "walk", title: "Morning walk", time: "08:00", done: false, note: "" },
    ];
    const history = setTaskDoneForDate({}, "2026-04-22", "walk", true);

    expect(tasksForDate(tasks, history, "2026-04-22")[0].done).toBe(true);
    expect(tasksForDate(tasks, history, "2026-04-23")[0].done).toBe(false);
  });

  it("migrates older tasks to an every-day schedule", () => {
    const normalized = normalizeState({
      tasks: [{ id: "brush", title: "Brush teeth", time: "08:00", done: false, note: "" }],
      diary: [],
      care: [],
      reminders: [],
    });

    expect(normalized.tasks[0].schedule).toEqual({ type: "daily" });
  });

  it("shows every-other-day tasks only on matching dates", () => {
    const tasks: DailyTask[] = [
      {
        id: "brush",
        title: "Brush teeth",
        time: "08:00",
        done: false,
        note: "",
        schedule: { type: "interval", intervalDays: 2, startDate: "2026-04-22" },
      },
    ];

    expect(tasksForDate(tasks, {}, "2026-04-22").map((task) => task.id)).toEqual(["brush"]);
    expect(tasksForDate(tasks, {}, "2026-04-23")).toEqual([]);
    expect(tasksForDate(tasks, {}, "2026-04-24").map((task) => task.id)).toEqual(["brush"]);
  });

  it("shows every-n-days tasks from their chosen start date", () => {
    const tasks: DailyTask[] = [
      {
        id: "supplement",
        title: "Supplement",
        time: "09:00",
        done: false,
        note: "",
        schedule: { type: "interval", intervalDays: 3, startDate: "2026-04-21" },
      },
    ];

    expect(tasksForDate(tasks, {}, "2026-04-20")).toEqual([]);
    expect(tasksForDate(tasks, {}, "2026-04-21").map((task) => task.id)).toEqual(["supplement"]);
    expect(tasksForDate(tasks, {}, "2026-04-24").map((task) => task.id)).toEqual(["supplement"]);
    expect(tasksForDate(tasks, {}, "2026-04-25")).toEqual([]);
  });

  it("shows weekday tasks only on selected weekdays", () => {
    const tasks: DailyTask[] = [
      {
        id: "brush",
        title: "Brush coat",
        time: "18:00",
        done: false,
        note: "",
        schedule: { type: "weekdays", weekdays: [1, 3, 5] },
      },
    ];

    expect(tasksForDate(tasks, {}, "2026-04-20").map((task) => task.id)).toEqual(["brush"]);
    expect(tasksForDate(tasks, {}, "2026-04-21")).toEqual([]);
    expect(tasksForDate(tasks, {}, "2026-04-22").map((task) => task.id)).toEqual(["brush"]);
  });

  it("falls back to a steady wellness state when routine history is still thin", () => {
    const state: PawfolioState = {
      ...normalizeState(initialState),
      tasks: [{ id: "walk", title: "Morning walk", time: "08:00", done: false, note: "" }],
      taskHistory: {},
      care: [],
      careEvents: [],
      reminders: [],
      reminderHistory: {},
    };

    expect(wellnessSummary(state, new Date("2026-04-22T12:00:00"))).toEqual({
      label: "Steady",
      tone: "amber",
      detail: "Still learning your routine",
    });
  });

  it("reports great wellness when recent tracked routine is strong and nothing is overdue", () => {
    const state: PawfolioState = {
      ...normalizeState(initialState),
      tasks: [
        { id: "walk", title: "Morning walk", time: "08:00", done: false, note: "" },
        { id: "meal", title: "Breakfast", time: "07:00", done: false, note: "" },
      ],
      taskHistory: {
        "2026-04-20": { walk: true, meal: true },
        "2026-04-21": { walk: true, meal: true },
        "2026-04-22": { walk: true, meal: true },
      },
      care: [],
      careEvents: [],
      reminders: [],
      reminderHistory: {},
    };

    expect(wellnessSummary(state, new Date("2026-04-22T12:00:00"))).toEqual({
      label: "Great",
      tone: "green",
      detail: "",
    });
  });

  it("reports steady wellness for mixed routine with only softer upcoming care pressure", () => {
    const state: PawfolioState = {
      ...normalizeState(initialState),
      tasks: [
        { id: "walk", title: "Morning walk", time: "08:00", done: false, note: "" },
        { id: "meal", title: "Breakfast", time: "07:00", done: false, note: "" },
      ],
      taskHistory: {
        "2026-04-18": { walk: true, meal: true },
        "2026-04-19": { walk: true, meal: false },
        "2026-04-20": { walk: false, meal: true },
      },
      care: [
        { id: "vaccine", type: "Vaccine", title: "Rabies", date: "2026-04-20", note: "", nextDueDate: "2026-05-10" },
      ],
      careEvents: [],
      reminders: [],
      reminderHistory: {},
    };

    expect(wellnessSummary(state, new Date("2026-04-22T12:00:00"))).toEqual({
      label: "Steady",
      tone: "amber",
      detail: "",
    });
  });

  it("reports needs-care wellness when overdue care exists", () => {
    const state: PawfolioState = {
      ...normalizeState(initialState),
      tasks: [
        { id: "walk", title: "Morning walk", time: "08:00", done: false, note: "" },
        { id: "meal", title: "Breakfast", time: "07:00", done: false, note: "" },
      ],
      taskHistory: {
        "2026-04-20": { walk: true, meal: true },
        "2026-04-21": { walk: true, meal: true },
        "2026-04-22": { walk: true, meal: true },
      },
      care: [
        { id: "vet", type: "Vet visit", title: "Annual checkup", date: "2026-04-01", note: "", nextDueDate: "2026-04-10" },
      ],
      careEvents: [],
      reminders: [],
      reminderHistory: {},
    };

    expect(wellnessSummary(state, new Date("2026-04-22T12:00:00"))).toEqual({
      label: "Needs care",
      tone: "coral",
      detail: "Overdue care needs attention",
    });
  });

  it("evaluates newer users only on the tracked days they actually have", () => {
    const state: PawfolioState = {
      ...normalizeState(initialState),
      tasks: [
        { id: "walk", title: "Morning walk", time: "08:00", done: false, note: "" },
        { id: "meal", title: "Breakfast", time: "07:00", done: false, note: "" },
      ],
      taskHistory: {
        "2026-04-10": { walk: true, meal: true },
        "2026-04-22": { walk: true, meal: true },
      },
      care: [],
      careEvents: [],
      reminders: [],
      reminderHistory: {},
    };

    expect(wellnessSummary(state, new Date("2026-04-22T12:00:00"))).toEqual({
      label: "Great",
      tone: "green",
      detail: "",
    });
  });

  it("reports phone push status in a user-facing way", () => {
    expect(
      pushStatusLabel({
        configured: true,
        supported: true,
        permission: "granted",
        hasSubscription: true,
      }),
    ).toBe("Active now");
    expect(
      pushStatusDetail({
        configured: true,
        supported: true,
        permission: "granted",
        hasSubscription: false,
      }),
    ).toContain("not been saved yet");
    expect(prettySyncTime("2026-04-23T14:30:00.000Z")).toMatch(/Apr 23/);
  });

  it("reports cloud backup and restore status in a user-facing way", () => {
    expect(cloudBackupStatusLabel({ signedIn: false })).toBe("Local only");
    expect(cloudBackupStatusDetail({ signedIn: false })).toContain("working copy");
    expect(cloudBackupStatusLabel({ signedIn: true })).toBe("Needs first backup");
    expect(cloudBackupStatusLabel({ signedIn: true, lastUploadedAt: "2026-04-23T14:30:00.000Z" })).toBe("Backed up");
    expect(cloudBackupStatusDetail({ signedIn: true, lastUploadedAt: "2026-04-23T14:30:00.000Z" })).toContain("Latest private backup");
    expect(cloudRestoreDetail()).toContain("has not restored");
    expect(cloudRestoreDetail("2026-04-24T09:15:00.000Z")).toContain("Last restore");
    expect(cloudUploadDetail()).toContain("has not uploaded");
    expect(cloudUploadDetail("2026-04-24T09:15:00.000Z")).toContain("Last upload");
  });

  it("detects missed routine nudges after local task time and hides them once marked done", () => {
    const tasks: DailyTask[] = [
      { id: "walk", title: "Morning walk", time: "08:00", done: false, note: "" },
      { id: "dinner", title: "Dinner", time: "18:00", done: false, note: "" },
    ];

    expect(missedRoutineTasks(tasks, {}, new Date(2026, 3, 22, 8, 59), 60)).toEqual([]);
    expect(missedRoutineTasks(tasks, {}, new Date(2026, 3, 22, 9, 0), 60).map((task) => task.id)).toEqual(["walk"]);

    const history = setTaskDoneForDate({}, "2026-04-22", "walk", true);
    expect(missedRoutineTasks(tasks, history, new Date(2026, 3, 22, 9, 0), 60)).toEqual([]);
    expect(tasksForDate(tasks, history, "2026-04-23").map((task) => task.done)).toEqual([false, false]);
  });

  it("only evaluates missed routine nudges for tasks scheduled on that day", () => {
    const tasks: DailyTask[] = [
      {
        id: "brush",
        title: "Brush teeth",
        time: "08:00",
        done: false,
        note: "",
        schedule: { type: "interval", intervalDays: 2, startDate: "2026-04-22" },
      },
    ];

    expect(missedRoutineTasks(tasks, {}, new Date(2026, 3, 23, 10, 0), 60)).toEqual([]);
    expect(missedRoutineTasks(tasks, {}, new Date(2026, 3, 24, 9, 0), 60).map((task) => task.id)).toEqual(["brush"]);
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
    expect(normalized.notificationPreferences.inApp).toBe(true);
    expect(normalized.integrationSettings.googleCalendar).toBe("off");
    expect(normalized.routineCoachSettings.enabled).toBe(true);
    expect(normalized.routineCoachSettings.missedRoutineNudges).toBe(true);
    expect(normalized.routineCoachSettings.missedRoutineGraceMinutes).toBe(60);
    expect(normalized.careEvents[0].notifyLeadMinutes).toBe(0);
  });

  it("pulls older routine grace settings up to the one-hour missed-task rule", () => {
    const normalized = normalizeState({
      tasks: [],
      diary: [],
      care: [],
      reminders: [],
      routineCoachSettings: {
        enabled: true,
        missedRoutineNudges: true,
        missedRoutineGraceMinutes: 30,
      },
    });

    expect(normalized.routineCoachSettings.missedRoutineGraceMinutes).toBe(60);
  });

  it("normalizes diary galleries from legacy single photos", () => {
    const normalized = normalizeState({
      tasks: [],
      diary: [
        { id: "old", title: "Hike", body: "", date: "2026-04-22", photo: "pawfolio-photo:old" },
        {
          id: "new",
          title: "Park",
          body: "",
          date: "2026-04-23",
          photo: "legacy-cover",
          photos: ["pawfolio-photo:1", "pawfolio-photo:2"],
        },
      ],
      care: [],
      reminders: [],
    });

    expect(normalized.diary.map((entry) => entry.id)).toEqual(["new", "old"]);
    expect(diaryEntryPhotos(normalized.diary[0])).toEqual(["pawfolio-photo:1", "pawfolio-photo:2"]);
    expect(diaryEntryPhotos(normalized.diary[1])).toEqual(["pawfolio-photo:old"]);
    expect(limitDiaryPhotos(["1", "2", "3", "4", "5", "6", "7"])).toHaveLength(maxDiaryPhotos);
    expect(collectPhotoRefs(normalized)).toEqual(["pawfolio-photo:1", "pawfolio-photo:2", "pawfolio-photo:old"]);
  });

  it("sorts diary entries newest first and keeps missing dates last", () => {
    const entries = [
      { id: "older", title: "Beach", body: "", date: "2026-04-18" },
      { id: "missing", title: "Mystery", body: "", date: "" },
      { id: "newer", title: "Park", body: "", date: "2026-04-22" },
      { id: "middle", title: "Vet", body: "", date: "2026-04-20" },
    ];

    expect(sortDiaryEntries(entries).map((entry) => entry.id)).toEqual(["newer", "middle", "older", "missing"]);
    expect(normalizeState({ tasks: [], diary: entries, care: [], reminders: [] }).diary.map((entry) => entry.id)).toEqual([
      "newer",
      "middle",
      "older",
      "missing",
    ]);
  });

  it("moves edited diary entries into the correct chronological position", () => {
    const entries = [
      { id: "newer", title: "Park", body: "", date: "2026-04-22" },
      { id: "older", title: "Beach", body: "", date: "2026-04-18" },
    ];
    const edited = entries.map((entry) => (entry.id === "older" ? { ...entry, date: "2026-04-24" } : entry));

    expect(sortDiaryEntries(edited).map((entry) => entry.id)).toEqual(["older", "newer"]);
  });

  it("validates care forms and returns friendly empty states", () => {
    expect(validateCareRecord({ type: "Medication", date: "2026-04-22", title: "Heartgard" })).toMatchObject({
      dose: "Add the dose.",
      frequency: "Add how often it is given.",
    });
    expect(
      validateCareRecord({
        type: "Medication",
        date: "2026-04-22",
        title: "Heartgard",
        dose: "1 chew",
        frequency: "Every month",
        startDate: "2026-05-01",
        endDate: "2026-04-01",
      }),
    ).toMatchObject({
      endDate: "End date should be after the start date.",
    });
    expect(validateCareRecord({ type: "Vaccine", date: "2026-04-22", title: "Rabies" })).toEqual({});
    expect(validateCareRecord({ type: "Weight", date: "2026-04-22", weightValue: "27.8" })).toEqual({});
    expect(careEmptyState("Vaccines").title).toBe("No vaccines yet");
  });

  it("derives medication plan states from dates and schedule completeness", () => {
    const activeRecord: CareRecord = {
      id: "med-active",
      type: "Medication",
      title: "Heartgard",
      date: "2026-04-22",
      startDate: "2026-04-01",
      endDate: "2026-10-01",
      note: "",
      doseAmount: "1",
      doseUnit: "chew",
      frequencyType: "monthly",
      frequencyInterval: 1,
    };

    expect(medicationPlanStatus(activeRecord, new Date("2026-04-22T12:00:00"))).toBe("Active");
    expect(medicationPlanStatus({ ...activeRecord, id: "med-upcoming", startDate: "2026-05-01" }, new Date("2026-04-22T12:00:00"))).toBe("Upcoming");
    expect(medicationPlanStatus({ ...activeRecord, id: "med-ended", endDate: "2026-04-21" }, new Date("2026-04-22T12:00:00"))).toBe("Ended");
    expect(medicationPlanStatus({ ...activeRecord, id: "med-review", doseAmount: "", doseUnit: undefined }, new Date("2026-04-22T12:00:00"))).toBe("Needs review");
  });

  it("builds medication plan summaries with fallback support detail", () => {
    const record: CareRecord = {
      id: "med-summary",
      type: "Medication",
      title: "Heartgard",
      date: "2026-04-22",
      startDate: "2026-04-01",
      endDate: "2026-10-01",
      refillDate: "2026-05-22",
      nextDueDate: "2026-05-01",
      adherenceNotes: "Give with breakfast.",
      note: "Watch appetite.",
      doseAmount: "1",
      doseUnit: "chew",
      frequencyType: "monthly",
      frequencyInterval: 1,
    };

    expect(medicationPlanDateSummary(record)).toContain("Apr 1");
    expect(medicationPlanSummary(record)).toContain("Every month");
    expect(medicationPlanSupportDetail(record)).toContain("Refill");
    expect(medicationPlanSupportDetail(record)).toContain("Give with breakfast.");
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
      notifyLeadMinutes: 1440,
    });

    expect(visibleCareRecords(state).some((record) => record.type === "Vet visit" && record.title === "Annual checkup")).toBe(true);
    expect(visibleReminders(state).some((reminder) => reminder.type === "Vet" && reminder.title === "Annual checkup" && reminder.notifyLeadMinutes === 1440)).toBe(true);

    state = saveReminderToState(state, {
      id: "vaccine-calendar",
      title: "Lyme 2",
      type: "Vaccine",
      date: "2026-05-08",
      time: "09:30",
      note: "",
      recurrence: "none",
      timeZone: "America/New_York",
    });

    expect(visibleCareRecords(state).some((record) => record.type === "Vaccine" && record.title === "Lyme 2")).toBe(true);
    expect(visibleReminders(state).some((reminder) => reminder.type === "Vaccine" && reminder.title === "Lyme 2")).toBe(true);
    expect(visibleReminders(state).find((reminder) => reminder.id === "vaccine-calendar")?.timeZone).toBe("America/New_York");
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
      startDate: "2026-05-01",
      endDate: "2026-10-01",
      adherenceNotes: "Give with breakfast if possible.",
      note: "with food",
      nextDueDate: "2026-06-01",
    });

    expect(state.careEvents).toHaveLength(1);
    expect(visibleReminders(state)[0]).toMatchObject({ title: "Heartgard Plus" });
    expect(visibleCareRecords(state)[0]).toMatchObject({
      startDate: "2026-05-01",
      endDate: "2026-10-01",
      adherenceNotes: "Give with breakfast if possible.",
    });

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

  it("persists cleared next due dates on shared care-calendar items", () => {
    let state = saveCareRecordToState(normalizeState(undefined), {
      id: "lyme-1",
      type: "Vaccine",
      title: "Lyme 1",
      date: "2026-04-17",
      note: "",
      nextDueDate: "2026-05-08",
    });

    state = saveCareRecordToState(state, {
      id: "lyme-1",
      type: "Vaccine",
      title: "Lyme 1",
      date: "2026-04-17",
      note: "",
      nextDueDate: "",
    });

    expect(state.careEvents[0].nextDueDate).toBe("");
    expect(normalizeState(state).careEvents[0].nextDueDate).toBe("");
    expect(visibleCareRecords(state)[0].nextDueDate).toBe("");
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
    expect(careStatus({ ...oldCareRecord, id: "lyme-2", title: "Lyme 2", date: "2026-05-08" }, new Date("2026-04-22T12:00:00"))).toBe("Due soon");
    expect(careStatus({ ...oldCareRecord, date: "2026-04-17" }, new Date("2026-04-22T12:00:00"))).toBe("OK");
  });

  it("infers medication recurrence from clear frequency text", () => {
    expect(parseMedicationRecurrence("daily")).toBe("daily");
    expect(parseMedicationRecurrence("every day")).toBe("daily");
    expect(parseMedicationRecurrence("once a week")).toBe("weekly");
    expect(parseMedicationRecurrence("Monthly refill")).toBe("monthly");
    expect(parseMedicationRecurrence("annually")).toBe("yearly");
    expect(parseMedicationRecurrence("as needed")).toBe("none");

    let state = saveCareRecordToState(normalizeState(undefined), {
      id: "heartgard",
      type: "Medication",
      title: "Heartgard",
      date: "2026-04-22",
      note: "",
      nextDueDate: "",
      dose: "1 chew",
      frequency: "once a month",
      refillDate: "2026-05-22",
    });
    expect(visibleReminders(state)[0]).toMatchObject({ type: "Medication", date: "2026-04-22", recurrence: "monthly" });

    state = saveCareRecordToState(state, {
      id: "heartgard",
      type: "Medication",
      title: "Heartgard",
      date: "2026-04-22",
      note: "",
      nextDueDate: "",
      dose: "1 chew",
      frequency: "as needed",
      refillDate: "2026-05-22",
    });
    expect(visibleReminders(state)[0].recurrence).toBe("none");
  });

  it("normalizes structured medication dose and frequency fields", () => {
    const oldDose = normalizeMedicationDose({ dose: "1 chew" });
    expect(oldDose).toMatchObject({ doseAmount: "1", doseUnit: "chew", dose: "1 chew" });
    expect(formatMedicationDose({ doseAmount: "1", doseUnit: "chew" })).toBe("1 chew");
    expect(formatMedicationDose({ dose: "custom syringe" })).toBe("custom syringe");

    const oldFrequency = normalizeMedicationFrequency({ frequency: "once a week" });
    expect(oldFrequency).toMatchObject({ frequencyType: "weekly", frequencyInterval: 1, frequency: "Every week" });
    expect(formatMedicationFrequency({ frequencyType: "monthly", frequencyInterval: 1 })).toBe("Every month");
    expect(formatMedicationFrequency({ frequencyType: "weekly", frequencyInterval: 2 })).toBe("Every 2 weeks");
    expect(medicationFrequencyToRecurrence({ frequencyType: "monthly", frequencyInterval: 1 })).toBe("monthly");
    expect(medicationFrequencyToRecurrence({ frequencyType: "as_needed", frequencyInterval: 1 })).toBe("none");
  });

  it("syncs structured medication frequency into calendar recurrence", () => {
    const state = saveCareRecordToState(normalizeState(undefined), {
      id: "structured-med",
      type: "Medication",
      title: "S-trio",
      date: "2026-04-22",
      note: "",
      dose: "",
      doseAmount: "1",
      doseUnit: "chew",
      frequency: "",
      frequencyType: "monthly",
      frequencyInterval: 1,
      refillDate: "2026-05-22",
    });

    expect(visibleCareRecords(state)[0]).toMatchObject({
      dose: "1 chew",
      doseAmount: "1",
      doseUnit: "chew",
      frequency: "Every month",
      frequencyType: "monthly",
    });
    expect(visibleReminders(state)[0]).toMatchObject({ type: "Medication", recurrence: "monthly" });
  });

  it("updates task times immutably", () => {
    const tasks: DailyTask[] = [
      { id: "walk", title: "Morning walk", time: "08:00", done: false, note: "" },
    ];

    expect(updateTaskTime(tasks, "walk", "8:45 AM")[0]).toEqual({
      id: "walk",
      title: "Morning walk",
      time: "08:45",
      done: false,
      note: "",
      schedule: { type: "daily" },
    });
    expect(tasks[0].time).toBe("08:00");
  });

  it("summarizes quick log care moments from completed tasks", () => {
    const tasks: DailyTask[] = [
      { id: "meal", title: "Morning meal", time: "07:00", done: true, note: "" },
      { id: "walk", title: "Morning walk", time: "08:00", done: false, note: "" },
      { id: "med", title: "Heartgard pill", time: "09:00", done: true, note: "" },
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

  it("keeps calendar chronology separate from open reminder filtering", () => {
    const reminders: Reminder[] = [
      { id: "lyme", title: "Lyme 2", type: "Vaccine", date: "2026-05-08", time: "11:15", note: "", recurrence: "none" },
      { id: "monthly-med", title: "Simplicity trio", type: "Medication", date: "2026-05-13", time: "", note: "", recurrence: "monthly" },
      { id: "rabies", title: "Rabbis", type: "Vaccine", date: "2028-07-23", time: "", note: "", recurrence: "none" },
    ];
    const history = {
      "2026-05-08": { lyme: "done" as const },
    };

    expect(getUpcomingCalendarItems(reminders, new Date("2026-05-06T12:00:00")).map((reminder) => reminder.title)).toEqual([
      "Lyme 2",
      "Simplicity trio",
      "Rabbis",
    ]);
    expect(getUpcomingReminders(reminders, new Date("2026-05-06T12:00:00"), history).map((reminder) => reminder.title)).toEqual([
      "Simplicity trio",
      "Rabbis",
    ]);
  });

  it("calculates next recurring reminder occurrences", () => {
    const reminder: Reminder = {
      id: "heartgard",
      title: "Heartgard",
      type: "Medication",
      date: "2026-01-01",
      time: "08:00",
      note: "",
      recurrence: "monthly",
    };

    expect(nextOccurrenceDate(reminder, new Date("2026-04-22T12:00:00"))).toBe("2026-05-01");
    expect(getUpcomingReminders([reminder], new Date("2026-04-22T12:00:00"))[0].date).toBe("2026-05-01");
    expect(eventsForMonth([reminder], new Date("2026-05-01T12:00:00"))[0].date).toBe("2026-05-01");
    expect(eventsForDate([reminder], "2026-05-01")[0].date).toBe("2026-05-01");
    expect(buildGoogleCalendarEvent(reminder, "Mochi", "America/New_York")).toMatchObject({
      summary: "Mochi: Heartgard",
      start: { dateTime: "2026-01-01T08:00:00", timeZone: "America/New_York" },
      end: { dateTime: "2026-01-01T08:30:00", timeZone: "America/New_York" },
      recurrence: ["RRULE:FREQ=MONTHLY"],
    });
  });

  it("prefers a reminder time zone override before the device default", () => {
    const reminder: Reminder = {
      id: "flight-med",
      title: "Flight meds",
      type: "Medication",
      date: "2026-06-01",
      time: "11:45",
      note: "",
      recurrence: "none",
      timeZone: "Europe/London",
    };

    expect(effectiveReminderTimeZone(reminder, { deviceTimeZone: "America/New_York" })).toBe("Europe/London");
    expect(effectiveReminderTimeZone({ ...reminder, timeZone: undefined }, { deviceTimeZone: "America/New_York" })).toBe("America/New_York");
    expect(buildGoogleCalendarEvent(reminder, "Mochi", "America/New_York").start).toMatchObject({
      dateTime: "2026-06-01T11:45:00",
      timeZone: "Europe/London",
    });
    expect(buildGoogleCalendarEvent(reminder, "Mochi", "America/New_York").end).toMatchObject({
      dateTime: "2026-06-01T12:15:00",
      timeZone: "Europe/London",
    });
  });

  it("tracks reminder completion by date and hides completed upcoming items", () => {
    const reminders: Reminder[] = [
      { id: "vet", title: "Vet", type: "Vet", date: "2026-04-22", time: "12:00", note: "", recurrence: "none" },
      { id: "med", title: "Meds", type: "Medication", date: "2026-04-22", time: "13:00", note: "", recurrence: "none" },
    ];
    const history = setReminderCompletionForDate({}, "2026-04-22", "vet", "done");

    expect(reminderCompletionStatus(history, reminders[0])).toBe("done");
    expect(getUpcomingReminders(reminders, new Date("2026-04-22T08:00:00"), history).map((reminder) => reminder.id)).toEqual(["med"]);
    expect(setReminderCompletionForDate(history, "2026-04-22", "vet", undefined)["2026-04-22"]?.vet).toBeUndefined();
  });

  it("moves recurring reminders to the next occurrence after the current one is completed", () => {
    const reminder: Reminder = {
      id: "heartgard",
      title: "Heartgard",
      type: "Medication",
      date: "2026-04-22",
      time: "09:00",
      note: "",
      recurrence: "monthly",
    };
    const history = setReminderCompletionForDate({}, "2026-04-22", "heartgard", "done");

    expect(nextOccurrenceDate(reminder, new Date("2026-04-22T08:00:00"), history)).toBe("2026-05-22");
    expect(getUpcomingReminder([reminder], new Date("2026-04-22T08:00:00"), history)?.date).toBe("2026-05-22");
  });

  it("reports browser notification support safely", () => {
    expect(notificationPermissionStatus(undefined)).toBe("unsupported");
    expect(canUseBrowserNotifications(undefined)).toBe(false);
    expect(notificationPermissionStatus({ permission: "granted" })).toBe("granted");
    expect(notificationPermissionStatus({ permission: "default" })).toBe("default");
    expect(canUseBrowserNotifications({ permission: "denied" })).toBe(true);
    expect(notificationBody({ title: "Lyme 2", date: "2026-05-08" })).toBe("Lyme 2 is coming up May 8.");
    expect(notificationBody()).toBe("Notifications are ready for Pawfolio.");
  });

  it("applies reminder lead times and groups notification timing", () => {
    const reminders = [
      { id: "med", title: "Meds", type: "Medication", date: "2026-04-22", time: "10:00", note: "", recurrence: "none" },
      { id: "vet", title: "Vet", type: "Vet", date: "2026-04-22", time: "12:00", note: "", recurrence: "none" },
      { id: "groom", title: "Groom", type: "Grooming", date: "2026-04-24", time: "12:00", note: "", recurrence: "none", notifyLeadMinutes: 1440 },
    ] satisfies Reminder[];
    const normalized = normalizeState({ tasks: [], diary: [], care: [], reminders });
    const visible = visibleReminders(normalized);

    expect(defaultReminderLeadMinutes("Medication")).toBe(0);
    expect(defaultReminderLeadMinutes("Vet")).toBe(60);
    expect(reminderLeadOptions.map((option) => option.value)).toEqual([0, 15, 30, 60, 720, 1440]);
    expect(visible.find((reminder) => reminder.id === "med")?.notifyLeadMinutes).toBe(0);
    expect(visible.find((reminder) => reminder.id === "vet")?.notifyLeadMinutes).toBe(60);
    expect(notificationLeadLabel(visible.find((reminder) => reminder.id === "vet")!)).toBe("1 hour before");
    expect(reminderAlertDate(visible.find((reminder) => reminder.id === "vet")!).getHours()).toBe(11);
    expect(
      notificationLeadLabel({ type: "Vet", notifyLeadMinutes: 720 }),
    ).toBe("Same day");
    expect(
      reminderAlertDate({ id: "same-day", title: "Annual check", type: "Vet", date: "2026-04-24", time: "14:00", note: "", recurrence: "none", notifyLeadMinutes: 720 }).getHours(),
    ).toBe(9);

    const groups = getNotificationGroups(visible, new Date("2026-04-22T11:15:00"));
    expect(groups.dueNow.map((reminder) => reminder.id)).toEqual(["med", "vet"]);
    expect(groups.soon).toEqual([]);
    expect(groups.upcoming.map((reminder) => reminder.id)).toEqual(["groom"]);
  });

  it("filters month events and maps event categories consistently", () => {
    const reminders: Reminder[] = [
      { id: "apr-med", title: "Heartgard", type: "Medication", date: "2026-04-22", time: "09:00", note: "", recurrence: "monthly" },
      { id: "apr-vet", title: "Vet", type: "Vet", date: "2026-04-23", time: "10:00", note: "", recurrence: "none" },
      { id: "may-groom", title: "Grooming", type: "Grooming", date: "2026-05-02", time: "14:00", note: "", recurrence: "none" },
    ];

    expect(eventsForMonth(reminders, new Date("2026-04-01T12:00:00")).map((reminder) => reminder.id)).toEqual(["apr-med", "apr-vet"]);
    expect(reminderTypes).toContain("Vet");
    expect(reminderTypes).toContain("Vaccine");
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
      { id: "old-weight", type: "Weight", title: "26 lb", date: "2026-04-01", note: "", weightValue: "26", weightUnit: "lb" },
      { id: "weight", type: "Weight", title: "27.8 lb", date: "2026-04-21", note: "", weightValue: "27.8", weightUnit: "lb" },
      { id: "med", type: "Medication", title: "Heartgard", date: "2026-04-21", note: "Next: May 1", nextDueDate: "" },
    ];

    expect(latestWeight(records, "26 lb")).toBe("27.8 lb");
    expect(weightTrend(records)).toBe("Up 1.8 lb");
    expect(weightTrendSeries(records).map((point) => point.value)).toEqual([26, 27.8]);
    expect(weightTrendPlot(records).map((point) => Math.round(point.x))).toEqual([8, 92]);
    expect(medicationConsistency(records, new Date("2026-04-22T12:00:00")).last30Days).toBe(1);
    expect(
      medicationConsistency([...records, { ...records[2], id: "future-med", date: "2026-06-01" }], new Date("2026-04-22T12:00:00")).last30Days,
    ).toBe(1);
    expect(careStatus(records[2])).toBe("Due soon");
    expect(careStatus(records[1])).toBe("OK");
  });

  it("builds stable weight chart points for empty, single, and tight ranges", () => {
    expect(weightTrendPlot([])).toEqual([]);

    const single = weightTrendPlot([
      { id: "weight-1", type: "Weight", title: "36.5 kg", date: "2026-04-17", note: "", weightValue: "36.5", weightUnit: "kg" },
    ]);
    expect(single).toHaveLength(1);
    expect(single[0]).toMatchObject({ x: 50, y: 50 });

    const close = weightTrendPlot([
      { id: "weight-1", type: "Weight", title: "36.5 kg", date: "2026-04-17", note: "", weightValue: "36.5", weightUnit: "kg" },
      { id: "weight-2", type: "Weight", title: "36.6 kg", date: "2026-04-18", note: "", weightValue: "36.6", weightUnit: "kg" },
      { id: "weight-3", type: "Weight", title: "36.55 kg", date: "2026-04-19", note: "", weightValue: "36.55", weightUnit: "kg" },
    ]);
    expect(close).toHaveLength(3);
    expect(close.every((point) => point.y >= 0 && point.y <= 100)).toBe(true);

    const pounds = weightTrendPlot([
      { id: "weight-1", type: "Weight", title: "80 lb", date: "2026-04-17", note: "", weightValue: "80", weightUnit: "lb" },
      { id: "weight-2", type: "Weight", title: "80.05 lb", date: "2026-04-18", note: "", weightValue: "80.05", weightUnit: "lb" },
    ]);
    expect(Math.round(pounds[1].y)).toBeGreaterThan(Math.round(close[1].y));
  });

  it("creates routine coach insights from local patterns", () => {
    const tasks: DailyTask[] = [
      { id: "walk", title: "Evening walk", time: "19:30", done: false, note: "" },
    ];
    const insights = routineCoachInsights(
      tasks,
      {
        "2026-04-20": { walk: false },
        "2026-04-21": { walk: false },
        "2026-04-22": { walk: true },
      },
      [],
      [],
    );

    expect(insights.some((insight) => insight.includes("Walks have been missed"))).toBe(true);
  });

  it("builds PawPal threads for longer-running follow-through issues", () => {
    const state = normalizeState({
      profile: {
        name: "Mochi",
        breed: "Great Pyrenees",
        birthday: "2021-05-12",
        weight: "80 lb",
        personality: "",
        avatar: initialState.profile?.avatar || { fur: "#fff7df", ears: "floppy", spot: "none", accessory: "none" },
      },
      tasks: [],
      diary: [],
      care: [
        { id: "med", type: "Medication", title: "Heartgard", date: "2026-04-22", note: "", dose: "", frequency: "" },
        { id: "vaccine", type: "Vaccine", title: "Lyme", date: "2026-04-22", note: "", nextDueDate: "" },
      ],
      reminders: [],
    });

    const suggestions = buildPawPalFeed(state, new Date("2026-04-22T12:00:00"));

    expect(suggestions[0].priority).toBeGreaterThanOrEqual(suggestions[1].priority);
    expect(suggestions.some((suggestion) => suggestion.id === "pawpal-thread-medication-med")).toBe(true);
    expect(suggestions.some((suggestion) => suggestion.id === "pawpal-thread-vaccine-vaccine")).toBe(true);
  });

  it("opens softer PawPal threads for memory gaps, weight drift, and near-future care follow-up", () => {
    const state = normalizeState({
      tasks: [
        { id: "walk", title: "Morning walk", time: "08:00", done: false, note: "" },
      ],
      taskHistory: {
        "2026-04-18": { walk: true },
        "2026-04-19": { walk: true },
      },
      diary: [{ id: "memory-1", title: "Park", body: "", date: "2026-04-20" }],
      care: [
        { id: "weight-1", type: "Weight", title: "36 kg", date: "2026-03-20", note: "", weightValue: "36", weightUnit: "kg" },
        { id: "vet-1", type: "Vet visit", title: "Annual checkup", date: "2026-05-05", note: "", nextDueDate: "2026-05-05" },
      ],
      reminders: [{ id: "future", title: "Grooming", type: "Grooming", date: "2026-05-20", time: "11:00", note: "", recurrence: "none" }],
      cloudSyncMeta: { lastUploadedAt: "2026-04-27T10:00:00.000Z" },
    });

    const threads = buildPawPalFeed(state, new Date("2026-04-29T12:00:00"));

    expect(threads.map((thread) => thread.id)).toContain("pawpal-thread-memory-gap");
    expect(threads.map((thread) => thread.id)).toContain("pawpal-thread-weight-checkin");
    expect(threads.map((thread) => thread.id)).toContain("pawpal-thread-followup-vet-1");
    expect(threads.map((thread) => thread.id).some((id) => id.startsWith("pawpal-thread-seasonal-"))).toBe(true);
  });

  it("opens a PawPal routine-drift thread when recent tracked completion slips", () => {
    const state = normalizeState({
      tasks: [
        { id: "walk", title: "Morning walk", time: "08:00", done: false, note: "" },
        { id: "meal", title: "Breakfast", time: "07:00", done: false, note: "" },
      ],
      taskHistory: {
        "2026-04-18": { walk: false, meal: true },
        "2026-04-19": { walk: false, meal: false },
        "2026-04-20": { walk: true, meal: false },
        "2026-04-21": { walk: false, meal: true },
      },
      diary: [{ id: "memory-1", title: "Park", body: "", date: "2026-04-21" }],
      care: [],
      reminders: [{ id: "future", title: "Vet", type: "Vet", date: "2026-05-20", time: "09:00", note: "", recurrence: "none" }],
      cloudSyncMeta: { lastUploadedAt: "2026-04-20T10:00:00.000Z" },
    });

    expect(buildPawPalFeed(state, new Date("2026-04-22T12:00:00")).map((thread) => thread.id)).toContain("pawpal-thread-routine-drift");
  });

  it("shows same-day missed routine tasks in today attention, not as duplicated PawPal alerts", () => {
    const state = normalizeState({
      tasks: [{ id: "morning-walk", title: "Morning walk", time: "08:00", done: false, note: "" }],
      taskHistory: {},
      diary: [],
      care: [],
      reminders: [{ id: "future", title: "Vet", type: "Vet", date: "2026-06-01", time: "09:00", note: "", recurrence: "none" }],
    });

    const suggestions = buildPawPalFeed(state, new Date(2026, 3, 22, 9, 5));
    expect(suggestions.map((suggestion) => suggestion.id)).not.toContain("today-missed-task-2026-04-22-morning-walk");
    expect(buildTodayAttentionItems(state, new Date(2026, 3, 22, 9, 5)).map((item) => item.id)).toContain("today-missed-task-2026-04-22-morning-walk");

    const done = {
      ...state,
      taskHistory: setTaskDoneForDate(state.taskHistory, "2026-04-22", "morning-walk", true),
    };
    expect(buildTodayAttentionItems(done, new Date(2026, 3, 22, 9, 5)).map((suggestion) => suggestion.id)).not.toContain("today-missed-task-2026-04-22-morning-walk");
  });

  it("keeps PawPal as a floating screen instead of a crowded bottom nav item", () => {
    const tab: Tab = "pawpal";

    expect(tab).toBe("pawpal");
    expect(bottomNavTabs).toEqual(["today", "diary", "care", "calendar", "profile"]);
    expect(bottomNavTabs).not.toContain("pawpal");
  });

  it("uses breed, season, and optional region for coach care signals", () => {
    expect(getSeasonForDate(new Date("2026-04-22T12:00:00"), "North America")).toBe("spring");
    expect(regionFromCoordinates(40.7, -74)).toBe("North America");
    expect(regionFromCoordinates(48.8, 2.3)).toBe("Europe");
    expect(breedCareSignals({ name: "Mochi", breed: "Great Pyrenees", birthday: "", weight: "", personality: "", avatar: { fur: "#fff7df", ears: "floppy", spot: "none", accessory: "none" } }).map((signal) => signal.id)).toContain("heavy-coat-heat");
    expect(regionalCareSignals("North America", "spring").map((signal) => signal.id)).toContain("north-america-tick-check");
  });

  it("keeps due-today care in Today attention, not as a duplicated PawPal thread", () => {
    const state = normalizeState({
      tasks: [],
      diary: [],
      care: [
        { id: "lyme-1", type: "Vaccine", title: "Lyme 1", date: "2026-04-20", note: "", nextDueDate: "2026-04-22" },
      ],
      reminders: [],
    });

    const todayIds = buildTodayAttentionItems(state, new Date("2026-04-22T12:00:00")).map((item) => item.id);
    const pawpalItems = buildPawPalFeed(state, new Date("2026-04-22T12:00:00"));

    expect(todayIds).toContain("today-care-lyme-1-2026-04-22");
    expect(pawpalItems.map((item) => item.id)).not.toContain("today-care-lyme-1-2026-04-22");
    expect(buildTodayAttentionItems(state, new Date("2026-04-22T12:00:00")).find((item) => item.id === "today-care-lyme-1-2026-04-22")?.title).toBe("Lyme 1 is due today");
  });

  it("keeps PawPal-only coaching out of Today attention", () => {
    const state = normalizeState({
      tasks: [],
      diary: [],
      care: [{ id: "lyme-1", type: "Vaccine", title: "Lyme 1", date: "2026-04-17", note: "", nextDueDate: "" }],
      reminders: [],
    });

    expect(buildPawPalFeed(state, new Date("2026-04-22T12:00:00")).map((item) => item.id)).toContain("pawpal-thread-vaccine-lyme-1");
    expect(buildTodayAttentionItems(state, new Date("2026-04-22T12:00:00")).map((item) => item.id)).not.toContain("pawpal-thread-vaccine-lyme-1");
  });

  it("dismissing a today item does not hide unrelated PawPal threads", () => {
    const state = normalizeState({
      tasks: [{ id: "morning-walk", title: "Morning walk", time: "08:00", done: false, note: "" }],
      taskHistory: {},
      diary: [],
      care: [{ id: "lyme-1", type: "Vaccine", title: "Lyme 1", date: "2026-04-17", note: "", nextDueDate: "" }],
      reminders: [],
    });

    const dismissed = applyCoachSuggestion(state, "today-missed-task-2026-04-22-morning-walk", new Date(2026, 3, 22, 8, 45));
    expect(buildTodayAttentionItems(dismissed, new Date(2026, 3, 22, 8, 45)).map((item) => item.id)).not.toContain("today-missed-task-2026-04-22-morning-walk");
    expect(buildPawPalFeed(dismissed, new Date("2026-04-22T12:00:00")).map((item) => item.id)).toContain("pawpal-thread-vaccine-lyme-1");
  });

  it("snoozed PawPal threads stay hidden until their next check date", () => {
    const base = normalizeState({
      tasks: [],
      diary: [],
      care: [{ id: "lyme-1", type: "Vaccine", title: "Lyme 1", date: "2026-04-17", note: "", nextDueDate: "" }],
      reminders: [],
    });
    const snoozed = snoozePawPalThread(base, "pawpal-thread-vaccine-lyme-1", new Date("2026-04-22T12:00:00"));

    expect(buildPawPalFeed(snoozed, new Date("2026-04-24T12:00:00")).map((item) => item.id)).not.toContain("pawpal-thread-vaccine-lyme-1");
    expect(buildPawPalFeed(snoozed, new Date("2026-04-30T12:00:00")).map((item) => item.id)).toContain("pawpal-thread-vaccine-lyme-1");
  });

  it("resolved PawPal threads disappear until the issue requalifies", () => {
    const base = normalizeState({
      tasks: [],
      diary: [],
      care: [{ id: "lyme-1", type: "Vaccine", title: "Lyme 1", date: "2026-04-17", note: "", nextDueDate: "" }],
      reminders: [],
    });
    const resolved = resolvePawPalThread(base, "pawpal-thread-vaccine-lyme-1", new Date("2026-04-22T12:00:00"));
    const fixed = normalizeState({
      ...resolved,
      care: [{ id: "lyme-1", type: "Vaccine", title: "Lyme 1", date: "2026-04-17", note: "", nextDueDate: "2027-04-17" }],
    });

    expect(buildPawPalFeed(fixed, new Date("2026-04-23T12:00:00")).map((item) => item.id)).not.toContain("pawpal-thread-vaccine-lyme-1");
  });

  it("always builds a PawPal digest even when no threads are open", () => {
    const calm = normalizeState({
      coachSettings: {
        ...initialState.coachSettings,
        enabled: false,
      },
      tasks: [{ id: "walk", title: "Morning walk", time: "08:00", done: false, note: "" }],
      taskHistory: {
        "2026-04-20": { walk: true },
        "2026-04-21": { walk: true },
      },
      diary: [{ id: "memory-1", title: "Sunny porch", body: "", date: "2026-04-28" }],
      care: [{ id: "weight-1", type: "Weight", title: "36 kg", date: "2026-04-25", note: "", weightValue: "36", weightUnit: "kg" }],
      reminders: [{ id: "future", title: "Vet", type: "Vet", date: "2026-06-01", time: "09:00", note: "", recurrence: "none" }],
      cloudSyncMeta: { lastUploadedAt: "2026-04-28T12:00:00.000Z" },
    });

    expect(buildPawPalDigest(calm, new Date("2026-04-22T12:00:00"))).toEqual({
      title: "Everything looks steady today",
      body: "No longer-running care threads need a follow-up right now.",
      tone: "good",
    });
  });

  it("builds a planner prompt even when no PawPal threads are open", () => {
    const calm = normalizeState({
      tasks: [{ id: "walk", title: "Morning walk", time: "08:00", done: false, note: "" }],
      taskHistory: {
        "2026-04-20": { walk: true },
        "2026-04-21": { walk: true },
      },
      diary: [{ id: "memory-1", title: "Sunny porch", body: "", date: "2026-04-28" }],
      care: [{ id: "weight-1", type: "Weight", title: "36 kg", date: "2026-04-25", note: "", weightValue: "36", weightUnit: "kg" }],
      reminders: [{ id: "future", title: "Vet", type: "Vet", date: "2026-06-01", time: "09:00", note: "", recurrence: "none" }],
      cloudSyncMeta: { lastUploadedAt: "2026-04-28T12:00:00.000Z" },
    });

    const prompt = buildPawPalPlannerPrompt(calm, new Date("2026-04-22T12:00:00"));
    expect(prompt.id).toContain("pawpal-prompt");
    expect(prompt.action.type).toBeTruthy();
  });

  it("keeps planner prompts from duplicating an already-open PawPal thread", () => {
    const state = normalizeState({
      tasks: [{ id: "walk", title: "Morning walk", time: "08:00", done: false, note: "" }],
      taskHistory: {
        "2026-04-18": { walk: true },
        "2026-04-19": { walk: true },
      },
      diary: [{ id: "memory-1", title: "Park", body: "", date: "2026-04-20" }],
      care: [],
      reminders: [{ id: "future", title: "Grooming", type: "Grooming", date: "2026-05-20", time: "11:00", note: "", recurrence: "none" }],
      cloudSyncMeta: { lastUploadedAt: "2026-04-27T10:00:00.000Z" },
    });

    expect(buildPawPalFeed(state, new Date("2026-04-29T12:00:00")).map((thread) => thread.id)).toContain("pawpal-thread-upcoming-reminders");
    expect(buildPawPalPlannerPrompt(state, new Date("2026-04-29T12:00:00")).id).not.toBe("pawpal-prompt-plan");
  });

  it("estimates data URL size and catches localStorage save failures", () => {
    expect(estimateDataUrlBytes("data:image/jpeg;base64,AAAA")).toBe(3);
    expect(isStoredPhotoRef("pawfolio-photo:abc")).toBe(true);
    expect(isStoredPhotoRef("data:image/jpeg;base64,AAAA")).toBe(false);
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
