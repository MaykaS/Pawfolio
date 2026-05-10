import { useCallback, useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  cleanupAuthCallbackUrl,
  connectGoogleCalendar,
  downloadCloudPawfolioToLocal,
  getCloudSession,
  hydrateSnapshotHealthDocs,
  hydrateSnapshotPhotos,
  parseAuthCallbackUrl,
  signInWithGoogle,
  subscribeDeviceToPush,
  supabase,
  syncGoogleCalendar,
  uploadLocalPawfolioToAccount,
} from "../cloud";
import { normalizeState, type PawfolioNotificationStatus, type PawfolioState, type Tab } from "../pawfolio";

export type CloudActionState =
  | "idle"
  | "uploading"
  | "restoring"
  | "enabling_push"
  | "connecting_calendar"
  | "syncing_calendar";

export type TrustState = {
  backup: "idle" | "uploading" | "uploaded" | "empty" | "failed";
  restore: "idle" | "restoring" | "restored" | "empty" | "failed";
  push: "idle" | "saving" | "active" | "blocked" | "failed";
  calendar: "disconnected" | "connecting" | "connected" | "sync_error";
  email: "on_hold";
};

export type RestoreSummary = {
  outcome: "restored" | "empty" | "failed";
  profile: boolean;
  reminders: number;
  care: number;
  diary: number;
  photos: number;
  docs: number;
};

type UseCloudAccountArgs = {
  state: PawfolioState;
  setState: Dispatch<SetStateAction<PawfolioState>>;
  setTab: (tab: Tab) => void;
  pushPermission: PawfolioNotificationStatus;
  hasPushSubscription: boolean;
  refreshPushStatus: () => Promise<void>;
};

function cloudSyncFingerprint(state: PawfolioState) {
  const {
    cloudSyncMeta: {
      lastUploadedAt: _lastUploadedAt,
      lastRestoredAt: _lastRestoredAt,
      lastPushRegisteredAt: _lastPushRegisteredAt,
      ...syncMeta
    },
    googleCalendarSyncState,
    ...rest
  } = state;
  return JSON.stringify({
    ...rest,
    cloudSyncMeta: syncMeta,
    googleCalendarSyncState: {
      ...googleCalendarSyncState,
      lastSyncAt: undefined,
    },
  });
}

function deliveryRelevantFingerprint(state: PawfolioState) {
  return JSON.stringify({
    tasks: state.tasks,
    taskHistory: state.taskHistory,
    reminders: state.reminders,
    reminderHistory: state.reminderHistory,
    careEvents: state.careEvents,
    routineCoachSettings: state.routineCoachSettings,
    notificationPreferences: {
      push: state.notificationPreferences.push,
      inApp: state.notificationPreferences.inApp,
    },
  });
}

function sessionWithProvider(session: Session) {
  return session as Session & {
    provider_token?: string;
    provider_refresh_token?: string;
  };
}

const calendarTokenStorageKey = "pawfolio-google-calendar-tokens";

function persistCalendarTokens(session: Session | null) {
  if (typeof window === "undefined") return;
  if (!session) {
    sessionStorage.removeItem(calendarTokenStorageKey);
    return;
  }
  const sessionData = sessionWithProvider(session);
  if (!sessionData.provider_token && !sessionData.provider_refresh_token) return;
  sessionStorage.setItem(
    calendarTokenStorageKey,
    JSON.stringify({
      providerToken: sessionData.provider_token || "",
      providerRefreshToken: sessionData.provider_refresh_token || "",
    }),
  );
}

function readStoredCalendarTokens() {
  if (typeof window === "undefined") return undefined;
  const raw = sessionStorage.getItem(calendarTokenStorageKey);
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw) as {
      providerToken?: string;
      providerRefreshToken?: string;
    };
    if (!parsed.providerToken) return undefined;
    return parsed;
  } catch {
    return undefined;
  }
}

export function useCloudAccount({
  state,
  setState,
  setTab,
  pushPermission,
  hasPushSubscription,
  refreshPushStatus,
}: UseCloudAccountArgs) {
  const [session, setSession] = useState<Session | null>(null);
  const [cloudStatus, setCloudStatus] = useState("");
  const [cloudAction, setCloudAction] = useState<CloudActionState>("idle");
  const [backupState, setBackupState] = useState<TrustState["backup"]>("idle");
  const [restoreState, setRestoreState] = useState<TrustState["restore"]>("idle");
  const [restoreSummary, setRestoreSummary] = useState<RestoreSummary | null>(null);
  const [pushState, setPushState] = useState<TrustState["push"]>("idle");
  const [calendarState, setCalendarState] = useState<TrustState["calendar"]>("disconnected");
  const cloudSyncTimer = useRef<number | null>(null);
  const lastUploadedFingerprint = useRef("");
  const lastCalendarSyncedFingerprint = useRef("");
  const lastDeliveryRelevantFingerprint = useRef("");

  const finalizeGoogleCalendarConnection = useCallback(
    async (nextSession: Session | null) => {
      if (!nextSession) return;
      const sessionData = sessionWithProvider(nextSession);
      const storedTokens = readStoredCalendarTokens();
      const providerToken = sessionData.provider_token || storedTokens?.providerToken || "";
      const providerRefreshToken = sessionData.provider_refresh_token || storedTokens?.providerRefreshToken || "";
      if (!providerToken) {
        throw new Error("Google Calendar access token was not returned. Try connecting again.");
      }
      await connectGoogleCalendar(
        nextSession,
        providerToken,
        providerRefreshToken,
      );
      persistCalendarTokens(null);
      setState((current) => ({
        ...current,
        integrationSettings: {
          ...current.integrationSettings,
          googleCalendar: "connected",
        },
        googleCalendarSyncState: {
          ...current.googleCalendarSyncState,
          connected: true,
        },
      }));
      setCalendarState("connected");
      setCloudStatus("Google Calendar is connected.");
      setCloudAction("idle");
    },
    [setState],
  );

  const applyCloudRestore = useCallback(async () => {
    const snapshot = await downloadCloudPawfolioToLocal();
    if (!snapshot?.state) {
      setRestoreState("empty");
      setRestoreSummary({
        outcome: "empty",
        profile: false,
        reminders: 0,
        care: 0,
        diary: 0,
        photos: 0,
        docs: 0,
      });
      setCloudStatus("No cloud backup was found for this account yet. You can start fresh here or try another signed-in account.");
      return false;
    }
    await hydrateSnapshotPhotos(snapshot.photos);
    await hydrateSnapshotHealthDocs((snapshot as { docs?: unknown }).docs as never);
    const restoredState = normalizeState(snapshot.state as Partial<PawfolioState>);
    const nextState = normalizeState({
      ...restoredState,
      cloudSyncMeta: {
        ...restoredState.cloudSyncMeta,
        lastUploadedAt: snapshot.updated_at || restoredState.cloudSyncMeta?.lastUploadedAt,
        lastRestoredAt: new Date().toISOString(),
      },
      integrationSettings: {
        ...restoredState.integrationSettings,
        cloudSync: "enabled",
      },
    });
    lastUploadedFingerprint.current = cloudSyncFingerprint(nextState);
    setState(nextState);
    const summary = {
      outcome: "restored" as const,
      profile: Boolean(nextState.profile),
      reminders: nextState.reminders.length,
      care: nextState.care.length + nextState.careEvents.length,
      diary: nextState.diary.length,
      photos: snapshot.photos?.length || 0,
      docs: Array.isArray((snapshot as { docs?: unknown[] }).docs) ? ((snapshot as { docs?: unknown[] }).docs?.length || 0) : 0,
    };
    setRestoreState("restored");
    setRestoreSummary(summary);
    setCloudStatus(restoreSummaryMessage(summary));
    return true;
  }, [setState]);

  useEffect(() => {
    const callback = parseAuthCallbackUrl(window.location.href);
    if (callback.requestedTab === "today") {
      setTab("today");
    }
  }, [setTab]);

  useEffect(() => {
    const client = supabase;
    if (!client) return undefined;
    let cancelled = false;
    const deviceTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "";

    if (deviceTimeZone) {
      setState((current) => (
        current.cloudSyncMeta.deviceTimeZone === deviceTimeZone
          ? current
          : {
              ...current,
              cloudSyncMeta: {
                ...current.cloudSyncMeta,
                deviceTimeZone,
              },
            }
      ));
    }

    const finishAuthReturn = async () => {
      const callback = parseAuthCallbackUrl(window.location.href);
      if (callback.requestedTab === "today") {
        setTab("today");
      }

      if (callback.error) {
        if (!cancelled) {
          const message = callback.intent === "calendar"
            ? calendarAccessDeniedMessage(callback.error)
            : callback.error;
          setCloudStatus(`Google sign-in didn't finish: ${message}`);
        }
        window.history.replaceState({}, document.title, cleanupAuthCallbackUrl(window.location.href));
        return;
      }

      if (callback.code) {
        if (!cancelled) setCloudStatus("Finishing Google sign-in...");
        const { data, error } = await client.auth.exchangeCodeForSession(callback.code);
        if (cancelled) return;
        if (error) {
          setSession(null);
          setCloudStatus(`Google sign-in didn't finish: ${error.message}`);
        } else {
          persistCalendarTokens(data.session);
          setSession(data.session);
          if (callback.intent === "calendar") {
            try {
              await finalizeGoogleCalendarConnection(data.session);
            } catch (calendarError) {
              setCloudAction("idle");
              setCalendarState("sync_error");
              setCloudStatus(calendarAccessDeniedMessage((calendarError as Error).message));
            }
          } else if (callback.intent === "restore") {
            try {
              setCloudAction("restoring");
              setRestoreState("restoring");
              await applyCloudRestore();
            } catch (restoreError) {
              setRestoreState("failed");
              setRestoreSummary({
                outcome: "failed",
                profile: false,
                reminders: 0,
                care: 0,
                diary: 0,
                photos: 0,
                docs: 0,
              });
              setCloudStatus((restoreError as Error).message);
            } finally {
              setCloudAction("idle");
            }
          } else {
            setCloudStatus("Signed in. This device is your working copy.");
          }
        }
        window.history.replaceState({}, document.title, cleanupAuthCallbackUrl(window.location.href));
        return;
      }

      const { data } = await client.auth.getSession();
      if (!cancelled) setSession(data.session);
    };

    void finishAuthReturn();

    const { data } = client.auth.onAuthStateChange((_event, nextSession) => {
      if (cancelled) return;
      persistCalendarTokens(nextSession);
      setSession(nextSession);
      if (nextSession) {
        setCloudStatus("Signed in. This device is your working copy.");
        window.history.replaceState({}, document.title, cleanupAuthCallbackUrl(window.location.href));
      }
    });

    return () => {
      cancelled = true;
      data.subscription.unsubscribe();
    };
  }, [applyCloudRestore, finalizeGoogleCalendarConnection, setState, setTab]);

  useEffect(() => {
    if (!session) return undefined;
    const syncFingerprint = cloudSyncFingerprint(state);
    if (syncFingerprint === lastUploadedFingerprint.current) return undefined;
    if (cloudSyncTimer.current) window.clearTimeout(cloudSyncTimer.current);
    const deliveryFingerprint = deliveryRelevantFingerprint(state);
    const deliveryRelevantChanged = deliveryFingerprint !== lastDeliveryRelevantFingerprint.current;
    lastDeliveryRelevantFingerprint.current = deliveryFingerprint;

    cloudSyncTimer.current = window.setTimeout(() => {
      uploadLocalPawfolioToAccount(state)
        .then(() => {
          lastUploadedFingerprint.current = syncFingerprint;
          setBackupState("uploaded");
          setState((current) => ({
            ...current,
            integrationSettings: {
              ...current.integrationSettings,
              cloudSync: "enabled",
            },
            cloudSyncMeta: {
              ...current.cloudSyncMeta,
              lastUploadedAt: new Date().toISOString(),
            },
          }));

          if (
            state.notificationPreferences.googleCalendar &&
            state.googleCalendarSyncState.connected &&
            syncFingerprint !== lastCalendarSyncedFingerprint.current
          ) {
            void syncGoogleCalendar(session).then((result) => {
              lastCalendarSyncedFingerprint.current = syncFingerprint;
              setCalendarState("connected");
              setState((current) => ({
                ...current,
                integrationSettings: {
                  ...current.integrationSettings,
                  googleCalendar: "connected",
                },
                googleCalendarSyncState: {
                  ...current.googleCalendarSyncState,
                  connected: true,
                  lastSyncAt: result.lastSyncAt || new Date().toISOString(),
                  lastSyncSummary: {
                    created: result.created,
                    updated: result.updated,
                    deleted: result.deleted,
                  },
                },
              }));
            }).catch(() => {
              setCalendarState("sync_error");
            });
          }
        })
        .catch(() => {
          setBackupState("failed");
        });
    }, deliveryRelevantChanged ? 150 : 1200);

    return () => {
      if (cloudSyncTimer.current) window.clearTimeout(cloudSyncTimer.current);
    };
  }, [session, setState, state]);

  const signIn = useCallback(() => {
    signInWithGoogle().catch((error: Error) => setCloudStatus(error.message));
  }, []);

  const signOut = useCallback(() => {
    supabase?.auth.signOut();
    persistCalendarTokens(null);
    setBackupState("idle");
    setRestoreState("idle");
    setPushState("idle");
    setCalendarState("disconnected");
    setCloudStatus("Signed out. This device still has its Pawfolio, but backup and push are off until you sign back in.");
  }, []);

  const uploadCloud = useCallback(() => {
    setCloudAction("uploading");
    setBackupState("uploading");
    setCloudStatus("Uploading the latest Pawfolio backup...");
    const syncFingerprint = cloudSyncFingerprint(state);
    uploadLocalPawfolioToAccount(state)
      .then(async () => {
        lastUploadedFingerprint.current = syncFingerprint;
        setBackupState("uploaded");
        setState((current) => ({
          ...current,
          integrationSettings: {
            ...current.integrationSettings,
            cloudSync: "enabled",
          },
          cloudSyncMeta: {
            ...current.cloudSyncMeta,
            lastUploadedAt: new Date().toISOString(),
          },
        }));

        if (session && state.notificationPreferences.googleCalendar && state.googleCalendarSyncState.connected) {
          const result = await syncGoogleCalendar(session);
          lastCalendarSyncedFingerprint.current = syncFingerprint;
          setCalendarState("connected");
          setState((current) => ({
            ...current,
            googleCalendarSyncState: {
              ...current.googleCalendarSyncState,
              connected: true,
              lastSyncAt: result.lastSyncAt || new Date().toISOString(),
              lastSyncSummary: {
                created: result.created,
                updated: result.updated,
                deleted: result.deleted,
              },
            },
          }));
        }

        setCloudStatus("Local Pawfolio uploaded to your account.");
      })
      .catch((error: Error) => {
        setBackupState("failed");
        setCloudStatus(error.message);
      })
      .finally(() => setCloudAction("idle"));
  }, [session, setState, state]);

  const restoreCloud = useCallback(() => {
    setCloudAction("restoring");
    setRestoreState("restoring");
    if (!session) {
      setCloudStatus("Sign in with Google to restore from cloud.");
      signInWithGoogle({ intent: "restore" })
        .catch((error: Error) => {
          setRestoreState("failed");
          setCloudStatus(error.message);
        })
        .finally(() => setCloudAction("idle"));
      return;
    }
    setCloudStatus("Restoring the latest cloud backup...");
    applyCloudRestore()
      .catch((error: Error) => {
        setRestoreState("failed");
        setRestoreSummary({
          outcome: "failed",
          profile: false,
          reminders: 0,
          care: 0,
          diary: 0,
          photos: 0,
          docs: 0,
        });
        setCloudStatus(error.message);
      })
      .finally(() => setCloudAction("idle"));
  }, [applyCloudRestore, session]);

  const enablePush = useCallback(() => {
    setCloudAction("enabling_push");
    setCloudStatus("Saving this device for Pawfolio reminders...");
    getCloudSession()
      .then((activeSession) => {
        if (!activeSession) {
          setCloudStatus("Sign in before enabling phone push.");
          return undefined;
        }
        setSession(activeSession);
        return subscribeDeviceToPush(activeSession).then(async () => {
          await refreshPushStatus();
          setPushState("active");
          setState((current) => ({
            ...current,
            notificationPreferences: {
              ...current.notificationPreferences,
              push: true,
            },
            integrationSettings: {
              ...current.integrationSettings,
              push: "enabled",
            },
            cloudSyncMeta: {
              ...current.cloudSyncMeta,
              lastPushRegisteredAt: new Date().toISOString(),
            },
          }));
          setCloudStatus("This device is saved for Pawfolio reminders.");
        });
      })
      .catch((error: Error) => {
        setPushState("failed");
        setCloudStatus(error.message);
      })
      .finally(() => setCloudAction("idle"));
  }, [refreshPushStatus, setState]);

  const connectCalendar = useCallback(() => {
    setCloudAction("connecting_calendar");
    setCalendarState("connecting");
    setCloudStatus("Connecting Google Calendar...");
    signInWithGoogle({ intent: "calendar", scopes: "https://www.googleapis.com/auth/calendar", forceConsent: true })
      .catch((error: Error) => {
        setCalendarState("sync_error");
        setCloudStatus(calendarAccessDeniedMessage(error.message));
        setState((current) => ({
          ...current,
          integrationSettings: {
            ...current.integrationSettings,
            googleCalendar: "issue",
          },
        }));
        setCloudAction("idle");
      });
  }, [setState]);

  const syncCalendarNow = useCallback(() => {
    if (!session) {
      setCloudStatus("Sign in before syncing Google Calendar.");
      return;
    }
    setCloudAction("syncing_calendar");
    setCalendarState("connecting");
    setCloudStatus("Uploading the latest Pawfolio, then syncing Google Calendar...");
    const syncFingerprint = cloudSyncFingerprint(state);
    uploadLocalPawfolioToAccount(state)
      .then(async () => {
        lastUploadedFingerprint.current = syncFingerprint;
        setBackupState("uploaded");
        setState((current) => ({
          ...current,
          integrationSettings: {
            ...current.integrationSettings,
            cloudSync: "enabled",
          },
          cloudSyncMeta: {
            ...current.cloudSyncMeta,
            lastUploadedAt: new Date().toISOString(),
          },
        }));
        return syncGoogleCalendar(session);
      })
      .then((result) => {
        lastCalendarSyncedFingerprint.current = syncFingerprint;
        setCalendarState("connected");
        setState((current) => ({
          ...current,
          integrationSettings: {
            ...current.integrationSettings,
            googleCalendar: "connected",
          },
          googleCalendarSyncState: {
            ...current.googleCalendarSyncState,
            connected: true,
            lastSyncAt: result.lastSyncAt || new Date().toISOString(),
            lastSyncSummary: {
              created: result.created,
              updated: result.updated,
              deleted: result.deleted,
            },
          },
        }));
        setCloudStatus(`Google Calendar synced: ${result.created} created, ${result.updated} updated, ${result.deleted} removed.`);
      })
      .catch((error: Error) => {
        setCalendarState("sync_error");
        setCloudStatus(calendarAccessDeniedMessage(error.message));
        setState((current) => ({
          ...current,
          integrationSettings: {
            ...current.integrationSettings,
            googleCalendar: "issue",
          },
        }));
      })
      .finally(() => setCloudAction("idle"));
  }, [session, setState, state]);

  const trustState = useMemo<TrustState>(() => ({
    backup:
      cloudAction === "uploading"
        ? "uploading"
        : !session
          ? "idle"
          : backupState === "idle" && state.cloudSyncMeta.lastUploadedAt
            ? "uploaded"
            : backupState,
    restore:
      cloudAction === "restoring"
        ? "restoring"
        : restoreState,
    push:
      cloudAction === "enabling_push"
        ? "saving"
        : pushPermission === "denied"
          ? "blocked"
          : hasPushSubscription
            ? "active"
            : pushState === "failed"
              ? "failed"
              : "idle",
    calendar:
      cloudAction === "connecting_calendar" || cloudAction === "syncing_calendar"
        ? "connecting"
        : state.googleCalendarSyncState.connected
          ? "connected"
          : calendarState,
    email: "on_hold",
  }), [
    backupState,
    calendarState,
    cloudAction,
    hasPushSubscription,
    pushState,
    pushPermission,
    restoreState,
    session,
    state.cloudSyncMeta.lastUploadedAt,
    state.googleCalendarSyncState.connected,
  ]);

  return {
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
  };
}

function restoreSummaryMessage(summary: RestoreSummary) {
  const restored: string[] = [];
  if (summary.profile) restored.push("profile");
  if (summary.reminders) restored.push(formatRestoreCount(summary.reminders, "reminder"));
  if (summary.care) restored.push(formatRestoreCount(summary.care, "care record"));
  if (summary.diary) restored.push(formatRestoreCount(summary.diary, "diary entry"));
  if (summary.photos) restored.push(formatRestoreCount(summary.photos, "photo"));
  if (summary.docs) restored.push(formatRestoreCount(summary.docs, "health doc"));
  if (restored.length === 0) return "Restored your Pawfolio to this device.";
  return `Restored ${joinHumanList(restored)} to this device.`;
}

function formatRestoreCount(count: number, singular: string) {
  return `${count} ${count === 1 ? singular : `${singular}s`}`;
}

function joinHumanList(items: string[]) {
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

function calendarAccessDeniedMessage(rawError: string) {
  const normalized = rawError.toLowerCase();
  if (
    normalized.includes("access_denied")
    || normalized.includes("developer-approved testers")
    || normalized.includes("has not completed the google verification process")
  ) {
    return "Google Calendar setup is still blocked in Google Cloud. Add your Google account as a test user, enable Google Calendar API, and add the calendar scope in Data Access, then try Connect Google Calendar again.";
  }
  return rawError;
}
