export type Tab = "today" | "diary" | "care" | "calendar" | "pawpal" | "profile";
export const bottomNavTabs = ["today", "diary", "care", "calendar", "profile"] as const satisfies Tab[];

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
  photos?: string[];
};

export type CareRecord = {
  id: string;
  type: string;
  title: string;
  date: string;
  note: string;
  nextDueDate?: string;
  notifyLeadMinutes?: number;
  dose?: string;
  doseAmount?: string;
  doseUnit?: MedicationDoseUnit;
  frequency?: string;
  frequencyType?: MedicationFrequencyType;
  frequencyInterval?: number;
  refillDate?: string;
  clinic?: string;
  vetName?: string;
  reason?: string;
  weightValue?: string;
  weightUnit?: string;
};

export type SharedCareType = "Medication" | "Vaccine" | "Vet visit";
export type ReminderRecurrence = "none" | "daily" | "weekly" | "monthly" | "yearly";
export type MedicationDoseUnit = "tablet" | "chew" | "capsule" | "mL" | "drops" | "scoop" | "other";
export type MedicationFrequencyType = "daily" | "weekly" | "monthly" | "yearly" | "as_needed";

export type CareEvent = {
  id: string;
  type: SharedCareType;
  title: string;
  date: string;
  time: string;
  note: string;
  nextDueDate?: string;
  recurrence: ReminderRecurrence;
  notifyLeadMinutes?: number;
  dose?: string;
  doseAmount?: string;
  doseUnit?: MedicationDoseUnit;
  frequency?: string;
  frequencyType?: MedicationFrequencyType;
  frequencyInterval?: number;
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
  notifyLeadMinutes?: number;
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
  missedRoutineNudges: boolean;
  missedRoutineGraceMinutes: number;
};

export type CoachLocationMode = "off" | "auto" | "manual";
export type CareRegion = "North America" | "Europe" | "Hot climate" | "Cold climate" | "Custom";

export type CoachSettings = {
  enabled: boolean;
  seasonalTips: boolean;
  locationMode: CoachLocationMode;
  careRegion: CareRegion;
};

export type CoachSuggestionAction =
  | { type: "add_task"; title: string; time: string }
  | { type: "open_today" }
  | { type: "open_care"; recordId?: string }
  | { type: "open_reminder" }
  | { type: "open_calendar" }
  | { type: "export_data" };

export type CoachSuggestion = {
  id: string;
  type: "care_gap" | "routine_pattern" | "seasonal" | "calendar" | "backup";
  priority: number;
  title: string;
  body: string;
  actionLabel: string;
  action: CoachSuggestionAction;
  dismissible: boolean;
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
  coachSettings: CoachSettings;
  coachDismissals: string[];
};

export const storageKey = "pawfolio-local-v1";
export const photoRefPrefix = "pawfolio-photo:";
export const maxDiaryPhotos = 6;
const anytimeSortMinutes = 24 * 60 + 1;

export const defaultTasks: DailyTask[] = [
  { id: "breakfast", title: "Morning meal", time: "07:00", done: false, note: "" },
  { id: "morning-walk", title: "Morning walk", time: "08:00", done: false, note: "" },
  { id: "heartgard-pill", title: "Heartgard pill", time: "09:00", done: false, note: "" },
  { id: "afternoon-meal", title: "Afternoon meal", time: "12:00", done: false, note: "" },
  { id: "afternoon-walk", title: "Afternoon walk", time: "16:00", done: false, note: "" },
  { id: "dinner", title: "Evening meal", time: "18:00", done: false, note: "" },
  { id: "evening-walk", title: "Evening walk", time: "19:30", done: false, note: "" },
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
    missedRoutineNudges: true,
    missedRoutineGraceMinutes: 30,
  },
  coachSettings: {
    enabled: true,
    seasonalTips: true,
    locationMode: "off",
    careRegion: "North America",
  },
  coachDismissals: [],
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
export const reminderTypes = ["Vet", "Vaccine", "Medication", "Grooming", "Walk", "Food", "Other"];
export const reminderRecurrenceOptions: { value: ReminderRecurrence; label: string }[] = [
  { value: "none", label: "Does not repeat" },
  { value: "daily", label: "Every day" },
  { value: "weekly", label: "Every week" },
  { value: "monthly", label: "Every month" },
  { value: "yearly", label: "Every year" },
];
export const reminderLeadOptions = [
  { value: 0, label: "At time" },
  { value: 15, label: "15 min before" },
  { value: 30, label: "30 min before" },
  { value: 60, label: "1 hour before" },
  { value: 720, label: "Same day" },
  { value: 1440, label: "1 day before" },
];
export const medicationDoseUnits: { value: MedicationDoseUnit; label: string }[] = [
  { value: "tablet", label: "Tablet" },
  { value: "chew", label: "Chew" },
  { value: "capsule", label: "Capsule" },
  { value: "mL", label: "mL" },
  { value: "drops", label: "Drops" },
  { value: "scoop", label: "Scoop" },
  { value: "other", label: "Other" },
];
export const medicationFrequencyOptions: { value: MedicationFrequencyType; label: string; noun: string }[] = [
  { value: "daily", label: "Daily", noun: "day" },
  { value: "weekly", label: "Weekly", noun: "week" },
  { value: "monthly", label: "Monthly", noun: "month" },
  { value: "yearly", label: "Yearly", noun: "year" },
  { value: "as_needed", label: "As needed", noun: "dose" },
];
export const taskHourOptions = Array.from({ length: 12 }, (_, index) => String(index + 1));
export const taskMinuteOptions = Array.from({ length: 12 }, (_, index) => String(index * 5).padStart(2, "0"));
export const taskMeridiemOptions = ["AM", "PM"] as const;

export const routineTimes: Record<string, string> = {
  "morning-walk": "08:00",
  breakfast: "07:00",
  "heartgard-pill": "09:00",
  "afternoon-meal": "12:00",
  "afternoon-walk": "16:00",
  "evening-walk": "19:30",
  dinner: "18:00",
  "night-walk": "21:30",
  training: "Anytime",
};

export function todayISO(now = new Date()) {
  return toLocalISO(now);
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

function inferredTaskTime(task: Pick<DailyTask, "id" | "title">) {
  const title = task.title.toLowerCase();
  if (routineTimes[task.id]) return routineTimes[task.id];
  if (title.includes("breakfast") || title.includes("morning meal")) return "07:00";
  if (title.includes("morning walk")) return "08:00";
  if (title.includes("pill") || title.includes("med")) return "09:00";
  if (title.includes("afternoon meal")) return "12:00";
  if (title.includes("afternoon walk")) return "16:00";
  if (title.includes("dinner") || title.includes("evening meal")) return "18:00";
  if (title.includes("evening walk")) return "19:30";
  return "Anytime";
}

export function parseTaskTimeMinutes(time = "") {
  const normalized = time.trim();
  if (!normalized || normalized.toLowerCase() === "anytime") return undefined;

  const twentyFourHour = normalized.match(/^(\d{1,2}):(\d{2})$/);
  if (twentyFourHour) {
    const hours = Number(twentyFourHour[1]);
    const minutes = Number(twentyFourHour[2]);
    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) return hours * 60 + minutes;
  }

  const twelveHour = normalized.match(/^(\d{1,2})(?::(\d{2}))?\s*([ap])\.?\s*m\.?$/i);
  if (!twelveHour) return undefined;
  let hours = Number(twelveHour[1]);
  const minutes = Number(twelveHour[2] || "0");
  if (hours < 1 || hours > 12 || minutes < 0 || minutes > 59) return undefined;
  const meridiem = twelveHour[3].toLowerCase();
  if (meridiem === "p" && hours < 12) hours += 12;
  if (meridiem === "a" && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

function minutesToInputValue(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

export function toTimeInputValue(time = "") {
  const minutes = parseTaskTimeMinutes(time);
  return typeof minutes === "number" ? minutesToInputValue(minutes) : "";
}

export function formatTaskTime(time = "") {
  const minutes = parseTaskTimeMinutes(time);
  if (typeof minutes !== "number") return time || "Anytime";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const hour12 = hours % 12 || 12;
  const meridiem = hours >= 12 ? "PM" : "AM";
  return `${hour12}:${String(mins).padStart(2, "0")} ${meridiem}`;
}

export function taskTimeParts(time = "") {
  const minutes = parseTaskTimeMinutes(time) ?? 8 * 60;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const roundedMinutes = Math.min(55, Math.round(mins / 5) * 5);
  return {
    hour: String(hours % 12 || 12),
    minute: String(roundedMinutes).padStart(2, "0"),
    meridiem: hours >= 12 ? "PM" : "AM",
  };
}

export function taskTimeFromParts(hour: string, minute: string, meridiem: string) {
  let hours = Number(hour);
  const mins = Number(minute);
  if (!Number.isFinite(hours) || hours < 1 || hours > 12) hours = 8;
  const safeMinutes = Number.isFinite(mins) && mins >= 0 && mins <= 59 ? mins : 0;
  if (meridiem === "PM" && hours < 12) hours += 12;
  if (meridiem === "AM" && hours === 12) hours = 0;
  return `${String(hours).padStart(2, "0")}:${String(safeMinutes).padStart(2, "0")}`;
}

export function taskTime(task: DailyTask) {
  const canonical = toTimeInputValue(task.time || inferredTaskTime(task));
  return canonical ? formatTaskTime(canonical) : "Anytime";
}

export function withTaskTime(task: Omit<DailyTask, "time"> & { time?: string }): DailyTask {
  return {
    ...task,
    time: toTimeInputValue(task.time || inferredTaskTime(task)) || "Anytime",
  };
}

export function compareTasksByTime(a: DailyTask, b: DailyTask) {
  const aMinutes = parseTaskTimeMinutes(a.time) ?? anytimeSortMinutes;
  const bMinutes = parseTaskTimeMinutes(b.time) ?? anytimeSortMinutes;
  if (aMinutes !== bMinutes) return aMinutes - bMinutes;
  return a.title.localeCompare(b.title);
}

export function sortTasksByTime(tasks: DailyTask[]) {
  return [...tasks].sort(compareTasksByTime);
}

export function withReminderRecurrence(
  reminder: Omit<Reminder, "recurrence"> & { recurrence?: ReminderRecurrence },
): Reminder {
  return { ...reminder, recurrence: reminder.recurrence || "none" };
}

export function defaultReminderLeadMinutes(type: string) {
  return type === "Medication" || type === "Food" || type === "Walk" ? 0 : 60;
}

export function withReminderNotification(
  reminder: Omit<Reminder, "recurrence"> & { recurrence?: ReminderRecurrence; notifyLeadMinutes?: number },
): Reminder {
  const recurrenceReminder = withReminderRecurrence(reminder);
  return {
    ...recurrenceReminder,
    notifyLeadMinutes:
      typeof recurrenceReminder.notifyLeadMinutes === "number"
        ? recurrenceReminder.notifyLeadMinutes
        : defaultReminderLeadMinutes(recurrenceReminder.type),
  };
}

export function diaryEntryPhotos(entry: Pick<DiaryEntry, "photo" | "photos">) {
  const photos = entry.photos?.filter(Boolean) || [];
  if (photos.length > 0) return photos.slice(0, maxDiaryPhotos);
  return entry.photo ? [entry.photo] : [];
}

export function withDiaryPhotos(entry: DiaryEntry): DiaryEntry {
  const photos = diaryEntryPhotos(entry);
  return {
    ...entry,
    photo: entry.photo || photos[0],
    photos,
  };
}

function diaryDateTime(date = "") {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return undefined;
  const value = new Date(`${date}T00:00`).getTime();
  return Number.isFinite(value) ? value : undefined;
}

export function compareDiaryEntriesByDate(a: DiaryEntry, b: DiaryEntry) {
  const aTime = diaryDateTime(a.date);
  const bTime = diaryDateTime(b.date);
  if (typeof aTime === "number" && typeof bTime === "number" && aTime !== bTime) return bTime - aTime;
  if (typeof aTime === "number" && typeof bTime !== "number") return -1;
  if (typeof aTime !== "number" && typeof bTime === "number") return 1;
  return (a.title || a.id).localeCompare(b.title || b.id);
}

export function sortDiaryEntries(entries: DiaryEntry[]) {
  return [...entries].sort(compareDiaryEntriesByDate);
}

export function limitDiaryPhotos(photos: string[]) {
  return photos.filter(Boolean).slice(0, maxDiaryPhotos);
}

export function withCareSchedule(record: CareRecord): CareRecord {
  const scheduled = {
    ...record,
    nextDueDate: record.nextDueDate || "",
    notifyLeadMinutes:
      typeof record.notifyLeadMinutes === "number"
        ? record.notifyLeadMinutes
        : isSharedCareType(record.type)
          ? defaultReminderLeadMinutes(careTypeToReminderType(record.type))
          : undefined,
    dose: record.dose || "",
    doseAmount: record.doseAmount || "",
    doseUnit: record.doseUnit,
    frequency: record.frequency || "",
    frequencyType: record.frequencyType,
    frequencyInterval: record.frequencyInterval,
    refillDate: record.refillDate || "",
    clinic: record.clinic || "",
    vetName: record.vetName || "",
    reason: record.reason || "",
    weightValue: record.weightValue || "",
    weightUnit: record.weightUnit || "",
  };
  return record.type === "Medication" ? normalizeMedicationFrequency(normalizeMedicationDose(scheduled)) : scheduled;
}

export function withCareEventSchedule(event: Omit<CareEvent, "recurrence"> & { recurrence?: ReminderRecurrence }): CareEvent {
  const scheduled = {
    ...event,
    nextDueDate: event.nextDueDate || "",
    recurrence: event.recurrence || "none",
    notifyLeadMinutes:
      typeof event.notifyLeadMinutes === "number"
        ? event.notifyLeadMinutes
        : defaultReminderLeadMinutes(careTypeToReminderType(event.type)),
    dose: event.dose || "",
    doseAmount: event.doseAmount || "",
    doseUnit: event.doseUnit,
    frequency: event.frequency || "",
    frequencyType: event.frequencyType,
    frequencyInterval: event.frequencyInterval,
    refillDate: event.refillDate || "",
    clinic: event.clinic || "",
    vetName: event.vetName || "",
    reason: event.reason || "",
  };
  return event.type === "Medication" ? normalizeMedicationFrequency(normalizeMedicationDose(scheduled)) : scheduled;
}

export function updateTaskTime(tasks: DailyTask[], id: string, time: string) {
  return sortTasksByTime(tasks.map((task) => (task.id === id ? withTaskTime({ ...task, time }) : task)));
}

export function tasksForDate(tasks: DailyTask[], taskHistory: TaskHistory, date: string) {
  const day = taskHistory[date] || {};
  return sortTasksByTime(tasks.map((task) => ({ ...task, done: Boolean(day[task.id]) })));
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

export function missedRoutineTasks(
  tasks: DailyTask[],
  taskHistory: TaskHistory,
  now = new Date(),
  graceMinutes = initialState.routineCoachSettings.missedRoutineGraceMinutes,
) {
  const date = todayISO(now);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  return tasksForDate(tasks, taskHistory, date).filter((task) => {
    if (task.done) return false;
    const taskMinutes = parseTaskTimeMinutes(task.time);
    if (typeof taskMinutes !== "number") return false;
    return currentMinutes >= taskMinutes + graceMinutes;
  });
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

export function parseMedicationRecurrence(text = ""): ReminderRecurrence {
  const normalized = text.trim().toLowerCase();
  if (!normalized) return "none";
  if (/\b(every day|daily|once a day|each day)\b/.test(normalized)) return "daily";
  if (/\b(every week|weekly|once a week|each week)\b/.test(normalized)) return "weekly";
  if (/\b(every month|monthly|once a month|each month)\b/.test(normalized)) return "monthly";
  if (/\b(every year|yearly|annually|annual|once a year|each year)\b/.test(normalized)) return "yearly";
  return "none";
}

function normalizeDoseUnit(unit = ""): MedicationDoseUnit | undefined {
  const normalized = unit.trim().toLowerCase();
  if (["tablet", "tablets", "tab", "tabs", "pill", "pills"].includes(normalized)) return "tablet";
  if (["chew", "chews"].includes(normalized)) return "chew";
  if (["capsule", "capsules", "cap", "caps"].includes(normalized)) return "capsule";
  if (["ml", "milliliter", "milliliters"].includes(normalized)) return "mL";
  if (["drop", "drops"].includes(normalized)) return "drops";
  if (["scoop", "scoops"].includes(normalized)) return "scoop";
  if (normalized === "other") return "other";
  return undefined;
}

function recurrenceToFrequencyType(recurrence: ReminderRecurrence): MedicationFrequencyType | undefined {
  if (recurrence === "daily" || recurrence === "weekly" || recurrence === "monthly" || recurrence === "yearly") return recurrence;
  return undefined;
}

export function formatMedicationDose(record: Pick<CareRecord, "dose" | "doseAmount" | "doseUnit">) {
  const amount = record.doseAmount?.trim();
  if (amount && record.doseUnit) return `${amount} ${record.doseUnit}`;
  return record.dose?.trim() || "";
}

export function normalizeMedicationDose<T extends Pick<CareRecord, "dose" | "doseAmount" | "doseUnit">>(record: T): T {
  if (record.doseAmount?.trim() && record.doseUnit) {
    return { ...record, dose: formatMedicationDose(record) };
  }

  const match = record.dose?.trim().match(/^(\d+(?:\.\d+)?)\s*([a-zA-Z]+)\b/);
  const doseUnit = match ? normalizeDoseUnit(match[2]) : undefined;
  if (!match || !doseUnit) return record;

  return {
    ...record,
    doseAmount: match[1],
    doseUnit,
    dose: `${match[1]} ${doseUnit}`,
  };
}

export function formatMedicationFrequency(
  record: Pick<CareRecord, "frequency" | "frequencyType" | "frequencyInterval">,
) {
  if (!record.frequencyType) return record.frequency?.trim() || "";
  if (record.frequencyType === "as_needed") return "As needed";

  const interval = Math.max(1, Math.floor(Number(record.frequencyInterval) || 1));
  const noun = medicationFrequencyOptions.find((option) => option.value === record.frequencyType)?.noun || "dose";
  if (interval === 1) return `Every ${noun}`;
  return `Every ${interval} ${noun}s`;
}

export function normalizeMedicationFrequency<
  T extends Pick<CareRecord, "frequency" | "frequencyType" | "frequencyInterval">,
>(record: T): T {
  if (record.frequencyType) {
    return {
      ...record,
      frequencyInterval: Math.max(1, Math.floor(Number(record.frequencyInterval) || 1)),
      frequency: formatMedicationFrequency(record),
    };
  }

  const normalized = record.frequency?.trim().toLowerCase() || "";
  const recurrence = parseMedicationRecurrence(normalized);
  const frequencyType = recurrenceToFrequencyType(recurrence);
  if (frequencyType) {
    return {
      ...record,
      frequencyType,
      frequencyInterval: 1,
      frequency: formatMedicationFrequency({ ...record, frequencyType, frequencyInterval: 1 }),
    };
  }
  if (/\b(as needed|as-needed|prn)\b/.test(normalized)) {
    return { ...record, frequencyType: "as_needed", frequencyInterval: 1, frequency: "As needed" };
  }

  return record;
}

export function medicationFrequencyToRecurrence(
  record: Pick<CareRecord, "frequency" | "frequencyType" | "frequencyInterval">,
): ReminderRecurrence {
  if (record.frequencyType === "daily" || record.frequencyType === "weekly" || record.frequencyType === "monthly" || record.frequencyType === "yearly") {
    return record.frequencyType;
  }
  if (record.frequencyType === "as_needed") return "none";
  return parseMedicationRecurrence(record.frequency);
}

function careEventKey(event: CareEvent) {
  return `${event.type}|${event.title.trim().toLowerCase()}|${event.date}`;
}

export function careRecordToEvent(record: CareRecord): CareEvent {
  const scheduled = withCareSchedule(record);
  const type = isSharedCareType(record.type) ? record.type : "Medication";
  const recurrence = record.type === "Medication" ? medicationFrequencyToRecurrence(scheduled) : "none";
  return {
    id: scheduled.id,
    type,
    title: scheduled.title,
    date: scheduled.date,
    time: "",
    note: scheduled.note,
    nextDueDate: scheduled.nextDueDate || "",
    recurrence,
    notifyLeadMinutes:
      typeof scheduled.notifyLeadMinutes === "number"
        ? scheduled.notifyLeadMinutes
        : defaultReminderLeadMinutes(careTypeToReminderType(type)),
    dose: scheduled.dose || "",
    doseAmount: scheduled.doseAmount || "",
    doseUnit: scheduled.doseUnit,
    frequency: scheduled.frequency || "",
    frequencyType: scheduled.frequencyType,
    frequencyInterval: scheduled.frequencyInterval,
    refillDate: scheduled.refillDate || "",
    clinic: scheduled.clinic || "",
    vetName: scheduled.vetName || "",
    reason: scheduled.reason || "",
  };
}

export function reminderToCareEvent(reminder: Reminder): CareEvent | undefined {
  const type = reminderTypeToCareType(reminder.type);
  if (!type) return undefined;
  const frequencyType = type === "Medication" ? recurrenceToFrequencyType(reminder.recurrence || "none") : undefined;
  return {
    id: reminder.id,
    type,
    title: reminder.title,
    date: reminder.date,
    time: reminder.time,
    note: reminder.note,
    recurrence: reminder.recurrence || "none",
    notifyLeadMinutes:
      typeof reminder.notifyLeadMinutes === "number"
        ? reminder.notifyLeadMinutes
        : defaultReminderLeadMinutes(reminder.type),
    frequencyType,
    frequencyInterval: frequencyType ? 1 : undefined,
    frequency: type === "Medication" && reminder.recurrence !== "none" ? formatMedicationFrequency({ frequencyType, frequencyInterval: 1 }) : "",
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
    notifyLeadMinutes:
      typeof event.notifyLeadMinutes === "number"
        ? event.notifyLeadMinutes
        : defaultReminderLeadMinutes(careTypeToReminderType(event.type)),
    dose: event.dose || "",
    doseAmount: event.doseAmount || "",
    doseUnit: event.doseUnit,
    frequency: event.frequency || "",
    frequencyType: event.frequencyType,
    frequencyInterval: event.frequencyInterval,
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
    notifyLeadMinutes:
      typeof event.notifyLeadMinutes === "number"
        ? event.notifyLeadMinutes
        : defaultReminderLeadMinutes(careTypeToReminderType(event.type)),
  };
}

function mergeCareEvent(events: CareEvent[], event: CareEvent) {
  const normalized = withCareEventSchedule(event);
  const existingIndex = events.findIndex(
    (item) => item.id === normalized.id || careEventKey(item) === careEventKey(normalized),
  );
  if (existingIndex === -1) return [...events, normalized];

  const optionalFields: (keyof CareEvent)[] = [
    "nextDueDate",
    "dose",
    "doseAmount",
    "doseUnit",
    "frequency",
    "frequencyType",
    "frequencyInterval",
    "refillDate",
    "clinic",
    "vetName",
    "reason",
    "notifyLeadMinutes",
  ];

  return events.map((item, index) =>
    index === existingIndex
      ? optionalFields.reduce<CareEvent>(
          (merged, field) =>
            Object.prototype.hasOwnProperty.call(event, field)
              ? { ...merged, [field]: normalized[field] }
              : merged,
          {
          ...item,
          id: item.id,
          type: normalized.type,
          title: normalized.title,
          date: normalized.date,
          time: normalized.time,
          note: normalized.id === item.id || normalized.note ? normalized.note : item.note,
          recurrence: normalized.recurrence,
          notifyLeadMinutes: normalized.notifyLeadMinutes,
        },
        )
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
  const legacyCoach = base.routineCoachSettings || initialState.routineCoachSettings;
  const coachSettings = {
    ...initialState.coachSettings,
    ...(base.coachSettings || {}),
    enabled: base.coachSettings?.enabled ?? legacyCoach.enabled,
  };
  const normalizedCare = (base.care || []).map(withCareSchedule);
  const normalizedReminders = (base.reminders || []).map(withReminderNotification);
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
    tasks: sortTasksByTime((base.tasks?.length ? base.tasks : defaultTasks).map(withTaskTime).map((task) => ({ ...task, done: false }))),
    taskHistory: base.taskHistory || legacyTaskHistory(base.tasks || []),
    diary: sortDiaryEntries((base.diary || []).map(withDiaryPhotos)),
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
      enabled: coachSettings.enabled,
    },
    coachSettings,
    coachDismissals: base.coachDismissals || [],
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
    reminders: upsertById(state.reminders, withReminderNotification(reminder)),
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

export function isStoredPhotoRef(photo?: string) {
  return Boolean(photo?.startsWith(photoRefPrefix));
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

export function toLocalISO(date: Date) {
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

export function notificationBody(reminder?: Pick<Reminder, "title" | "date">) {
  return reminder
    ? `${reminder.title} is coming up ${prettyDate(reminder.date)}.`
    : "Notifications are ready for Pawfolio.";
}

function parseReminderClock(time: string) {
  if (!time) return { hours: 9, minutes: 0 };
  const match = time.match(/^(\d{1,2}):(\d{2})$/);
  if (match) return { hours: Number(match[1]), minutes: Number(match[2]) };

  const friendly = time.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i);
  if (!friendly) return { hours: 9, minutes: 0 };
  let hours = Number(friendly[1]);
  const minutes = Number(friendly[2] || "0");
  const meridiem = friendly[3].toUpperCase();
  if (meridiem === "PM" && hours < 12) hours += 12;
  if (meridiem === "AM" && hours === 12) hours = 0;
  return { hours, minutes };
}

export function reminderAlertDate(reminder: Reminder) {
  const { hours, minutes } = parseReminderClock(reminder.time);
  const alertDate = new Date(`${reminder.date}T00:00`);
  alertDate.setHours(hours, minutes, 0, 0);
  const leadMinutes = reminder.notifyLeadMinutes ?? defaultReminderLeadMinutes(reminder.type);
  if (leadMinutes === 720) {
    const sameDay = new Date(alertDate);
    sameDay.setHours(9, 0, 0, 0);
    return sameDay.getTime() <= alertDate.getTime() ? sameDay : alertDate;
  }
  alertDate.setMinutes(alertDate.getMinutes() - leadMinutes);
  return alertDate;
}

export function notificationLeadLabel(reminder: Pick<Reminder, "notifyLeadMinutes" | "type">) {
  const minutes = reminder.notifyLeadMinutes ?? defaultReminderLeadMinutes(reminder.type);
  return reminderLeadOptions.find((option) => option.value === minutes)?.label || `${minutes} min before`;
}

export function getNotificationGroups(reminders: Reminder[], now = new Date()) {
  const upcoming = getUpcomingReminders(reminders, now);
  const soonLimit = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  return upcoming.reduce(
    (groups, reminder) => {
      const alertAt = reminderAlertDate(reminder);
      if (alertAt.getTime() <= now.getTime()) groups.dueNow.push(reminder);
      else if (alertAt.getTime() <= soonLimit.getTime()) groups.soon.push(reminder);
      else groups.upcoming.push(reminder);
      return groups;
    },
    { dueNow: [] as Reminder[], soon: [] as Reminder[], upcoming: [] as Reminder[] },
  );
}

export function validateCareRecord(record: Partial<CareRecord>) {
  const errors: Partial<Record<keyof CareRecord, string>> = {};
  if (!record.date) errors.date = "Choose a date.";

  if (record.type === "Medication") {
    if (!record.title?.trim()) errors.title = "Add the medication name.";
    if (!formatMedicationDose(record).trim()) errors.dose = "Add the dose.";
    if (!formatMedicationFrequency(record).trim()) errors.frequency = "Add how often it is given.";
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

export function getSeasonForDate(date = new Date(), region: CareRegion = "North America") {
  const month = date.getMonth();
  if (region === "Hot climate") return month >= 3 && month <= 9 ? "hot season" : "mild season";
  if (region === "Cold climate") return month >= 10 || month <= 2 ? "cold season" : "mild season";
  if (month >= 2 && month <= 4) return "spring";
  if (month >= 5 && month <= 7) return "summer";
  if (month >= 8 && month <= 10) return "fall";
  return "winter";
}

export function regionFromCoordinates(latitude: number, longitude: number): CareRegion {
  if (latitude >= 5 && latitude <= 83 && longitude >= -170 && longitude <= -50) return "North America";
  if (latitude >= 34 && latitude <= 72 && longitude >= -25 && longitude <= 45) return "Europe";
  if (Math.abs(latitude) <= 25) return "Hot climate";
  if (Math.abs(latitude) >= 55) return "Cold climate";
  return "Custom";
}

export function breedCareSignals(profile?: DogProfile) {
  const breed = profile?.breed?.toLowerCase() || "";
  const signals: { id: string; title: string; body: string }[] = [];
  if (/great pyrenees|pyrenees|husky|samoyed|newfoundland|bernese/.test(breed)) {
    signals.push({
      id: "heavy-coat-heat",
      title: "Warm-weather coat check",
      body: `${profile?.name || "Your dog"} has a heavier coat. On warm days, shade, water, and shorter midday outings can help.`,
    });
    signals.push({
      id: "heavy-coat-shedding",
      title: "Shedding-season brush",
      body: "A quick brushing routine can make heavy seasonal shedding easier to stay ahead of.",
    });
  }
  if (/retriever|labrador|golden/.test(breed)) {
    signals.push({
      id: "retriever-ear-check",
      title: "Ear check reminder",
      body: "Retriever ears can trap moisture after water or muddy adventures. A quick check can help you spot irritation early.",
    });
  }
  return signals;
}

export function regionalCareSignals(region: CareRegion, season: string) {
  const signals: { id: string; title: string; body: string }[] = [];
  if (region === "North America" && (season === "spring" || season === "summer" || season === "fall")) {
    signals.push({
      id: "north-america-tick-check",
      title: "Tick-season check",
      body: "Tick and flea pressure can rise in warmer months. A short evening check is a useful habit.",
    });
  }
  if ((region === "Hot climate" || season === "summer" || season === "hot season") && region !== "Cold climate") {
    signals.push({
      id: "warm-weather-hydration",
      title: "Heat and water check",
      body: "Warm weather is a good time to keep walks cooler and make water easy to reach.",
    });
  }
  if (region === "Cold climate" || season === "winter" || season === "cold season") {
    signals.push({
      id: "cold-weather-paws",
      title: "Paw check",
      body: "Cold, salt, or ice can be rough on paws. Add a quick post-walk paw check when weather is harsh.",
    });
  }
  return signals;
}

export function rankCoachSuggestions(suggestions: CoachSuggestion[]) {
  return [...suggestions].sort((a, b) => b.priority - a.priority || a.title.localeCompare(b.title));
}

export function buildCoachSuggestions(state: PawfolioState, now = new Date()) {
  const settings = state.coachSettings || initialState.coachSettings;
  if (!settings.enabled) return [];

  const records = visibleCareRecords(state);
  const reminders = visibleReminders(state);
  const dismissals = new Set(state.coachDismissals || []);
  const suggestions: CoachSuggestion[] = [];

  const urgentCare = records.find((record) => careStatus(record, now) !== "OK");
  if (urgentCare && !dismissals.has(`record-${urgentCare.id}`)) {
    suggestions.push({
      id: `care-status-${urgentCare.id}`,
      type: "care_gap",
      priority: careStatus(urgentCare, now) === "Overdue" ? 100 : 90,
      title: `${urgentCare.title} needs attention`,
      body: `${urgentCare.type} is marked ${careStatus(urgentCare, now).toLowerCase()}. Review the record or add the next step.`,
      actionLabel: "Review care",
      action: { type: "open_care", recordId: urgentCare.id },
      dismissible: true,
    });
  }

  const routineSettings = state.routineCoachSettings || initialState.routineCoachSettings;
  if (routineSettings.enabled && routineSettings.missedRoutineNudges) {
    missedRoutineTasks(
      state.tasks,
      state.taskHistory,
      now,
      routineSettings.missedRoutineGraceMinutes,
    ).slice(0, 2).forEach((task) => {
      const id = `missed-task-${todayISO(now)}-${task.id}`;
      if (dismissals.has(id)) return;
      suggestions.push({
        id,
        type: "routine_pattern",
        priority: /walk|pill|med|medicine/i.test(task.title) ? 92 : 78,
        title: `Did you forget ${task.title}?`,
        body: `${task.title} was scheduled for ${taskTime(task)} and is not marked done yet.`,
        actionLabel: "Review routine",
        action: { type: "open_today" },
        dismissible: true,
      });
    });
  }

  const incompleteMedication = records.find((record) => record.type === "Medication" && (!record.dose || !record.frequency));
  if (incompleteMedication && !dismissals.has(`record-${incompleteMedication.id}`)) {
    suggestions.push({
      id: `med-details-${incompleteMedication.id}`,
      type: "care_gap",
      priority: 88,
      title: "Medication details are missing",
      body: `${incompleteMedication.title} will be safer to track with dose and frequency filled in.`,
      actionLabel: "Review med",
      action: { type: "open_care", recordId: incompleteMedication.id },
      dismissible: true,
    });
  }

  const vaccineWithoutNext = records.find((record) => record.type === "Vaccine" && !record.nextDueDate);
  if (vaccineWithoutNext && !dismissals.has(`record-${vaccineWithoutNext.id}`)) {
    suggestions.push({
      id: `vaccine-next-${vaccineWithoutNext.id}`,
      type: "care_gap",
      priority: 82,
      title: "Add the next vaccine date",
      body: `${vaccineWithoutNext.title} does not have a next due date yet. Add it if your vet gave you one.`,
      actionLabel: "Review vaccine",
      action: { type: "open_care", recordId: vaccineWithoutNext.id },
      dismissible: true,
    });
  }

  const upcoming = getUpcomingReminders(reminders, now);
  if (upcoming.length === 0) {
    suggestions.push({
      id: "no-upcoming-reminders",
      type: "calendar",
      priority: 70,
      title: "No upcoming reminders",
      body: "A medication, vaccine, vet, grooming, or food reminder can keep the week calmer.",
      actionLabel: "Add reminder",
      action: { type: "open_reminder" },
      dismissible: true,
    });
  }

  const dates = Object.keys(state.taskHistory || {}).sort().slice(-7);
  const walkTasks = state.tasks.filter((task) => /walk/i.test(task.title));
  const missedWalkDays = dates.filter((date) => walkTasks.some((task) => !state.taskHistory[date]?.[task.id])).length;
  if (walkTasks.length && dates.length >= 3 && missedWalkDays >= 2) {
    suggestions.push({
      id: "routine-missed-walks",
      type: "routine_pattern",
      priority: 76,
      title: "Walks are slipping lately",
      body: "Evening or busy-day walks have been missed a few times. A time tweak might make the routine easier.",
      actionLabel: "Review routine",
      action: { type: "open_calendar" },
      dismissible: true,
    });
  }

  if (settings.seasonalTips) {
    const season = getSeasonForDate(now, settings.careRegion);
    breedCareSignals(state.profile).forEach((signal) => {
      if ((signal.id.includes("heat") && !["spring", "summer", "hot season"].includes(season)) || signal.id.includes("shedding") && !["spring", "fall"].includes(season)) return;
      suggestions.push({
        id: `breed-${signal.id}`,
        type: "seasonal",
        priority: 52,
        title: signal.title,
        body: signal.body,
        actionLabel: signal.id.includes("shedding") ? "Add brush task" : "Add reminder",
        action: signal.id.includes("shedding")
          ? { type: "add_task", title: "Brush coat", time: "18:30" }
          : { type: "open_reminder" },
        dismissible: true,
      });
    });

    if (settings.locationMode !== "off") {
      regionalCareSignals(settings.careRegion, season).forEach((signal) => {
        suggestions.push({
          id: `region-${signal.id}`,
          type: "seasonal",
          priority: signal.id.includes("tick") ? 64 : 50,
          title: signal.title,
          body: signal.body,
          actionLabel: signal.id.includes("tick") ? "Add tick check" : "Add task",
          action: {
            type: "add_task",
            title: signal.id.includes("tick") ? "Tick check" : signal.id.includes("paw") ? "Paw check" : "Water check",
            time: signal.id.includes("tick") ? "20:00" : "18:00",
          },
          dismissible: true,
        });
      });
    }
  }

  if ((state.diary.length > 0 || records.length > 0) && !dismissals.has("backup-local-data")) {
    suggestions.push({
      id: "backup-local-data",
      type: "backup",
      priority: 45,
      title: "Back up Pawfolio",
      body: "You have local photos or care data saved. Export a backup so this device is not the only copy.",
      actionLabel: "Export backup",
      action: { type: "export_data" },
      dismissible: true,
    });
  }

  return rankCoachSuggestions(suggestions).filter((suggestion) => !dismissals.has(suggestion.id));
}

export function buildTodayAttentionItems(state: PawfolioState, now = new Date()) {
  return buildCoachSuggestions(state, now).filter((suggestion) => suggestion.priority >= 70).slice(0, 3);
}

export function applyCoachSuggestion(state: PawfolioState, suggestionId: string, now = new Date()) {
  const suggestion = buildCoachSuggestions(state, now).find((item) => item.id === suggestionId);
  if (!suggestion) return state;
  let next = state;
  if (suggestion.action.type === "add_task") {
    const action = suggestion.action;
    const exists = next.tasks.some((task) => task.title.toLowerCase() === action.title.toLowerCase());
    if (!exists) {
      next = {
        ...next,
        tasks: sortTasksByTime([
          ...next.tasks,
          withTaskTime({
            id: `coach-${action.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
            title: action.title,
            time: action.time,
            done: false,
            note: "",
          }),
        ]),
      };
    }
  }
  return dismissCoachSuggestion(next, suggestion.id);
}

export function dismissCoachSuggestion(state: PawfolioState, suggestionId: string) {
  const suggestion = buildCoachSuggestions(state).find((item) => item.id === suggestionId);
  const relatedDismissal = suggestion?.action.type === "open_care" && suggestion.action.recordId ? `record-${suggestion.action.recordId}` : "";
  return {
    ...state,
    coachDismissals: [...new Set([...(state.coachDismissals || []), suggestionId, relatedDismissal].filter(Boolean))],
  };
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

export function collectPhotoRefs(state: Pick<PawfolioState, "profile" | "diary">) {
  const refs = new Set<string>();
  if (state.profile?.photo && isStoredPhotoRef(state.profile.photo)) refs.add(state.profile.photo);
  state.diary.forEach((entry) => {
    diaryEntryPhotos(entry).forEach((photo) => {
      if (isStoredPhotoRef(photo)) refs.add(photo);
    });
  });
  return [...refs];
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
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (record.nextDueDate) {
    const due = new Date(`${record.nextDueDate}T00:00`);
    const daysUntilDue = Math.ceil((due.getTime() - today.getTime()) / 86_400_000);
    if (daysUntilDue < 0) return "Overdue";
    if (daysUntilDue <= 45) return "Due soon";
    return "OK";
  }
  if ((record.type === "Vaccine" || record.type === "Vet visit") && record.date) {
    const scheduled = new Date(`${record.date}T00:00`);
    const daysUntilScheduled = Math.ceil((scheduled.getTime() - today.getTime()) / 86_400_000);
    if (daysUntilScheduled >= 0 && daysUntilScheduled <= 45) return "Due soon";
    if (daysUntilScheduled > 45) return "OK";
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
