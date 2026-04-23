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
  X,
} from "lucide-react";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import type { MouseEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  cloudConfigured,
  missingCloudConfigMessage,
  pushConfigured,
  signInWithGoogle,
  subscribeDeviceToPush,
  supabase,
  uploadLocalPawfolioToAccount,
} from "./cloud";
import {
  ageLabel,
  applyCoachSuggestion,
  avatarOptions,
  bottomNavTabs,
  breedOptions,
  buildCoachSuggestions,
  buildTodayAttentionItems,
  canUseBrowserNotifications,
  careStatus,
  careTypes,
  careEmptyState,
  collectPhotoRefs,
  defaultReminderLeadMinutes,
  deleteCalendarItemFromState,
  deleteCareItemFromState,
  dismissCoachSuggestion,
  diaryEntryPhotos,
  daysTogether,
  estimateDataUrlBytes,
  eventCategory,
  eventsForDate,
  eventsForMonth,
  getCareMoments,
  getNotificationGroups,
  getUpcomingReminder,
  getUpcomingReminders,
  initialState,
  isStoredPhotoRef,
  limitDiaryPhotos,
  medicationDoseUnits,
  medicationConsistency,
  medicationFrequencyOptions,
  normalizeMedicationDose,
  normalizeMedicationFrequency,
  normalizeState,
  notificationBody,
  notificationLeadLabel,
  photoRefPrefix,
  notificationPermissionStatus,
  reminderLeadOptions,
  prettyDate,
  recurrenceLabel,
  reminderRecurrenceOptions,
  reminderTypes,
  reminderCompletionStatus,
  regionFromCoordinates,
  routineCoachInsights,
  safeSetLocalStorage,
  saveCareRecordToState,
  saveReminderToState,
  setTaskDoneForDate,
  setReminderCompletionForDate,
  sortDiaryEntries,
  sortTasksByTime,
  storageKey,
  taskHourOptions,
  taskMeridiemOptions,
  taskMinuteOptions,
  taskTimeFromParts,
  taskTimeParts,
  taskTime,
  tasksForDate,
  todayISO,
  withTaskTime,
  visibleCareRecords,
  visibleReminders,
  validateCareRecord,
  weightTrendSeries,
  type CareRecord,
  type CareRegion,
  type CoachSettings,
  type CoachSuggestion,
  type DailyTask,
  type DiaryEntry,
  type DogAvatar,
  type DogProfile,
  type MedicationDoseUnit,
  type MedicationFrequencyType,
  type PawfolioState,
  type Reminder,
  type ReminderCompletionStatus,
  type ReminderRecurrence,
  type Tab,
} from "./pawfolio";

type TaskMode = { mode: "create" } | { mode: "edit"; task: DailyTask };
type MemoryMode = { mode: "create" } | { mode: "edit"; entry: DiaryEntry };
type CareMode = { mode: "create" } | { mode: "edit"; record: CareRecord };
type ReminderMode = { mode: "create"; date?: string } | { mode: "edit"; reminder: Reminder };
type PhotoRecord = { id: string; dataUrl: string; createdAt: string };
type BackupPayload = { app: "Pawfolio"; version: number; exportedAt: string; state: PawfolioState; photos?: PhotoRecord[] };

const photoDbName = "pawfolio-photos-v1";
const photoStoreName = "photos";

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

function openPhotoDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(photoDbName, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(photoStoreName, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function savePhotoToStore(dataUrl: string) {
  const id = uid("photo");
  const db = await openPhotoDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(photoStoreName, "readwrite");
      transaction.objectStore(photoStoreName).put({ id, dataUrl, createdAt: new Date().toISOString() } satisfies PhotoRecord);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } finally {
    db.close();
  }
  return `${photoRefPrefix}${id}`;
}

async function savePhotoRecordToStore(record: PhotoRecord) {
  const db = await openPhotoDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(photoStoreName, "readwrite");
      transaction.objectStore(photoStoreName).put(record);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } finally {
    db.close();
  }
}

async function loadPhotoFromStore(ref: string) {
  if (!isStoredPhotoRef(ref)) return ref;
  const id = ref.slice(photoRefPrefix.length);
  const db = await openPhotoDb();
  try {
    return await new Promise<string>((resolve, reject) => {
      const transaction = db.transaction(photoStoreName, "readonly");
      const request = transaction.objectStore(photoStoreName).get(id);
      request.onsuccess = () => resolve((request.result as PhotoRecord | undefined)?.dataUrl || "");
      request.onerror = () => reject(request.error);
    });
  } finally {
    db.close();
  }
}

async function loadPhotoRecordFromStore(ref: string) {
  if (!isStoredPhotoRef(ref)) return undefined;
  const id = ref.slice(photoRefPrefix.length);
  const db = await openPhotoDb();
  try {
    return await new Promise<PhotoRecord | undefined>((resolve, reject) => {
      const transaction = db.transaction(photoStoreName, "readonly");
      const request = transaction.objectStore(photoStoreName).get(id);
      request.onsuccess = () => resolve(request.result as PhotoRecord | undefined);
      request.onerror = () => reject(request.error);
    });
  } finally {
    db.close();
  }
}

async function deletePhotoFromStore(ref: string) {
  if (!isStoredPhotoRef(ref)) return;
  const id = ref.slice(photoRefPrefix.length);
  const db = await openPhotoDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(photoStoreName, "readwrite");
      transaction.objectStore(photoStoreName).delete(id);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } finally {
    db.close();
  }
}

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function readCompressedImage(
  file: File,
  maxDimension: number,
  quality = 0.78,
  targetBytes = 220_000,
): Promise<string> {
  if (!file.type.startsWith("image/")) return readFile(file);

  const sourceUrl = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = sourceUrl;
    await image.decode();

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) return readFile(file);

    let dimension = maxDimension;
    let outputQuality = quality;
    let best = "";

    for (let attempt = 0; attempt < 8; attempt += 1) {
      const scale = Math.min(1, dimension / Math.max(image.naturalWidth, image.naturalHeight));
      const width = Math.max(1, Math.round(image.naturalWidth * scale));
      const height = Math.max(1, Math.round(image.naturalHeight * scale));
      canvas.width = width;
      canvas.height = height;
      context.clearRect(0, 0, width, height);
      context.drawImage(image, 0, 0, width, height);
      best = canvas.toDataURL("image/jpeg", outputQuality);
      if (estimateDataUrlBytes(best) <= targetBytes) return best;
      if (outputQuality > 0.52) {
        outputQuality -= 0.1;
      } else {
        dimension = Math.max(360, Math.round(dimension * 0.78));
      }
    }

    return best;
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
  if (record.dose) parts.push(record.dose);
  if (record.frequency) parts.push(record.frequency);
  if (record.refillDate) parts.push(`refill ${prettyLongDate(record.refillDate)}`);
  if (record.clinic) parts.push(record.clinic);
  if (record.vetName) parts.push(record.vetName);
  if (record.reason) parts.push(record.reason);
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

function PhotoImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [resolvedSrc, setResolvedSrc] = useState(isStoredPhotoRef(src) ? "" : src);

  useEffect(() => {
    let active = true;
    if (!isStoredPhotoRef(src)) {
      setResolvedSrc(src);
      return () => {
        active = false;
      };
    }

    loadPhotoFromStore(src)
      .then((photo) => {
        if (active) setResolvedSrc(photo);
      })
      .catch(() => {
        if (active) setResolvedSrc("");
      });

    return () => {
      active = false;
    };
  }, [src]);

  if (!resolvedSrc) return <div className={`${className || ""} photo-loading`} aria-label={`${alt} loading`} />;
  return <img className={className} src={resolvedSrc} alt={alt} />;
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
  const [selectedMemory, setSelectedMemory] = useState<DiaryEntry | null>(null);
  const [saveError, setSaveError] = useState("");
  const [session, setSession] = useState<Session | null>(null);
  const [cloudStatus, setCloudStatus] = useState("");

  useEffect(() => {
    if (!supabase) return undefined;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    let active = true;
    const migratePhotos = async () => {
      let changed = false;
      const next: PawfolioState = {
        ...state,
        profile: state.profile ? { ...state.profile } : undefined,
        diary: state.diary.map((entry) => ({ ...entry })),
      };

      if (next.profile?.photo && !isStoredPhotoRef(next.profile.photo)) {
        try {
          next.profile.photo = await savePhotoToStore(next.profile.photo);
          changed = true;
        } catch {
          // Keep the existing data URL if IndexedDB is unavailable.
        }
      }

      for (const entry of next.diary) {
        const photos = diaryEntryPhotos(entry);
        if (photos.some((photo) => photo && !isStoredPhotoRef(photo))) {
          const migratedPhotos = await Promise.all(
            photos.map(async (photo) => {
              if (!photo || isStoredPhotoRef(photo)) return photo;
              try {
                return await savePhotoToStore(photo);
              } catch {
                return photo;
              }
            }),
          );
          entry.photos = limitDiaryPhotos(migratedPhotos);
          entry.photo = entry.photos[0];
          changed = true;
        } else if (photos.length !== (entry.photos || []).length || entry.photo !== photos[0]) {
          entry.photos = photos;
          entry.photo = photos[0];
          changed = true;
        }
      }

      if (active && changed) setState(next);
    };

    migratePhotos();
    return () => {
      active = false;
    };
  }, [state]);

  useEffect(() => {
    const result = safeSetLocalStorage(localStorage, storageKey, state);
    setSaveError(result.ok ? "" : result.message);
  }, [state]);

  const today = todayISO();
  const todayTasks = useMemo(() => tasksForDate(state.tasks, state.taskHistory, today), [state.tasks, state.taskHistory, today]);
  const completed = todayTasks.filter((task) => task.done).length;
  const progress = todayTasks.length ? completed / todayTasks.length : 0;
  const careRecords = useMemo(() => visibleCareRecords(state), [state]);
  const calendarItems = useMemo(() => visibleReminders(state), [state]);
  const coachSuggestions = useMemo(() => buildCoachSuggestions(state), [state]);
  const todayAttentionItems = useMemo(() => buildTodayAttentionItems(state), [state]);
  const upcomingReminder = useMemo(
    () => getUpcomingReminder(calendarItems, new Date(), state.reminderHistory),
    [calendarItems, state.reminderHistory],
  );

  const handleCoachAction = (suggestion: CoachSuggestion) => {
    if (suggestion.action.type === "add_task") {
      setState((current) => applyCoachSuggestion(current, suggestion.id));
      return;
    }
    if (suggestion.action.type === "open_care") {
      const action = suggestion.action;
      const record = careRecords.find((item) => item.id === action.recordId);
      setTab("care");
      if (record) setCareMode({ mode: "edit", record });
      return;
    }
    if (suggestion.action.type === "open_today") {
      setTab("today");
      return;
    }
    if (suggestion.action.type === "open_reminder") {
      setTab("calendar");
      setReminderMode({ mode: "create" });
      return;
    }
    if (suggestion.action.type === "open_calendar") {
      setTab("calendar");
      return;
    }
    if (suggestion.action.type === "export_data") {
      void exportPawfolioData();
    }
  };

  const exportPawfolioData = async () => {
    const photos = (
      await Promise.all(collectPhotoRefs(state).map((ref) => loadPhotoRecordFromStore(ref)))
    ).filter(Boolean) as PhotoRecord[];
    const payload: BackupPayload = {
      app: "Pawfolio",
      version: 2,
      exportedAt: new Date().toISOString(),
      state,
      photos,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${state.profile?.name || "pawfolio"}-backup.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importPawfolioData = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as BackupPayload | PawfolioState;
      if ("photos" in parsed && parsed.photos?.length) {
        await Promise.all(
          parsed.photos.map((photo) =>
            savePhotoRecordToStore({ ...photo, createdAt: photo.createdAt || new Date().toISOString() }),
          ),
        );
      }
      const importedState = "state" in parsed && parsed.state ? parsed.state : parsed;
      setState(normalizeState(importedState as Partial<PawfolioState>));
      setSaveError("");
    } catch {
      setSaveError("Pawfolio could not import that file. Choose a Pawfolio backup JSON file.");
    }
  };

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
          tasks={todayTasks}
          completed={completed}
          progress={progress}
          upcomingReminder={upcomingReminder}
          attentionItems={todayAttentionItems}
          onToggleTask={(id) =>
            setState((current) => ({
              ...current,
              taskHistory: setTaskDoneForDate(
                current.taskHistory,
                today,
                id,
                !tasksForDate(current.tasks, current.taskHistory, today).find((task) => task.id === id)?.done,
              ),
            }))
          }
          onTaskNote={(id, note) =>
            setState((current) => ({
              ...current,
              tasks: sortTasksByTime(current.tasks.map((task) =>
                task.id === id ? { ...task, note } : task,
              )),
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
          onCoachAction={handleCoachAction}
          onDismissCoach={(id) => setState((current) => dismissCoachSuggestion(current, id))}
        />
      )}

      {tab === "pawpal" && (
        <PawPalScreen
          profile={state.profile}
          suggestions={coachSuggestions}
          onAction={handleCoachAction}
          onDone={(id) => setState((current) => dismissCoachSuggestion(current, id))}
        />
      )}

      {tab === "diary" && (
        <DiaryScreen
          profile={state.profile}
          entries={state.diary}
          onOpenMemory={() => setMemoryMode({ mode: "create" })}
          onOpenEntry={setSelectedMemory}
          onEdit={(entry) => setMemoryMode({ mode: "edit", entry })}
          onDelete={(id) => {
            const entry = state.diary.find((item) => item.id === id);
            diaryEntryPhotos(entry || ({} as DiaryEntry)).forEach((photo) => {
              void deletePhotoFromStore(photo);
            });
            setState((current) => ({
              ...current,
              diary: current.diary.filter((entry) => entry.id !== id),
            }));
            if (selectedMemory?.id === id) setSelectedMemory(null);
          }}
        />
      )}

      {tab === "care" && (
        <CareScreen
          profile={state.profile}
          records={careRecords}
          taskHistory={state.taskHistory}
          tasks={state.tasks}
          reminders={calendarItems}
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
          reminderHistory={state.reminderHistory}
          onOpenReminder={(date) => setReminderMode({ mode: "create", date })}
          onEdit={(reminder) => setReminderMode({ mode: "edit", reminder })}
          onDelete={(id) =>
            setState((current) => deleteCalendarItemFromState(current, id))
          }
          onComplete={(reminder, status) =>
            setState((current) => ({
              ...current,
              reminderHistory: setReminderCompletionForDate(current.reminderHistory, reminder.date, reminder.id, status),
            }))
          }
        />
      )}

      {tab === "profile" && (
        <ProfileScreen
          profile={state.profile}
          diaryCount={state.diary.length}
          walkCount={state.tasks.filter((task) => /walk/i.test(task.title)).length}
          onSave={(profile) => setState((current) => ({ ...current, profile }))}
          onOpenNotifications={() => setNotificationsOpen(true)}
          onExportData={exportPawfolioData}
          onImportData={importPawfolioData}
          notificationPreferences={state.notificationPreferences}
          integrationSettings={state.integrationSettings}
          coachSettings={state.coachSettings}
          session={session}
          cloudStatus={cloudStatus}
          cloudConfigured={cloudConfigured}
          pushConfigured={pushConfigured}
          onSignIn={() => {
            signInWithGoogle().catch((error: Error) => setCloudStatus(error.message));
          }}
          onSignOut={() => {
            supabase?.auth.signOut();
            setCloudStatus("Signed out.");
          }}
          onUploadCloud={() => {
            uploadLocalPawfolioToAccount(state)
              .then(() => setCloudStatus("Local Pawfolio uploaded to your account."))
              .catch((error: Error) => setCloudStatus(error.message));
          }}
          onEnablePush={() => {
            if (!session) {
              setCloudStatus("Sign in before enabling phone push.");
              return;
            }
            subscribeDeviceToPush(session)
              .then(() => setCloudStatus("This phone is saved for Pawfolio push reminders."))
              .catch((error: Error) => setCloudStatus(error.message));
          }}
          onTogglePreference={(key) =>
            setState((current) => ({
              ...current,
              notificationPreferences: {
                ...current.notificationPreferences,
                [key]: !current.notificationPreferences[key],
              },
            }))
          }
          onToggleCoach={() =>
            setState((current) => ({
              ...current,
              coachSettings: {
                ...current.coachSettings,
                enabled: !current.coachSettings.enabled,
              },
              routineCoachSettings: {
                ...current.routineCoachSettings,
                enabled: !current.coachSettings.enabled,
              },
            }))
          }
          onUpdateCoachSettings={(settings) =>
            setState((current) => ({
              ...current,
              coachSettings: {
                ...current.coachSettings,
                ...settings,
              },
              routineCoachSettings:
                typeof settings.enabled === "boolean"
                  ? { ...current.routineCoachSettings, enabled: settings.enabled }
                  : current.routineCoachSettings,
            }))
          }
        />
      )}

      <button
        className={tab === "pawpal" ? "pawpal-fab active" : "pawpal-fab"}
        type="button"
        onClick={() => setTab("pawpal")}
        aria-label="Open PawPal"
      >
        <span className="pawpal-fab-icon">
          <Sparkles size={17} />
        </span>
        <span>PawPal</span>
      </button>
      <BottomNav active={tab} onChange={setTab} />

      {taskMode && (
        <TaskSheet
          mode={taskMode}
          onClose={() => setTaskMode(null)}
          onSave={(task) => {
            setState((current) => ({
              ...current,
              tasks: sortTasksByTime(
                taskMode.mode === "edit"
                  ? current.tasks.map((item) => (item.id === task.id ? task : item))
                  : [...current.tasks, task],
              ),
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
              diary: sortDiaryEntries(
                memoryMode.mode === "edit"
                  ? current.diary.map((item) => (item.id === entry.id ? entry : item))
                  : [entry, ...current.diary],
              ),
            }));
            setMemoryMode(null);
          }}
        />
      )}

      {selectedMemory && (
        <MemoryDetailSheet
          entry={selectedMemory}
          onClose={() => setSelectedMemory(null)}
          onEdit={(entry) => {
            setSelectedMemory(null);
            setMemoryMode({ mode: "edit", entry });
          }}
          onDelete={(id) => {
            diaryEntryPhotos(selectedMemory).forEach((photo) => {
              void deletePhotoFromStore(photo);
            });
            setState((current) => ({
              ...current,
              diary: current.diary.filter((entry) => entry.id !== id),
            }));
            setSelectedMemory(null);
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
          reminderHistory={state.reminderHistory}
          onComplete={(reminder, status) =>
            setState((current) => ({
              ...current,
              reminderHistory: setReminderCompletionForDate(current.reminderHistory, reminder.date, reminder.id, status),
            }))
          }
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
    personalityTags: ["Playful", "Energetic", "Food-motivated"],
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
    const compressedPhoto = await readCompressedImage(file, 512, 0.78, 120_000);
    const photo = await savePhotoToStore(compressedPhoto).catch(() => compressedPhoto);
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
              <PhotoImage src={profile.photo} alt="Dog profile preview" />
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
  attentionItems,
  onToggleTask,
  onTaskNote,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onOpenMemory,
  onOpenNotifications,
  onCoachAction,
  onDismissCoach,
}: {
  profile: DogProfile;
  tasks: DailyTask[];
  completed: number;
  progress: number;
  upcomingReminder?: Reminder;
  attentionItems: CoachSuggestion[];
  onToggleTask: (id: string) => void;
  onTaskNote: (id: string, note: string) => void;
  onAddTask: () => void;
  onEditTask: (task: DailyTask) => void;
  onDeleteTask: (id: string) => void;
  onOpenMemory: () => void;
  onOpenNotifications: () => void;
  onCoachAction: (suggestion: CoachSuggestion) => void;
  onDismissCoach: (id: string) => void;
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
              <PhotoImage src={profile.photo} alt={profile.name} />
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

      <section className="attention-card">
        <p className="label no-margin">Today needs attention</p>
        {attentionItems.length ? (
          <div className="attention-list">
            {attentionItems.map((item) => (
              <article className="attention-item" key={item.id}>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </div>
                <div className="attention-actions">
                  <button className="link-btn" type="button" onClick={() => onCoachAction(item)}>
                    {item.actionLabel}
                  </button>
                  <button className="link-btn muted" type="button" onClick={() => onDismissCoach(item.id)}>
                    Done
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p>Everything looks calm for today.</p>
        )}
      </section>

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

function PawPalScreen({
  profile,
  suggestions,
  onAction,
  onDone,
}: {
  profile: DogProfile;
  suggestions: CoachSuggestion[];
  onAction: (suggestion: CoachSuggestion) => void;
  onDone: (id: string) => void;
}) {
  const groups = [
    { type: "care_gap", label: "Care attention" },
    { type: "routine_pattern", label: "Routine patterns" },
    { type: "seasonal", label: "Seasonal care" },
    { type: "calendar", label: "Calendar help" },
    { type: "backup", label: "Data safety" },
  ] as const;

  return (
    <section className="screen pawpal-screen">
      <ScreenHeader
        label={`${profile.name}'s companion`}
        title="PawPal"
        action={
          <span className="pawpal-orb" aria-hidden="true">
            <Sparkles size={20} />
          </span>
        }
      />
      <section className="pawpal-hero">
        <div>
          <p className="label no-margin">Local helper</p>
          <h2>Little nudges for a calmer care day.</h2>
          <p>PawPal looks at Pawfolio data on this device and suggests practical next steps.</p>
        </div>
      </section>
      {suggestions.length === 0 ? (
        <EmptyState title="PawPal is all caught up" text="No care gaps or helpful nudges right now. Nice and calm." />
      ) : (
        groups.map((group) => {
          const groupSuggestions = suggestions.filter((suggestion) => suggestion.type === group.type);
          if (groupSuggestions.length === 0) return null;
          return (
            <section className="pawpal-group" key={group.type}>
              <p className="label">{group.label}</p>
              <div className="coach-list">
                {groupSuggestions.map((suggestion) => (
                  <article className={`coach-suggestion coach-${suggestion.type}`} key={suggestion.id}>
                    <div>
                      <h3>{suggestion.title}</h3>
                      <p>{suggestion.body}</p>
                    </div>
                    <div className="coach-actions">
                      <button className="btn btn-sm btn-secondary" type="button" onClick={() => onAction(suggestion)}>
                        {suggestion.actionLabel}
                      </button>
                      {suggestion.dismissible && (
                        <button className="btn btn-sm btn-ghost" type="button" onClick={() => onDone(suggestion.id)}>
                          Done
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          );
        })
      )}
    </section>
  );
}

function DiaryScreen({
  profile,
  entries,
  onOpenMemory,
  onOpenEntry,
  onEdit,
  onDelete,
}: {
  profile: DogProfile;
  entries: DiaryEntry[];
  onOpenMemory: () => void;
  onOpenEntry: (entry: DiaryEntry) => void;
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
        entries.map((entry) => {
          const photos = diaryEntryPhotos(entry);
          return (
            <article className="diary-entry" key={entry.id}>
              <button className="diary-open" type="button" onClick={() => onOpenEntry(entry)}>
                <div className="diary-photo-wrap">
                  {photos[0] ? (
                    <PhotoImage className="diary-photo" src={photos[0]} alt={entry.title} />
                  ) : (
                    <div className="diary-photo photo-placeholder">
                      <Camera size={18} />
                      <span>{entry.title.toLowerCase()}</span>
                    </div>
                  )}
                  {photos.length > 1 && <span className="photo-count">1/{photos.length}</span>}
                </div>
                <div className="diary-entry-body">
                  <div className="entry-head">
                    <span className="badge badge-amber">{prettyDate(entry.date)}</span>
                    <span className="diary-tap-hint">View</span>
                  </div>
                  <h2>{entry.title}</h2>
                  <p>{entry.body || "No journal note yet."}</p>
                </div>
              </button>
              <div className="diary-card-actions" onClick={(event) => event.stopPropagation()}>
                <CardActions onEdit={() => onEdit(entry)} onDelete={() => onDelete(entry.id)} />
              </div>
            </article>
          );
        })
      )}
    </section>
  );
}

function MemoryDetailSheet({
  entry,
  onClose,
  onEdit,
  onDelete,
}: {
  entry: DiaryEntry;
  onClose: () => void;
  onEdit: (entry: DiaryEntry) => void;
  onDelete: (id: string) => void;
}) {
  const photos = diaryEntryPhotos(entry);

  return (
    <Sheet title={entry.title || "Memory"} onClose={onClose}>
      <div className="memory-detail">
        <div className="entry-head">
          <span className="badge badge-amber">{prettyDate(entry.date)}</span>
          <CardActions onEdit={() => onEdit(entry)} onDelete={() => onDelete(entry.id)} />
        </div>
        {photos.length > 0 ? (
          <div className="memory-gallery">
            {photos.map((photo, index) => (
              <PhotoImage
                className={index === 0 ? "memory-photo featured" : "memory-photo"}
                key={`${photo}-${index}`}
                src={photo}
                alt={`${entry.title} photo ${index + 1}`}
              />
            ))}
          </div>
        ) : (
          <div className="memory-photo featured photo-placeholder">
            <Camera size={20} />
            <span>No photo saved</span>
          </div>
        )}
        <section className="memory-note">
          <p className="label no-margin">Journal note</p>
          <p>{entry.body || "No journal note yet."}</p>
        </section>
      </div>
    </Sheet>
  );
}

function CareScreen({
  profile,
  records,
  taskHistory,
  tasks,
  reminders,
  onOpenCare,
  onEdit,
  onDelete,
}: {
  profile: DogProfile;
  records: CareRecord[];
  taskHistory: PawfolioState["taskHistory"];
  tasks: DailyTask[];
  reminders: Reminder[];
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
  const empty = careEmptyState(activeCareTab);
  const weights = weightTrendSeries(records);
  const meds = medicationConsistency(records);
  const coachInsights = routineCoachInsights(tasks, taskHistory, reminders, records);

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
      <CareHistoryPanel activeTab={activeCareTab} records={filteredRecords} weights={weights} meds={meds} insights={coachInsights} />
      {filteredRecords.length === 0 ? (
        <EmptyState
          title={empty.title}
          text={empty.text}
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

function CareHistoryPanel({
  activeTab,
  records,
  weights,
  meds,
  insights,
}: {
  activeTab: string;
  records: CareRecord[];
  weights: ReturnType<typeof weightTrendSeries>;
  meds: ReturnType<typeof medicationConsistency>;
  insights: string[];
}) {
  if (activeTab === "Weight") {
    return (
      <section className="care-history card">
        <div className="section-heading">
          <div>
            <p className="label no-margin">Weight trend</p>
            <h2>{weights.length ? `${weights[weights.length - 1].value} ${weights[weights.length - 1].unit}` : "No weights yet"}</h2>
          </div>
        </div>
        <div className="mini-chart" aria-label="Weight trend chart">
          {weights.slice(-6).map((point) => (
            <span
              key={`${point.date}-${point.value}`}
              style={{ height: `${Math.max(12, Math.min(88, point.value * 2))}%` }}
              title={`${point.date}: ${point.value} ${point.unit}`}
            />
          ))}
        </div>
      </section>
    );
  }

  if (activeTab === "Meds") {
    return (
      <section className="care-history card">
        <p className="label no-margin">Medication consistency</p>
        <div className="mini-metrics">
          <span><strong>{meds.last30Days}</strong> last 30 days</span>
          <span><strong>{meds.withDose}/{meds.total}</strong> with dose</span>
          <span><strong>{meds.withFrequency}/{meds.total}</strong> with frequency</span>
        </div>
      </section>
    );
  }

  if (activeTab === "Vaccines" || activeTab === "Vet visits") {
    return (
      <section className="care-history card">
        <p className="label no-margin">{activeTab === "Vaccines" ? "Vaccine follow-ups" : "Visit follow-ups"}</p>
        <p>{records.filter((record) => record.nextDueDate).length || 0} records have a next date saved.</p>
      </section>
    );
  }

  return (
    <section className="care-history card">
      <p className="label no-margin">Routine Coach</p>
      <p>{insights[0]}</p>
    </section>
  );
}

function CalendarScreen({
  reminders,
  reminderHistory,
  onOpenReminder,
  onEdit,
  onDelete,
  onComplete,
}: {
  reminders: Reminder[];
  reminderHistory: PawfolioState["reminderHistory"];
  onOpenReminder: (date?: string) => void;
  onEdit: (reminder: Reminder) => void;
  onDelete: (id: string) => void;
  onComplete: (reminder: Reminder, status?: ReminderCompletionStatus) => void;
}) {
  const [visibleMonth, setVisibleMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [showAllUpcoming, setShowAllUpcoming] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const currentMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const monthEvents = eventsForMonth(reminders, visibleMonth);
  const upcoming = getUpcomingReminders(reminders, new Date(), reminderHistory);
  const visibleUpcoming = showAllUpcoming ? upcoming : upcoming.slice(0, 3);
  const isCurrentMonth = monthKey(visibleMonth) === monthKey(currentMonth);
  const selectedDateEvents = selectedDate ? eventsForDate(reminders, selectedDate) : [];
  const completedToday = reminders
    .map((reminder) => ({ ...reminder, date: todayISO() }))
    .filter((reminder) => reminderCompletionStatus(reminderHistory, reminder));

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
              <button className="mini-done-btn" type="button" onClick={() => onComplete(reminder, "done")}>
                Mark done
              </button>
            </div>
            <CardActions onEdit={() => onEdit(reminder)} onDelete={() => onDelete(reminder.id)} />
          </article>
        ))
      )}
      {completedToday.length > 0 && (
        <>
          <p className="label">Completed today</p>
          {completedToday.map((reminder) => (
            <DayReminderItem
              key={`done-${reminder.id}-${reminder.date}`}
              reminder={reminder}
              status={reminderCompletionStatus(reminderHistory, reminder)}
              onEdit={onEdit}
              onDelete={onDelete}
              onComplete={onComplete}
            />
          ))}
        </>
      )}
      {selectedDate && (
        <DayDetailSheet
          date={selectedDate}
          reminders={selectedDateEvents}
          reminderHistory={reminderHistory}
          onAdd={() => {
            onOpenReminder(selectedDate);
            setSelectedDate(null);
          }}
          onEdit={(reminder) => {
            onEdit(reminder);
            setSelectedDate(null);
          }}
          onDelete={onDelete}
          onComplete={onComplete}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </section>
  );
}

function DayDetailSheet({
  date,
  reminders,
  reminderHistory,
  onAdd,
  onEdit,
  onDelete,
  onComplete,
  onClose,
}: {
  date: string;
  reminders: Reminder[];
  reminderHistory: PawfolioState["reminderHistory"];
  onAdd: () => void;
  onEdit: (reminder: Reminder) => void;
  onDelete: (id: string) => void;
  onComplete: (reminder: Reminder, status?: ReminderCompletionStatus) => void;
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
          <DayReminderItem
            key={`${reminder.id}-${reminder.date}`}
            reminder={reminder}
            status={reminderCompletionStatus(reminderHistory, reminder)}
            onEdit={onEdit}
            onDelete={onDelete}
            onComplete={onComplete}
          />
        ))
      )}
    </Sheet>
  );
}

function DayReminderItem({
  reminder,
  status,
  onEdit,
  onDelete,
  onComplete,
}: {
  reminder: Reminder;
  status?: ReminderCompletionStatus;
  onEdit: (reminder: Reminder) => void;
  onDelete: (id: string) => void;
  onComplete: (reminder: Reminder, status?: ReminderCompletionStatus) => void;
}) {
  return (
    <article className={`event-item day-event event-${eventCategory(reminder.type)} ${status ? "event-complete" : ""}`}>
      <div className="event-date-block">
        <strong>{reminder.time || "--"}</strong>
        <span>{reminder.time ? "time" : "any"}</span>
      </div>
      <div className="event-copy">
        <div className="badge-row">
          {reminder.recurrence !== "none" && <span className="badge badge-amber">{recurrenceLabel(reminder.recurrence)}</span>}
          {status && <span className={status === "done" ? "badge badge-green" : "badge badge-gray"}>{status === "done" ? "Done" : "Skipped"}</span>}
        </div>
        <h2>{reminder.title}</h2>
        <p>{reminder.type}{reminder.note && ` - ${reminder.note}`}</p>
        <div className="reminder-status-actions">
          <button className="mini-done-btn" type="button" onClick={() => onComplete(reminder, status === "done" ? undefined : "done")}>
            {status === "done" ? "Undo" : "Done"}
          </button>
          <button className="mini-skip-btn" type="button" onClick={() => onComplete(reminder, status === "skipped" ? undefined : "skipped")}>
            {status === "skipped" ? "Undo skip" : "Skip"}
          </button>
        </div>
      </div>
      <CardActions onEdit={() => onEdit(reminder)} onDelete={() => onDelete(reminder.id)} />
    </article>
  );
}

function NotificationsSheet({
  reminders,
  reminderHistory,
  onComplete,
  onClose,
}: {
  reminders: Reminder[];
  reminderHistory: PawfolioState["reminderHistory"];
  onComplete: (reminder: Reminder, status?: ReminderCompletionStatus) => void;
  onClose: () => void;
}) {
  const notificationApi = typeof Notification === "undefined" ? undefined : Notification;
  const [permission, setPermission] = useState(() => notificationPermissionStatus(notificationApi));
  const [testStatus, setTestStatus] = useState("");
  const groups = getNotificationGroups(reminders, new Date(), reminderHistory);
  const upcoming = getUpcomingReminders(reminders, new Date(), reminderHistory).slice(0, 6);
  const supported = canUseBrowserNotifications(notificationApi);

  const testNotification = async () => {
    if (!supported || !notificationApi) {
      setTestStatus("Notifications are not supported in this browser.");
      return;
    }

    const nextPermission =
      notificationApi.permission === "default" ? await notificationApi.requestPermission() : notificationApi.permission;
    setPermission(nextPermission);

    if (nextPermission !== "granted") {
      setTestStatus("Notifications are blocked. Enable them in your browser or phone app settings.");
      return;
    }

    const body = notificationBody(upcoming[0]);
    try {
      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification("Pawfolio reminder", {
          body,
          icon: "/pwa-192x192.png",
          badge: "/pwa-192x192.png",
          tag: "pawfolio-test-reminder",
        });
      } else {
        new Notification("Pawfolio reminder", { body });
      }
      setTestStatus("Test notification sent. On Android, check the notification shade if you do not see it pop up.");
    } catch {
      try {
        new Notification("Pawfolio reminder", { body });
        setTestStatus("Test notification sent.");
      } catch {
        setTestStatus("Pawfolio could not send a test notification here. Try from the installed app on your phone.");
      }
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
            Enable & test
          </button>
        )}
      </section>

      <p className="notice-copy">
        Install Pawfolio on Android, open this sheet, and tap Enable & test to confirm phone notifications. Automatic background reminders still need backend push later.
      </p>
      {testStatus && <p className="notice-copy notice-status">{testStatus}</p>}

      <div className="label-row">
        <p className="label no-margin">Reminder timing</p>
        <span>{upcoming.length} active</span>
      </div>
      {upcoming.length === 0 ? (
        <section className="day-empty">
          <Bell size={22} />
          <h3>No upcoming reminders</h3>
          <p>Add calendar reminders for medicine, vaccines, vet visits, grooming, food, walks, or other care.</p>
        </section>
      ) : (
        <>
          <NotificationGroup title="Due now" reminders={groups.dueNow} onComplete={onComplete} />
          <NotificationGroup title="Soon" reminders={groups.soon} onComplete={onComplete} />
          <NotificationGroup title="Upcoming" reminders={groups.upcoming.slice(0, 6)} onComplete={onComplete} />
        </>
      )}
    </Sheet>
  );
}

function NotificationGroup({
  title,
  reminders,
  onComplete,
}: {
  title: string;
  reminders: Reminder[];
  onComplete: (reminder: Reminder, status?: ReminderCompletionStatus) => void;
}) {
  if (reminders.length === 0) return null;
  return (
    <section className="notification-group">
      <p className="label">{title}</p>
      {reminders.map((reminder) => (
        <article className={`event-item notification-item event-${eventCategory(reminder.type)}`} key={reminder.id}>
          <div className="event-date-block">
            <strong>{new Date(`${reminder.date}T00:00`).getDate()}</strong>
            <span>{new Date(`${reminder.date}T00:00`).toLocaleDateString("en", { month: "short" })}</span>
          </div>
          <div className="event-copy">
            <div className="badge-row">
              {reminder.recurrence !== "none" && <span className="badge badge-amber">{recurrenceLabel(reminder.recurrence)}</span>}
              <span className="badge badge-green">{notificationLeadLabel(reminder)}</span>
            </div>
            <h2>{reminder.title}</h2>
            <p>{reminder.type} - {reminder.time || "Any time"}{reminder.note && ` - ${reminder.note}`}</p>
            <button className="mini-done-btn" type="button" onClick={() => onComplete(reminder, "done")}>
              Mark done
            </button>
          </div>
        </article>
      ))}
    </section>
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
  onSave,
  onOpenNotifications,
  onExportData,
  onImportData,
  notificationPreferences,
  integrationSettings,
  coachSettings,
  session,
  cloudStatus,
  cloudConfigured: isCloudConfigured,
  pushConfigured: isPushConfigured,
  onSignIn,
  onSignOut,
  onUploadCloud,
  onEnablePush,
  onTogglePreference,
  onToggleCoach,
  onUpdateCoachSettings,
}: {
  profile: DogProfile;
  diaryCount: number;
  walkCount: number;
  onSave: (profile: DogProfile) => void;
  onOpenNotifications: () => void;
  onExportData: () => void;
  onImportData: (file: File) => Promise<void>;
  notificationPreferences: PawfolioState["notificationPreferences"];
  integrationSettings: PawfolioState["integrationSettings"];
  coachSettings: CoachSettings;
  session: Session | null;
  cloudStatus: string;
  cloudConfigured: boolean;
  pushConfigured: boolean;
  onSignIn: () => void;
  onSignOut: () => void;
  onUploadCloud: () => void;
  onEnablePush: () => void;
  onTogglePreference: (key: keyof PawfolioState["notificationPreferences"]) => void;
  onToggleCoach: () => void;
  onUpdateCoachSettings: (settings: Partial<CoachSettings>) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [climateOpen, setClimateOpen] = useState(false);
  const [locationStatus, setLocationStatus] = useState("");
  const enableAutoLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus("Location is not supported in this browser.");
      onUpdateCoachSettings({ locationMode: "manual" });
      return;
    }
    setLocationStatus("Checking broad region...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const region = regionFromCoordinates(position.coords.latitude, position.coords.longitude);
        onUpdateCoachSettings({ locationMode: "auto", careRegion: region });
        setLocationStatus(`Using ${region} for broad seasonal care tips.`);
      },
      () => {
        setLocationStatus("Location permission was not enabled. Manual region still works.");
        onUpdateCoachSettings({ locationMode: "manual" });
      },
      { enableHighAccuracy: false, maximumAge: 86_400_000, timeout: 8000 },
    );
  };

  return (
    <section className="screen profile-screen">
      <section className="profile-hero">
        <div className="profile-photo profile-photo-ring">
          {profile.photo ? <PhotoImage src={profile.photo} alt={profile.name} /> : <DogAvatar avatar={profile.avatar} small />}
        </div>
        <h1>{profile.name}</h1>
        <p>{profile.breed || "Breed not set"} - {ageLabel(profile.birthday)} - {profile.weight || "Weight not set"}</p>
      <div className="quick-pills center">
          {(profile.personalityTags?.length ? profile.personalityTags : ["Playful", "Energetic", "Food-motivated"]).map((tag, index) => (
            <span className={index % 3 === 0 ? "badge badge-amber" : index % 3 === 1 ? "badge badge-green" : "badge badge-blue"} key={tag}>{tag}</span>
          ))}
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
      <section className="card settings-card">
        <p className="label no-margin">Integrations</p>
        <SettingRow label="Google Calendar" value={integrationStatusLabel(integrationSettings.googleCalendar)} checked={notificationPreferences.googleCalendar} onToggle={() => onTogglePreference("googleCalendar")} />
        <SettingRow label="Email reminders" value={integrationStatusLabel(integrationSettings.email)} checked={notificationPreferences.email} onToggle={() => onTogglePreference("email")} />
        <SettingRow label="Phone push" value={integrationStatusLabel(integrationSettings.push)} checked={notificationPreferences.push} onToggle={() => onTogglePreference("push")} />
        <SettingRow label="In-app reminders" value="Active now" checked={notificationPreferences.inApp} onToggle={() => onTogglePreference("inApp")} />
      </section>
      <section className="card settings-card">
        <p className="label no-margin">PawPal</p>
        <SettingRow label="Pattern suggestions" value="Local and private" checked={coachSettings.enabled} onToggle={onToggleCoach} />
        <SettingRow
          label="Seasonal tips"
          value="Breed and season"
          checked={coachSettings.seasonalTips}
          onToggle={() => onUpdateCoachSettings({ seasonalTips: !coachSettings.seasonalTips })}
        />
        <div className={climateOpen ? "coach-location-settings cute-region open" : "coach-location-settings cute-region"}>
          <button
            className="climate-care-toggle"
            type="button"
            onClick={() => setClimateOpen((current) => !current)}
            aria-expanded={climateOpen}
          >
            <span className="companion-mini-icon"><Sparkles size={15} /></span>
            <span>
              <strong>Climate care</strong>
              <small>{coachSettings.locationMode === "off" ? "Location off" : coachSettings.locationMode === "auto" ? `Using ${coachSettings.careRegion}` : coachSettings.careRegion}</small>
            </span>
            <ChevronRight className="climate-chevron" size={16} />
          </button>
          {climateOpen && (
            <>
              <div className="region-chip-grid">
                {(["North America", "Europe", "Hot climate", "Cold climate", "Custom"] as CareRegion[]).map((region) => (
                  <button
                    className={coachSettings.locationMode !== "off" && coachSettings.careRegion === region ? "region-chip active" : "region-chip"}
                    key={region}
                    type="button"
                    onClick={() => onUpdateCoachSettings({ locationMode: "manual", careRegion: region })}
                  >
                    <span>{region}</span>
                  </button>
                ))}
              </div>
              <div className="coach-location-actions">
                <button className="btn btn-sm btn-secondary" type="button" onClick={enableAutoLocation}>
                  Use broad location
                </button>
                <button className="btn btn-sm btn-ghost" type="button" onClick={() => onUpdateCoachSettings({ locationMode: "off" })}>
                  Turn off
                </button>
              </div>
              {locationStatus && <p className="settings-note">{locationStatus}</p>}
            </>
          )}
        </div>
        <p className="settings-note">PawPal uses Pawfolio data on this device. Location is optional and only used for broad care context. LLM help can come later after cloud/privacy is ready.</p>
      </section>
      <section className="card settings-card">
        <p className="label no-margin">Cloud sync plan</p>
        <div className="cloud-card">
          <div>
            <h3>{session ? "Signed in" : "Private account"}</h3>
            <p>{session?.user.email || (isCloudConfigured ? "Google sign-in is ready." : missingCloudConfigMessage())}</p>
          </div>
          <button className="btn btn-sm btn-secondary" type="button" onClick={session ? onSignOut : onSignIn} disabled={!isCloudConfigured}>
            {session ? "Sign out" : "Sign in"}
          </button>
        </div>
        <button className="setting-row" type="button" onClick={onUploadCloud} disabled={!session}>
          <span>
            <strong>Upload local Pawfolio</strong>
            <small>Copies this phone's saved data into your private account.</small>
          </span>
          <ChevronRight size={17} />
        </button>
        <button className="setting-row" type="button" onClick={onEnablePush} disabled={!session || !isPushConfigured}>
          <span>
            <strong>Enable phone push</strong>
            <small>{isPushConfigured ? "Save this phone for scheduled reminders." : "Add VAPID keys first."}</small>
          </span>
          <ChevronRight size={17} />
        </button>
        {cloudStatus && <p className="settings-note">{cloudStatus}</p>}
      </section>
      <div className="profile-actions">
        <ProfileAction icon={<Pencil size={18} />} label="Edit profile" onClick={() => setEditing(true)} />
        <ProfileAction icon={<Bell size={18} />} label="Notifications" onClick={onOpenNotifications} />
        <ProfileAction icon={<Download size={18} />} label="Export Pawfolio data" onClick={onExportData} />
        <label className="profile-action card-sm import-action">
          <span className="profile-action-icon"><Download size={18} /></span>
          <span>Import Pawfolio data</span>
          <ChevronRight size={17} />
          <input
            type="file"
            accept="application/json"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void onImportData(file);
              event.currentTarget.value = "";
            }}
          />
        </label>
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

function SettingRow({
  label,
  value,
  checked,
  onToggle,
}: {
  label: string;
  value: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button className="setting-row" type="button" onClick={onToggle}>
      <span>
        <strong>{label}</strong>
        <small>{value}</small>
      </span>
      <span className={checked ? "toggle-pill on" : "toggle-pill"}>{checked ? "On" : "Off"}</span>
    </button>
  );
}

function integrationStatusLabel(status: string) {
  if (status === "connected" || status === "configured" || status === "enabled") return "Connected";
  if (status === "planned") return "Planned";
  if (status === "local_only") return "Local only";
  return "Not connected";
}

function isSharedCareTypeLabel(type: string) {
  return type === "Medication" || type === "Vaccine" || type === "Vet visit";
}

function ReminderLeadChips({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="choice-chip-row reminder-lead-row">
      {reminderLeadOptions.map((option) => (
        <button
          className={value === option.value ? "choice-chip active" : "choice-chip"}
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
        >
          {option.label.replace(" before", "")}
        </button>
      ))}
    </div>
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
    const compressedPhoto = await readCompressedImage(file, 512, 0.78, 120_000);
    const photo = await savePhotoToStore(compressedPhoto).catch(() => compressedPhoto);
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
            {draft.photo ? <PhotoImage src={draft.photo} alt={draft.name} /> : <DogAvatar avatar={draft.avatar} />}
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
      <Field label="Personality tags">
        <input
          className="input"
          value={(draft.personalityTags || []).join(", ")}
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              personalityTags: event.target.value.split(",").map((tag) => tag.trim()).filter(Boolean),
            }))
          }
          placeholder="Playful, Energetic, Food-motivated"
        />
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
  const [timeParts, setTimeParts] = useState(() => taskTimeParts(existing?.time || "08:00"));
  const time = taskTimeFromParts(timeParts.hour, timeParts.minute, timeParts.meridiem);

  return (
    <Sheet title={mode.mode === "edit" ? "Edit task" : "Add task"} onClose={onClose}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!title.trim()) return;
          onSave({
            id: existing?.id || uid("task"),
            title: title.trim(),
            time: withTaskTime({ ...(existing || { id: "preview", title: title.trim(), done: false, note: "" }), title: title.trim(), time }).time,
            done: existing?.done || false,
            note: existing?.note || "",
          });
        }}
      >
        <Field label="Task title">
          <input className="input" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Afternoon walk" required />
        </Field>
        <Field label="Time">
          <TaskTimePicker
            hour={timeParts.hour}
            minute={timeParts.minute}
            meridiem={timeParts.meridiem}
            onChange={(next) => setTimeParts((current) => ({ ...current, ...next }))}
          />
        </Field>
        <button className="btn btn-primary">{mode.mode === "edit" ? "Save task" : "Add task"}</button>
      </form>
    </Sheet>
  );
}

function TaskTimePicker({
  hour,
  minute,
  meridiem,
  onChange,
}: {
  hour: string;
  minute: string;
  meridiem: string;
  onChange: (next: Partial<{ hour: string; minute: string; meridiem: string }>) => void;
}) {
  return (
    <div className="task-time-picker" aria-label="Task time">
      <label>
        <select value={hour} onChange={(event) => onChange({ hour: event.target.value })}>
          {taskHourOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
      <label>
        <select value={minute} onChange={(event) => onChange({ minute: event.target.value })}>
          {taskMinuteOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
      <label>
        <select value={meridiem} onChange={(event) => onChange({ meridiem: event.target.value })}>
          {taskMeridiemOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
    </div>
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
  const [photos, setPhotos] = useState<string[]>(() => diaryEntryPhotos(existing || ({} as DiaryEntry)));

  const updatePhoto = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = [...(event.target.files || [])].slice(0, Math.max(0, 6 - photos.length));
    if (files.length === 0) return;
    const nextPhotos = await Promise.all(
      files.map(async (file) => {
        const compressedPhoto = await readCompressedImage(file, 760, 0.72, 180_000);
        try {
          return await savePhotoToStore(compressedPhoto);
        } catch {
          return readCompressedImage(file, 560, 0.58, 90_000);
        }
      }),
    );
    setPhotos((current) => limitDiaryPhotos([...current, ...nextPhotos]));
    event.target.value = "";
  };

  return (
    <Sheet title={mode.mode === "edit" ? "Edit memory" : "Add memory"} onClose={onClose}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const savedPhotos = limitDiaryPhotos(photos);
          onSave({ id: existing?.id || uid("memory"), title, body, date, photo: savedPhotos[0], photos: savedPhotos });
        }}
      >
        <Field label="Photo">
          <label className="btn btn-secondary upload-btn full">
            <Camera size={17} />
            {photos.length ? `${photos.length}/6 photos ready` : "Choose photos"}
            <input type="file" accept="image/*" multiple onChange={updatePhoto} />
          </label>
          {photos.length > 0 && (
            <div className="photo-strip">
              {photos.map((photo, index) => (
                <div className="photo-thumb" key={`${photo}-${index}`}>
                  <PhotoImage src={photo} alt={`Memory photo ${index + 1}`} />
                  <button
                    className="thumb-remove"
                    type="button"
                    onClick={() => {
                      setPhotos((current) => current.filter((_, photoIndex) => photoIndex !== index));
                    }}
                    aria-label={`Remove photo ${index + 1}`}
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
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
  const normalizedExisting = existing ? normalizeMedicationFrequency(normalizeMedicationDose(existing)) : undefined;
  const [record, setRecord] = useState({
    type: normalizedExisting?.type || "Weight",
    title: normalizedExisting?.title || "",
    date: normalizedExisting?.date || todayISO(),
    nextDueDate: normalizedExisting?.nextDueDate || "",
    note: normalizedExisting?.note || "",
    dose: normalizedExisting?.dose || "",
    doseAmount: normalizedExisting?.doseAmount || "",
    doseUnit: normalizedExisting?.doseUnit || ("chew" as MedicationDoseUnit),
    frequency: normalizedExisting?.frequency || "",
    frequencyType: normalizedExisting?.frequencyType || ("monthly" as MedicationFrequencyType),
    frequencyInterval: normalizedExisting?.frequencyInterval || 1,
    refillDate: normalizedExisting?.refillDate || "",
    notifyLeadMinutes: normalizedExisting?.notifyLeadMinutes ?? defaultReminderLeadMinutes(normalizedExisting?.type || "Weight"),
    clinic: normalizedExisting?.clinic || "",
    vetName: normalizedExisting?.vetName || "",
    reason: normalizedExisting?.reason || "",
    weightValue: normalizedExisting?.weightValue || "",
    weightUnit: normalizedExisting?.weightUnit || "lb",
  });

  const update = (key: keyof typeof record, value: string) => {
    setRecord((current) => ({ ...current, [key]: value }));
  };
  const errors = validateCareRecord(record);
  const canSave = Object.keys(errors).length === 0;

  return (
    <Sheet title={mode.mode === "edit" ? "Edit care record" : "Add care record"} onClose={onClose}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const title =
            record.type === "Weight" && record.weightValue
              ? `${record.weightValue} ${record.weightUnit || "lb"}`
              : record.title;
          if (!canSave) return;
          const savedRecord = record.type === "Medication"
            ? normalizeMedicationFrequency(normalizeMedicationDose({ id: existing?.id || uid("care"), ...record, title }))
            : { id: existing?.id || uid("care"), ...record, title };
          onSave(savedRecord);
        }}
      >
        <div className="form-two">
          <Field label="Type">
            <select
              className="input"
              value={record.type}
              onChange={(event) =>
                setRecord((current) => ({
                  ...current,
                  type: event.target.value,
                  notifyLeadMinutes: isSharedCareTypeLabel(event.target.value)
                    ? defaultReminderLeadMinutes(event.target.value === "Vet visit" ? "Vet" : event.target.value)
                    : current.notifyLeadMinutes,
                }))
              }
            >
              {careTypes.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
          </Field>
          <Field label="Date">
            <input className="input" type="date" value={record.date} onChange={(event) => update("date", event.target.value)} />
          </Field>
        </div>
        <Field label={record.type === "Weight" ? "Label" : record.type === "Medication" ? "Medication name" : record.type === "Vaccine" ? "Vaccine name" : "Title"}>
          <input
            className="input"
            value={record.title}
            onChange={(event) => update("title", event.target.value)}
            required={record.type !== "Weight" && record.type !== "Vet visit"}
          />
          {errors.title && <span className="field-error">{errors.title}</span>}
        </Field>
        {record.type === "Weight" && (
          <div className="form-two">
            <Field label="Weight">
              <input className="input" inputMode="decimal" value={record.weightValue} onChange={(event) => update("weightValue", event.target.value)} placeholder="27.8" />
              {errors.weightValue && <span className="field-error">{errors.weightValue}</span>}
            </Field>
            <Field label="Unit">
              <select className="input" value={record.weightUnit} onChange={(event) => update("weightUnit", event.target.value)}>
                <option>lb</option>
                <option>kg</option>
              </select>
            </Field>
          </div>
        )}
        {record.type === "Medication" && (
          <>
            <Field label="Dose">
              <div className="dose-builder">
                <input
                  className="input dose-amount"
                  inputMode="decimal"
                  value={record.doseAmount}
                  onChange={(event) => update("doseAmount", event.target.value)}
                  placeholder="1"
                />
                <div className="choice-chip-row unit-chip-row">
                  {medicationDoseUnits.map((unit) => (
                    <button
                      className={record.doseUnit === unit.value ? "choice-chip active" : "choice-chip"}
                      key={unit.value}
                      type="button"
                      onClick={() => setRecord((current) => ({ ...current, doseUnit: unit.value }))}
                    >
                      {unit.label}
                    </button>
                  ))}
                </div>
              </div>
              {errors.dose && <span className="field-error">{errors.dose}</span>}
            </Field>
            <Field label="Frequency">
              <div className="frequency-builder">
                <div className="choice-chip-row frequency-chip-row">
                  {medicationFrequencyOptions.map((option) => (
                    <button
                      className={record.frequencyType === option.value ? "choice-chip active" : "choice-chip"}
                      key={option.value}
                      type="button"
                      onClick={() =>
                        setRecord((current) => ({
                          ...current,
                          frequencyType: option.value,
                          frequencyInterval: option.value === "as_needed" ? 1 : current.frequencyInterval || 1,
                        }))
                      }
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                {record.frequencyType !== "as_needed" && (
                  <div className="interval-control">
                    <span>Every</span>
                    <input
                      className="interval-input"
                      type="number"
                      min="1"
                      max="12"
                      value={record.frequencyInterval}
                      onChange={(event) =>
                        setRecord((current) => ({
                          ...current,
                          frequencyInterval: Math.max(1, Number(event.target.value) || 1),
                        }))
                      }
                    />
                    <span>
                      {medicationFrequencyOptions.find((option) => option.value === record.frequencyType)?.noun || "dose"}
                      {record.frequencyInterval > 1 ? "s" : ""}
                    </span>
                  </div>
                )}
              </div>
              {errors.frequency && <span className="field-error">{errors.frequency}</span>}
            </Field>
            <Field label="Refill / next dose">
              <input className="input" type="date" value={record.refillDate} onChange={(event) => update("refillDate", event.target.value)} />
            </Field>
          </>
        )}
        {record.type === "Vaccine" && (
          <Field label="Next due date">
            <input className="input" type="date" value={record.nextDueDate} onChange={(event) => update("nextDueDate", event.target.value)} />
            {errors.nextDueDate && <span className="field-error">{errors.nextDueDate}</span>}
          </Field>
        )}
        {record.type === "Vet visit" && (
          <>
            <div className="form-two">
              <Field label="Clinic">
                <input className="input" value={record.clinic} onChange={(event) => update("clinic", event.target.value)} />
                {errors.clinic && <span className="field-error">{errors.clinic}</span>}
              </Field>
              <Field label="Vet">
                <input className="input" value={record.vetName} onChange={(event) => update("vetName", event.target.value)} />
              </Field>
            </div>
            <Field label="Reason">
              <input className="input" value={record.reason} onChange={(event) => update("reason", event.target.value)} placeholder="Annual checkup" />
              {errors.title && <span className="field-error">{errors.title}</span>}
            </Field>
            <Field label="Follow-up date">
              <input className="input" type="date" value={record.nextDueDate} onChange={(event) => update("nextDueDate", event.target.value)} />
            </Field>
          </>
        )}
        {isSharedCareTypeLabel(record.type) && (
          <Field label="Reminder">
            <ReminderLeadChips
              value={record.notifyLeadMinutes}
              onChange={(value) => setRecord((current) => ({ ...current, notifyLeadMinutes: value }))}
            />
          </Field>
        )}
        <Field label="Note">
          <textarea className="input" value={record.note} onChange={(event) => update("note", event.target.value)} />
        </Field>
        <button className="btn btn-primary" disabled={!canSave}>Save care record</button>
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
    notifyLeadMinutes: existing?.notifyLeadMinutes ?? defaultReminderLeadMinutes(existing?.type || "Vet"),
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
            <select
              className="input"
              value={reminder.type}
              onChange={(event) =>
                setReminder((current) => ({
                  ...current,
                  type: event.target.value,
                  notifyLeadMinutes:
                    mode.mode === "create" ? defaultReminderLeadMinutes(event.target.value) : current.notifyLeadMinutes,
                }))
              }
            >
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
        <Field label="Notify">
          <ReminderLeadChips
            value={reminder.notifyLeadMinutes}
            onChange={(value) => setReminder((current) => ({ ...current, notifyLeadMinutes: value }))}
          />
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
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  const closeFromBackdrop = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) onClose();
  };

  return (
    <div className="overlay" onMouseDown={closeFromBackdrop}>
      <section className="sheet" onMouseDown={(event) => event.stopPropagation()}>
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
  const iconMap: Record<(typeof bottomNavTabs)[number], React.ReactNode> = {
    today: <Home size={19} />,
    diary: <NotebookPen size={19} />,
    care: <HeartPulse size={19} />,
    calendar: <CalendarDays size={19} />,
    profile: <UserRound size={19} />,
  };
  const labelMap: Record<(typeof bottomNavTabs)[number], string> = {
    today: "Today",
    diary: "Diary",
    care: "Care",
    calendar: "Calendar",
    profile: "Profile",
  };
  const items = bottomNavTabs.map((tab) => ({ tab, label: labelMap[tab], icon: iconMap[tab] }));

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
