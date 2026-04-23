import { describe, expect, it } from "vitest";
import {
  ageLabel,
  applyCoachSuggestion,
  breedCareSignals,
  buildCoachSuggestions,
  buildTodayAttentionItems,
  buildGoogleCalendarEvent,
  bottomNavTabs,
  careEmptyState,
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
  getSeasonForDate,
  getUpcomingReminder,
  getUpcomingReminders,
  initialState,
  isStoredPhotoRef,
  isFutureOrToday,
  latestWeight,
  medicationConsistency,
  nextOccurrenceDate,
  normalizeState,
  notificationBody,
  notificationPermissionStatus,
  parseMedicationRecurrence,
  prettyDate,
  recurrenceLabel,
  reminderTypes,
  safeSetLocalStorage,
  saveCareRecordToState,
  saveReminderToState,
  setTaskDoneForDate,
  sortDiaryEntries,
  taskTime,
  tasksForDate,
  todayISO,
  updateTaskTime,
  validateCareRecord,
  visibleCareRecords,
  visibleReminders,
  weightTrend,
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
  reminderAlertDate,
  regionFromCoordinates,
  regionalCareSignals,
  rankCoachSuggestions,
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
    expect(normalized.integrationSettings.googleCalendar).toBe("planned");
    expect(normalized.routineCoachSettings.enabled).toBe(true);
    expect(normalized.careEvents[0].notifyLeadMinutes).toBe(0);
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
    expect(validateCareRecord({ type: "Vaccine", date: "2026-04-22", title: "Rabies" })).toEqual({});
    expect(validateCareRecord({ type: "Weight", date: "2026-04-22", weightValue: "27.8" })).toEqual({});
    expect(careEmptyState("Vaccines").title).toBe("No vaccines yet");
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
    });

    expect(visibleCareRecords(state).some((record) => record.type === "Vaccine" && record.title === "Lyme 2")).toBe(true);
    expect(visibleReminders(state).some((reminder) => reminder.type === "Vaccine" && reminder.title === "Lyme 2")).toBe(true);
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
    expect(buildGoogleCalendarEvent(reminder, "Mochi")).toMatchObject({
      summary: "Mochi: Heartgard",
      recurrence: ["RRULE:FREQ=MONTHLY"],
    });
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
    expect(visible.find((reminder) => reminder.id === "med")?.notifyLeadMinutes).toBe(0);
    expect(visible.find((reminder) => reminder.id === "vet")?.notifyLeadMinutes).toBe(60);
    expect(notificationLeadLabel(visible.find((reminder) => reminder.id === "vet")!)).toBe("1 hour before");
    expect(reminderAlertDate(visible.find((reminder) => reminder.id === "vet")!).getHours()).toBe(11);

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
    expect(medicationConsistency(records, new Date("2026-04-22T12:00:00")).last30Days).toBe(1);
    expect(
      medicationConsistency([...records, { ...records[2], id: "future-med", date: "2026-06-01" }], new Date("2026-04-22T12:00:00")).last30Days,
    ).toBe(1);
    expect(careStatus(records[2])).toBe("Due soon");
    expect(careStatus(records[1])).toBe("OK");
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

  it("builds local coach suggestions for care gaps and ranks urgent items first", () => {
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

    const suggestions = buildCoachSuggestions(state, new Date("2026-04-22T12:00:00"));

    expect(suggestions[0].priority).toBeGreaterThanOrEqual(suggestions[1].priority);
    expect(suggestions.some((suggestion) => suggestion.id === "med-details-med")).toBe(true);
    expect(suggestions.some((suggestion) => suggestion.id === "vaccine-next-vaccine")).toBe(true);
    expect(rankCoachSuggestions([{ ...suggestions[0], priority: 1 }, { ...suggestions[1], priority: 99 }])[0].priority).toBe(99);
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

  it("keeps location coach suggestions off until location or manual region is enabled", () => {
    const base = normalizeState({
      profile: {
        name: "Mochi",
        breed: "Great Pyrenees",
        birthday: "",
        weight: "",
        personality: "",
        avatar: { fur: "#fff7df", ears: "floppy", spot: "none", accessory: "none" },
      },
      tasks: [],
      diary: [],
      care: [],
      reminders: [{ id: "future", title: "Vet", type: "Vet", date: "2026-06-01", time: "09:00", note: "", recurrence: "none" }],
      coachSettings: { enabled: true, seasonalTips: true, locationMode: "off", careRegion: "North America" },
    });

    expect(buildCoachSuggestions(base, new Date("2026-04-22T12:00:00")).some((suggestion) => suggestion.id === "region-north-america-tick-check")).toBe(false);
    const withRegion = normalizeState({
      ...base,
      coachSettings: { ...base.coachSettings, locationMode: "manual" },
    });
    expect(buildCoachSuggestions(withRegion, new Date("2026-04-22T12:00:00")).some((suggestion) => suggestion.id === "region-north-america-tick-check")).toBe(true);
  });

  it("dismisses coach suggestions and applies one-tap task actions", () => {
    const state = normalizeState({
      tasks: [],
      diary: [],
      care: [],
      reminders: [{ id: "future", title: "Vet", type: "Vet", date: "2026-06-01", time: "09:00", note: "", recurrence: "none" }],
      coachSettings: { enabled: true, seasonalTips: true, locationMode: "manual", careRegion: "North America" },
    }) as PawfolioState;

    expect(buildCoachSuggestions(state, new Date("2026-04-22T12:00:00")).some((suggestion) => suggestion.id === "region-north-america-tick-check")).toBe(true);
    const next = applyCoachSuggestion(state, "region-north-america-tick-check", new Date("2026-04-22T12:00:00"));

    expect(next.tasks.some((task) => task.title === "Tick check" && task.time === "20:00")).toBe(true);
    expect(next.coachDismissals).toContain("region-north-america-tick-check");
    expect(buildCoachSuggestions(next, new Date("2026-04-22T12:00:00")).some((suggestion) => suggestion.id === "region-north-america-tick-check")).toBe(false);
  });

  it("uses coach suggestions for today attention and dismisses them everywhere", () => {
    const state = normalizeState({
      tasks: [],
      diary: [],
      care: [
        { id: "lyme-1", type: "Vaccine", title: "Lyme 1", date: "2026-05-08", note: "", nextDueDate: "" },
      ],
      reminders: [],
    });

    expect(buildTodayAttentionItems(state, new Date("2026-04-22T12:00:00")).map((item) => item.id)).toContain("care-status-lyme-1");
    const dismissed = applyCoachSuggestion(state, "care-status-lyme-1", new Date("2026-04-22T12:00:00"));

    expect(buildCoachSuggestions(dismissed, new Date("2026-04-22T12:00:00")).map((item) => item.id)).not.toContain("care-status-lyme-1");
    expect(buildCoachSuggestions(dismissed, new Date("2026-04-22T12:00:00")).map((item) => item.id)).not.toContain("vaccine-next-lyme-1");
    expect(buildTodayAttentionItems(dismissed, new Date("2026-04-22T12:00:00")).map((item) => item.id)).not.toContain("care-status-lyme-1");
    expect(buildCoachSuggestions(dismissed, new Date("2026-04-22T12:00:00")).some((item) => item.id !== "care-status-lyme-1")).toBe(true);
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
