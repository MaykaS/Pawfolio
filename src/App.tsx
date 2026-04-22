import {
  Bell,
  CalendarDays,
  Camera,
  Check,
  ChevronRight,
  ChevronLeft,
  Download,
  Heart,
  HeartPulse,
  Home,
  ImagePlus,
  NotebookPen,
  PawPrint,
  Pencil,
  Pill,
  Plus,
  Sparkles,
  Trash2,
  UserRound,
  Weight,
  X,
} from "lucide-react";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import {
  ageLabel,
  avatarOptions,
  breedOptions,
  canUseBrowserNotifications,
  careStatus,
  careTypes,
  deleteCalendarItemFromState,
  deleteCareItemFromState,
  daysTogether,
  eventCategory,
  eventsForDate,
  eventsForMonth,
  getCareMoments,
  getUpcomingReminder,
  getUpcomingReminders,
  initialState,
  latestWeight,
  normalizeState,
  notificationPermissionStatus,
  prettyDate,
  recurrenceLabel,
  reminderRecurrenceOptions,
  reminderTypes,
  safeSetLocalStorage,
  saveCareRecordToState,
  saveReminderToState,
  storageKey,
  taskTime,
  todayISO,
  visibleCareRecords,
  visibleReminders,
  type CareRecord,
  type DailyTask,
  type DiaryEntry,
  type DogAvatar,
  type DogProfile,
  type PawfolioState,
  type Reminder,
  type ReminderRecurrence,
  type Tab,
} from "./pawfolio";

type TaskMode = { mode: "create" } | { mode: "edit"; task: DailyTask };
type MemoryMode = { mode: "create" } | { mode: "edit"; entry: DiaryEntry };
type CareMode = { mode: "create" } | { mode: "edit"; record: CareRecord };
type ReminderMode = { mode: "create"; date?: string } | { mode: "edit"; reminder: Reminder };

function loadState(): PawfolioState {
  try {
    const stored = localStorage.getItem(storageKey);
    if (!stored) return normalizeState(initialState);
    return normalizeState(JSON.parse(stored));
  } catch {
    return normalizeState(initialState);
  }
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

async function readCompressedImage(file: File, maxDimension: number, quality = 0.78): Promise<string> {
  if (!file.type.startsWith("image/")) return readFile(file);

  const sourceUrl = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = sourceUrl;
    await image.decode();

    const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return readFile(file);
    context.drawImage(image, 0, 0, width, height);
    return canvas.toDataURL("image/jpeg", quality);
  } catch {
    return readFile(file);
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
}

function countTasks(tasks: DailyTask[], pattern: RegExp) {
  return tasks.filter((task) => pattern.test(task.title) && task.done).length;
}

function careMeta(record: CareRecord) {
  const parts = [record.type, prettyDate(record.date)];
  if (record.nextDueDate) parts.push(`next ${prettyLongDate(record.nextDueDate)}`);
  if (record.note) parts.push(record.note);
  return parts.join(" - ");
}

function prettyLongDate(date: string) {
  if (!date) return "No date";
  return new Date(`${date}T00:00`).toLocaleDateString("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}`;
}

export default function App() {
  const [state, setState] = useState<PawfolioState>(() => loadState());
  const [tab, setTab] = useState<Tab>("today");
  const [taskMode, setTaskMode] = useState<TaskMode | null>(null);
  const [memoryMode, setMemoryMode] = useState<MemoryMode | null>(null);
  const [careMode, setCareMode] = useState<CareMode | null>(null);
  const [reminderMode, setReminderMode] = useState<ReminderMode | null>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    const result = safeSetLocalStorage(localStorage, storageKey, state);
    setSaveError(result.ok ? "" : result.message);
  }, [state]);

  const completed = state.tasks.filter((task) => task.done).length;
  const progress = state.tasks.length ? completed / state.tasks.length : 0;
  const careRecords = useMemo(() => visibleCareRecords(state), [state]);
  const calendarItems = useMemo(() => visibleReminders(state), [state]);
  const upcomingReminder = useMemo(
    () => getUpcomingReminder(calendarItems),
    [calendarItems],
  );

  if (!state.profile) {
    return (
      <main className="app-root">
        {saveError && <div className="app-alert">{saveError}</div>}
        <Onboarding
          onSave={(profile) => setState((current) => ({ ...current, profile }))}
        />
      </main>
    );
  }

  return (
    <main className="app-root">
      {saveError && <div className="app-alert">{saveError}</div>}
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
          onAddTask={() => setTaskMode({ mode: "create" })}
          onEditTask={(task) => setTaskMode({ mode: "edit", task })}
          onDeleteTask={(id) =>
            setState((current) => ({
              ...current,
              tasks: current.tasks.filter((task) => task.id !== id),
            }))
          }
          onOpenMemory={() => setMemoryMode({ mode: "create" })}
          onOpenNotifications={() => setNotificationsOpen(true)}
        />
      )}

      {tab === "diary" && (
        <DiaryScreen
          profile={state.profile}
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
          records={careRecords}
          onOpenCare={() => setCareMode({ mode: "create" })}
          onEdit={(record) => setCareMode({ mode: "edit", record })}
          onDelete={(id) =>
            setState((current) => deleteCareItemFromState(current, id))
          }
        />
      )}

      {tab === "calendar" && (
        <CalendarScreen
          reminders={calendarItems}
          onOpenReminder={(date) => setReminderMode({ mode: "create", date })}
          onEdit={(reminder) => setReminderMode({ mode: "edit", reminder })}
          onDelete={(id) =>
            setState((current) => deleteCalendarItemFromState(current, id))
          }
        />
      )}

      {tab === "profile" && (
        <ProfileScreen
          profile={state.profile}
          diaryCount={state.diary.length}
          walkCount={state.tasks.filter((task) => /walk/i.test(task.title)).length}
          careRecords={careRecords}
          onSave={(profile) => setState((current) => ({ ...current, profile }))}
          onOpenNotifications={() => setNotificationsOpen(true)}
        />
      )}

      <BottomNav active={tab} onChange={setTab} />

      {taskMode && (
        <TaskSheet
          mode={taskMode}
          onClose={() => setTaskMode(null)}
          onSave={(task) => {
            setState((current) => ({
              ...current,
              tasks:
                taskMode.mode === "edit"
                  ? current.tasks.map((item) => (item.id === task.id ? task : item))
                  : [...current.tasks, task],
            }));
            setTaskMode(null);
          }}
        />
      )}

      {memoryMode && (
        <MemorySheet
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

      {careMode && (
        <CareSheet
          mode={careMode}
          onClose={() => setCareMode(null)}
          onSave={(record) => {
            setState((current) => saveCareRecordToState(current, record));
            setCareMode(null);
          }}
        />
      )}

      {reminderMode && (
        <ReminderSheet
          mode={reminderMode}
          onClose={() => setReminderMode(null)}
          onSave={(reminder) => {
            setState((current) => saveReminderToState(current, reminder));
            setReminderMode(null);
          }}
        />
      )}

      {notificationsOpen && (
        <NotificationsSheet
          reminders={calendarItems}
          onClose={() => setNotificationsOpen(false)}
        />
      )}
    </main>
  );
}

function ScreenHeader({
  label,
  title,
  action,
}: {
  label?: string;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="screen-head">
      <div>
        {label && <p className="screen-kicker">{label}</p>}
        <h1 className="screen-title">{title}</h1>
      </div>
      {action}
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
    const photo = await readCompressedImage(file, 512);
    setProfile((current) => ({ ...current, photo }));
  };

  return (
    <section className="onboarding">
      <div className="ob-progress">
        <span className="ob-dot active" />
        <span className="ob-dot active" />
        <span className="ob-dot active" />
      </div>
      <div className="ob-content">
        <div className="profile-preview card">
          <div className="profile-photo">
            {profile.photo ? (
              <img src={profile.photo} alt="Dog profile preview" />
            ) : (
              <DogAvatar avatar={profile.avatar} />
            )}
          </div>
          <div>
            <p className="label no-margin">Pet profile</p>
            <h1 className="ob-title">Create their Pawfolio</h1>
            <p className="ob-sub">Saved locally in this browser for your real dog.</p>
            <label className="btn btn-secondary upload-btn">
              <Camera size={17} />
              Add photo
              <input type="file" accept="image/*" onChange={updatePhoto} />
            </label>
          </div>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (canSave) onSave(profile);
          }}
        >
          <Field label="Dog name">
            <input
              className="input"
              value={profile.name}
              onChange={(event) => update("name", event.target.value)}
              placeholder="Mochi"
            />
          </Field>
          <Field label="Breed">
            <input
              className="input"
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
          </Field>
          <div className="form-two">
            <Field label="Birthday">
              <input
                className="input"
                type="date"
                value={profile.birthday}
                onChange={(event) => update("birthday", event.target.value)}
              />
            </Field>
            <Field label="Weight">
              <input
                className="input"
                value={profile.weight}
                onChange={(event) => update("weight", event.target.value)}
                placeholder="27.8 lb"
              />
            </Field>
          </div>
          <Field label="Personality notes">
            <textarea
              className="input"
              value={profile.personality}
              onChange={(event) => update("personality", event.target.value)}
              placeholder="Playful, energetic, food-motivated..."
            />
          </Field>
          <AvatarBuilder
            avatar={profile.avatar}
            onChange={(avatar) => setProfile((current) => ({ ...current, avatar }))}
          />
          <button className="btn btn-primary" disabled={!canSave}>
            Start Pawfolio
          </button>
        </form>
      </div>
    </section>
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
  onEditTask,
  onDeleteTask,
  onOpenMemory,
  onOpenNotifications,
}: {
  profile: DogProfile;
  tasks: DailyTask[];
  completed: number;
  progress: number;
  upcomingReminder?: Reminder;
  onToggleTask: (id: string) => void;
  onTaskNote: (id: string, note: string) => void;
  onAddTask: () => void;
  onEditTask: (task: DailyTask) => void;
  onDeleteTask: (id: string) => void;
  onOpenMemory: () => void;
  onOpenNotifications: () => void;
}) {
  const careMoments = getCareMoments(tasks);
  const [openNoteId, setOpenNoteId] = useState<string | null>(null);

  return (
    <section className="screen">
      <ScreenHeader
        label={new Date().toLocaleDateString("en", {
          weekday: "long",
          month: "short",
          day: "numeric",
        })}
        title={`Good morning, ${profile.name}`}
        action={
          <button className="icon-chip" type="button" aria-label="Open notifications" onClick={onOpenNotifications}>
            <Bell size={18} />
          </button>
        }
      />

      <div className="today-header">
        <div className="hero-row">
          <div className="profile-avatar small-avatar">
            {profile.photo ? (
              <img src={profile.photo} alt={profile.name} />
            ) : (
              <DogAvatar avatar={profile.avatar} small />
            )}
          </div>
          <div>
            <h2>{completed} of {tasks.length} done</h2>
            <p>{tasks.length - completed} tasks remaining</p>
          </div>
        </div>
        <div className="progress-track">
          <span className="progress-fill" style={{ width: `${Math.round(progress * 100)}%` }} />
        </div>
        <div className="hero-meta">
          <span>food {countTasks(tasks, /breakfast|dinner|meal|food/i)}</span>
          <span>walk {countTasks(tasks, /walk/i)}</span>
          <span>med {countTasks(tasks, /pill|med|medicine/i)}</span>
        </div>
      </div>

      <div className="quick-grid">
        <button className="btn btn-secondary" type="button" onClick={onAddTask}>
          <Plus size={16} />
          Task
        </button>
        <button className="btn btn-secondary" type="button" onClick={onOpenMemory}>
          <ImagePlus size={16} />
          Memory
        </button>
      </div>

      <p className="label">Quick log</p>
      <div className="quick-pills">
        {careMoments.map((moment) => (
          <span className={moment.active ? "badge badge-green" : "badge badge-gray"} key={moment.label}>
            {moment.label}
          </span>
        ))}
      </div>

      <div className="label-row">
        <p className="label no-margin">Today's routine</p>
        {upcomingReminder && (
          <span>{upcomingReminder.title} {upcomingReminder.time || ""}</span>
        )}
      </div>

      {tasks.map((task) => (
        <article className="task-item" key={task.id}>
          <div className="task-main-row">
            <button
              className={task.done ? "task-check done" : "task-check"}
              type="button"
              aria-label={`Toggle ${task.title}`}
              onClick={() => onToggleTask(task.id)}
            >
              {task.done && <Check size={16} />}
            </button>
            <div className="task-copy">
              <div className={task.done ? "task-label done" : "task-label"}>{task.title}</div>
              <div className="task-time">{taskTime(task)}</div>
              {task.note && openNoteId !== task.id && <p className="task-note-preview">{task.note}</p>}
            </div>
            <div className="row-actions">
              <button
                className={task.note ? "tiny-btn note-active" : "tiny-btn"}
                type="button"
                aria-label={task.note ? `Edit note for ${task.title}` : `Add note for ${task.title}`}
                onClick={() => setOpenNoteId(openNoteId === task.id ? null : task.id)}
              >
                <NotebookPen size={14} />
              </button>
              <button className="tiny-btn" type="button" aria-label={`Edit ${task.title}`} onClick={() => onEditTask(task)}>
                <Pencil size={14} />
              </button>
              <button className="tiny-btn danger" type="button" aria-label={`Delete ${task.title}`} onClick={() => onDeleteTask(task.id)}>
                <Trash2 size={14} />
              </button>
            </div>
          </div>
          {openNoteId === task.id && (
            <input
              className="task-note input"
              value={task.note}
              onChange={(event) => onTaskNote(task.id, event.target.value)}
              placeholder="Add note"
              autoFocus
            />
          )}
        </article>
      ))}
    </section>
  );
}

function DiaryScreen({
  profile,
  entries,
  onOpenMemory,
  onEdit,
  onDelete,
}: {
  profile: DogProfile;
  entries: DiaryEntry[];
  onOpenMemory: () => void;
  onEdit: (entry: DiaryEntry) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <section className="screen">
      <ScreenHeader
        label="Journal"
        title={`${profile.name}'s diary`}
        action={
          <button className="btn btn-sm btn-secondary" type="button" onClick={onOpenMemory}>
            + New
          </button>
        }
      />
      {entries.length === 0 ? (
        <EmptyState title="No memories yet" text="Save a hike, sleepy morning, or funny training win." />
      ) : (
        entries.map((entry) => (
          <article className="diary-entry" key={entry.id}>
            {entry.photo ? (
              <img className="diary-photo" src={entry.photo} alt={entry.title} />
            ) : (
              <div className="diary-photo photo-placeholder">
                <Camera size={18} />
                <span>{entry.title.toLowerCase()}</span>
              </div>
            )}
            <div className="diary-entry-body">
              <div className="entry-head">
                <span className="badge badge-amber">{prettyDate(entry.date)}</span>
                <CardActions onEdit={() => onEdit(entry)} onDelete={() => onDelete(entry.id)} />
              </div>
              <h2>{entry.title}</h2>
              <p>{entry.body || "No journal note yet."}</p>
            </div>
          </article>
        ))
      )}
    </section>
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
  const careTabs = [
    { label: "Meds", types: ["Medication"] },
    { label: "Vaccines", types: ["Vaccine"] },
    { label: "Vet visits", types: ["Vet visit", "Allergy", "Health note"] },
    { label: "Weight", types: ["Weight"] },
  ];
  const [activeCareTab, setActiveCareTab] = useState(careTabs[0].label);
  const activeTypes = careTabs.find((tabItem) => tabItem.label === activeCareTab)?.types || [];
  const filteredRecords = records.filter((record) => activeTypes.includes(record.type));
  const displayWeight = latestWeight(records, profile.weight);

  return (
    <section className="screen">
      <ScreenHeader
        label={profile.name}
        title="Care records"
        action={
          <button className="btn btn-sm btn-secondary" type="button" onClick={onOpenCare}>
            + Add
          </button>
        }
      />
      <div className="seg-control">
        {careTabs.map((tabItem) => (
          <button
            className={activeCareTab === tabItem.label ? "seg-btn active" : "seg-btn"}
            type="button"
            key={tabItem.label}
            onClick={() => setActiveCareTab(tabItem.label)}
          >
            {tabItem.label}
          </button>
        ))}
      </div>
      <div className="stats-grid">
        <StatCard icon={<Weight size={16} />} label="Weight" value={displayWeight} />
        <StatCard icon={<Pill size={16} />} label="Meds" value={String(records.filter((record) => record.type === "Medication").length)} />
        <StatCard icon={<HeartPulse size={16} />} label="Records" value={String(records.length)} />
      </div>
      {filteredRecords.length === 0 ? (
        <EmptyState
          title={`No ${activeCareTab.toLowerCase()} yet`}
          text="Tap Add to save a care record for this section."
        />
      ) : (
        filteredRecords.map((record) => (
          <article className="care-item" key={record.id}>
            <div className={record.type === "Medication" ? "care-icon-wrap badge-blue" : "care-icon-wrap badge-green"}>
              {record.type === "Medication" ? <Pill size={18} /> : <HeartPulse size={18} />}
            </div>
            <div className="care-copy">
              <span className={careStatus(record) === "OK" ? "badge badge-green" : careStatus(record) === "Overdue" ? "badge badge-red" : "badge badge-amber"}>
                {careStatus(record)}
              </span>
              <h2>{record.title}</h2>
              <p>{careMeta(record)}</p>
            </div>
            <CardActions onEdit={() => onEdit(record)} onDelete={() => onDelete(record.id)} />
          </article>
        ))
      )}
    </section>
  );
}

function CalendarScreen({
  reminders,
  onOpenReminder,
  onEdit,
  onDelete,
}: {
  reminders: Reminder[];
  onOpenReminder: (date?: string) => void;
  onEdit: (reminder: Reminder) => void;
  onDelete: (id: string) => void;
}) {
  const [visibleMonth, setVisibleMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [showAllUpcoming, setShowAllUpcoming] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const currentMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const monthEvents = eventsForMonth(reminders, visibleMonth);
  const upcoming = getUpcomingReminders(reminders);
  const visibleUpcoming = showAllUpcoming ? upcoming : upcoming.slice(0, 3);
  const isCurrentMonth = monthKey(visibleMonth) === monthKey(currentMonth);
  const selectedDateEvents = selectedDate ? eventsForDate(reminders, selectedDate) : [];

  const shiftMonth = (amount: number) => {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1));
  };

  return (
    <section className="screen">
      <header className="calendar-head">
        <div className="calendar-topline">
          <p className="screen-kicker">Calendar</p>
          <div className="calendar-actions">
            {!isCurrentMonth && (
              <button className="btn btn-sm btn-ghost" type="button" onClick={() => setVisibleMonth(currentMonth)}>
                Today
              </button>
            )}
            <button className="btn btn-sm btn-secondary" type="button" onClick={() => onOpenReminder()}>
              + Add
            </button>
          </div>
        </div>
        <div className="month-title-row">
          <button className="calendar-arrow" type="button" aria-label="Previous month" onClick={() => shiftMonth(-1)}>
            <ChevronLeft size={13} />
          </button>
          <h1 className="calendar-title">{visibleMonth.toLocaleDateString("en", { month: "long", year: "numeric" })}</h1>
          <button className="calendar-arrow" type="button" aria-label="Next month" onClick={() => shiftMonth(1)}>
            <ChevronRight size={13} />
          </button>
        </div>
      </header>
      <MonthGrid
        visibleMonth={visibleMonth}
        reminders={monthEvents}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
      />
      <div className="label-row">
        <p className="label no-margin">Upcoming</p>
        {upcoming.length > 3 && (
          <button className="link-btn" type="button" onClick={() => setShowAllUpcoming((current) => !current)}>
            {showAllUpcoming ? "Show less" : `Show all ${upcoming.length}`}
          </button>
        )}
      </div>
      {visibleUpcoming.length === 0 ? (
        <EmptyState title="No reminders yet" text="Add a vet appointment, medication, food refill, or grooming task." />
      ) : (
        visibleUpcoming.map((reminder) => (
          <article className={`event-item event-${eventCategory(reminder.type)}`} key={reminder.id}>
            <div className="event-date-block">
              <strong>{new Date(`${reminder.date}T00:00`).getDate()}</strong>
              <span>{new Date(`${reminder.date}T00:00`).toLocaleDateString("en", { month: "short" })}</span>
            </div>
            <div className="event-copy">
              {reminder.recurrence !== "none" && <span className="badge badge-amber">{recurrenceLabel(reminder.recurrence)}</span>}
              <h2>{reminder.title}</h2>
              <p>{reminder.type} - {reminder.time || "Any time"} {reminder.note && `- ${reminder.note}`}</p>
            </div>
            <CardActions onEdit={() => onEdit(reminder)} onDelete={() => onDelete(reminder.id)} />
          </article>
        ))
      )}
      {selectedDate && (
        <DayDetailSheet
          date={selectedDate}
          reminders={selectedDateEvents}
          onAdd={() => {
            onOpenReminder(selectedDate);
            setSelectedDate(null);
          }}
          onEdit={(reminder) => {
            onEdit(reminder);
            setSelectedDate(null);
          }}
          onDelete={onDelete}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </section>
  );
}

function DayDetailSheet({
  date,
  reminders,
  onAdd,
  onEdit,
  onDelete,
  onClose,
}: {
  date: string;
  reminders: Reminder[];
  onAdd: () => void;
  onEdit: (reminder: Reminder) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <Sheet title={prettyLongDate(date)} onClose={onClose}>
      <div className="day-detail-head">
        <p>{reminders.length ? `${reminders.length} calendar item${reminders.length === 1 ? "" : "s"}` : "Nothing saved for this day yet."}</p>
        <button className="btn btn-sm btn-secondary" type="button" onClick={onAdd}>
          + Add
        </button>
      </div>
      {reminders.length === 0 ? (
        <section className="day-empty">
          <CalendarDays size={22} />
          <h3>No plans here</h3>
          <p>Add a medicine, vaccine, vet visit, grooming, walk, food note, or other reminder.</p>
        </section>
      ) : (
        reminders.map((reminder) => (
          <article className={`event-item day-event event-${eventCategory(reminder.type)}`} key={reminder.id}>
            <div className="event-date-block">
              <strong>{reminder.time || "--"}</strong>
              <span>{reminder.time ? "time" : "any"}</span>
            </div>
            <div className="event-copy">
              {reminder.recurrence !== "none" && <span className="badge badge-amber">{recurrenceLabel(reminder.recurrence)}</span>}
              <h2>{reminder.title}</h2>
              <p>{reminder.type}{reminder.note && ` - ${reminder.note}`}</p>
            </div>
            <CardActions onEdit={() => onEdit(reminder)} onDelete={() => onDelete(reminder.id)} />
          </article>
        ))
      )}
    </Sheet>
  );
}

function NotificationsSheet({
  reminders,
  onClose,
}: {
  reminders: Reminder[];
  onClose: () => void;
}) {
  const notificationApi = typeof Notification === "undefined" ? undefined : Notification;
  const [permission, setPermission] = useState(() => notificationPermissionStatus(notificationApi));
  const upcoming = getUpcomingReminders(reminders).slice(0, 6);
  const supported = canUseBrowserNotifications(notificationApi);

  const testNotification = async () => {
    if (!supported || !notificationApi) return;
    const nextPermission =
      notificationApi.permission === "default" ? await notificationApi.requestPermission() : notificationApi.permission;
    setPermission(nextPermission);
    if (nextPermission === "granted") {
      new Notification("Pawfolio reminder", {
        body: upcoming[0]
          ? `${upcoming[0].title} is coming up ${prettyDate(upcoming[0].date)}.`
          : "Notifications are ready for Pawfolio.",
      });
    }
  };

  return (
    <Sheet title="Notifications" onClose={onClose}>
      <section className="notice-card">
        <div>
          <p className="label no-margin">Browser permission</p>
          <h3>{supported ? permissionLabel(permission) : "Not supported here"}</h3>
        </div>
        {supported && (
          <button className="btn btn-sm btn-secondary" type="button" onClick={testNotification}>
            Test notification
          </button>
        )}
      </section>

      <p className="notice-copy">
        Pawfolio can show this in-app notification center today. Real background push reminders come later with PWA push or the native app.
      </p>

      <div className="label-row">
        <p className="label no-margin">Upcoming</p>
        <span>{upcoming.length} active</span>
      </div>
      {upcoming.length === 0 ? (
        <section className="day-empty">
          <Bell size={22} />
          <h3>No upcoming reminders</h3>
          <p>Add calendar reminders for medicine, vaccines, vet visits, grooming, food, walks, or other care.</p>
        </section>
      ) : (
        upcoming.map((reminder) => (
          <article className={`event-item notification-item event-${eventCategory(reminder.type)}`} key={reminder.id}>
            <div className="event-date-block">
              <strong>{new Date(`${reminder.date}T00:00`).getDate()}</strong>
              <span>{new Date(`${reminder.date}T00:00`).toLocaleDateString("en", { month: "short" })}</span>
            </div>
            <div className="event-copy">
              {reminder.recurrence !== "none" && <span className="badge badge-amber">{recurrenceLabel(reminder.recurrence)}</span>}
              <h2>{reminder.title}</h2>
              <p>{reminder.type} - {reminder.time || "Any time"}{reminder.note && ` - ${reminder.note}`}</p>
            </div>
          </article>
        ))
      )}
    </Sheet>
  );
}

function permissionLabel(permission: string) {
  if (permission === "granted") return "Allowed";
  if (permission === "denied") return "Blocked";
  if (permission === "default") return "Not decided yet";
  return "Not supported here";
}

function ProfileScreen({
  profile,
  diaryCount,
  walkCount,
  careRecords,
  onSave,
  onOpenNotifications,
}: {
  profile: DogProfile;
  diaryCount: number;
  walkCount: number;
  careRecords: CareRecord[];
  onSave: (profile: DogProfile) => void;
  onOpenNotifications: () => void;
}) {
  const [editing, setEditing] = useState(false);

  const exportHealthRecords = () => {
    const payload = {
      pet: profile.name,
      exportedAt: new Date().toISOString(),
      careRecords,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${profile.name || "pawfolio"}-health-records.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="screen profile-screen">
      <section className="profile-hero">
        <div className="profile-photo profile-photo-ring">
          {profile.photo ? <img src={profile.photo} alt={profile.name} /> : <DogAvatar avatar={profile.avatar} small />}
        </div>
        <h1>{profile.name}</h1>
        <p>{profile.breed || "Breed not set"} - {ageLabel(profile.birthday)} - {profile.weight || "Weight not set"}</p>
        <div className="quick-pills center">
          <span className="badge badge-amber">Playful</span>
          <span className="badge badge-green">Energetic</span>
          <span className="badge badge-blue">Food-motivated</span>
        </div>
      </section>
      <div className="stats-grid">
        <StatCard icon={<NotebookPen size={16} />} label="Diary entries" value={String(diaryCount)} />
        <StatCard icon={<PawPrint size={16} />} label="Walks logged" value={String(walkCount)} />
        <StatCard icon={<Heart size={16} />} label="Days together" value={daysTogether(profile.birthday)} />
      </div>
      <section className="card">
        <p className="label no-margin">Personality notes</p>
        <p className="personality-text">{profile.personality || "Add little quirks, fears, favorite games, and care notes."}</p>
      </section>
      <div className="profile-actions">
        <ProfileAction icon={<Pencil size={18} />} label="Edit profile" onClick={() => setEditing(true)} />
        <ProfileAction icon={<Bell size={18} />} label="Notifications" onClick={onOpenNotifications} />
        <ProfileAction icon={<Download size={18} />} label="Export health records" onClick={exportHealthRecords} />
      </div>
      {editing && (
        <ProfileEditSheet
          profile={profile}
          onClose={() => setEditing(false)}
          onSave={(updated) => {
            onSave(updated);
            setEditing(false);
          }}
        />
      )}
    </section>
  );
}

function ProfileAction({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button className="profile-action card-sm" type="button" onClick={onClick}>
      <span className="profile-action-icon">{icon}</span>
      <span>{label}</span>
      <ChevronRight size={17} />
    </button>
  );
}

function ProfileEditSheet({
  profile,
  onClose,
  onSave,
}: {
  profile: DogProfile;
  onClose: () => void;
  onSave: (profile: DogProfile) => void;
}) {
  const [draft, setDraft] = useState(profile);

  const updatePhoto = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const photo = await readCompressedImage(file, 512);
    setDraft((current) => ({ ...current, photo }));
  };

  return (
    <Sheet title="Edit profile" onClose={onClose}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSave(draft);
        }}
      >
        <section className="profile-preview card">
          <div className="profile-photo">
            {draft.photo ? <img src={draft.photo} alt={draft.name} /> : <DogAvatar avatar={draft.avatar} />}
          </div>
          <div>
            <h2>{draft.name || "Your dog"}</h2>
            <p>{draft.breed || "Breed not set"}</p>
            <label className="btn btn-secondary upload-btn">
              <Camera size={17} />
              Change photo
              <input type="file" accept="image/*" onChange={updatePhoto} />
            </label>
          </div>
        </section>
      <Field label="Name">
        <input className="input" value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} />
      </Field>
      <Field label="Breed">
        <input
          className="input"
          value={draft.breed}
          list="profile-breeds"
          onChange={(event) => setDraft((current) => ({ ...current, breed: event.target.value }))}
        />
        <datalist id="profile-breeds">
          {breedOptions.map((breed) => (
            <option key={breed} value={breed} />
          ))}
        </datalist>
      </Field>
      <div className="form-two">
        <Field label="Birthday">
          <input className="input" type="date" value={draft.birthday} onChange={(event) => setDraft((current) => ({ ...current, birthday: event.target.value }))} />
        </Field>
        <Field label="Weight">
          <input className="input" value={draft.weight} onChange={(event) => setDraft((current) => ({ ...current, weight: event.target.value }))} />
        </Field>
      </div>
      <Field label="Personality">
        <textarea className="input" value={draft.personality} onChange={(event) => setDraft((current) => ({ ...current, personality: event.target.value }))} />
      </Field>
      <AvatarBuilder avatar={draft.avatar} onChange={(avatar) => setDraft((current) => ({ ...current, avatar }))} />
      <button className="btn btn-primary">Save profile</button>
    </form>
    </Sheet>
  );
}

function MonthGrid({
  visibleMonth,
  reminders,
  selectedDate,
  onSelectDate,
}: {
  visibleMonth: Date;
  reminders: Reminder[];
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
}) {
  const now = new Date();
  const daysInMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0).getDate();
  const firstDay = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1).getDay();
  const eventsByDay = reminders.reduce<Record<string, string[]>>((days, reminder) => {
    const date = new Date(`${reminder.date}T00:00`);
    const day = String(date.getDate());
    days[day] = [...(days[day] || []), eventCategory(reminder.type)];
    return days;
  }, {});
  const cells = [
    ...Array.from({ length: firstDay }, (_, index) => ({ key: `blank-${index}`, day: "" })),
    ...Array.from({ length: daysInMonth }, (_, index) => ({ key: `day-${index + 1}`, day: String(index + 1) })),
  ];

  return (
    <section className="card month-card">
      <div className="month-grid">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
          <span className="weekday" key={day}>{day}</span>
        ))}
        {cells.map((cell) => {
          const isToday =
            cell.day === String(now.getDate()) &&
            visibleMonth.getMonth() === now.getMonth() &&
            visibleMonth.getFullYear() === now.getFullYear();
          const date = cell.day
            ? `${visibleMonth.getFullYear()}-${String(visibleMonth.getMonth() + 1).padStart(2, "0")}-${cell.day.padStart(2, "0")}`
            : "";
          const isSelected = Boolean(date && selectedDate === date);
          const categories = [...new Set(eventsByDay[cell.day] || [])].slice(0, 3);

          if (!cell.day) {
            return <span className="month-day blank" key={cell.key} />;
          }

          return (
            <button
              className={`${isToday ? "month-day today" : "month-day"} ${isSelected ? "selected" : ""}`}
              key={cell.key}
              type="button"
              aria-label={`Open ${prettyLongDate(date)}`}
              onClick={() => onSelectDate(date)}
            >
              <span>{cell.day}</span>
              {categories.length > 0 && (
                <span className="event-dots">
                  {categories.map((category) => (
                    <span className={`event-dot dot-${category}`} key={category} />
                  ))}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function TaskSheet({
  mode,
  onClose,
  onSave,
}: {
  mode: TaskMode;
  onClose: () => void;
  onSave: (task: DailyTask) => void;
}) {
  const existing = mode.mode === "edit" ? mode.task : undefined;
  const [title, setTitle] = useState(existing?.title || "");
  const [time, setTime] = useState(existing?.time || "8:00 AM");

  return (
    <Sheet title={mode.mode === "edit" ? "Edit task" : "Add task"} onClose={onClose}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!title.trim()) return;
          onSave({
            id: existing?.id || uid("task"),
            title: title.trim(),
            time: time.trim() || "Anytime",
            done: existing?.done || false,
            note: existing?.note || "",
          });
        }}
      >
        <Field label="Task title">
          <input className="input" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Afternoon walk" required />
        </Field>
        <Field label="Time">
          <input className="input" value={time} onChange={(event) => setTime(event.target.value)} placeholder="4:00 PM" required />
        </Field>
        <button className="btn btn-primary">{mode.mode === "edit" ? "Save task" : "Add task"}</button>
      </form>
    </Sheet>
  );
}

function MemorySheet({
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
    setPhoto(await readCompressedImage(file, 900, 0.74));
  };

  return (
    <Sheet title={mode.mode === "edit" ? "Edit memory" : "Add memory"} onClose={onClose}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSave({ id: existing?.id || uid("memory"), title, body, date, photo });
        }}
      >
        <Field label="Photo">
          <label className="btn btn-secondary upload-btn full">
            <Camera size={17} />
            {photo ? "Photo ready" : "Choose photo"}
            <input type="file" accept="image/*" onChange={updatePhoto} />
          </label>
        </Field>
        <Field label="Caption">
          <input className="input" value={title} onChange={(event) => setTitle(event.target.value)} required />
        </Field>
        <Field label="Date">
          <input className="input" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        </Field>
        <Field label="Journal note">
          <textarea className="input" value={body} onChange={(event) => setBody(event.target.value)} />
        </Field>
        <button className="btn btn-primary">Save memory</button>
      </form>
    </Sheet>
  );
}

function CareSheet({
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
    nextDueDate: existing?.nextDueDate || "",
    note: existing?.note || "",
  });

  const update = (key: keyof typeof record, value: string) => {
    setRecord((current) => ({ ...current, [key]: value }));
  };

  return (
    <Sheet title={mode.mode === "edit" ? "Edit care record" : "Add care record"} onClose={onClose}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSave({ id: existing?.id || uid("care"), ...record });
        }}
      >
        <div className="form-two">
          <Field label="Type">
            <select className="input" value={record.type} onChange={(event) => update("type", event.target.value)}>
              {careTypes.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
          </Field>
          <Field label="Date">
            <input className="input" type="date" value={record.date} onChange={(event) => update("date", event.target.value)} />
          </Field>
        </div>
        <Field label="Title">
          <input className="input" value={record.title} onChange={(event) => update("title", event.target.value)} required />
        </Field>
        <Field label="Next due date">
          <input className="input" type="date" value={record.nextDueDate} onChange={(event) => update("nextDueDate", event.target.value)} />
        </Field>
        <Field label="Note">
          <textarea className="input" value={record.note} onChange={(event) => update("note", event.target.value)} />
        </Field>
        <button className="btn btn-primary">Save care record</button>
      </form>
    </Sheet>
  );
}

function ReminderSheet({
  mode,
  onClose,
  onSave,
}: {
  mode: ReminderMode;
  onClose: () => void;
  onSave: (reminder: Reminder) => void;
}) {
  const existing = mode.mode === "edit" ? mode.reminder : undefined;
  const [reminder, setReminder] = useState({
    title: existing?.title || "",
    type: existing?.type || "Vet",
    date: existing?.date || (mode.mode === "create" ? mode.date : undefined) || todayISO(),
    time: existing?.time || "",
    note: existing?.note || "",
    recurrence: existing?.recurrence || ("none" as ReminderRecurrence),
  });

  const update = (key: keyof typeof reminder, value: string) => {
    setReminder((current) => ({ ...current, [key]: value }));
  };

  return (
    <Sheet title={mode.mode === "edit" ? "Edit reminder" : "Add reminder"} onClose={onClose}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSave({ id: existing?.id || uid("reminder"), ...reminder });
        }}
      >
        <Field label="Title">
          <input className="input" value={reminder.title} onChange={(event) => update("title", event.target.value)} required />
        </Field>
        <div className="form-two">
          <Field label="Type">
            <select className="input" value={reminder.type} onChange={(event) => update("type", event.target.value)}>
              {reminderTypes.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
          </Field>
          <Field label="Time">
            <input className="input" type="time" value={reminder.time} onChange={(event) => update("time", event.target.value)} />
          </Field>
        </div>
        <Field label="Repeat">
          <select
            className="input"
            value={reminder.recurrence}
            onChange={(event) => update("recurrence", event.target.value as ReminderRecurrence)}
          >
            {reminderRecurrenceOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Date">
          <input className="input" type="date" value={reminder.date} onChange={(event) => update("date", event.target.value)} />
        </Field>
        <Field label="Note">
          <textarea className="input" value={reminder.note} onChange={(event) => update("note", event.target.value)} />
        </Field>
        <button className="btn btn-primary">Save reminder</button>
      </form>
    </Sheet>
  );
}

function Sheet({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="overlay">
      <section className="sheet">
        <div className="sheet-handle" />
        <div className="sheet-head">
          <h2 className="sheet-title">{title}</h2>
          <button className="tiny-btn" type="button" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="field">
      <span className="input-label">{label}</span>
      {children}
    </label>
  );
}

function AvatarBuilder({ avatar, onChange }: { avatar: DogAvatar; onChange: (avatar: DogAvatar) => void }) {
  return (
    <section className="card avatar-builder">
      <div className="section-heading">
        <div>
          <p className="label no-margin">Avatar studio</p>
          <h2>App character</h2>
        </div>
        <Sparkles size={19} />
      </div>
      <div className="avatar-studio">
        <DogAvatar avatar={avatar} />
        <div className="avatar-controls">
          <div>
            <span className="input-label">Fur</span>
            <div className="swatches">
              {avatarOptions.fur.map((color) => (
                <button
                  key={color}
                  aria-label={`Choose fur ${color}`}
                  className={avatar.fur === color ? "color-swatch selected" : "color-swatch"}
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
    <Field label={label}>
      <select className="input" value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </Field>
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

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <article className="card-sm stat-card">
      <div className="stat-icon">{icon}</div>
      <strong>{value}</strong>
      <span>{label}</span>
    </article>
  );
}

function CardActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="card-actions">
      <button className="tiny-btn" type="button" aria-label="Edit" onClick={onEdit}>
        <Pencil size={14} />
      </button>
      <button className="tiny-btn danger" type="button" aria-label="Delete" onClick={onDelete}>
        <Trash2 size={14} />
      </button>
    </div>
  );
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <section className="card empty-state">
      <PawPrint size={30} />
      <h2>{title}</h2>
      <p>{text}</p>
    </section>
  );
}

function BottomNav({ active, onChange }: { active: Tab; onChange: (tab: Tab) => void }) {
  const items: { tab: Tab; label: string; icon: React.ReactNode }[] = [
    { tab: "today", label: "Today", icon: <Home size={19} /> },
    { tab: "diary", label: "Diary", icon: <NotebookPen size={19} /> },
    { tab: "care", label: "Care", icon: <HeartPulse size={19} /> },
    { tab: "calendar", label: "Calendar", icon: <CalendarDays size={19} /> },
    { tab: "profile", label: "Profile", icon: <UserRound size={19} /> },
  ];

  return (
    <nav className="nav-bar">
      {items.map((item) => (
        <button
          className={active === item.tab ? "nav-btn active" : "nav-btn"}
          key={item.tab}
          onClick={() => onChange(item.tab)}
          type="button"
        >
          <span className="nav-icon">{item.icon}</span>
          <span className="nav-label">{item.label}</span>
          {active === item.tab && <span className="nav-active-dot" />}
        </button>
      ))}
    </nav>
  );
}
