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

export type PawfolioState = {
  profile?: DogProfile;
  tasks: DailyTask[];
  diary: DiaryEntry[];
  care: CareRecord[];
  careEvents: CareEvent[];
  reminders: Reminder[];
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
  diary: [],
  care: [],
  careEvents: [],
  reminders: [],
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
  fur: ["#fff7df", "#f7d08a", "#d9a066", "#6f4d38", "#1f2933", "#fbfbf5"],
  ears: ["floppy", "pointy", "round"],
  spot: ["none", "eye", "back", "freckles"],
  accessory: ["none", "bandana", "bow", "collar"],
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
  return { ...record, nextDueDate: record.nextDueDate || "" };
}

export function withCareEventSchedule(event: Omit<CareEvent, "recurrence"> & { recurrence?: ReminderRecurrence }): CareEvent {
  return { ...event, nextDueDate: event.nextDueDate || "", recurrence: event.recurrence || "none" };
}

export function updateTaskTime(tasks: DailyTask[], id: string, time: string) {
  return tasks.map((task) => (task.id === id ? { ...task, time } : task));
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
    tasks: (base.tasks?.length ? base.tasks : defaultTasks).map(withTaskTime),
    diary: base.diary || [],
    care: normalizedCare.filter((record) => !isSharedCareType(record.type)),
    careEvents,
    reminders: normalizedReminders.filter((reminder) => !reminderTypeToCareType(reminder.type)),
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

export function getUpcomingReminder(reminders: Reminder[]) {
  return [...reminders]
    .filter((reminder) => reminder.date)
    .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))[0];
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
  return records.find((record) => record.type === "Weight")?.title || profileWeight || "Not set";
}
