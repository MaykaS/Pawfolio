export type Tab = "today" | "diary" | "care" | "calendar" | "profile";

export type DogAvatar = {
  fur: string;
  ears: string;
  spot: string;
  accessory: string;
};

export type DogProfile = {
  name: string;
  breed: string;
  birthday: string;
  weight: string;
  personality: string;
  personalityTags?: string[];
  photo?: string;
  avatar: DogAvatar;
};

export type DailyTask = {
  id: string;
  title: string;
  time: string;
  done: boolean;
  note: string;
};

export type DiaryEntry = {
  id: string;
  title: string;
  body: string;
  date: string;
  photo?: string;
};

export type CareRecord = {
  id: string;
  type: string;
  title: string;
  date: string;
  note: string;
  nextDueDate?: string;
  dose?: string;
  frequency?: string;
  refillDate?: string;
  clinic?: string;
  vetName?: string;
  reason?: string;
  weightValue?: string;
  weightUnit?: string;
};

export type SharedCareType = "Medication" | "Vaccine" | "Vet visit";
export type ReminderRecurrence = "none" | "daily" | "weekly" | "monthly" | "yearly";

export type CareEvent = {
  id: string;
  type: SharedCareType;
  title: string;
  date: string;
  time: string;
  note: string;
  nextDueDate?: string;
  recurrence: ReminderRecurrence;
  dose?: string;
  frequency?: string;
  refillDate?: string;
  clinic?: string;
  vetName?: string;
  reason?: string;
};

export type Reminder = {
  id: string;
  title: string;
  type: string;
  date: string;
  time: string;
  note: string;
  recurrence: ReminderRecurrence;
};

export type PawfolioNotificationStatus = "unsupported" | "default" | "granted" | "denied";
export type TaskHistory = Record<string, Record<string, boolean>>;

export type NotificationPreferences = {
  inApp: boolean;
  push: boolean;
  email: boolean;
  googleCalendar: boolean;
};

export type IntegrationSettings = {
  googleCalendar: "not_connected" | "planned" | "connected";
  email: "not_configured" | "planned" | "configured";
  push: "not_enabled" | "planned" | "enabled";
  cloudSync: "local_only" | "planned" | "enabled";
};

export type GoogleCalendarSyncState = {
  connected: boolean;
  calendarId?: string;
  lastSyncAt?: string;
};

export type RoutineCoachSettings = {
  enabled: boolean;
};

export type PawfolioState = {
  profile?: DogProfile;
  tasks: DailyTask[];
  taskHistory: TaskHistory;
  diary: DiaryEntry[];
  care: CareRecord[];
  careEvents: CareEvent[];
  reminders: Reminder[];
  notificationPreferences: NotificationPreferences;
  integrationSettings: IntegrationSettings;
  googleCalendarSyncState: GoogleCalendarSyncState;
  routineCoachSettings: RoutineCoachSettings;
};

export const storageKey = "pawfolio-local-v1";

export const defaultTasks: DailyTask[] = [
  { id: "breakfast", title: "Morning meal", time: "7:00 AM", done: false, note: "" },
  { id: "morning-walk", title: "Morning walk", time: "8:00 AM", done: false, note: "" },
  { id: "heartgard-pill", title: "Heartgard pill", time: "9:00 AM", done: false, note: "" },
  { id: "afternoon-meal", title: "Afternoon meal", time: "12:00 PM", done: false, note: "" },
  { id: "afternoon-walk", title: "Afternoon walk", time: "4:00 PM", done: false, note: "" },
  { id: "dinner", title: "Evening meal", time: "6:00 PM", done: false, note: "" },
  { id: "evening-walk", title: "Evening walk", time: "7:30 PM", done: false, note: "" },
];

export const initialState: PawfolioState = {
  tasks: defaultTasks,
  taskHistory: {},
  diary: [],
  care: [],
  careEvents: [],
  reminders: [],
  notificationPreferences: {
    inApp: true,
    push: false,
    email: false,
    googleCalendar: false,
  },
  integrationSettings: {
    googleCalendar: "planned",
    email: "planned",
    push: "planned",
    cloudSync: "planned",
  },
  googleCalendarSyncState: {
    connected: false,
  },
  routineCoachSettings: {
    enabled: true,
  },
};

export const breedOptions = [
  "Great Pyrenees",
  "Golden Retriever",
  "Labrador Retriever",
  "German Shepherd",
  "Poodle",
  "Australian Shepherd",
  "Border Collie",
  "Corgi",
  "Cavalier King Charles Spaniel",
  "Mixed Breed",
];

export const avatarOptions = {
  fur: ["#fff7df", "#f7d08a", "#d9a066", "#6f4d38", "#1f2933", "#fbfbf5", "#b7794f", "#8b6f47"],
  ears: ["floppy", "pointy", "round"],
  spot: ["none", "eye", "back", "freckles"],
  accessory: ["none", "bandana", "bow", "collar", "scarf", "star"],
};

export const careTypes = ["Weight", "Medication", "Vaccine", "Vet visit", "Allergy", "Health note"];
export const reminderTypes = ["Vet", "Medication", "Grooming", "Walk", "Food", "Other"];
export const reminderRecurrenceOptions: { value: ReminderRecurrence; label: string }[] = [
  { value: "none", label: "Does not repeat" },
  { value: "daily", label: "Every day" },
  { value: "weekly", label: "Every week" },
  { value: "monthly", label: "Every month" },
  { value: "yearly", label: "Every year" },
];

export const routineTimes: Record<string, string> = {
  "morning-walk": "8:00 AM",
  breakfast: "7:00 AM",
  "heartgard-pill": "9:00 AM",
  "afternoon-meal": "12:00 PM",
  "afternoon-walk": "4:00 PM",
  "evening-walk": "7:30 PM",
  dinner: "6:00 PM",
  "night-walk": "9:30 PM",
  training: "Anytime",
};

export function todayISO(now = new Date()) {
  return now.toISOString().slice(0, 10);
}

export function prettyDate(date: string) {
  if (!date) return "No date";
  return new Date(`${date}T00:00`).toLocaleDateString("en", {
    month: "short",
    day: "numeric",
  });
}

export function ageLabel(birthday: string, now = new Date()) {
  if (!birthday) return "Birthday not set";
  const birth = new Date(`${birthday}T00:00`);
  const months =
    (now.getFullYear() - birth.getFullYear()) * 12 + now.getMonth() - birth.getMonth();
  if (months < 12) return `${Math.max(months, 0)} months old`;
  const years = Math.floor(months / 12);
  return `${years} ${years === 1 ? "year" : "years"} old`;
}

export function daysTogether(birthday: string, now = new Date()) {
  if (!birthday) return "0";
  const birth = new Date(`${birthday}T00:00`);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diff = today.getTime() - birth.getTime();
  const days = Math.max(0, Math.floor(diff / 86_400_000));
  return new Intl.NumberFormat("en").format(days);
}

export function taskTime(task: DailyTask) {
  if (task.time) return task.time;
  const title = task.title.toLowerCase();
  if (routineTimes[task.id]) return routineTimes[task.id];
  if (title.includes("breakfast") || title.includes("morning meal")) return "7:00 AM";
  if (title.includes("morning walk")) return "8:00 AM";
  if (title.includes("pill") || title.includes("med")) return "9:00 AM";
  if (title.includes("afternoon meal")) return "12:00 PM";
  if (title.includes("afternoon walk")) return "4:00 PM";
  if (title.includes("dinner") || title.includes("evening meal")) return "6:00 PM";
  if (title.includes("evening walk")) return "7:30 PM";
  return "Anytime";
}

export function withTaskTime(task: Omit<DailyTask, "time"> & { time?: string }): DailyTask {
  return { ...task, time: task.time || taskTime({ ...task, time: "" }) };
}

export function withReminderRecurrence(
  reminder: Omit<Reminder, "recurrence"> & { recurrence?: ReminderRecurrence },
): Reminder {
  return { ...reminder, recurrence: reminder.recurrence || "none" };
}

export function withCareSchedule(record: CareRecord): CareRecord {
  return {
    ...record,
    nextDueDate: record.nextDueDate || "",
    dose: record.dose || "",
    frequency: record.frequency || "",
    refillDate: record.refillDate || "",
    clinic: record.clinic || "",
    vetName: record.vetName || "",
    reason: record.reason || "",
    weightValue: record.weightValue || "",
    weightUnit: record.weightUnit || "",
  };
}

export function withCareEventSchedule(event: Omit<CareEvent, "recurrence"> & { recurrence?: ReminderRecurrence }): CareEvent {
  return {
    ...event,
    nextDueDate: event.nextDueDate || "",
    recurrence: event.recurrence || "none",
    dose: event.dose || "",
    frequency: event.frequency || "",
    refillDate: event.refillDate || "",
    clinic: event.clinic || "",
    vetName: event.vetName || "",
    reason: event.reason || "",
  };
}

export function updateTaskTime(tasks: DailyTask[], id: string, time: string) {
  return tasks.map((task) => (task.id === id ? { ...task, time } : task));
}

export function tasksForDate(tasks: DailyTask[], taskHistory: TaskHistory, date: string) {
  const day = taskHistory[date] || {};
  return tasks.map((task) => ({ ...task, done: Boolean(day[task.id]) }));
}

export function setTaskDoneForDate(taskHistory: TaskHistory, date: string, taskId: string, done: boolean): TaskHistory {
  return {
    ...taskHistory,
    [date]: {
      ...(taskHistory[date] || {}),
      [taskId]: done,
    },
  };
}

export function isSharedCareType(type: string): type is SharedCareType {
  return type === "Medication" || type === "Vaccine" || type === "Vet visit";
}

export function reminderTypeToCareType(type: string): SharedCareType | undefined {
  if (type === "Medication") return "Medication";
  if (type === "Vaccine") return "Vaccine";
  if (type === "Vet") return "Vet visit";
  return undefined;
}

export function careTypeToReminderType(type: SharedCareType) {
  return type === "Vet visit" ? "Vet" : type;
}

function careEventKey(event: CareEvent) {
  return `${event.type}|${event.title.trim().toLowerCase()}|${event.date}`;
}

export function careRecordToEvent(record: CareRecord): CareEvent {
  const type = isSharedCareType(record.type) ? record.type : "Medication";
  return {
    id: record.id,
    type,
    title: record.title,
    date: record.date,
    time: "",
    note: record.note,
    nextDueDate: record.nextDueDate || "",
    recurrence: "none",
    dose: record.dose || "",
    frequency: record.frequency || "",
    refillDate: record.refillDate || "",
    clinic: record.clinic || "",
    vetName: record.vetName || "",
    reason: record.reason || "",
  };
}

export function reminderToCareEvent(reminder: Reminder): CareEvent | undefined {
  const type = reminderTypeToCareType(reminder.type);
  if (!type) return undefined;
  return {
    id: reminder.id,
    type,
    title: reminder.title,
    date: reminder.date,
    time: reminder.time,
    note: reminder.note,
    nextDueDate: "",
    recurrence: reminder.recurrence || "none",
  };
}

export function careEventToCareRecord(event: CareEvent): CareRecord {
  return {
    id: event.id,
    type: event.type,
    title: event.title,
    date: event.date,
    note: event.note,
    nextDueDate: event.nextDueDate || "",
    dose: event.dose || "",
    frequency: event.frequency || "",
    refillDate: event.refillDate || "",
    clinic: event.clinic || "",
    vetName: event.vetName || "",
    reason: event.reason || "",
  };
}

export function careEventToReminder(event: CareEvent): Reminder {
  return {
    id: event.id,
    title: event.title,
    type: careTypeToReminderType(event.type),
    date: event.date,
    time: event.time,
    note: event.note,
    recurrence: event.recurrence || "none",
  };
}

function mergeCareEvent(events: CareEvent[], event: CareEvent) {
  const normalized = withCareEventSchedule(event);
  const existingIndex = events.findIndex(
    (item) => item.id === normalized.id || careEventKey(item) === careEventKey(normalized),
  );
  if (existingIndex === -1) return [...events, normalized];

  return events.map((item, index) =>
    index === existingIndex
      ? {
          ...item,
          ...normalized,
          id: item.id,
          time: normalized.time || item.time,
          note: normalized.note || item.note,
          nextDueDate: normalized.nextDueDate || item.nextDueDate || "",
          recurrence: normalized.recurrence !== "none" ? normalized.recurrence : item.recurrence,
        }
      : item,
  );
}

function upsertById<T extends { id: string }>(items: T[], item: T) {
  return items.some((current) => current.id === item.id)
    ? items.map((current) => (current.id === item.id ? item : current))
    : [item, ...items];
}

export function normalizeState(state: Partial<PawfolioState> | null | undefined): PawfolioState {
  const base = {
    ...initialState,
    ...(state || {}),
  };
  const normalizedCare = (base.care || []).map(withCareSchedule);
  const normalizedReminders = (base.reminders || []).map(withReminderRecurrence);
  let careEvents = (base.careEvents || []).map(withCareEventSchedule);

  normalizedCare.filter((record) => isSharedCareType(record.type)).forEach((record) => {
    careEvents = mergeCareEvent(careEvents, careRecordToEvent(record));
  });

  normalizedReminders.forEach((reminder) => {
    const event = reminderToCareEvent(reminder);
    if (event) careEvents = mergeCareEvent(careEvents, event);
  });

  return {
    ...base,
    profile: base.profile
      ? { ...base.profile, personalityTags: base.profile.personalityTags?.length ? base.profile.personalityTags : ["Playful", "Energetic", "Food-motivated"] }
      : undefined,
    tasks: (base.tasks?.length ? base.tasks : defaultTasks).map(withTaskTime).map((task) => ({ ...task, done: false })),
    taskHistory: base.taskHistory || legacyTaskHistory(base.tasks || []),
    diary: base.diary || [],
    care: normalizedCare.filter((record) => !isSharedCareType(record.type)),
    careEvents,
    reminders: normalizedReminders.filter((reminder) => !reminderTypeToCareType(reminder.type)),
    notificationPreferences: {
      ...initialState.notificationPreferences,
      ...(base.notificationPreferences || {}),
    },
    integrationSettings: {
      ...initialState.integrationSettings,
      ...(base.integrationSettings || {}),
    },
    googleCalendarSyncState: {
      ...initialState.googleCalendarSyncState,
      ...(base.googleCalendarSyncState || {}),
    },
    routineCoachSettings: {
      ...initialState.routineCoachSettings,
      ...(base.routineCoachSettings || {}),
    },
  };
}

function legacyTaskHistory(tasks: DailyTask[]) {
  const doneTasks = tasks.filter((task) => task.done);
  if (doneTasks.length === 0) return {};
  return {
    [todayISO()]: Object.fromEntries(doneTasks.map((task) => [task.id, true])),
  };
}

export function visibleCareRecords(state: Pick<PawfolioState, "care" | "careEvents">) {
  return [...state.care, ...state.careEvents.map(careEventToCareRecord)];
}

export function visibleReminders(state: Pick<PawfolioState, "reminders" | "careEvents">) {
  return [...state.reminders, ...state.careEvents.map(careEventToReminder)];
}

export function saveCareRecordToState(state: PawfolioState, record: CareRecord): PawfolioState {
  if (isSharedCareType(record.type)) {
    return {
      ...state,
      care: state.care.filter((item) => item.id !== record.id),
      careEvents: mergeCareEvent(state.careEvents, careRecordToEvent(record)),
    };
  }

  return {
    ...state,
    care: upsertById(state.care, withCareSchedule(record)),
    careEvents: state.careEvents.filter((item) => item.id !== record.id),
  };
}

export function saveReminderToState(state: PawfolioState, reminder: Reminder): PawfolioState {
  const event = reminderToCareEvent(reminder);
  if (event) {
    return {
      ...state,
      reminders: state.reminders.filter((item) => item.id !== reminder.id),
      careEvents: mergeCareEvent(state.careEvents, event),
    };
  }

  return {
    ...state,
    reminders: upsertById(state.reminders, withReminderRecurrence(reminder)),
    careEvents: state.careEvents.filter((item) => item.id !== reminder.id),
  };
}

export function deleteCareItemFromState(state: PawfolioState, id: string): PawfolioState {
  return {
    ...state,
    care: state.care.filter((record) => record.id !== id),
    careEvents: state.careEvents.filter((event) => event.id !== id),
  };
}

export function deleteCalendarItemFromState(state: PawfolioState, id: string): PawfolioState {
  return {
    ...state,
    reminders: state.reminders.filter((reminder) => reminder.id !== id),
    careEvents: state.careEvents.filter((event) => event.id !== id),
  };
}

export function estimateDataUrlBytes(dataUrl: string) {
  const encoded = dataUrl.split(",")[1] || "";
  return Math.ceil((encoded.length * 3) / 4);
}

export function safeSetLocalStorage(
  storage: Pick<Storage, "setItem">,
  key: string,
  value: unknown,
): { ok: true } | { ok: false; message: string } {
  try {
    storage.setItem(key, JSON.stringify(value));
    return { ok: true };
  } catch {
    return {
      ok: false,
      message: "Pawfolio could not save the latest change. Try a smaller photo or export your data before adding more photos.",
    };
  }
}

export function getCareMoments(tasks: DailyTask[]) {
  return [
    { label: "Fed", active: tasks.some((task) => /breakfast|dinner|meal|food/i.test(task.title) && task.done) },
    { label: "Walked", active: tasks.some((task) => /walk/i.test(task.title) && task.done) },
    { label: "Medicated", active: tasks.some((task) => /pill|med|medicine/i.test(task.title) && task.done) },
  ];
}

export function isFutureOrToday(date: string, now = new Date()) {
  if (!date) return false;
  const eventDate = new Date(`${date}T00:00`);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return eventDate.getTime() >= today.getTime();
}

function toLocalISO(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function addRecurrence(date: Date, recurrence: ReminderRecurrence) {
  const next = new Date(date);
  if (recurrence === "daily") next.setDate(next.getDate() + 1);
  if (recurrence === "weekly") next.setDate(next.getDate() + 7);
  if (recurrence === "monthly") next.setMonth(next.getMonth() + 1);
  if (recurrence === "yearly") next.setFullYear(next.getFullYear() + 1);
  return next;
}

export function nextOccurrenceDate(reminder: Pick<Reminder, "date" | "recurrence">, now = new Date()) {
  if (!reminder.date) return "";
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let occurrence = new Date(`${reminder.date}T00:00`);
  if (reminder.recurrence === "none") return toLocalISO(occurrence);

  let guard = 0;
  while (occurrence.getTime() < today.getTime() && guard < 1000) {
    occurrence = addRecurrence(occurrence, reminder.recurrence);
    guard += 1;
  }
  return toLocalISO(occurrence);
}

export function withNextOccurrence(reminder: Reminder, now = new Date()): Reminder {
  const occurrenceDate = nextOccurrenceDate(reminder, now);
  return occurrenceDate ? { ...reminder, date: occurrenceDate } : reminder;
}

export function getUpcomingReminders(reminders: Reminder[], now = new Date()) {
  return reminders
    .map((reminder) => withNextOccurrence(reminder, now))
    .filter((reminder) => isFutureOrToday(reminder.date, now))
    .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
}

export function getUpcomingReminder(reminders: Reminder[], now = new Date()) {
  return getUpcomingReminders(reminders, now)[0];
}

export function notificationPermissionStatus(notificationApi?: { permission?: NotificationPermission }): PawfolioNotificationStatus {
  if (!notificationApi) return "unsupported";
  return notificationApi.permission || "default";
}

export function canUseBrowserNotifications(notificationApi?: { permission?: NotificationPermission }) {
  return notificationPermissionStatus(notificationApi) !== "unsupported";
}

export function validateCareRecord(record: Partial<CareRecord>) {
  const errors: Partial<Record<keyof CareRecord, string>> = {};
  if (!record.date) errors.date = "Choose a date.";

  if (record.type === "Medication") {
    if (!record.title?.trim()) errors.title = "Add the medication name.";
    if (!record.dose?.trim()) errors.dose = "Add the dose.";
    if (!record.frequency?.trim()) errors.frequency = "Add how often it is given.";
  } else if (record.type === "Vaccine") {
    if (!record.title?.trim()) errors.title = "Add the vaccine name.";
  } else if (record.type === "Vet visit") {
    if (!record.title?.trim() && !record.reason?.trim()) errors.title = "Add a visit title or reason.";
    if (!record.clinic?.trim()) errors.clinic = "Add the clinic name.";
  } else if (record.type === "Weight") {
    if (!record.weightValue?.trim()) errors.weightValue = "Add a weight.";
  } else if (!record.title?.trim()) {
    errors.title = "Add a title.";
  }

  return errors;
}

export function careEmptyState(tab: string) {
  const states: Record<string, { title: string; text: string }> = {
    Meds: {
      title: "No medications yet",
      text: "Add doses, frequency, and refill or next-dose dates so medicine stays easy to track.",
    },
    Vaccines: {
      title: "No vaccines yet",
      text: "Save vaccine dates and next due dates so future boosters are easier to remember.",
    },
    "Vet visits": {
      title: "No vet visits yet",
      text: "Track clinic, vet, reason, notes, and follow-up dates in one place.",
    },
    Weight: {
      title: "No weight records yet",
      text: "Add weights over time to see a simple trend for your dog.",
    },
  };
  return states[tab] || { title: `No ${tab.toLowerCase()} yet`, text: "Tap Add to save a care record." };
}

export function weightTrendSeries(records: CareRecord[]) {
  return records
    .filter((record) => record.type === "Weight")
    .map((record) => ({
      date: record.date,
      value: Number.parseFloat(record.weightValue || record.title),
      unit: record.weightUnit || "lb",
    }))
    .filter((point) => Number.isFinite(point.value))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function medicationConsistency(records: CareRecord[], now = new Date()) {
  const meds = records.filter((record) => record.type === "Medication");
  const last30 = meds.filter((record) => {
    const date = new Date(`${record.date}T00:00`);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const age = today.getTime() - date.getTime();
    return age >= 0 && age <= 30 * 86_400_000;
  });
  return {
    total: meds.length,
    last30Days: last30.length,
    withDose: meds.filter((record) => Boolean(record.dose)).length,
    withFrequency: meds.filter((record) => Boolean(record.frequency)).length,
  };
}

export function buildGoogleCalendarEvent(reminder: Reminder, petName = "Pawfolio") {
  return {
    summary: `${petName}: ${reminder.title}`,
    description: [reminder.type, reminder.note].filter(Boolean).join(" - "),
    start: reminder.time
      ? { dateTime: `${reminder.date}T${reminder.time}:00` }
      : { date: reminder.date },
    end: reminder.time
      ? { dateTime: `${reminder.date}T${reminder.time}:00` }
      : { date: reminder.date },
    recurrence: reminder.recurrence === "none" ? [] : [`RRULE:FREQ=${reminder.recurrence.toUpperCase()}`],
  };
}

export function routineCoachInsights(tasks: DailyTask[], taskHistory: TaskHistory, reminders: Reminder[], records: CareRecord[]) {
  const dates = Object.keys(taskHistory).sort();
  const insights: string[] = [];
  const recentDates = dates.slice(-7);
  const walkTasks = tasks.filter((task) => /walk/i.test(task.title));
  const missedWalks = recentDates.filter((date) => walkTasks.some((task) => !taskHistory[date]?.[task.id])).length;
  if (walkTasks.length && recentDates.length >= 3 && missedWalks >= 2) {
    insights.push("Walks have been missed a few times lately. Want to move one to an easier time?");
  }
  const medSummary = medicationConsistency(records);
  if (medSummary.total > 0 && medSummary.withDose < medSummary.total) {
    insights.push("Some medication records are missing dose details. Adding them will make reminders safer.");
  }
  if (getUpcomingReminders(reminders).length === 0) {
    insights.push("No upcoming reminders yet. A vet, vaccine, medication, or grooming reminder can keep the week calmer.");
  }
  if (insights.length === 0) {
    insights.push("Routine looks steady. Pawfolio will keep watching for helpful patterns.");
  }
  return insights;
}

export function eventCategory(type: string) {
  if (type === "Medication") return "medication";
  if (type === "Vaccine") return "vaccine";
  if (type === "Vet" || type === "Vet visit") return "vet";
  if (type === "Grooming") return "grooming";
  if (type === "Walk") return "walk";
  if (type === "Food") return "food";
  return "other";
}

export function eventCategoryColor(type: string) {
  if (type === "Medication") return "blue";
  if (type === "Vaccine" || type === "Vet" || type === "Vet visit") return "green";
  if (type === "Grooming") return "coral";
  if (type === "Walk") return "lavender";
  if (type === "Food") return "green";
  return "gray";
}

export function eventsForMonth(reminders: Reminder[], visibleMonth: Date) {
  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0);
  return reminders.flatMap((reminder) => {
    if (!reminder.date) return [];
    if (reminder.recurrence === "none") {
      const date = new Date(`${reminder.date}T00:00`);
      return date.getFullYear() === year && date.getMonth() === month ? [reminder] : [];
    }

    let occurrence = new Date(`${reminder.date}T00:00`);
    let guard = 0;
    while (occurrence.getTime() < monthStart.getTime() && guard < 1000) {
      occurrence = addRecurrence(occurrence, reminder.recurrence);
      guard += 1;
    }
    if (occurrence.getTime() > monthEnd.getTime()) return [];
    return [{ ...reminder, date: toLocalISO(occurrence) }];
  });
}

export function eventsForDate(reminders: Reminder[], date: string) {
  return reminders
    .flatMap((reminder) => {
      if (reminder.date === date) return [reminder];
      if (reminder.recurrence === "none" || !reminder.date) return [];
      const target = new Date(`${date}T00:00`);
      let occurrence = new Date(`${reminder.date}T00:00`);
      let guard = 0;
      while (occurrence.getTime() < target.getTime() && guard < 1000) {
        occurrence = addRecurrence(occurrence, reminder.recurrence);
        guard += 1;
      }
      return toLocalISO(occurrence) === date ? [{ ...reminder, date }] : [];
    })
    .sort((a, b) => `${a.time || "99:99"} ${a.title}`.localeCompare(`${b.time || "99:99"} ${b.title}`));
}

export function recurrenceLabel(recurrence: ReminderRecurrence) {
  return reminderRecurrenceOptions.find((option) => option.value === recurrence)?.label || "Does not repeat";
}

export function careStatus(record: CareRecord, now = new Date()) {
  if (record.nextDueDate) {
    const due = new Date(`${record.nextDueDate}T00:00`);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const daysUntilDue = Math.ceil((due.getTime() - today.getTime()) / 86_400_000);
    if (daysUntilDue < 0) return "Overdue";
    if (daysUntilDue <= 45) return "Due soon";
    return "OK";
  }
  const note = record.note.toLowerCase();
  if (note.includes("due") || note.includes("next")) return "Due soon";
  return "OK";
}

export function latestWeight(records: CareRecord[], profileWeight: string) {
  const weight = records
    .filter((record) => record.type === "Weight")
    .sort((a, b) => b.date.localeCompare(a.date))[0];
  if (weight?.weightValue) return `${weight.weightValue} ${weight.weightUnit || "lb"}`;
  return weight?.title || profileWeight || "Not set";
}

export function weightTrend(records: CareRecord[]) {
  const weights = records
    .filter((record) => record.type === "Weight")
    .map((record) => ({ ...record, numeric: Number.parseFloat(record.weightValue || record.title) }))
    .filter((record) => Number.isFinite(record.numeric))
    .sort((a, b) => b.date.localeCompare(a.date));
  if (weights.length < 2) return "No trend yet";
  const diff = weights[0].numeric - weights[1].numeric;
  if (Math.abs(diff) < 0.1) return "Stable";
  return diff > 0 ? `Up ${diff.toFixed(1)} ${weights[0].weightUnit || "lb"}` : `Down ${Math.abs(diff).toFixed(1)} ${weights[0].weightUnit || "lb"}`;
}
