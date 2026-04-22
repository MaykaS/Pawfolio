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
};

export type Reminder = {
  id: string;
  title: string;
  type: string;
  date: string;
  time: string;
  note: string;
};

export type PawfolioState = {
  profile?: DogProfile;
  tasks: DailyTask[];
  diary: DiaryEntry[];
  care: CareRecord[];
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

export function updateTaskTime(tasks: DailyTask[], id: string, time: string) {
  return tasks.map((task) => (task.id === id ? { ...task, time } : task));
}

export function normalizeState(state: Partial<PawfolioState> | null | undefined): PawfolioState {
  const base = {
    ...initialState,
    ...(state || {}),
  };

  return {
    ...base,
    tasks: (base.tasks?.length ? base.tasks : defaultTasks).map(withTaskTime),
    diary: base.diary || [],
    care: base.care || [],
    reminders: base.reminders || [],
  };
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

export function careStatus(record: CareRecord) {
  const note = record.note.toLowerCase();
  if (note.includes("due") || note.includes("next")) return "Due soon";
  return "OK";
}

export function latestWeight(records: CareRecord[], profileWeight: string) {
  return records.find((record) => record.type === "Weight")?.title || profileWeight || "Not set";
}
