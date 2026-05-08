import {
  Bell,
  CalendarDays,
  Camera,
  Check,
  ChevronRight,
  ChevronLeft,
  Download,
  Eye,
  Heart,
  HeartPulse,
  Home,
  ImagePlus,
  Link2,
  NotebookPen,
  PawPrint,
  Pencil,
  Pill,
  Plus,
  Sparkles,
  Syringe,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  cloudConfigured,
  missingCloudConfigMessage,
  pushConfigured,
} from "./cloud";
import {
  deleteHealthDocFromStore,
  loadHealthDocRecordFromStore,
  saveHealthDocRecordToStore,
  saveHealthDocToStore,
  type HealthDocRecord,
} from "./docStore";
import {
  deletePhotoFromStore,
  loadPhotoFromStore,
  loadPhotoRecordFromStore,
  savePhotoRecordToStore,
  savePhotoToStore,
  type PhotoRecord,
} from "./photoStore";
import {
  ageLabel,
  applyCoachSuggestion,
  avatarOptions,
  bottomNavTabs,
  breedOptions,
  buildPawPalFeed,
  buildPawPalDigest,
  buildPawPalPlannerPrompt,
  buildProofModeSections,
  buildMedicalSummary,
  buildTodayAttentionItems,
  canUseBrowserNotifications,
  candidateCareRecordsForHealthDoc,
  careRecordSummary,
  careStatus,
  careEmptyState,
  cloudBackupStatusLabel,
  cloudUploadDetail,
  collectHealthDocRefs,
  collectPhotoRefs,
  deleteCalendarItemFromState,
  deleteCareItemFromState,
  deleteHealthDocFromState,
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
  getUpcomingCalendarItems,
  healthDocTitleFromFileName,
  healthDocsForCareRecord,
  initialState,
  isStoredPhotoRef,
  linkHealthDocsToCareRecord,
  limitDiaryPhotos,
  medicationPlanStatus,
  medicationPlanSupportDetail,
  normalizeState,
  notificationBody,
  notificationLeadLabel,
  notificationPermissionStatus,
  pushStatusDetail,
  pushStatusLabel,
  reminderTypeForCareRecord,
  reminderLeadOptions,
  prettyDate,
  recurrenceLabel,
  reminderCompletionStatus,
  regionFromCoordinates,
  routineCoachInsights,
  safeSetLocalStorage,
  saveCareRecordToState,
  saveReminderToState,
  snoozePawPalThread,
  resolvePawPalThread,
  setTaskDoneForDate,
  setReminderCompletionForDate,
  sortDiaryEntries,
  sortTasksByTime,
  storageKey,
  taskScheduleLabel,
  taskHourOptions,
  taskMeridiemOptions,
  taskMinuteOptions,
  taskTimeFromParts,
  taskTimeParts,
  taskTime,
  normalizeTaskSchedule,
  tasksForDate,
  todayISO,
  updateHealthDocById,
  upsertHealthDocs,
  weekdayOptions,
  withTaskTime,
  visibleCareRecords,
  visibleReminders,
  validateCareRecord,
  wellnessSummary,
  weightTrendPlot,
  weightTrendSeries,
  careRecordNextStepStatus,
  careRecordProofStatus,
  type CareRecord,
  type CareRegion,
  type CoachSettings,
  type CoachSuggestion,
  type CoachSuggestionAction,
  type CloudSyncMeta,
  type DailyTask,
  type DailyTaskSchedule,
  type DiaryEntry,
  type DogAvatar,
  type DogProfile,
  type HealthDoc,
  type HealthDocCategory,
  type PawfolioNotificationStatus,
  type PawfolioState,
  type Reminder,
  type ReminderCompletionStatus,
  type Tab,
  type PawPalDigest,
  type PawPalPlannerPrompt,
  type PawPalThread,
  type ProofModeItem,
  type ProofModeSection,
  type WellnessSummary,
} from "./pawfolio";
import { useCloudAccount, type CloudActionState, type TrustState } from "./hooks/useCloudAccount";
import { useLocalReminderScheduling } from "./hooks/useLocalReminderScheduling";
import { usePushStatus } from "./hooks/usePushStatus";
import { CareSheet, type CareSheetMode } from "./components/CareSheet";
import { ReminderSheet } from "./components/ReminderSheet";
import { AccountDeviceSection, IntegrationsCard, SettingRow } from "./components/ProfileSettings";
import { TrustDetailsSheet } from "./components/TrustDetailsSheet";
import { Field, Sheet } from "./components/Sheet";
import {
  cloudSyncStatusLabel,
  googleCalendarStatusDetail,
  googleCalendarStatusLabel,
  notificationsSheetMessage,
  permissionLabel,
  restoreStatusDetail,
} from "./trust";

type TaskMode = { mode: "create" } | { mode: "edit"; task: DailyTask };
type MemoryMode = { mode: "create" } | { mode: "edit"; entry: DiaryEntry };
type ReminderMode = { mode: "create"; date?: string; draft?: Partial<Reminder> } | { mode: "edit"; reminder: Reminder };
type HealthDocEditMode = { doc: HealthDoc };
type BackupPayload = { app: "Pawfolio"; version: number; exportedAt: string; state: PawfolioState; photos?: PhotoRecord[]; docs?: HealthDocRecord[] };

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

async function openStoredHealthDoc(assetRef: string) {
  const record = await loadHealthDocRecordFromStore(assetRef);
  if (!record?.dataUrl) return;
  window.open(record.dataUrl, "_blank", "noopener,noreferrer");
}

async function downloadStoredHealthDoc(assetRef: string, fileName: string) {
  const record = await loadHealthDocRecordFromStore(assetRef);
  if (!record?.dataUrl) return;
  const link = document.createElement("a");
  link.href = record.dataUrl;
  link.download = fileName || record.fileName || "pawfolio-health-doc";
  link.click();
}

function healthDocTypeLabel(doc: HealthDoc) {
  return doc.category;
}

function badgeClassForTone(tone: "green" | "amber" | "coral" | "gray") {
  if (tone === "green") return "badge badge-green";
  if (tone === "amber") return "badge badge-amber";
  if (tone === "coral") return "badge badge-red";
  return "badge badge-gray";
}

function countTasks(tasks: DailyTask[], pattern: RegExp) {
  return tasks.filter((task) => pattern.test(task.title) && task.done).length;
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
  const [careMode, setCareMode] = useState<CareSheetMode | null>(null);
  const [reminderMode, setReminderMode] = useState<ReminderMode | null>(null);
  const [healthDocEditMode, setHealthDocEditMode] = useState<HealthDocEditMode | null>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [selectedMemory, setSelectedMemory] = useState<DiaryEntry | null>(null);
  const [saveError, setSaveError] = useState("");
  const [pushDiagnosticsOpen, setPushDiagnosticsOpen] = useState(false);
  const [careTabIntent, setCareTabIntent] = useState<string | null>(null);

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

  const { pushPermission, hasPushSubscription, refreshPushStatus } = usePushStatus();
  const {
    session,
    cloudStatus,
    cloudAction,
    trustState,
    restoreSummary,
    signIn,
    signOut,
    uploadCloud,
    restoreCloud,
    enablePush,
    connectCalendar,
    syncCalendarNow,
  } = useCloudAccount({
    state,
    setState,
    setTab,
    pushPermission,
    hasPushSubscription,
    refreshPushStatus,
  });

  const today = todayISO();
  const todayTasks = useMemo(() => tasksForDate(state.tasks, state.taskHistory, today), [state.tasks, state.taskHistory, today]);
  const completed = todayTasks.filter((task) => task.done).length;
  const progress = todayTasks.length ? completed / todayTasks.length : 0;
  const careRecords = useMemo(() => visibleCareRecords(state), [state]);
  const calendarItems = useMemo(() => visibleReminders(state), [state]);
  const pawPalThreads = useMemo(() => buildPawPalFeed(state), [state]);
  const pawPalDigest = useMemo(() => buildPawPalDigest(state), [state]);
  const pawPalPlannerPrompt = useMemo(() => buildPawPalPlannerPrompt(state), [state]);
  const todayAttentionItems = useMemo(() => buildTodayAttentionItems(state), [state]);
  const upcomingReminder = useMemo(
    () => getUpcomingReminder(calendarItems, new Date(), state.reminderHistory),
    [calendarItems, state.reminderHistory],
  );

  useLocalReminderScheduling({
    reminders: calendarItems,
    reminderHistory: state.reminderHistory,
    enabled: state.notificationPreferences.push,
  });

  const handleCoachAction = (item: { id: string; action: CoachSuggestionAction }) => {
    if (item.action.type === "add_task") {
      setState((current) => applyCoachSuggestion(current, item.id));
      return;
    }
    if (item.action.type === "open_care") {
      const action = item.action;
      const record = careRecords.find((item) => item.id === action.recordId);
      setTab("care");
      setCareTabIntent(record ? (record.type === "Medication" ? "Meds" : record.type === "Vaccine" ? "Vaccines" : record.type === "Vet visit" || record.type === "Allergy" || record.type === "Health note" ? "Vet visits" : "Weight") : null);
      if (record) setCareMode({ mode: "edit", record });
      return;
    }
    if (item.action.type === "open_health_docs") {
      const action = item.action;
      setTab("care");
      setCareTabIntent("Docs");
      if (action.docId) {
        const doc = state.healthDocs.find((entry) => entry.id === action.docId);
        if (doc) setHealthDocEditMode({ doc });
      }
      return;
    }
    if (item.action.type === "open_today") {
      setTab("today");
      return;
    }
    if (item.action.type === "open_diary") {
      setTab("diary");
      return;
    }
    if (item.action.type === "open_reminder") {
      const action = item.action;
      setTab("calendar");
      const record = action.recordId ? careRecords.find((entry) => entry.id === action.recordId) : undefined;
      setReminderMode({
        mode: "create",
        date: record?.nextDueDate || record?.date,
        draft: record
          ? {
              title: record.title,
              type: reminderTypeForCareRecord(record),
              date: record.nextDueDate || record.date,
              note: record.note || "",
            }
          : undefined,
      });
      return;
    }
    if (item.action.type === "open_calendar") {
      setTab("calendar");
      return;
    }
    if (item.action.type === "open_profile") {
      setTab("profile");
      return;
    }
    if (item.action.type === "export_data") {
      void exportPawfolioData();
    }
  };

  const exportPawfolioData = async () => {
    const photos = (
      await Promise.all(collectPhotoRefs(state).map((ref) => loadPhotoRecordFromStore(ref)))
    ).filter(Boolean) as PhotoRecord[];
    const docs = (
      await Promise.all(collectHealthDocRefs(state).map((ref) => loadHealthDocRecordFromStore(ref)))
    ).filter(Boolean) as HealthDocRecord[];
    const payload: BackupPayload = {
      app: "Pawfolio",
      version: 2,
      exportedAt: new Date().toISOString(),
      state,
      photos,
      docs,
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
      if ("docs" in parsed && parsed.docs?.length) {
        await Promise.all(
          parsed.docs.map((doc) =>
            saveHealthDocRecordToStore({ ...doc, createdAt: doc.createdAt || new Date().toISOString() }),
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

  const uploadHealthDocs = async (
    files: File[],
    options: { linkedCareRecordId?: string; category?: HealthDocCategory } = {},
  ) => {
    const nextDocs = await Promise.all(files.map(async (file) => {
      const assetRef = await saveHealthDocToStore(file);
      return {
        id: `health-doc-${crypto.randomUUID()}`,
        title: healthDocTitleFromFileName(file.name),
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        assetRef,
        linkedCareRecordId: options.linkedCareRecordId,
        category: options.category || "Other",
        uploadedAt: new Date().toISOString(),
      } satisfies HealthDoc;
    }));
    setState((current) => ({
      ...current,
      healthDocs: upsertHealthDocs(current.healthDocs, nextDocs),
    }));
    return nextDocs;
  };

  const deleteHealthDoc = async (doc: HealthDoc) => {
    await deleteHealthDocFromStore(doc.assetRef).catch(() => undefined);
    setState((current) => ({
      ...current,
      healthDocs: deleteHealthDocFromState(current.healthDocs, doc.id),
    }));
  };

  const updateHealthDoc = (docId: string, patch: Partial<HealthDoc>) => {
    setState((current) => ({
      ...current,
      healthDocs: updateHealthDocById(current.healthDocs, docId, patch),
    }));
  };

  if (!state.profile) {
    return (
      <main className="app-root">
        {saveError && <div className="app-alert">{saveError}</div>}
        <Onboarding
          session={session}
          cloudStatus={cloudStatus}
          cloudAction={cloudAction}
          onSave={(profile) => setState((current) => ({ ...current, profile }))}
          onSignIn={signIn}
          onRestoreCloud={restoreCloud}
          onImportData={importPawfolioData}
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
          digest={pawPalDigest}
          plannerPrompt={pawPalPlannerPrompt}
          threads={pawPalThreads}
          onAction={handleCoachAction}
          onSnooze={(id) => setState((current) => snoozePawPalThread(current, id))}
          onDone={(id) => setState((current) => resolvePawPalThread(current, id))}
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
          healthDocs={state.healthDocs}
          initialTab={careTabIntent}
          taskHistory={state.taskHistory}
          tasks={state.tasks}
          reminders={calendarItems}
          onOpenCare={() => setCareMode({ mode: "create" })}
          onQuickAddCare={(type) => setCareMode({ mode: "create", presetType: type })}
          onQuickAddReminder={() => setReminderMode({ mode: "create", draft: { type: "Vet" } })}
          onEdit={(record) => setCareMode({ mode: "edit", record })}
          onDelete={(id) =>
            setState((current) => deleteCareItemFromState(current, id))
          }
          onUploadDocs={uploadHealthDocs}
          onUpdateDoc={updateHealthDoc}
          onDeleteDoc={deleteHealthDoc}
          onOpenDoc={openStoredHealthDoc}
          onDownloadDoc={downloadStoredHealthDoc}
          onEditDoc={(doc) => setHealthDocEditMode({ doc })}
          onOpenLinkedRecord={(recordId) => {
            const record = careRecords.find((item) => item.id === recordId);
            if (!record) return;
            setCareTabIntent(record.type === "Medication" ? "Meds" : record.type === "Vaccine" ? "Vaccines" : record.type === "Vet visit" || record.type === "Allergy" || record.type === "Health note" ? "Vet visits" : "Weight");
            setCareMode({ mode: "edit", record });
          }}
          onTabIntentConsumed={() => setCareTabIntent(null)}
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
          wellness={wellnessSummary(state)}
          onSave={(profile) => setState((current) => ({ ...current, profile }))}
          onOpenNotifications={() => setNotificationsOpen(true)}
          onExportData={exportPawfolioData}
          onImportData={importPawfolioData}
          notificationPreferences={state.notificationPreferences}
          integrationSettings={state.integrationSettings}
          googleCalendarSyncState={state.googleCalendarSyncState}
          cloudSyncMeta={state.cloudSyncMeta}
          coachSettings={state.coachSettings}
          session={session}
          cloudStatus={cloudStatus}
          cloudAction={cloudAction}
          trustState={trustState}
          restoreSummary={restoreSummary}
          cloudConfigured={cloudConfigured}
          pushConfigured={pushConfigured}
          pushPermission={pushPermission}
          hasPushSubscription={hasPushSubscription}
          onSignIn={signIn}
          onSignOut={signOut}
          onUploadCloud={uploadCloud}
          onRestoreCloud={restoreCloud}
          onEnablePush={enablePush}
          onConnectCalendar={connectCalendar}
          onSyncCalendar={syncCalendarNow}
          onOpenPushDiagnostics={() => setPushDiagnosticsOpen(true)}
          onTogglePreference={(key) =>
            setState((current) => ({
              ...current,
              notificationPreferences: {
                ...current.notificationPreferences,
                [key]: key === "email" ? false : !current.notificationPreferences[key],
              },
              integrationSettings: {
                ...current.integrationSettings,
                googleCalendar:
                  key === "googleCalendar"
                    ? !current.notificationPreferences.googleCalendar
                      ? current.googleCalendarSyncState.connected
                        ? "connected"
                        : "needs_setup"
                      : "off"
                    : current.integrationSettings.googleCalendar,
                email: "on_hold",
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
            existingDocs={
              careMode.mode === "edit"
                ? healthDocsForCareRecord(state.healthDocs, careMode.record.id)
                : []
            }
            onUploadDocs={uploadHealthDocs}
            renderLeadChips={(value, onChange) => (
              <ReminderLeadChips value={value} onChange={onChange} />
            )}
            validate={validateCareRecord}
            onSave={(record, attachedDocIds) => {
              setState((current) => {
                const saved = saveCareRecordToState(current, record);
                return attachedDocIds.length
                  ? {
                      ...saved,
                      healthDocs: linkHealthDocsToCareRecord(saved.healthDocs, attachedDocIds, record),
                    }
                  : saved;
              });
              setCareMode(null);
            }}
          />
      )}

      {reminderMode && (
        <ReminderSheet
          mode={reminderMode}
          deviceTimeZone={state.cloudSyncMeta.deviceTimeZone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"}
          onClose={() => setReminderMode(null)}
          onSave={(reminder) => {
            setState((current) => saveReminderToState(current, reminder));
            setReminderMode(null);
          }}
          renderLeadChips={(value, onChange) => (
            <ReminderLeadChips value={value} onChange={onChange} />
          )}
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

      {healthDocEditMode && (
        <HealthDocEditSheet
          doc={healthDocEditMode.doc}
          records={careRecords}
          onClose={() => setHealthDocEditMode(null)}
          onSave={(patch) => {
            updateHealthDoc(healthDocEditMode.doc.id, patch);
            setHealthDocEditMode(null);
          }}
        />
      )}

      {pushDiagnosticsOpen && (
        <TrustDetailsSheet
          session={session}
          cloudConfigured={cloudConfigured}
          pushConfigured={pushConfigured}
          pushPermission={pushPermission}
          hasPushSubscription={hasPushSubscription}
          cloudSyncMeta={state.cloudSyncMeta}
          googleCalendarSyncState={state.googleCalendarSyncState}
          trustState={trustState}
          cloudStatus={cloudStatus}
          restoreSummary={restoreSummary}
          integrationSettings={state.integrationSettings}
          onClose={() => setPushDiagnosticsOpen(false)}
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

function Onboarding({
  session,
  cloudStatus,
  cloudAction,
  onSave,
  onSignIn,
  onRestoreCloud,
  onImportData,
}: {
  session: Session | null;
  cloudStatus: string;
  cloudAction: CloudActionState;
  onSave: (profile: DogProfile) => void;
  onSignIn: () => void;
  onRestoreCloud: () => void;
  onImportData: (file: File) => Promise<void>;
}) {
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

  const restoreLabel = cloudAction === "restoring"
    ? "Restoring..."
    : session
      ? "Restore from cloud"
      : "Sign in to restore";

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
            <p className="ob-sub">Starts on this device. You can back it up anytime.</p>
            <label className="btn btn-secondary upload-btn">
              <Camera size={17} />
              Add photo
              <input type="file" accept="image/*" onChange={updatePhoto} />
            </label>
          </div>
        </div>

        <section className="card onboarding-recovery">
          <div className="section-heading onboarding-recovery-head">
            <div>
              <p className="label no-margin">Recovery</p>
              <h2>Already have a Pawfolio backup?</h2>
            </div>
            <span className={`badge ${session ? "badge-green" : "badge-gray"}`}>{session ? "Signed in" : "Recovery"}</span>
          </div>
          <p className="ob-sub onboarding-recovery-copy">
            Already backed up? Restore it here before you start a new profile.
          </p>
          <div className="onboarding-recovery-actions">
            {!session && (
              <button className="btn btn-secondary" type="button" onClick={onSignIn}>
                Sign in with Google
              </button>
            )}
            <button
              className="btn btn-primary"
              type="button"
              onClick={onRestoreCloud}
              disabled={cloudAction === "restoring"}
            >
              {restoreLabel}
            </button>
            <label className="btn btn-secondary upload-btn">
              <Download size={17} />
              Import backup file
              <input
                type="file"
                accept="application/json"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void onImportData(file);
                  event.target.value = "";
                }}
              />
            </label>
          </div>
          {cloudStatus && <p className="onboarding-recovery-status">{cloudStatus}</p>}
        </section>

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
              {normalizeTaskSchedule(task.schedule).type !== "daily" && <div className="task-repeat-hint">{taskScheduleLabel(task)}</div>}
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
  digest,
  plannerPrompt,
  threads,
  onAction,
  onSnooze,
  onDone,
}: {
  profile: DogProfile;
  digest: PawPalDigest;
  plannerPrompt: PawPalPlannerPrompt;
  threads: PawPalThread[];
  onAction: (suggestion: { id: string; action: CoachSuggestionAction }) => void;
  onSnooze: (id: string) => void;
  onDone: (id: string) => void;
}) {
  const groups = [
    { label: "Open threads", types: ["incomplete_medication", "vaccine_missing_next_date", "vaccine_missing_proof", "vet_visit_missing_proof", "care_missing_next_step", "stale_backup", "unattached_health_doc"] as PawPalThread["type"][] },
    { label: "Patterns", types: ["repeated_missed_walks", "routine_drift"] as PawPalThread["type"][] },
    { label: "Looking ahead", types: ["no_upcoming_reminders", "care_follow_up", "weight_checkin", "no_recent_memory", "seasonal_care_nudge"] as PawPalThread["type"][] },
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
      <section className={`pawpal-hero pawpal-hero-${digest.tone}`}>
        <div>
          <p className="label no-margin">Daily digest</p>
          <h2>{digest.title}</h2>
          <p>{digest.body}</p>
        </div>
      </section>
      <article className="coach-suggestion coach-planner-prompt">
        <div>
          <p className="label no-margin">Next useful thing</p>
          <h3>{plannerPrompt.title}</h3>
          <p>{plannerPrompt.body}</p>
        </div>
        <div className="coach-actions">
          <button className="btn btn-sm btn-secondary" type="button" onClick={() => onAction(plannerPrompt)}>
            {plannerPrompt.actionLabel}
          </button>
        </div>
      </article>
      {threads.length === 0 ? null : (
        groups.map((group) => {
          const groupThreads = threads.filter((thread) => group.types.includes(thread.type));
          if (groupThreads.length === 0) return null;
          return (
            <section className="pawpal-group" key={group.label}>
              <p className="label">{group.label}</p>
              <div className="coach-list">
                {groupThreads.map((thread) => (
                  <article className={`coach-suggestion coach-${thread.type}`} key={thread.id}>
                    <div>
                      <h3>{thread.title}</h3>
                      <p>{thread.body}</p>
                      <p className="coach-why">PawPal noticed: {thread.reason}</p>
                    </div>
                    <div className="coach-actions">
                      <button className="btn btn-sm btn-secondary" type="button" onClick={() => onAction(thread)}>
                        {thread.actionLabel}
                      </button>
                      <button className="btn btn-sm btn-ghost" type="button" onClick={() => onSnooze(thread.id)}>
                        Later
                      </button>
                      <button className="btn btn-sm btn-ghost" type="button" onClick={() => onDone(thread.id)}>
                        Done
                      </button>
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
  healthDocs,
  initialTab,
  taskHistory,
  tasks,
  reminders,
  onOpenCare,
  onQuickAddCare,
  onQuickAddReminder,
  onEdit,
  onDelete,
  onUploadDocs,
  onUpdateDoc,
  onDeleteDoc,
  onOpenDoc,
  onDownloadDoc,
  onEditDoc,
  onOpenLinkedRecord,
  onTabIntentConsumed,
}: {
  profile: DogProfile;
  records: CareRecord[];
  healthDocs: HealthDoc[];
  initialTab: string | null;
  taskHistory: PawfolioState["taskHistory"];
  tasks: DailyTask[];
  reminders: Reminder[];
  onOpenCare: () => void;
  onQuickAddCare: (type: CareRecord["type"]) => void;
  onQuickAddReminder: () => void;
  onEdit: (record: CareRecord) => void;
  onDelete: (id: string) => void;
  onUploadDocs: (files: File[], options?: { linkedCareRecordId?: string; category?: HealthDocCategory }) => Promise<HealthDoc[]>;
  onUpdateDoc: (docId: string, patch: Partial<HealthDoc>) => void;
  onDeleteDoc: (doc: HealthDoc) => Promise<void>;
  onOpenDoc: (assetRef: string) => Promise<void>;
  onDownloadDoc: (assetRef: string, fileName: string) => Promise<void>;
  onEditDoc: (doc: HealthDoc) => void;
  onOpenLinkedRecord: (recordId: string) => void;
  onTabIntentConsumed: () => void;
}) {
  const careTabs = [
    { label: "Summary", types: [] as string[] },
    { label: "Meds", types: ["Medication"] },
    { label: "Vaccines", types: ["Vaccine"] },
    { label: "Vet visits", types: ["Vet visit", "Allergy", "Health note"] },
    { label: "Weight", types: ["Weight"] },
    { label: "Proof", types: [] as string[] },
    { label: "Docs", types: [] as string[] },
  ];
  const [activeCareTab, setActiveCareTab] = useState(careTabs[0].label);
  useEffect(() => {
    if (!initialTab) return;
    setActiveCareTab(initialTab);
    onTabIntentConsumed();
  }, [initialTab, onTabIntentConsumed]);
  const activeTypes = careTabs.find((tabItem) => tabItem.label === activeCareTab)?.types || [];
  const filteredRecords = records.filter((record) => activeTypes.includes(record.type));
  const empty = careEmptyState(activeCareTab);
  const weights = weightTrendSeries(records);
  const [selectedRecord, setSelectedRecord] = useState<CareRecord | null>(null);
  const coachInsights = routineCoachInsights(tasks, taskHistory, reminders, records);
  const proofSections = useMemo(() => buildProofModeSections(records, healthDocs), [records, healthDocs]);
  const medicalSummary = useMemo(() => buildMedicalSummary(records, healthDocs), [records, healthDocs]);

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
      {activeCareTab === "Summary" && (
        <section className="card care-quick-add-card">
          <p className="label no-margin">Quick add</p>
          <div className="care-quick-add-grid">
            <button className="care-quick-add-btn" type="button" onClick={() => onQuickAddCare("Vaccine")}>
              <Syringe size={16} />
              <span>Vaccine</span>
            </button>
            <button className="care-quick-add-btn" type="button" onClick={() => onQuickAddCare("Vet visit")}>
              <HeartPulse size={16} />
              <span>Vet</span>
            </button>
            <button className="care-quick-add-btn" type="button" onClick={() => onQuickAddCare("Weight")}>
              <Heart size={16} />
              <span>Weight</span>
            </button>
            <button className="care-quick-add-btn" type="button" onClick={() => onQuickAddCare("Medication")}>
              <Pill size={16} />
              <span>Meds</span>
            </button>
            <label className="care-quick-add-btn care-quick-upload">
              <NotebookPen size={16} />
              <span>Doc</span>
              <input
                type="file"
                accept="image/*,application/pdf"
                multiple
                onChange={(event) => {
                  const files = [...(event.target.files || [])];
                  if (files.length) {
                    void onUploadDocs(files, { category: "Other" }).then(() => setActiveCareTab("Docs"));
                  }
                  event.currentTarget.value = "";
                }}
              />
            </label>
            <button className="care-quick-add-btn" type="button" onClick={onQuickAddReminder}>
              <CalendarDays size={16} />
              <span>Reminder</span>
            </button>
          </div>
        </section>
      )}
      <CareHistoryPanel
        activeTab={activeCareTab}
        records={filteredRecords}
        weights={weights}
        insights={coachInsights}
      />
      {activeCareTab === "Summary" ? (
        <MedicalSummaryPanel
          summary={medicalSummary}
          onOpenRecord={(recordId) => {
            const record = records.find((item) => item.id === recordId);
            if (record) setSelectedRecord(record);
          }}
          onOpenDoc={onOpenDoc}
          onDownloadDoc={onDownloadDoc}
        />
      ) : activeCareTab === "Proof" ? (
        <ProofModePanel
          sections={proofSections}
          onOpenRecord={(recordId) => {
            const record = records.find((item) => item.id === recordId);
            if (record) setSelectedRecord(record);
          }}
          onOpenDoc={onOpenDoc}
          onDownloadDoc={onDownloadDoc}
        />
      ) : activeCareTab === "Docs" ? (
        <HealthDocsPanel
          docs={healthDocs}
          records={records}
          onUploadDocs={onUploadDocs}
          onDeleteDoc={onDeleteDoc}
          onOpenDoc={onOpenDoc}
          onDownloadDoc={onDownloadDoc}
          onEditDoc={onEditDoc}
          onOpenLinkedRecord={onOpenLinkedRecord}
        />
      ) : filteredRecords.length === 0 ? (
        <EmptyState
          title={empty.title}
          text={empty.text}
        />
      ) : (
        filteredRecords.map((record) => {
          const planStatus = record.type === "Medication" ? medicationPlanStatus(record) : undefined;
          const statusClass = planStatus === "Active"
            ? "badge badge-green"
            : planStatus === "Upcoming"
              ? "badge badge-blue"
              : planStatus === "Ended"
                ? "badge badge-gray"
                : "badge badge-amber";
          const supportDetail = record.type === "Medication" ? medicationPlanSupportDetail(record) : "";

          return (
            <article className="care-item" key={record.id}>
              <button className="care-open" type="button" onClick={() => setSelectedRecord(record)}>
                <div className={record.type === "Medication" ? "care-icon-wrap badge-blue" : "care-icon-wrap badge-green"}>
                  {record.type === "Medication" ? <Pill size={18} /> : <HeartPulse size={18} />}
                </div>
                <div className="care-copy">
                  {planStatus ? (
                    <div className="badge-row">
                      <span className={statusClass}>{planStatus}</span>
                    </div>
                  ) : (
                    <span className={careStatus(record) === "OK" ? "badge badge-green" : careStatus(record) === "Overdue" ? "badge badge-red" : "badge badge-amber"}>
                      {careStatus(record)}
                    </span>
                  )}
                  <h2>{record.title}</h2>
                  <p>{careRecordSummary(record)}</p>
                  <div className="care-proof-grid">
                    <span className={badgeClassForTone(careRecordProofStatus(record, healthDocs).tone)}>
                      {careRecordProofStatus(record, healthDocs).label}
                    </span>
                    <span className={badgeClassForTone(careRecordNextStepStatus(record).tone)}>
                      {careRecordNextStepStatus(record).label}
                    </span>
                  </div>
                  {supportDetail && <p className="care-support">{supportDetail}</p>}
                </div>
              </button>
              <CardActions onEdit={() => onEdit(record)} onDelete={() => onDelete(record.id)} />
            </article>
          );
        })
      )}
      {selectedRecord && (
        <CareDetailSheet
          record={selectedRecord}
          linkedReminder={reminders.find((reminder) => reminder.id === selectedRecord.id)}
          docs={healthDocsForCareRecord(healthDocs, selectedRecord.id)}
          onClose={() => setSelectedRecord(null)}
          onEdit={() => {
            onEdit(selectedRecord);
            setSelectedRecord(null);
          }}
          onDelete={() => {
            onDelete(selectedRecord.id);
            setSelectedRecord(null);
          }}
          onOpenDoc={onOpenDoc}
          onDownloadDoc={onDownloadDoc}
          onEditDoc={onEditDoc}
          onUnlinkDoc={(doc) => onUpdateDoc(doc.id, { linkedCareRecordId: undefined })}
        />
      )}
    </section>
  );
}

function CareHistoryPanel({
  activeTab,
  records,
  weights,
  insights,
}: {
  activeTab: string;
  records: CareRecord[];
  weights: ReturnType<typeof weightTrendSeries>;
  insights: string[];
}) {
  if (activeTab === "Weight") {
    const plottedWeights = weightTrendPlot(records, 8);
    return (
      <section className="care-history card">
        <div className="section-heading">
          <div>
            <p className="label no-margin">Weight trend</p>
            <h2>{weights.length ? `${weights[weights.length - 1].value} ${weights[weights.length - 1].unit}` : "No weights yet"}</h2>
          </div>
        </div>
        <WeightTrendChart points={plottedWeights} />
      </section>
    );
  }

  if (activeTab === "Docs" || activeTab === "Proof" || activeTab === "Summary" || activeTab === "Meds" || activeTab === "Vaccines" || activeTab === "Vet visits") return null;

  return (
    <section className="care-history card">
      <p className="label no-margin">Routine Coach</p>
      <p>{insights[0]}</p>
    </section>
  );
}

function MedicalSummaryPanel({
  summary,
  onOpenRecord,
  onOpenDoc,
  onDownloadDoc,
}: {
  summary: ReturnType<typeof buildMedicalSummary>;
  onOpenRecord: (recordId: string) => void;
  onOpenDoc: (assetRef: string) => Promise<void>;
  onDownloadDoc: (assetRef: string, fileName: string) => Promise<void>;
}) {
  return (
    <section className="medical-summary-panel">
      <section className="card medical-summary-hero">
        <p className="label no-margin">Medical summary</p>
        <div className="mini-metrics">
          <span><strong>{summary.activeMedications.length}</strong> active meds</span>
          <span><strong>{summary.vaccineSnapshot.current}</strong> current vaccines</span>
          <span><strong>{summary.vaccineSnapshot.dueSoon + summary.vaccineSnapshot.overdue}</strong> needing follow-up</span>
          <span><strong>{summary.keyDocs.length}</strong> key docs</span>
        </div>
      </section>
      <section className="card medical-summary-card">
        <div className="detail-head-row">
          <p className="label no-margin">Current meds</p>
          <span className={summary.activeMedications.length ? "badge badge-green" : "badge badge-gray"}>{summary.activeMedications.length || 0}</span>
        </div>
        {summary.activeMedications.length === 0 ? (
          <p>No active medication plans right now.</p>
        ) : (
          <div className="medical-summary-list">
            {summary.activeMedications.map((record) => (
              <button className="medical-summary-item" type="button" key={record.id} onClick={() => onOpenRecord(record.id)}>
                <strong>{record.title}</strong>
                <span>{careRecordSummary(record)}</span>
              </button>
            ))}
          </div>
        )}
      </section>
      <section className="card medical-summary-card">
        <p className="label no-margin">At a glance</p>
        <div className="detail-grid">
          <div className="detail-row">
            <span>Latest weight</span>
            <strong>{summary.latestWeight ? `${summary.latestWeight.weightValue || summary.latestWeight.title}${summary.latestWeight.weightUnit ? ` ${summary.latestWeight.weightUnit}` : ""}` : "Not logged yet"}</strong>
          </div>
          <div className="detail-row">
            <span>Recent vet visit</span>
            <strong>{summary.latestVetVisit ? `${summary.latestVetVisit.title} • ${prettyDate(summary.latestVetVisit.date)}` : "No visit saved yet"}</strong>
          </div>
          <div className="detail-row">
            <span>Vaccine proof gaps</span>
            <strong>{summary.vaccineSnapshot.missingProof ? `${summary.vaccineSnapshot.missingProof} missing` : "Covered"}</strong>
          </div>
          <div className="detail-row">
            <span>Allergies & notes</span>
            <strong>{summary.allergyNotes.length ? `${summary.allergyNotes.length} saved` : "None saved"}</strong>
          </div>
        </div>
      </section>
      <section className="card medical-summary-card">
        <div className="detail-head-row">
          <p className="label no-margin">Key docs</p>
          <span className={summary.keyDocs.length ? "badge badge-green" : "badge badge-gray"}>{summary.keyDocs.length || 0}</span>
        </div>
        {summary.keyDocs.length === 0 ? (
          <p>No key health docs saved yet.</p>
        ) : (
          <div className="detail-doc-list">
            {summary.keyDocs.map(({ doc, record }) => (
              <article className="detail-doc-item" key={doc.id}>
                <div>
                  <h3>{doc.title}</h3>
                  <p>{doc.category} • Uploaded {prettyDate(doc.uploadedAt.slice(0, 10))}</p>
                  {record ? <p className="care-support">{record.title} • {prettyDate(record.date)}</p> : null}
                </div>
                <div className="health-doc-actions">
                  <button className="tiny-btn" type="button" title="View" onClick={() => void onOpenDoc(doc.assetRef)}>
                    <Eye size={14} />
                  </button>
                  <button className="tiny-btn" type="button" title="Download" onClick={() => void onDownloadDoc(doc.assetRef, doc.fileName)}>
                    <Download size={14} />
                  </button>
                  {record ? (
                    <button className="tiny-btn" type="button" title="Open record" onClick={() => onOpenRecord(record.id)}>
                      <Link2 size={14} />
                    </button>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}

function ProofModePanel({
  sections,
  onOpenRecord,
  onOpenDoc,
  onDownloadDoc,
}: {
  sections: ProofModeSection[];
  onOpenRecord: (recordId: string) => void;
  onOpenDoc: (assetRef: string) => Promise<void>;
  onDownloadDoc: (assetRef: string, fileName: string) => Promise<void>;
}) {
  const totalReady = sections.reduce((sum, section) => (
    sum + section.items.filter((item) => Boolean(item.assetRef)).length
  ), 0);

  return (
    <section className="proof-mode-panel">
      <section className="card proof-mode-intro">
        <div>
          <p className="label no-margin">Proof mode</p>
          <h2>{totalReady ? `${totalReady} docs ready fast` : "Build a faster proof trail"}</h2>
        </div>
        <p>
          Open the paperwork people usually ask for first, then jump back to the source record if you need the full story.
        </p>
      </section>
      {sections.map((section) => (
        <section className="card proof-mode-section" key={section.id}>
          <div className="proof-mode-section-head">
            <div>
              <p className="label no-margin">{section.title}</p>
              <p>{section.description}</p>
            </div>
            <span className={section.items.length ? "badge badge-green" : "badge badge-gray"}>{section.items.length}</span>
          </div>
          {section.items.length === 0 ? (
            <p className="proof-mode-empty">Nothing saved here yet.</p>
          ) : (
            <div className="proof-mode-list">
              {section.items.map((item) => (
                <ProofModeItemCard
                  item={item}
                  key={item.id}
                  onOpenRecord={onOpenRecord}
                  onOpenDoc={onOpenDoc}
                  onDownloadDoc={onDownloadDoc}
                />
              ))}
            </div>
          )}
        </section>
      ))}
    </section>
  );
}

function ProofModeItemCard({
  item,
  onOpenRecord,
  onOpenDoc,
  onDownloadDoc,
}: {
  item: ProofModeItem;
  onOpenRecord: (recordId: string) => void;
  onOpenDoc: (assetRef: string) => Promise<void>;
  onDownloadDoc: (assetRef: string, fileName: string) => Promise<void>;
}) {
  return (
    <article className="proof-mode-item">
      <div className="proof-mode-copy">
        <div className="badge-row">
          <span className={badgeClassForTone(item.statusTone)}>{item.statusLabel}</span>
        </div>
        <h3>{item.title}</h3>
        <p>{item.meta}</p>
        <p className="care-support">{item.support}</p>
      </div>
      <div className="health-doc-actions proof-mode-actions">
        {item.assetRef && item.fileName ? (
          <>
            <button className="tiny-btn" type="button" title="View doc" onClick={() => void onOpenDoc(item.assetRef!)}>
              <Eye size={14} />
            </button>
            <button className="tiny-btn" type="button" title="Download doc" onClick={() => void onDownloadDoc(item.assetRef!, item.fileName!)}>
              <Download size={14} />
            </button>
          </>
        ) : null}
        <button className="tiny-btn" type="button" title="Open record" onClick={() => onOpenRecord(item.recordId)}>
          <Link2 size={14} />
        </button>
      </div>
    </article>
  );
}

function CareDetailSheet({
  record,
  linkedReminder,
  docs,
  onClose,
  onEdit,
  onDelete,
  onOpenDoc,
  onDownloadDoc,
  onEditDoc,
  onUnlinkDoc,
}: {
  record: CareRecord;
  linkedReminder?: Reminder;
  docs: HealthDoc[];
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onOpenDoc: (assetRef: string) => Promise<void>;
  onDownloadDoc: (assetRef: string, fileName: string) => Promise<void>;
  onEditDoc: (doc: HealthDoc) => void;
  onUnlinkDoc: (doc: HealthDoc) => void;
}) {
  const proof = careRecordProofStatus(record, docs);
  const nextStep = careRecordNextStepStatus(record);
  const reminderDetail = linkedReminder
    ? `${linkedReminder.type}${linkedReminder.time ? ` • ${linkedReminder.time}` : ""}${linkedReminder.recurrence !== "none" ? ` • ${recurrenceLabel(linkedReminder.recurrence)}` : ""}`
    : "";
  const summaryRows = [
    { label: "Type", value: record.type },
    { label: "Event date", value: prettyDate(record.date) },
    record.startDate ? { label: "Start", value: prettyDate(record.startDate) } : null,
    record.endDate ? { label: "End", value: prettyDate(record.endDate) } : null,
    record.nextDueDate ? { label: record.type === "Vet visit" ? "Follow-up" : "Next due", value: prettyDate(record.nextDueDate) } : null,
    record.refillDate ? { label: "Refill", value: prettyDate(record.refillDate) } : null,
    record.clinic ? { label: "Clinic", value: record.clinic } : null,
    record.vetName ? { label: "Vet", value: record.vetName } : null,
    record.reason ? { label: "Reason", value: record.reason } : null,
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <Sheet title={record.title} onClose={onClose}>
      <div className="care-detail-sheet">
        <div className="entry-head">
          <div className="badge-row">
            <span className={badgeClassForTone(proof.tone)}>{proof.label}</span>
            <span className={badgeClassForTone(nextStep.tone)}>{nextStep.label}</span>
          </div>
          <CardActions onEdit={onEdit} onDelete={onDelete} />
        </div>
        <section className="card care-detail-card">
          <div className="detail-grid">
            {summaryRows.map((row) => (
              <div className="detail-row" key={`${row.label}-${row.value}`}>
                <span>{row.label}</span>
                <strong>{row.value}</strong>
              </div>
            ))}
          </div>
        </section>
        {record.note || record.adherenceNotes ? (
          <section className="card care-detail-card">
            <p className="label no-margin">Notes</p>
            {record.note ? <p>{record.note}</p> : null}
            {record.adherenceNotes ? <p className="care-support">{record.adherenceNotes}</p> : null}
          </section>
        ) : null}
        <section className="card care-detail-card">
          <div className="detail-head-row">
            <p className="label no-margin">Linked reminder</p>
            {!linkedReminder && <span className="badge badge-gray">None</span>}
          </div>
          {linkedReminder ? (
            <>
              <h3>{linkedReminder.title}</h3>
              <p>{reminderDetail}</p>
            </>
          ) : (
            <p>No reminder is carrying this next step yet.</p>
          )}
        </section>
        <section className="card care-detail-card">
          <div className="detail-head-row">
            <p className="label no-margin">Attached documents</p>
            <span className={docs.length ? "badge badge-green" : "badge badge-gray"}>{docs.length || 0}</span>
          </div>
          {docs.length === 0 ? (
            <p>No documents attached yet.</p>
          ) : (
            <div className="detail-doc-list">
              {docs.map((doc) => (
                <article className="detail-doc-item" key={doc.id}>
                  <div>
                    <h3>{doc.title}</h3>
                    <p>{doc.category} • Uploaded {prettyDate(doc.uploadedAt.slice(0, 10))}</p>
                  </div>
                  <div className="health-doc-actions">
                    <button className="tiny-btn" type="button" title="View" onClick={() => void onOpenDoc(doc.assetRef)}>
                      <Eye size={14} />
                    </button>
                    <button className="tiny-btn" type="button" title="Download" onClick={() => void onDownloadDoc(doc.assetRef, doc.fileName)}>
                      <Download size={14} />
                    </button>
                    <button className="tiny-btn" type="button" title="Edit metadata" onClick={() => onEditDoc(doc)}>
                      <Pencil size={14} />
                    </button>
                    <button className="tiny-btn danger" type="button" title="Unlink" onClick={() => onUnlinkDoc(doc)}>
                      <X size={14} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </Sheet>
  );
}

function HealthDocEditSheet({
  doc,
  records,
  onClose,
  onSave,
}: {
  doc: HealthDoc;
  records: CareRecord[];
  onClose: () => void;
  onSave: (patch: Partial<HealthDoc>) => void;
}) {
  const [title, setTitle] = useState(doc.title);
  const [category, setCategory] = useState<HealthDocCategory>(doc.category);
  const [linkedCareRecordId, setLinkedCareRecordId] = useState(doc.linkedCareRecordId || "");
  const candidateRecords = candidateCareRecordsForHealthDoc(records, category);

  return (
    <Sheet title="Edit health doc" onClose={onClose}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSave({
            title: title.trim() || doc.title,
            category,
            linkedCareRecordId: linkedCareRecordId || undefined,
          });
        }}
      >
        <Field label="Title">
          <input className="input" value={title} onChange={(event) => setTitle(event.target.value)} />
        </Field>
        <div className="doc-edit-file-row">
          <span className="label no-margin">File</span>
          <strong>{doc.fileName}</strong>
        </div>
        <Field label="Category">
          <select className="input" value={category} onChange={(event) => setCategory(event.target.value as HealthDocCategory)}>
            {(["Vaccine", "Vet visit", "Medication", "Other"] as HealthDocCategory[]).map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </Field>
        <Field label="Linked record">
          <select className="input" value={linkedCareRecordId} onChange={(event) => setLinkedCareRecordId(event.target.value)}>
            <option value="">Unlinked</option>
            {candidateRecords.map((record) => (
              <option key={record.id} value={record.id}>
                {record.title} • {prettyDate(record.date)}
              </option>
            ))}
          </select>
        </Field>
        <p className="settings-note">Link this document to the right record so proof and follow-up stay easy to trust later.</p>
        <div className="sheet-actions-row">
          {linkedCareRecordId ? (
            <button className="btn btn-ghost" type="button" onClick={() => setLinkedCareRecordId("")}>
              Unlink
            </button>
          ) : <span />}
          <button className="btn btn-primary">Save health doc</button>
        </div>
      </form>
    </Sheet>
  );
}

function HealthDocsPanel({
  docs,
  records,
  onUploadDocs,
  onDeleteDoc,
  onOpenDoc,
  onDownloadDoc,
  onEditDoc,
  onOpenLinkedRecord,
}: {
  docs: HealthDoc[];
  records: CareRecord[];
  onUploadDocs: (files: File[], options?: { linkedCareRecordId?: string; category?: HealthDocCategory }) => Promise<HealthDoc[]>;
  onDeleteDoc: (doc: HealthDoc) => Promise<void>;
  onOpenDoc: (assetRef: string) => Promise<void>;
  onDownloadDoc: (assetRef: string, fileName: string) => Promise<void>;
  onEditDoc: (doc: HealthDoc) => void;
  onOpenLinkedRecord: (recordId: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<HealthDocCategory | "All">("All");
  const [linkFilter, setLinkFilter] = useState<"all" | "linked" | "unlinked">("all");
  const linkedCount = docs.filter((doc) => doc.linkedCareRecordId).length;
  const linkedRecords = useMemo(() => new Map(records.map((record) => [record.id, record])), [records]);
  const filtered = useMemo(() => {
    const lowered = query.trim().toLowerCase();
    return docs.filter((doc) => {
      if (typeFilter !== "All" && doc.category !== typeFilter) return false;
      if (linkFilter === "linked" && !doc.linkedCareRecordId) return false;
      if (linkFilter === "unlinked" && doc.linkedCareRecordId) return false;
      if (!lowered) return true;
      const linkedRecord = doc.linkedCareRecordId ? linkedRecords.get(doc.linkedCareRecordId) : undefined;
      const haystack = [
        doc.title,
        doc.fileName,
        doc.category,
        linkedRecord?.title,
        linkedRecord?.clinic,
        linkedRecord?.vetName,
        linkedRecord?.date,
      ].filter(Boolean).join(" ").toLowerCase();
      return haystack.includes(lowered);
    });
  }, [docs, linkFilter, linkedRecords, query, typeFilter]);

  return (
    <section className="health-docs-panel">
      <section className="card health-docs-toolbar">
        <div className="health-docs-summary">
          <div>
            <p className="label no-margin">Health docs</p>
            <p>{docs.length} saved{docs.length ? ` • ${linkedCount} linked` : ""}</p>
          </div>
        </div>
        <div className="health-docs-toolbar-row">
          <input
            className="input"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search docs, vet, vaccine"
          />
          <label className="btn btn-secondary upload-btn health-doc-upload-btn">
            <Plus size={15} />
            <span>Upload</span>
            <input
              type="file"
              accept="image/*,application/pdf"
              multiple
              onChange={(event) => {
                const files = [...(event.target.files || [])];
                if (files.length) void onUploadDocs(files, { category: "Other" });
                event.currentTarget.value = "";
              }}
            />
          </label>
        </div>
        <div className="choice-chip-row health-doc-chip-row">
          {(["All", "Vaccine", "Vet visit", "Medication", "Other"] as const).map((value) => (
            <button
              key={value}
              type="button"
              className={typeFilter === value ? "choice-chip active" : "choice-chip"}
              onClick={() => setTypeFilter(value)}
            >
              {value === "Vet visit" ? "Vet" : value === "Medication" ? "Meds" : value}
            </button>
          ))}
        </div>
        <div className="choice-chip-row health-doc-chip-row">
          {([
            { value: "all", label: "All docs" },
            { value: "linked", label: "Linked" },
            { value: "unlinked", label: "Unlinked" },
          ] as const).map((option) => (
            <button
              key={option.value}
              type="button"
              className={linkFilter === option.value ? "choice-chip active" : "choice-chip"}
              onClick={() => setLinkFilter(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>
      {filtered.length === 0 ? (
        <EmptyState title="No health docs yet" text="Upload a vaccine certificate, visit summary, or medication paperwork so the proof is easy to find later." />
      ) : (
        filtered.map((doc) => {
          const linkedRecord = doc.linkedCareRecordId ? linkedRecords.get(doc.linkedCareRecordId) : undefined;
          return (
            <article className="care-item health-doc-item" key={doc.id}>
              <div className="care-icon-wrap badge-amber">
                {doc.mimeType === "application/pdf" ? <NotebookPen size={18} /> : <ImagePlus size={18} />}
              </div>
              <div className="care-copy">
                <div className="badge-row">
                  <span className="badge badge-amber">{healthDocTypeLabel(doc)}</span>
                  <span className={doc.linkedCareRecordId ? "badge badge-green" : "badge badge-gray"}>
                    {doc.linkedCareRecordId ? "Linked" : "Unlinked"}
                  </span>
                </div>
                <h2 className="health-doc-title">{doc.title}</h2>
                <p className="health-doc-meta-line">Uploaded {prettyDate(doc.uploadedAt.slice(0, 10))}</p>
                {linkedRecord && <p className="care-support">{linkedRecord.title} • {prettyDate(linkedRecord.date)}</p>}
                <div className="health-doc-actions">
                  <button className="tiny-btn" type="button" aria-label={`View ${doc.title}`} title="View" onClick={() => void onOpenDoc(doc.assetRef)}>
                    <Eye size={14} />
                  </button>
                  <button className="tiny-btn" type="button" aria-label={`Download ${doc.title}`} title="Download" onClick={() => void onDownloadDoc(doc.assetRef, doc.fileName)}>
                    <Download size={14} />
                  </button>
                  {doc.linkedCareRecordId && (
                    <button className="tiny-btn" type="button" aria-label={`Open linked record for ${doc.title}`} title="Open record" onClick={() => onOpenLinkedRecord(doc.linkedCareRecordId!)}>
                      <Link2 size={14} />
                    </button>
                  )}
                  <button className="tiny-btn" type="button" aria-label={`Edit ${doc.title}`} title="Edit" onClick={() => onEditDoc(doc)}>
                    <Pencil size={14} />
                  </button>
                  <button className="tiny-btn danger" type="button" aria-label={`Delete ${doc.title}`} title="Delete" onClick={() => void onDeleteDoc(doc)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </article>
          );
        })
      )}
    </section>
  );
}

function WeightTrendChart({
  points,
}: {
  points: ReturnType<typeof weightTrendPlot>;
}) {
  if (points.length === 0) {
    return (
      <div className="weight-chart-empty">
        Add a few weights to see the trend settle in.
      </div>
    );
  }

  if (points.length === 1) {
    const point = points[0];
    return (
      <div className="weight-chart-shell" aria-label="Weight trend chart">
        <div className="weight-chart-single">
          <div className="weight-chart-single-track" />
          <div className="weight-chart-single-dot" />
          <p>{prettyDate(point.date)} - {point.value} {point.unit}</p>
        </div>
      </div>
    );
  }

  const linePath = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1].x} 100 L ${points[0].x} 100 Z`;

  return (
    <div className="weight-chart-shell" aria-label="Weight trend chart">
      <svg className="weight-chart" viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-hidden="true">
        <defs>
          <linearGradient id="weightAreaFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="rgba(50, 138, 91, 0.22)" />
            <stop offset="100%" stopColor="rgba(50, 138, 91, 0.02)" />
          </linearGradient>
        </defs>
        <line className="weight-chart-baseline" x1="8" y1="82" x2="92" y2="82" />
        <path className="weight-chart-area" d={areaPath} fill="url(#weightAreaFill)" />
        <path className="weight-chart-line" d={linePath} />
        {points.map((point) => (
          <circle
            key={`${point.date}-${point.value}`}
            className="weight-chart-point"
            cx={point.x}
            cy={point.y}
            r="1.5"
          />
        ))}
      </svg>
      <div className="weight-chart-labels">
        <span>{prettyDate(points[0].date)}</span>
        <span>{prettyDate(points[points.length - 1].date)}</span>
      </div>
    </div>
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
  const upcoming = getUpcomingCalendarItems(reminders, new Date());
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
              <div className="badge-row">
                {reminder.recurrence !== "none" && <span className="badge badge-amber">{recurrenceLabel(reminder.recurrence)}</span>}
                {reminderCompletionStatus(reminderHistory, reminder) && (
                  <span className={reminderCompletionStatus(reminderHistory, reminder) === "done" ? "badge badge-green" : "badge badge-gray"}>
                    {reminderCompletionStatus(reminderHistory, reminder) === "done" ? "Done" : "Skipped"}
                  </span>
                )}
              </div>
              <h2>{reminder.title}</h2>
              <p>{reminder.type} - {reminder.time || "Any time"} {reminder.note && `- ${reminder.note}`}</p>
              <div className="reminder-status-actions">
                <button
                  className="mini-done-btn"
                  type="button"
                  onClick={() => onComplete(reminder, reminderCompletionStatus(reminderHistory, reminder) === "done" ? undefined : "done")}
                >
                  {reminderCompletionStatus(reminderHistory, reminder) === "done" ? "Undo" : "Mark done"}
                </button>
                <button
                  className="mini-skip-btn"
                  type="button"
                  onClick={() => onComplete(reminder, reminderCompletionStatus(reminderHistory, reminder) === "skipped" ? undefined : "skipped")}
                >
                  {reminderCompletionStatus(reminderHistory, reminder) === "skipped" ? "Undo skip" : "Skip"}
                </button>
              </div>
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

      <p className="notice-copy">{notificationsSheetMessage()}</p>
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

function ProfileScreen({
  profile,
  diaryCount,
  wellness,
  onSave,
  onOpenNotifications,
  onExportData,
  onImportData,
  notificationPreferences,
  integrationSettings,
  googleCalendarSyncState,
  cloudSyncMeta,
  coachSettings,
  session,
  cloudStatus,
  cloudAction,
  trustState,
  restoreSummary,
  cloudConfigured: isCloudConfigured,
  pushConfigured: isPushConfigured,
  pushPermission,
  hasPushSubscription,
  onSignIn,
  onSignOut,
  onUploadCloud,
  onRestoreCloud,
  onEnablePush,
  onConnectCalendar,
  onSyncCalendar,
  onOpenPushDiagnostics,
  onTogglePreference,
  onToggleCoach,
  onUpdateCoachSettings,
}: {
  profile: DogProfile;
  diaryCount: number;
  wellness: WellnessSummary;
  onSave: (profile: DogProfile) => void;
  onOpenNotifications: () => void;
  onExportData: () => void;
  onImportData: (file: File) => Promise<void>;
  notificationPreferences: PawfolioState["notificationPreferences"];
  integrationSettings: PawfolioState["integrationSettings"];
  googleCalendarSyncState: PawfolioState["googleCalendarSyncState"];
  cloudSyncMeta: CloudSyncMeta;
  coachSettings: CoachSettings;
  session: Session | null;
  cloudStatus: string;
  cloudAction: CloudActionState;
  trustState: TrustState;
  restoreSummary: ReturnType<typeof useCloudAccount>["restoreSummary"];
  cloudConfigured: boolean;
  pushConfigured: boolean;
  pushPermission: PawfolioNotificationStatus;
  hasPushSubscription: boolean;
  onSignIn: () => void;
  onSignOut: () => void;
  onUploadCloud: () => void;
  onRestoreCloud: () => void;
  onEnablePush: () => void;
  onConnectCalendar: () => void;
  onSyncCalendar: () => void;
  onOpenPushDiagnostics: () => void;
  onTogglePreference: (key: keyof PawfolioState["notificationPreferences"]) => void;
  onToggleCoach: () => void;
  onUpdateCoachSettings: (settings: Partial<CoachSettings>) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editFocus, setEditFocus] = useState<"personality" | null>(null);
  const [climateOpen, setClimateOpen] = useState(false);
  const [locationStatus, setLocationStatus] = useState("");
  const phonePushLabel = pushStatusLabel({
    configured: isPushConfigured,
    supported: canUseBrowserNotifications(globalThis.Notification),
    permission: pushPermission,
    hasSubscription: hasPushSubscription,
  });
  const phonePushDetail = pushStatusDetail({
    configured: isPushConfigured,
    supported: canUseBrowserNotifications(globalThis.Notification),
    permission: pushPermission,
    hasSubscription: hasPushSubscription,
  });
  const backupLabel = cloudBackupStatusLabel({
    signedIn: Boolean(session),
    lastUploadedAt: cloudSyncMeta.lastUploadedAt,
  });
  const uploadDetail = cloudUploadDetail(cloudSyncMeta.lastUploadedAt);
  const restoreDetail = restoreStatusDetail({
    status: trustState.restore,
    lastRestoredAt: cloudSyncMeta.lastRestoredAt,
    summary: restoreSummary,
  });
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
        <StatCard icon={<NotebookPen size={16} />} label="Memories" value={String(diaryCount)} />
        <StatCard
          icon={<HeartPulse size={16} />}
          label="Wellness"
          value={wellness.label}
          detail={wellness.detail}
          tone={wellness.tone}
        />
        <StatCard icon={<Heart size={16} />} label="Days together" value={daysTogether(profile.birthday)} />
      </div>
      <button
        className="card profile-summary-card"
        type="button"
        onClick={() => {
          setEditFocus("personality");
          setEditing(true);
        }}
        aria-label="Edit personality notes"
      >
        <div className="profile-summary-head">
          <p className="label no-margin">Personality notes</p>
          <span className="profile-summary-edit">
            <Pencil size={14} />
          </span>
        </div>
        <p className="personality-text">{profile.personality || "Add little quirks, fears, favorite games, and care notes."}</p>
      </button>
      <IntegrationsCard
        googleCalendarValue={googleCalendarStatusLabel(
          trustState.calendar,
          notificationPreferences.googleCalendar || googleCalendarSyncState.connected,
          Boolean(session),
        )}
        googleCalendarChecked={notificationPreferences.googleCalendar}
        onToggleGoogleCalendar={() => onTogglePreference("googleCalendar")}
        inAppChecked={notificationPreferences.inApp}
        onToggleInApp={() => onTogglePreference("inApp")}
      />
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
        <p className="settings-note">PawPal stays on this device. Location is optional and only used for broad care context.</p>
      </section>
      <AccountDeviceSection
        accountText={session?.user.email || (isCloudConfigured ? "Sign in with Google to turn on backup and restore." : missingCloudConfigMessage())}
        accountButtonLabel={session ? "Sign out" : "Sign in with Google"}
        accountConnected={Boolean(session)}
        backupLabel={backupLabel}
        syncLabel={cloudSyncStatusLabel(Boolean(session), integrationSettings.cloudSync === "enabled")}
        phonePushLabel={phonePushLabel}
        uploadLabel={cloudAction === "uploading" ? "Uploading local Pawfolio..." : "Upload local Pawfolio"}
        uploadDetail={uploadDetail}
        restoreLabel={cloudAction === "restoring" ? "Restoring cloud Pawfolio..." : "Restore cloud Pawfolio"}
        restoreDetail={restoreDetail}
        pushActionLabel={cloudAction === "enabling_push" ? "Saving this device..." : hasPushSubscription ? "Refresh phone push" : "Enable phone push"}
        pushDetail={phonePushDetail}
        calendarActionLabel={
          cloudAction === "connecting_calendar"
            ? "Connecting Google Calendar..."
            : cloudAction === "syncing_calendar"
              ? "Syncing Google Calendar..."
              : googleCalendarSyncState.connected
                ? "Sync Google Calendar"
                : "Connect Google Calendar"
        }
        calendarDetail={googleCalendarStatusDetail({
          status: trustState.calendar,
          enabled: notificationPreferences.googleCalendar || googleCalendarSyncState.connected,
          signedIn: Boolean(session),
          lastSyncAt: googleCalendarSyncState.lastSyncAt,
          lastSyncSummary: googleCalendarSyncState.lastSyncSummary,
        })}
        cloudStatus={cloudStatus}
        accountDisabled={!isCloudConfigured}
        actionDisabled={!session || cloudAction !== "idle"}
        pushDisabled={!session || !isPushConfigured || cloudAction !== "idle"}
        onAccountAction={session ? onSignOut : onSignIn}
        onUpload={onUploadCloud}
        onRestore={onRestoreCloud}
        onPush={onEnablePush}
        onCalendar={googleCalendarSyncState.connected ? onSyncCalendar : onConnectCalendar}
        onOpenDetails={onOpenPushDiagnostics}
      />
      <div className="profile-actions">
        <ProfileAction
          icon={<Pencil size={18} />}
          label="Edit profile"
          onClick={() => {
            setEditFocus(null);
            setEditing(true);
          }}
        />
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
          initialFocus={editFocus}
          onClose={() => {
            setEditFocus(null);
            setEditing(false);
          }}
          onSave={(updated) => {
            onSave(updated);
            setEditFocus(null);
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
  initialFocus,
  onClose,
  onSave,
}: {
  profile: DogProfile;
  initialFocus?: "personality" | null;
  onClose: () => void;
  onSave: (profile: DogProfile) => void;
}) {
  const [draft, setDraft] = useState(profile);
  const personalityRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (initialFocus === "personality") personalityRef.current?.focus();
  }, [initialFocus]);

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
        <textarea
          ref={personalityRef}
          className="input"
          value={draft.personality}
          onChange={(event) => setDraft((current) => ({ ...current, personality: event.target.value }))}
          placeholder="What makes your dog feel like your dog?"
        />
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
  const existingSchedule = normalizeTaskSchedule(existing?.schedule, existing ? todayISO() : todayISO());
  const [repeatMode, setRepeatMode] = useState<"daily" | "every_other_day" | "interval" | "weekdays">(
    existingSchedule.type === "interval"
      ? existingSchedule.intervalDays === 2
        ? "every_other_day"
        : "interval"
      : existingSchedule.type === "weekdays"
        ? "weekdays"
        : "daily",
  );
  const [intervalDays, setIntervalDays] = useState(
    existingSchedule.type === "interval" ? String(Math.max(2, existingSchedule.intervalDays || 2)) : "3",
  );
  const [startDate, setStartDate] = useState(existingSchedule.startDate || todayISO());
  const [weekdays, setWeekdays] = useState<number[]>(
    existingSchedule.type === "weekdays" ? (existingSchedule.weekdays || [1]) : [1, 3, 5],
  );
  const time = taskTimeFromParts(timeParts.hour, timeParts.minute, timeParts.meridiem);

  const schedule: DailyTaskSchedule =
    repeatMode === "daily"
      ? { type: "daily" }
      : repeatMode === "every_other_day"
        ? { type: "interval", intervalDays: 2, startDate }
        : repeatMode === "interval"
          ? { type: "interval", intervalDays: Math.max(2, Math.floor(Number(intervalDays) || 2)), startDate }
          : { type: "weekdays", weekdays: weekdays.length > 0 ? weekdays : [1] };

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
            schedule,
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
        <Field label="Repeat">
          <select className="input" value={repeatMode} onChange={(event) => setRepeatMode(event.target.value as "daily" | "every_other_day" | "interval" | "weekdays")}>
            <option value="daily">Every day</option>
            <option value="every_other_day">Every other day</option>
            <option value="interval">Every N days</option>
            <option value="weekdays">Selected weekdays</option>
          </select>
        </Field>
        {repeatMode === "every_other_day" && (
          <Field label="Start date">
            <input className="input" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} required />
          </Field>
        )}
        {repeatMode === "interval" && (
          <div className="form-two">
            <Field label="Start date">
              <input className="input" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} required />
            </Field>
            <Field label="Every">
              <div className="task-interval-row">
                <input
                  className="input"
                  type="number"
                  min={2}
                  value={intervalDays}
                  onChange={(event) => setIntervalDays(event.target.value)}
                />
                <span>days</span>
              </div>
            </Field>
          </div>
        )}
        {repeatMode === "weekdays" && (
          <Field label="On these days">
            <div className="task-weekday-row">
              {weekdayOptions.map((day) => {
                const active = weekdays.includes(day.value);
                return (
                  <button
                    key={day.value}
                    className={active ? "choice-chip active" : "choice-chip"}
                    type="button"
                    onClick={() =>
                      setWeekdays((current) => {
                        const next = active ? current.filter((value) => value !== day.value) : [...current, day.value];
                        return next.length > 0 ? next.sort((a, b) => a - b) : current;
                      })
                    }
                  >
                    {day.label}
                  </button>
                );
              })}
            </div>
          </Field>
        )}
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

function StatCard({
  icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail?: string;
  tone?: WellnessSummary["tone"];
}) {
  return (
    <article className={`card-sm stat-card${tone ? ` stat-card-${tone}` : ""}`}>
      <div className="stat-icon">{icon}</div>
      <strong>{value}</strong>
      <span>{label}</span>
      {detail ? <small>{detail}</small> : null}
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
