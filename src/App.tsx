import {
  Bell,
  CalendarDays,
  Camera,
  Check,
  HeartPulse,
  Home,
  ImagePlus,
  NotebookPen,
  PawPrint,
  Plus,
  Sparkles,
  UserRound,
} from "lucide-react";
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";

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
  fur: ["#fff7df", "#f7d08a", "#d9a066", "#6f4d38", "#1f2933"],
  ears: ["floppy", "pointy", "round"],
  spot: ["none", "eye", "back", "freckles"],
  accessory: ["none", "bandana", "bow", "collar"],
};

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

export default function App() {
  const [state, setState] = useState<PawfolioState>(() => loadState());
  const [tab, setTab] = useState<Tab>("today");
  const [showMemory, setShowMemory] = useState(false);
  const [showReminder, setShowReminder] = useState(false);
  const [showCare, setShowCare] = useState(false);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(state));
  }, [state]);

  const completed = state.tasks.filter((task) => task.done).length;
  const progress = state.tasks.length ? completed / state.tasks.length : 0;

  const upcomingReminder = useMemo(() => {
    return [...state.reminders].sort((a, b) =>
      `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`),
    )[0];
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
        <header className="app-header">
          <div>
            <p className="eyebrow">Pawfolio</p>
            <h1>{state.profile.name}'s day</h1>
          </div>
          <div className="mini-avatar">
            {state.profile.photo ? (
              <img src={state.profile.photo} alt={state.profile.name} />
            ) : (
              <DogAvatar avatar={state.profile.avatar} small />
            )}
          </div>
        </header>

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
              onAddTask={(title) =>
                setState((current) => ({
                  ...current,
                  tasks: [
                    ...current.tasks,
                    { id: uid("task"), title, done: false, note: "" },
                  ],
                }))
              }
              onOpenMemory={() => setShowMemory(true)}
              onOpenReminder={() => setShowReminder(true)}
            />
          )}
          {tab === "diary" && (
            <DiaryScreen
              entries={state.diary}
              onOpenMemory={() => setShowMemory(true)}
            />
          )}
          {tab === "care" && (
            <CareScreen
              records={state.care}
              onOpenCare={() => setShowCare(true)}
            />
          )}
          {tab === "calendar" && (
            <CalendarScreen
              reminders={state.reminders}
              onOpenReminder={() => setShowReminder(true)}
            />
          )}
          {tab === "profile" && (
            <ProfileScreen
              profile={state.profile}
              onSave={(profile) =>
                setState((current) => ({ ...current, profile }))
              }
            />
          )}
        </div>

        <BottomNav active={tab} onChange={setTab} />
      </section>

      {showMemory && (
        <MemoryModal
          onClose={() => setShowMemory(false)}
          onSave={(entry) => {
            setState((current) => ({
              ...current,
              diary: [entry, ...current.diary],
            }));
            setShowMemory(false);
          }}
        />
      )}

      {showReminder && (
        <ReminderModal
          onClose={() => setShowReminder(false)}
          onSave={(reminder) => {
            setState((current) => ({
              ...current,
              reminders: [...current.reminders, reminder],
            }));
            setShowReminder(false);
          }}
        />
      )}

      {showCare && (
        <CareModal
          onClose={() => setShowCare(false)}
          onSave={(record) => {
            setState((current) => ({
              ...current,
              care: [record, ...current.care],
            }));
            setShowCare(false);
          }}
        />
      )}
    </main>
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
      <div className="welcome-badge">
        <PawPrint size={22} />
      </div>
      <h1>Build your dog's little world</h1>
      <p>
        Add the real details now. Pawfolio saves this prototype locally in your
        browser so you can test it with your own dog.
      </p>

      <div className="profile-preview">
        <div className="profile-photo large">
          {profile.photo ? (
            <img src={profile.photo} alt="Dog profile preview" />
          ) : (
            <DogAvatar avatar={profile.avatar} />
          )}
        </div>
        <label className="photo-button">
          <Camera size={18} />
          Add photo
          <input type="file" accept="image/*" onChange={updatePhoto} />
        </label>
      </div>

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
              placeholder="Example: 72 lb"
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
          onChange={(avatar) =>
            setProfile((current) => ({ ...current, avatar }))
          }
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
  onAddTask: (title: string) => void;
  onOpenMemory: () => void;
  onOpenReminder: () => void;
}) {
  const [newTask, setNewTask] = useState("");

  return (
    <div className="stack">
      <section className="hero-panel">
        <div className="floating-spark spark-one" />
        <div className="floating-spark spark-two" />
        <div>
          <p className="eyebrow">Today</p>
          <h2>{profile.name} is ready for a good day</h2>
          <p>{completed} of {tasks.length} care moments complete</p>
          {upcomingReminder && (
            <div className="next-pill">
              <Bell size={15} />
              {upcomingReminder.title} at {upcomingReminder.time || "any time"}
            </div>
          )}
        </div>
        <div className="dog-bounce">
          {profile.photo ? (
            <img src={profile.photo} alt={profile.name} />
          ) : (
            <DogAvatar avatar={profile.avatar} />
          )}
        </div>
        <div className="progress-track">
          <span style={{ width: `${Math.round(progress * 100)}%` }} />
        </div>
      </section>

      <div className="quick-actions">
        <button onClick={onOpenMemory}>
          <ImagePlus size={18} />
          Memory
        </button>
        <button onClick={onOpenReminder}>
          <Bell size={18} />
          Reminder
        </button>
      </div>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Daily care</p>
            <h2>Checklist with notes</h2>
          </div>
        </div>

        <div className="task-list">
          {tasks.map((task) => (
            <article className={`task-card ${task.done ? "done" : ""}`} key={task.id}>
              <button
                className="check-button"
                aria-label={`Toggle ${task.title}`}
                onClick={() => onToggleTask(task.id)}
              >
                {task.done && <Check size={18} />}
              </button>
              <div>
                <h3>{task.title}</h3>
                <textarea
                  value={task.note}
                  onChange={(event) => onTaskNote(task.id, event.target.value)}
                  placeholder="Add a note for this task"
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
          <input
            value={newTask}
            onChange={(event) => setNewTask(event.target.value)}
            placeholder="Add custom task"
          />
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
}: {
  entries: DiaryEntry[];
  onOpenMemory: () => void;
}) {
  return (
    <div className="stack">
      <ScreenTitle
        icon={<NotebookPen size={20} />}
        title="Diary"
        text="Photo captions and journal notes for the moments you want to keep."
        action="Add memory"
        onAction={onOpenMemory}
      />
      {entries.length === 0 ? (
        <EmptyState
          title="No memories yet"
          text="Add a waterfall hike, a sleepy morning, a funny training win, or anything worth remembering."
        />
      ) : (
        <div className="memory-list">
          {entries.map((entry) => (
            <article className="memory-card" key={entry.id}>
              {entry.photo && <img src={entry.photo} alt={entry.title} />}
              <div>
                <p className="eyebrow">{entry.date}</p>
                <h3>{entry.title}</h3>
                <p>{entry.body}</p>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function CareScreen({
  records,
  onOpenCare,
}: {
  records: CareRecord[];
  onOpenCare: () => void;
}) {
  return (
    <div className="stack">
      <ScreenTitle
        icon={<HeartPulse size={20} />}
        title="Care"
        text="Weight, vaccines, medication, vet visits, allergies, and health notes."
        action="Add record"
        onAction={onOpenCare}
      />
      <div className="care-grid">
        {["Weight", "Medication", "Vaccine", "Vet visit"].map((label) => (
          <div className="stat-card" key={label}>
            <span>{label}</span>
            <strong>{records.filter((record) => record.type === label).length}</strong>
          </div>
        ))}
      </div>
      {records.length === 0 ? (
        <EmptyState
          title="No care records yet"
          text="Start with a weight check, medication note, vaccine, or vet visit."
        />
      ) : (
        <div className="record-list">
          {records.map((record) => (
            <article className="record-card" key={record.id}>
              <span>{record.type}</span>
              <h3>{record.title}</h3>
              <p>{record.date}</p>
              <p>{record.note}</p>
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
}: {
  reminders: Reminder[];
  onOpenReminder: () => void;
}) {
  return (
    <div className="stack">
      <ScreenTitle
        icon={<CalendarDays size={20} />}
        title="Calendar"
        text="Appointments, tasks, care reminders, and things to schedule."
        action="Add reminder"
        onAction={onOpenReminder}
      />
      {reminders.length === 0 ? (
        <EmptyState
          title="No reminders yet"
          text="Add a vet appointment, medication reminder, food refill, or grooming task."
        />
      ) : (
        <div className="record-list">
          {reminders.map((reminder) => (
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
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function ProfileScreen({
  profile,
  onSave,
}: {
  profile: DogProfile;
  onSave: (profile: DogProfile) => void;
}) {
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
        window.setTimeout(() => setSaved(false), 1800);
      }}
    >
      <section className="profile-card">
        <div className="profile-photo large">
          {draft.photo ? (
            <img src={draft.photo} alt={draft.name} />
          ) : (
            <DogAvatar avatar={draft.avatar} />
          )}
        </div>
        <label className="photo-button">
          <Camera size={18} />
          Change photo
          <input type="file" accept="image/*" onChange={updatePhoto} />
        </label>
        <h2>{draft.name}</h2>
        <p>{draft.breed}</p>
      </section>

      <section className="section-block">
        <div className="form-grid">
          <label>
            Name
            <input
              value={draft.name}
              onChange={(event) =>
                setDraft((current) => ({ ...current, name: event.target.value }))
              }
            />
          </label>
          <label>
            Breed
            <input
              value={draft.breed}
              list="profile-breeds"
              onChange={(event) =>
                setDraft((current) => ({ ...current, breed: event.target.value }))
              }
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
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    birthday: event.target.value,
                  }))
                }
              />
            </label>
            <label>
              Weight
              <input
                value={draft.weight}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    weight: event.target.value,
                  }))
                }
              />
            </label>
          </div>
          <label>
            Personality
            <textarea
              value={draft.personality}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  personality: event.target.value,
                }))
              }
            />
          </label>
        </div>
        <AvatarBuilder
          avatar={draft.avatar}
          onChange={(avatar) => setDraft((current) => ({ ...current, avatar }))}
        />
        <button className="primary-button">{saved ? "Saved" : "Save profile"}</button>
      </section>
    </form>
  );
}

function AvatarBuilder({
  avatar,
  onChange,
}: {
  avatar: DogAvatar;
  onChange: (avatar: DogAvatar) => void;
}) {
  return (
    <section className="avatar-builder">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Avatar studio</p>
          <h2>Create their app character</h2>
        </div>
        <Sparkles size={22} />
      </div>
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
          <AvatarSelect
            label="Ears"
            value={avatar.ears}
            options={avatarOptions.ears}
            onChange={(ears) => onChange({ ...avatar, ears })}
          />
          <AvatarSelect
            label="Marking"
            value={avatar.spot}
            options={avatarOptions.spot}
            onChange={(spot) => onChange({ ...avatar, spot })}
          />
          <AvatarSelect
            label="Style"
            value={avatar.accessory}
            options={avatarOptions.accessory}
            onChange={(accessory) => onChange({ ...avatar, accessory })}
          />
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

function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <section className="empty-state">
      <PawPrint size={32} />
      <h3>{title}</h3>
      <p>{text}</p>
    </section>
  );
}

function BottomNav({
  active,
  onChange,
}: {
  active: Tab;
  onChange: (tab: Tab) => void;
}) {
  const items: { tab: Tab; label: string; icon: React.ReactNode }[] = [
    { tab: "today", label: "Today", icon: <Home size={20} /> },
    { tab: "diary", label: "Diary", icon: <NotebookPen size={20} /> },
    { tab: "care", label: "Care", icon: <HeartPulse size={20} /> },
    { tab: "calendar", label: "Plan", icon: <CalendarDays size={20} /> },
    { tab: "profile", label: "Profile", icon: <UserRound size={20} /> },
  ];

  return (
    <nav className="bottom-nav">
      {items.map((item) => (
        <button
          className={active === item.tab ? "active" : ""}
          key={item.tab}
          onClick={() => onChange(item.tab)}
          type="button"
        >
          {item.icon}
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}

function MemoryModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (entry: DiaryEntry) => void;
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [date, setDate] = useState(todayISO());
  const [photo, setPhoto] = useState<string | undefined>();

  const updatePhoto = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setPhoto(await readFile(file));
  };

  return (
    <Modal title="Add memory" onClose={onClose}>
      <form
        className="form-grid"
        onSubmit={(event) => {
          event.preventDefault();
          onSave({ id: uid("memory"), title, body, date, photo });
        }}
      >
        <label>
          Photo
          <span className="upload-strip">
            <Camera size={18} />
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
        <button className="primary-button">Save memory</button>
      </form>
    </Modal>
  );
}

function ReminderModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (reminder: Reminder) => void;
}) {
  return (
    <Modal title="Add reminder" onClose={onClose}>
      <ReminderForm onSave={onSave} />
    </Modal>
  );
}

function ReminderForm({ onSave }: { onSave: (reminder: Reminder) => void }) {
  const [reminder, setReminder] = useState({
    title: "",
    type: "Vet",
    date: todayISO(),
    time: "",
    note: "",
  });

  const update = (key: keyof typeof reminder, value: string) => {
    setReminder((current) => ({ ...current, [key]: value }));
  };

  return (
    <form
      className="form-grid"
      onSubmit={(event) => {
        event.preventDefault();
        onSave({ id: uid("reminder"), ...reminder });
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
            <option>Vet</option>
            <option>Medication</option>
            <option>Grooming</option>
            <option>Walk</option>
            <option>Food</option>
            <option>Other</option>
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
      <button className="primary-button">Save reminder</button>
    </form>
  );
}

function CareModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (record: CareRecord) => void;
}) {
  const [record, setRecord] = useState({
    type: "Weight",
    title: "",
    date: todayISO(),
    note: "",
  });

  const update = (key: keyof typeof record, value: string) => {
    setRecord((current) => ({ ...current, [key]: value }));
  };

  return (
    <Modal title="Add care record" onClose={onClose}>
      <form
        className="form-grid"
        onSubmit={(event) => {
          event.preventDefault();
          onSave({ id: uid("care"), ...record });
        }}
      >
        <div className="two-col">
          <label>
            Type
            <select value={record.type} onChange={(event) => update("type", event.target.value)}>
              <option>Weight</option>
              <option>Medication</option>
              <option>Vaccine</option>
              <option>Vet visit</option>
              <option>Allergy</option>
              <option>Health note</option>
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
        <button className="primary-button">Save care record</button>
      </form>
    </Modal>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="modal-backdrop">
      <section className="modal">
        <div className="section-heading">
          <h2>{title}</h2>
          <button className="icon-button" onClick={onClose} type="button">
            Close
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
