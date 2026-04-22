import {
  Bell,
  Bone,
  CalendarDays,
  Camera,
  Check,
  HeartPulse,
  Home,
  ImagePlus,
  NotebookPen,
  PawPrint,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { ChangeEvent, useEffect, useMemo, useState } from "react";

type Tab = "today" | "diary" | "care" | "calendar" | "profile";

type DogAvatar = {
  fur: string;
  ears: string;
  spot: string;
  accessory: string;
};

type DogProfile = {
  name: string;
  breed: string;
  birthday: string;
  weight: string;
  personality: string;
  photo?: string;
  avatar: DogAvatar;
};

type DailyTask = {
  id: string;
  title: string;
  done: boolean;
  note: string;
};

type DiaryEntry = {
  id: string;
  title: string;
  body: string;
  date: string;
  photo?: string;
};

type CareRecord = {
  id: string;
  type: string;
  title: string;
  date: string;
  note: string;
};

type Reminder = {
  id: string;
  title: string;
  type: string;
  date: string;
  time: string;
  note: string;
};

type PawfolioState = {
  profile?: DogProfile;
  tasks: DailyTask[];
  diary: DiaryEntry[];
  care: CareRecord[];
  reminders: Reminder[];
};

type MemoryMode = { mode: "create" } | { mode: "edit"; entry: DiaryEntry };
type CareMode = { mode: "create" } | { mode: "edit"; record: CareRecord };
type ReminderMode = { mode: "create" } | { mode: "edit"; reminder: Reminder };

const storageKey = "pawfolio-local-v1";

const defaultTasks: DailyTask[] = [
  { id: "morning-walk", title: "Morning walk", done: false, note: "" },
  { id: "breakfast", title: "Breakfast", done: false, note: "" },
  { id: "evening-walk", title: "Evening walk", done: false, note: "" },
  { id: "dinner", title: "Dinner", done: false, note: "" },
  { id: "night-walk", title: "Night walk", done: false, note: "" },
  { id: "training", title: "Treats or training", done: false, note: "" },
];

const initialState: PawfolioState = {
  tasks: defaultTasks,
  diary: [],
  care: [],
  reminders: [],
};

const breedOptions = [
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

const avatarOptions = {
  fur: ["#fff7df", "#f7d08a", "#d9a066", "#6f4d38", "#1f2933", "#fbfbf5"],
  ears: ["floppy", "pointy", "round"],
  spot: ["none", "eye", "back", "freckles"],
  accessory: ["none", "bandana", "bow", "collar"],
};

const careTypes = ["Weight", "Medication", "Vaccine", "Vet visit", "Allergy", "Health note"];
const reminderTypes = ["Vet", "Medication", "Grooming", "Walk", "Food", "Other"];

function loadState(): PawfolioState {
  try {
    const stored = localStorage.getItem(storageKey);
    if (!stored) return initialState;
    return { ...initialState, ...JSON.parse(stored) };
  } catch {
    return initialState;
  }
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function uid(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function prettyDate(date: string) {
  if (!date) return "No date";
  return new Date(`${date}T00:00`).toLocaleDateString("en", {
    month: "short",
    day: "numeric",
  });
}

function ageLabel(birthday: string) {
  if (!birthday) return "Birthday not set";
  const birth = new Date(`${birthday}T00:00`);
  const now = new Date();
  const months =
    (now.getFullYear() - birth.getFullYear()) * 12 + now.getMonth() - birth.getMonth();
  if (months < 12) return `${Math.max(months, 0)} months old`;
  const years = Math.floor(months / 12);
  return `${years} ${years === 1 ? "year" : "years"} old`;
}

export default function App() {
  const [state, setState] = useState<PawfolioState>(() => loadState());
  const [tab, setTab] = useState<Tab>("today");
  const [memoryMode, setMemoryMode] = useState<MemoryMode | null>(null);
  const [careMode, setCareMode] = useState<CareMode | null>(null);
  const [reminderMode, setReminderMode] = useState<ReminderMode | null>(null);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(state));
  }, [state]);

  const completed = state.tasks.filter((task) => task.done).length;
  const progress = state.tasks.length ? completed / state.tasks.length : 0;

  const upcomingReminder = useMemo(() => {
    return [...state.reminders]
      .filter((reminder) => reminder.date)
      .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))[0];
  }, [state.reminders]);

  const saveProfile = (profile: DogProfile) => {
    setState((current) => ({ ...current, profile }));
    setTab("today");
  };

  if (!state.profile) {
    return (
      <main className="app-bg">
        <section className="phone-shell onboarding-shell">
          <Onboarding onSave={saveProfile} />
        </section>
      </main>
    );
  }

  return (
    <main className="app-bg">
      <section className="phone-shell">
        <AppTopbar profile={state.profile} progress={progress} />

        <div className="screen-scroll">
          {tab === "today" && (
            <TodayScreen
              profile={state.profile}
              tasks={state.tasks}
              completed={completed}
              progress={progress}
              upcomingReminder={upcomingReminder}
              onToggleTask={(id) =>
                setState((current) => ({
                  ...current,
                  tasks: current.tasks.map((task) =>
                    task.id === id ? { ...task, done: !task.done } : task,
                  ),
                }))
              }
              onTaskNote={(id, note) =>
                setState((current) => ({
                  ...current,
                  tasks: current.tasks.map((task) =>
                    task.id === id ? { ...task, note } : task,
                  ),
                }))
              }
              onRenameTask={(id, title) =>
                setState((current) => ({
                  ...current,
                  tasks: current.tasks.map((task) =>
                    task.id === id ? { ...task, title } : task,
                  ),
                }))
              }
              onDeleteTask={(id) =>
                setState((current) => ({
                  ...current,
                  tasks: current.tasks.filter((task) => task.id !== id),
                }))
              }
              onAddTask={(title) =>
                setState((current) => ({
                  ...current,
                  tasks: [...current.tasks, { id: uid("task"), title, done: false, note: "" }],
                }))
              }
              onOpenMemory={() => setMemoryMode({ mode: "create" })}
              onOpenReminder={() => setReminderMode({ mode: "create" })}
            />
          )}
          {tab === "diary" && (
            <DiaryScreen
              entries={state.diary}
              onOpenMemory={() => setMemoryMode({ mode: "create" })}
              onEdit={(entry) => setMemoryMode({ mode: "edit", entry })}
              onDelete={(id) =>
                setState((current) => ({
                  ...current,
                  diary: current.diary.filter((entry) => entry.id !== id),
                }))
              }
            />
          )}
          {tab === "care" && (
            <CareScreen
              profile={state.profile}
              records={state.care}
              onOpenCare={() => setCareMode({ mode: "create" })}
              onEdit={(record) => setCareMode({ mode: "edit", record })}
              onDelete={(id) =>
                setState((current) => ({
                  ...current,
                  care: current.care.filter((record) => record.id !== id),
                }))
              }
            />
          )}
          {tab === "calendar" && (
            <CalendarScreen
              reminders={state.reminders}
              onOpenReminder={() => setReminderMode({ mode: "create" })}
              onEdit={(reminder) => setReminderMode({ mode: "edit", reminder })}
              onDelete={(id) =>
                setState((current) => ({
                  ...current,
                  reminders: current.reminders.filter((reminder) => reminder.id !== id),
                }))
              }
            />
          )}
          {tab === "profile" && (
            <ProfileScreen
              profile={state.profile}
              onSave={(profile) => setState((current) => ({ ...current, profile }))}
            />
          )}
        </div>

        <BottomNav active={tab} onChange={setTab} />
      </section>

      {memoryMode && (
        <MemoryModal
          mode={memoryMode}
          onClose={() => setMemoryMode(null)}
          onSave={(entry) => {
            setState((current) => ({
              ...current,
              diary:
                memoryMode.mode === "edit"
                  ? current.diary.map((item) => (item.id === entry.id ? entry : item))
                  : [entry, ...current.diary],
            }));
            setMemoryMode(null);
          }}
        />
      )}

      {reminderMode && (
        <ReminderModal
          mode={reminderMode}
          onClose={() => setReminderMode(null)}
          onSave={(reminder) => {
            setState((current) => ({
              ...current,
              reminders:
                reminderMode.mode === "edit"
                  ? current.reminders.map((item) =>
                      item.id === reminder.id ? reminder : item,
                    )
                  : [...current.reminders, reminder],
            }));
            setReminderMode(null);
          }}
        />
      )}

      {careMode && (
        <CareModal
          mode={careMode}
          onClose={() => setCareMode(null)}
          onSave={(record) => {
            setState((current) => ({
              ...current,
              care:
                careMode.mode === "edit"
                  ? current.care.map((item) => (item.id === record.id ? record : item))
                  : [record, ...current.care],
            }));
            setCareMode(null);
          }}
        />
      )}
    </main>
  );
}

function AppTopbar({ profile, progress }: { profile: DogProfile; progress: number }) {
  return (
    <header className="app-topbar">
      <div>
        <p className="micro-label">Pawfolio</p>
        <h1>{profile.name}</h1>
      </div>
      <div className="topbar-actions">
        <span className="care-score">{Math.round(progress * 100)}%</span>
        <AvatarBubble profile={profile} />
      </div>
    </header>
  );
}

function Onboarding({ onSave }: { onSave: (profile: DogProfile) => void }) {
  const [profile, setProfile] = useState<DogProfile>({
    name: "",
    breed: "",
    birthday: "",
    weight: "",
    personality: "",
    avatar: {
      fur: avatarOptions.fur[0],
      ears: "floppy",
      spot: "none",
      accessory: "bandana",
    },
  });

  const canSave = profile.name.trim() && profile.breed.trim();

  const update = (key: keyof DogProfile, value: string) => {
    setProfile((current) => ({ ...current, [key]: value }));
  };

  const updatePhoto = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const photo = await readFile(file);
    setProfile((current) => ({ ...current, photo }));
  };

  return (
    <div className="onboarding">
      <header className="setup-cover">
        <div className="setup-badge">
          <PawPrint size={20} />
        </div>
        <p className="micro-label">New companion</p>
        <h1>Create their Pawfolio</h1>
        <p>Start with the real profile. Everything stays saved in this browser.</p>
      </header>

      <section className="pet-id-card">
        <div className="profile-photo large">
          {profile.photo ? (
            <img src={profile.photo} alt="Dog profile preview" />
          ) : (
            <DogAvatar avatar={profile.avatar} />
          )}
        </div>
        <div>
          <p className="micro-label">Pet ID</p>
          <h2>{profile.name || "Your dog"}</h2>
          <p>{profile.breed || "Breed will appear here"}</p>
          <label className="photo-button">
            <Camera size={17} />
            Add photo
            <input type="file" accept="image/*" onChange={updatePhoto} />
          </label>
        </div>
      </section>

      <form
        className="form-grid"
        onSubmit={(event) => {
          event.preventDefault();
          if (canSave) onSave(profile);
        }}
      >
        <label>
          Dog name
          <input
            value={profile.name}
            onChange={(event) => update("name", event.target.value)}
            placeholder="Enter your dog's name"
          />
        </label>
        <label>
          Breed
          <input
            value={profile.breed}
            onChange={(event) => update("breed", event.target.value)}
            placeholder="Search or type breed"
            list="breeds"
          />
          <datalist id="breeds">
            {breedOptions.map((breed) => (
              <option key={breed} value={breed} />
            ))}
          </datalist>
        </label>
        <div className="two-col">
          <label>
            Birthday
            <input
              type="date"
              value={profile.birthday}
              onChange={(event) => update("birthday", event.target.value)}
            />
          </label>
          <label>
            Weight
            <input
              value={profile.weight}
              onChange={(event) => update("weight", event.target.value)}
              placeholder="72 lb"
            />
          </label>
        </div>
        <label>
          Personality notes
          <textarea
            value={profile.personality}
            onChange={(event) => update("personality", event.target.value)}
            placeholder="Gentle, goofy, brave, picky..."
          />
        </label>

        <AvatarBuilder
          avatar={profile.avatar}
          onChange={(avatar) => setProfile((current) => ({ ...current, avatar }))}
        />

        <button className="primary-button" disabled={!canSave}>
          Start Pawfolio
        </button>
      </form>
    </div>
  );
}

function TodayScreen({
  profile,
  tasks,
  completed,
  progress,
  upcomingReminder,
  onToggleTask,
  onTaskNote,
  onRenameTask,
  onDeleteTask,
  onAddTask,
  onOpenMemory,
  onOpenReminder,
}: {
  profile: DogProfile;
  tasks: DailyTask[];
  completed: number;
  progress: number;
  upcomingReminder?: Reminder;
  onToggleTask: (id: string) => void;
  onTaskNote: (id: string, note: string) => void;
  onRenameTask: (id: string, title: string) => void;
  onDeleteTask: (id: string) => void;
  onAddTask: (title: string) => void;
  onOpenMemory: () => void;
  onOpenReminder: () => void;
}) {
  const [newTask, setNewTask] = useState("");
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [taskTitle, setTaskTitle] = useState("");

  const careMoments = [
    { label: "Walk", active: tasks.some((task) => /walk/i.test(task.title) && task.done) },
    { label: "Food", active: tasks.some((task) => /breakfast|dinner|food/i.test(task.title) && task.done) },
    { label: "Play", active: tasks.some((task) => /treat|training|play/i.test(task.title) && task.done) },
    { label: "Rest", active: progress >= 1 },
  ];

  return (
    <div className="stack">
      <section className="daily-card">
        <div className="daily-copy">
          <p className="micro-label">Today</p>
          <h2>{profile.name}'s day</h2>
          <p>{completed} of {tasks.length} care moments done</p>
          <div className="progress-line">
            <span style={{ width: `${Math.round(progress * 100)}%` }} />
          </div>
        </div>
        <div className="daily-pet">
          {profile.photo ? <img src={profile.photo} alt={profile.name} /> : <DogAvatar avatar={profile.avatar} />}
        </div>
      </section>

      <section className="status-strip">
        {careMoments.map((moment) => (
          <div className={moment.active ? "status-chip active" : "status-chip"} key={moment.label}>
            <span />
            {moment.label}
          </div>
        ))}
      </section>

      <section className="quick-grid">
        <button type="button" onClick={onOpenMemory}>
          <ImagePlus size={18} />
          Memory
        </button>
        <button type="button" onClick={onOpenReminder}>
          <Bell size={18} />
          Reminder
        </button>
        <div className="mini-note">
          <span>Next</span>
          <strong>{upcomingReminder ? upcomingReminder.title : "No reminders"}</strong>
          <small>{upcomingReminder ? `${prettyDate(upcomingReminder.date)} ${upcomingReminder.time}` : "Add one when ready"}</small>
        </div>
      </section>

      <section className="panel">
        <SectionHeader eyebrow="Routine" title="Today's plan" />
        <div className="task-list compact">
          {tasks.map((task) => (
            <article className={`task-card ${task.done ? "done" : ""}`} key={task.id}>
              <button
                className="check-button"
                aria-label={`Toggle ${task.title}`}
                onClick={() => onToggleTask(task.id)}
                type="button"
              >
                {task.done && <Check size={16} />}
              </button>
              <div className="task-main">
                {editingTask === task.id ? (
                  <form
                    className="rename-row"
                    onSubmit={(event) => {
                      event.preventDefault();
                      if (taskTitle.trim()) onRenameTask(task.id, taskTitle.trim());
                      setEditingTask(null);
                    }}
                  >
                    <input value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} />
                    <button className="tiny-icon" type="submit" aria-label="Save task name">
                      <Check size={15} />
                    </button>
                  </form>
                ) : (
                  <div className="task-title-row">
                    <h3>{task.title}</h3>
                    <div className="row-actions">
                      <button
                        className="tiny-icon"
                        type="button"
                        aria-label={`Edit ${task.title}`}
                        onClick={() => {
                          setEditingTask(task.id);
                          setTaskTitle(task.title);
                        }}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        className="tiny-icon danger"
                        type="button"
                        aria-label={`Delete ${task.title}`}
                        onClick={() => onDeleteTask(task.id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                )}
                <input
                  value={task.note}
                  onChange={(event) => onTaskNote(task.id, event.target.value)}
                  placeholder="Small note"
                />
              </div>
            </article>
          ))}
        </div>

        <form
          className="inline-add"
          onSubmit={(event) => {
            event.preventDefault();
            if (!newTask.trim()) return;
            onAddTask(newTask.trim());
            setNewTask("");
          }}
        >
          <input value={newTask} onChange={(event) => setNewTask(event.target.value)} placeholder="Add custom task" />
          <button aria-label="Add task">
            <Plus size={18} />
          </button>
        </form>
      </section>
    </div>
  );
}

function DiaryScreen({
  entries,
  onOpenMemory,
  onEdit,
  onDelete,
}: {
  entries: DiaryEntry[];
  onOpenMemory: () => void;
  onEdit: (entry: DiaryEntry) => void;
  onDelete: (id: string) => void;
}) {
  const photoEntries = entries.filter((entry) => entry.photo).slice(0, 6);

  return (
    <div className="stack">
      <ScreenTitle
        icon={<NotebookPen size={19} />}
        title="Diary"
        text="Tiny moments, big memories."
        action="Add"
        onAction={onOpenMemory}
      />

      {photoEntries.length > 0 && (
        <section className="photo-grid">
          {photoEntries.map((entry) => (
            <button key={entry.id} type="button" onClick={() => onEdit(entry)}>
              <img src={entry.photo} alt={entry.title} />
            </button>
          ))}
        </section>
      )}

      {entries.length === 0 ? (
        <EmptyState title="No memories yet" text="Save a hike, sleepy morning, or funny training win." />
      ) : (
        <div className="card-list">
          {entries.map((entry) => (
            <article className="memory-card" key={entry.id}>
              {entry.photo && <img src={entry.photo} alt={entry.title} />}
              <div>
                <p className="micro-label">{prettyDate(entry.date)}</p>
                <h3>{entry.title}</h3>
                <p>{entry.body || "No journal note yet."}</p>
              </div>
              <CardActions onEdit={() => onEdit(entry)} onDelete={() => onDelete(entry.id)} />
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function CareScreen({
  profile,
  records,
  onOpenCare,
  onEdit,
  onDelete,
}: {
  profile: DogProfile;
  records: CareRecord[];
  onOpenCare: () => void;
  onEdit: (record: CareRecord) => void;
  onDelete: (id: string) => void;
}) {
  const latestWeight = records.find((record) => record.type === "Weight")?.title || profile.weight || "Not set";

  return (
    <div className="stack">
      <section className="health-card">
        <div>
          <p className="micro-label">Health book</p>
          <h2>{profile.name}'s care</h2>
          <p>{ageLabel(profile.birthday)}</p>
        </div>
        <button type="button" onClick={onOpenCare}>
          <Plus size={17} />
          Record
        </button>
      </section>

      <section className="care-grid">
        <StatCard label="Weight" value={latestWeight} />
        <StatCard label="Records" value={String(records.length)} />
        <StatCard label="Meds" value={String(records.filter((record) => record.type === "Medication").length)} />
        <StatCard label="Vaccines" value={String(records.filter((record) => record.type === "Vaccine").length)} />
      </section>

      <section className="chip-row">
        {careTypes.slice(0, 5).map((type) => (
          <span key={type}>{type}</span>
        ))}
      </section>

      {records.length === 0 ? (
        <EmptyState title="No care records yet" text="Start with a weight check, vaccine, medication, or vet note." />
      ) : (
        <div className="card-list">
          {records.map((record) => (
            <article className="record-card" key={record.id}>
              <div>
                <span>{record.type}</span>
                <h3>{record.title}</h3>
                <p>{prettyDate(record.date)} {record.note && `- ${record.note}`}</p>
              </div>
              <CardActions onEdit={() => onEdit(record)} onDelete={() => onDelete(record.id)} />
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function CalendarScreen({
  reminders,
  onOpenReminder,
  onEdit,
  onDelete,
}: {
  reminders: Reminder[];
  onOpenReminder: () => void;
  onEdit: (reminder: Reminder) => void;
  onDelete: (id: string) => void;
}) {
  const sorted = [...reminders].sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));

  return (
    <div className="stack">
      <ScreenTitle
        icon={<CalendarDays size={19} />}
        title="Plan"
        text="Appointments, refills, grooming, and care reminders."
        action="Add"
        onAction={onOpenReminder}
      />

      <section className="date-strip">
        {[0, 1, 2, 3, 4].map((offset) => {
          const date = new Date();
          date.setDate(date.getDate() + offset);
          return (
            <div className="date-chip" key={offset}>
              <span>{date.toLocaleDateString("en", { weekday: "short" })}</span>
              <strong>{date.getDate()}</strong>
            </div>
          );
        })}
      </section>

      {sorted.length === 0 ? (
        <EmptyState title="No reminders yet" text="Add a vet appointment, medication, food refill, or grooming task." />
      ) : (
        <div className="card-list">
          {sorted.map((reminder) => (
            <article className="reminder-card" key={reminder.id}>
              <div className="date-tile">
                <span>{new Date(`${reminder.date}T00:00`).toLocaleString("en", { month: "short" })}</span>
                <strong>{new Date(`${reminder.date}T00:00`).getDate()}</strong>
              </div>
              <div>
                <span>{reminder.type}</span>
                <h3>{reminder.title}</h3>
                <p>{reminder.time || "Any time"} {reminder.note && `- ${reminder.note}`}</p>
              </div>
              <CardActions onEdit={() => onEdit(reminder)} onDelete={() => onDelete(reminder.id)} />
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function ProfileScreen({ profile, onSave }: { profile: DogProfile; onSave: (profile: DogProfile) => void }) {
  const [draft, setDraft] = useState(profile);
  const [saved, setSaved] = useState(false);

  const updatePhoto = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const photo = await readFile(file);
    setDraft((current) => ({ ...current, photo }));
  };

  return (
    <form
      className="stack"
      onSubmit={(event) => {
        event.preventDefault();
        onSave(draft);
        setSaved(true);
        window.setTimeout(() => setSaved(false), 1600);
      }}
    >
      <section className="passport-card">
        <div className="profile-photo large">
          {draft.photo ? <img src={draft.photo} alt={draft.name} /> : <DogAvatar avatar={draft.avatar} />}
        </div>
        <div>
          <p className="micro-label">Pet passport</p>
          <h2>{draft.name}</h2>
          <p>{draft.breed} - {ageLabel(draft.birthday)}</p>
          <label className="photo-button">
            <Camera size={17} />
            Photo
            <input type="file" accept="image/*" onChange={updatePhoto} />
          </label>
        </div>
      </section>

      <section className="panel">
        <div className="form-grid">
          <label>
            Name
            <input value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} />
          </label>
          <label>
            Breed
            <input
              value={draft.breed}
              list="profile-breeds"
              onChange={(event) => setDraft((current) => ({ ...current, breed: event.target.value }))}
            />
            <datalist id="profile-breeds">
              {breedOptions.map((breed) => (
                <option key={breed} value={breed} />
              ))}
            </datalist>
          </label>
          <div className="two-col">
            <label>
              Birthday
              <input
                type="date"
                value={draft.birthday}
                onChange={(event) => setDraft((current) => ({ ...current, birthday: event.target.value }))}
              />
            </label>
            <label>
              Weight
              <input value={draft.weight} onChange={(event) => setDraft((current) => ({ ...current, weight: event.target.value }))} />
            </label>
          </div>
          <label>
            Personality
            <textarea value={draft.personality} onChange={(event) => setDraft((current) => ({ ...current, personality: event.target.value }))} />
          </label>
        </div>
        <AvatarBuilder avatar={draft.avatar} onChange={(avatar) => setDraft((current) => ({ ...current, avatar }))} />
        <button className="primary-button">{saved ? "Saved" : "Save profile"}</button>
      </section>
    </form>
  );
}

function AvatarBuilder({ avatar, onChange }: { avatar: DogAvatar; onChange: (avatar: DogAvatar) => void }) {
  return (
    <section className="avatar-builder">
      <SectionHeader eyebrow="Avatar studio" title="App character" icon={<Sparkles size={19} />} />
      <div className="avatar-studio">
        <DogAvatar avatar={avatar} />
        <div className="avatar-controls">
          <div>
            <span>Fur</span>
            <div className="swatches">
              {avatarOptions.fur.map((color) => (
                <button
                  key={color}
                  aria-label={`Choose fur ${color}`}
                  className={avatar.fur === color ? "selected" : ""}
                  style={{ background: color }}
                  type="button"
                  onClick={() => onChange({ ...avatar, fur: color })}
                />
              ))}
            </div>
          </div>
          <AvatarSelect label="Ears" value={avatar.ears} options={avatarOptions.ears} onChange={(ears) => onChange({ ...avatar, ears })} />
          <AvatarSelect label="Marking" value={avatar.spot} options={avatarOptions.spot} onChange={(spot) => onChange({ ...avatar, spot })} />
          <AvatarSelect label="Style" value={avatar.accessory} options={avatarOptions.accessory} onChange={(accessory) => onChange({ ...avatar, accessory })} />
        </div>
      </div>
    </section>
  );
}

function AvatarSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="select-label">
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function DogAvatar({ avatar, small = false }: { avatar: DogAvatar; small?: boolean }) {
  return (
    <div
      className={`dog-avatar ${small ? "small" : ""} ears-${avatar.ears} spot-${avatar.spot} accessory-${avatar.accessory}`}
      style={{ "--fur": avatar.fur } as React.CSSProperties}
    >
      <span className="ear left" />
      <span className="ear right" />
      <span className="head">
        <span className="spot" />
        <span className="eye left" />
        <span className="eye right" />
        <span className="snout">
          <span className="nose" />
        </span>
        <span className="freckles" />
      </span>
      <span className="body" />
      <span className="accessory" />
    </div>
  );
}

function AvatarBubble({ profile }: { profile: DogProfile }) {
  return (
    <div className="avatar-bubble">
      {profile.photo ? <img src={profile.photo} alt={profile.name} /> : <DogAvatar avatar={profile.avatar} small />}
    </div>
  );
}

function ScreenTitle({
  icon,
  title,
  text,
  action,
  onAction,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  action: string;
  onAction: () => void;
}) {
  return (
    <section className="screen-title">
      <div className="title-icon">{icon}</div>
      <div>
        <h2>{title}</h2>
        <p>{text}</p>
      </div>
      <button onClick={onAction} type="button">
        <Plus size={16} />
        {action}
      </button>
    </section>
  );
}

function SectionHeader({ eyebrow, title, icon }: { eyebrow: string; title: string; icon?: React.ReactNode }) {
  return (
    <div className="section-heading">
      <div>
        <p className="micro-label">{eyebrow}</p>
        <h2>{title}</h2>
      </div>
      {icon}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function CardActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="card-actions">
      <button type="button" aria-label="Edit" onClick={onEdit}>
        <Pencil size={14} />
      </button>
      <button type="button" aria-label="Delete" onClick={onDelete}>
        <Trash2 size={14} />
      </button>
    </div>
  );
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <section className="empty-state">
      <Bone size={30} />
      <h3>{title}</h3>
      <p>{text}</p>
    </section>
  );
}

function BottomNav({ active, onChange }: { active: Tab; onChange: (tab: Tab) => void }) {
  const items: { tab: Tab; label: string; icon: React.ReactNode }[] = [
    { tab: "today", label: "Today", icon: <Home size={19} /> },
    { tab: "diary", label: "Diary", icon: <NotebookPen size={19} /> },
    { tab: "care", label: "Care", icon: <HeartPulse size={19} /> },
    { tab: "calendar", label: "Plan", icon: <CalendarDays size={19} /> },
    { tab: "profile", label: "Profile", icon: <UserRound size={19} /> },
  ];

  return (
    <nav className="bottom-nav">
      {items.map((item) => (
        <button className={active === item.tab ? "active" : ""} key={item.tab} onClick={() => onChange(item.tab)} type="button">
          {item.icon}
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}

function MemoryModal({
  mode,
  onClose,
  onSave,
}: {
  mode: MemoryMode;
  onClose: () => void;
  onSave: (entry: DiaryEntry) => void;
}) {
  const existing = mode.mode === "edit" ? mode.entry : undefined;
  const [title, setTitle] = useState(existing?.title || "");
  const [body, setBody] = useState(existing?.body || "");
  const [date, setDate] = useState(existing?.date || todayISO());
  const [photo, setPhoto] = useState<string | undefined>(existing?.photo);

  const updatePhoto = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setPhoto(await readFile(file));
  };

  return (
    <Modal title={mode.mode === "edit" ? "Edit memory" : "Add memory"} onClose={onClose}>
      <form
        className="form-grid"
        onSubmit={(event) => {
          event.preventDefault();
          onSave({ id: existing?.id || uid("memory"), title, body, date, photo });
        }}
      >
        <label>
          Photo
          <span className="upload-strip">
            <Camera size={17} />
            {photo ? "Photo ready" : "Choose photo"}
            <input type="file" accept="image/*" onChange={updatePhoto} />
          </span>
        </label>
        <label>
          Caption
          <input value={title} onChange={(event) => setTitle(event.target.value)} required />
        </label>
        <label>
          Date
          <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        </label>
        <label>
          Journal note
          <textarea value={body} onChange={(event) => setBody(event.target.value)} />
        </label>
        <button className="primary-button">{mode.mode === "edit" ? "Save changes" : "Save memory"}</button>
      </form>
    </Modal>
  );
}

function ReminderModal({
  mode,
  onClose,
  onSave,
}: {
  mode: ReminderMode;
  onClose: () => void;
  onSave: (reminder: Reminder) => void;
}) {
  return (
    <Modal title={mode.mode === "edit" ? "Edit reminder" : "Add reminder"} onClose={onClose}>
      <ReminderForm mode={mode} onSave={onSave} />
    </Modal>
  );
}

function ReminderForm({ mode, onSave }: { mode: ReminderMode; onSave: (reminder: Reminder) => void }) {
  const existing = mode.mode === "edit" ? mode.reminder : undefined;
  const [reminder, setReminder] = useState({
    title: existing?.title || "",
    type: existing?.type || "Vet",
    date: existing?.date || todayISO(),
    time: existing?.time || "",
    note: existing?.note || "",
  });

  const update = (key: keyof typeof reminder, value: string) => {
    setReminder((current) => ({ ...current, [key]: value }));
  };

  return (
    <form
      className="form-grid"
      onSubmit={(event) => {
        event.preventDefault();
        onSave({ id: existing?.id || uid("reminder"), ...reminder });
      }}
    >
      <label>
        Title
        <input value={reminder.title} onChange={(event) => update("title", event.target.value)} required />
      </label>
      <div className="two-col">
        <label>
          Type
          <select value={reminder.type} onChange={(event) => update("type", event.target.value)}>
            {reminderTypes.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
        </label>
        <label>
          Time
          <input type="time" value={reminder.time} onChange={(event) => update("time", event.target.value)} />
        </label>
      </div>
      <label>
        Date
        <input type="date" value={reminder.date} onChange={(event) => update("date", event.target.value)} />
      </label>
      <label>
        Note
        <textarea value={reminder.note} onChange={(event) => update("note", event.target.value)} />
      </label>
      <button className="primary-button">{mode.mode === "edit" ? "Save changes" : "Save reminder"}</button>
    </form>
  );
}

function CareModal({
  mode,
  onClose,
  onSave,
}: {
  mode: CareMode;
  onClose: () => void;
  onSave: (record: CareRecord) => void;
}) {
  const existing = mode.mode === "edit" ? mode.record : undefined;
  const [record, setRecord] = useState({
    type: existing?.type || "Weight",
    title: existing?.title || "",
    date: existing?.date || todayISO(),
    note: existing?.note || "",
  });

  const update = (key: keyof typeof record, value: string) => {
    setRecord((current) => ({ ...current, [key]: value }));
  };

  return (
    <Modal title={mode.mode === "edit" ? "Edit care record" : "Add care record"} onClose={onClose}>
      <form
        className="form-grid"
        onSubmit={(event) => {
          event.preventDefault();
          onSave({ id: existing?.id || uid("care"), ...record });
        }}
      >
        <div className="two-col">
          <label>
            Type
            <select value={record.type} onChange={(event) => update("type", event.target.value)}>
              {careTypes.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
          </label>
          <label>
            Date
            <input type="date" value={record.date} onChange={(event) => update("date", event.target.value)} />
          </label>
        </div>
        <label>
          Title
          <input value={record.title} onChange={(event) => update("title", event.target.value)} required />
        </label>
        <label>
          Note
          <textarea value={record.note} onChange={(event) => update("note", event.target.value)} />
        </label>
        <button className="primary-button">{mode.mode === "edit" ? "Save changes" : "Save care record"}</button>
      </form>
    </Modal>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="modal-backdrop">
      <section className="modal">
        <div className="section-heading">
          <h2>{title}</h2>
          <button className="close-button" onClick={onClose} type="button" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
