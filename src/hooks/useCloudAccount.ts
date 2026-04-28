import { useCallback, useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  cleanupAuthCallbackUrl,
  connectGoogleCalendar,
  downloadCloudPawfolioToLocal,
  getCloudSession,
  parseAuthCallbackUrl,
  signInWithGoogle,
  subscribeDeviceToPush,
  supabase,
  syncGoogleCalendar,
  uploadLocalPawfolioToAccount,
} from "../cloud";
import { initialState, normalizeState, type PawfolioNotificationStatus, type PawfolioState, type Tab } from "../pawfolio";

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
  email: "off" | "active" | "send_error";
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
  const { cloudSyncMeta: _cloudSyncMeta, googleCalendarSyncState, ...rest } = state;
  return JSON.stringify({
    ...rest,
    googleCalendarSyncState: {
      ...googleCalendarSyncState,
      lastSyncAt: undefined,
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
  const cloudSyncTimer = useRef<number | null>(null);
  const lastUploadedFingerprint = useRef("");
  const lastCalendarSyncedFingerprint = useRef("");

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
      setCloudStatus("Google Calendar is connected. Pawfolio can sync reminders into your primary calendar.");
      setCloudAction("idle");
    },
    [setState],
  );

  useEffect(() => {
    const callback = parseAuthCallbackUrl(window.location.href);
    if (callback.requestedTab === "profile" || callback.authReturn || callback.code || callback.error) {
      setTab("profile");
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
      if (callback.requestedTab === "profile" || callback.authReturn || callback.code || callback.error) {
        setTab("profile");
      }

      if (callback.error) {
        if (!cancelled) setCloudStatus(`Google sign-in didn't finish: ${callback.error}`);
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
              setCloudStatus((calendarError as Error).message);
            }
          } else {
            setCloudStatus("Signed in. This phone keeps the working copy, and you can back it up or save push now.");
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
        setTab("profile");
        setCloudStatus("Signed in. This phone keeps the working copy, and you can back it up or save push now.");
        window.history.replaceState({}, document.title, cleanupAuthCallbackUrl(window.location.href));
      }
    });

    return () => {
      cancelled = true;
      data.subscription.unsubscribe();
    };
  }, [finalizeGoogleCalendarConnection, setState, setTab]);

  useEffect(() => {
    if (!session) return undefined;
    const syncFingerprint = cloudSyncFingerprint(state);
    if (syncFingerprint === lastUploadedFingerprint.current) return undefined;
    if (cloudSyncTimer.current) window.clearTimeout(cloudSyncTimer.current);

    cloudSyncTimer.current = window.setTimeout(() => {
      uploadLocalPawfolioToAccount({ ...state, cloudSyncMeta: initialState.cloudSyncMeta })
        .then(() => {
          lastUploadedFingerprint.current = syncFingerprint;
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
                },
              }));
            }).catch(() => undefined);
          }
        })
        .catch(() => undefined);
    }, 1200);

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
    setCloudStatus("Signed out. This phone still has its local Pawfolio, but cloud backup and phone push are off until you sign back in.");
  }, []);

  const uploadCloud = useCallback(() => {
    setCloudAction("uploading");
    setCloudStatus("Uploading this phone's Pawfolio into your private account...");
    const syncFingerprint = cloudSyncFingerprint(state);
    uploadLocalPawfolioToAccount({ ...state, cloudSyncMeta: initialState.cloudSyncMeta })
      .then(async () => {
        lastUploadedFingerprint.current = syncFingerprint;
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
          setState((current) => ({
            ...current,
            googleCalendarSyncState: {
              ...current.googleCalendarSyncState,
              connected: true,
              lastSyncAt: result.lastSyncAt || new Date().toISOString(),
            },
          }));
        }

        setCloudStatus("Local Pawfolio uploaded to your account.");
      })
      .catch((error: Error) => setCloudStatus(error.message))
      .finally(() => setCloudAction("idle"));
  }, [session, setState, state]);

  const restoreCloud = useCallback(() => {
    setCloudAction("restoring");
    setCloudStatus("Restoring your latest private Pawfolio backup...");
    downloadCloudPawfolioToLocal()
      .then((snapshot) => {
        if (!snapshot?.state) {
          setCloudStatus("No cloud Pawfolio backup was found yet. This phone is still your working copy.");
          return;
        }
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
        setCloudStatus("Cloud Pawfolio restored to this phone.");
      })
      .catch((error: Error) => setCloudStatus(error.message))
      .finally(() => setCloudAction("idle"));
  }, [setState]);

  const enablePush = useCallback(() => {
    setCloudAction("enabling_push");
    setCloudStatus("Saving this phone for Pawfolio reminders...");
    getCloudSession()
      .then((activeSession) => {
        if (!activeSession) {
          setCloudStatus("Sign in before enabling phone push.");
          return undefined;
        }
        setSession(activeSession);
        return subscribeDeviceToPush(activeSession).then(async () => {
          await refreshPushStatus();
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
          setCloudStatus("This phone is saved for Pawfolio push reminders.");
        });
      })
      .catch((error: Error) => setCloudStatus(error.message))
      .finally(() => setCloudAction("idle"));
  }, [refreshPushStatus, setState]);

  const connectCalendar = useCallback(() => {
    setCloudAction("connecting_calendar");
    setCloudStatus("Connecting Google Calendar...");
    signInWithGoogle({ intent: "calendar", scopes: "https://www.googleapis.com/auth/calendar", forceConsent: true })
      .catch((error: Error) => {
        setCloudStatus(error.message);
        setCloudAction("idle");
      });
  }, []);

  const syncCalendarNow = useCallback(() => {
    if (!session) {
      setCloudStatus("Sign in before syncing Google Calendar.");
      return;
    }
    setCloudAction("syncing_calendar");
    setCloudStatus("Syncing Pawfolio into Google Calendar...");
    syncGoogleCalendar(session)
      .then((result) => {
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
          },
        }));
        setCloudStatus("Google Calendar synced.");
      })
      .catch((error: Error) => {
        setCloudStatus(error.message);
      })
      .finally(() => setCloudAction("idle"));
  }, [session, setState]);

  const trustState = useMemo<TrustState>(() => ({
    backup:
      cloudAction === "uploading"
        ? "uploading"
        : !session
          ? "idle"
          : cloudStatus.includes("backup was found yet")
            ? "empty"
            : cloudStatus.includes("uploaded")
              ? "uploaded"
              : cloudStatus.includes("upload") && !cloudStatus.includes("uploaded")
                ? "failed"
                : state.cloudSyncMeta.lastUploadedAt
                  ? "uploaded"
                  : "idle",
    restore:
      cloudAction === "restoring"
        ? "restoring"
        : cloudStatus.includes("No cloud Pawfolio backup")
          ? "empty"
          : cloudStatus.includes("restored")
            ? "restored"
            : cloudStatus.includes("Restoring") || cloudStatus.includes("restore")
              ? "failed"
              : "idle",
    push:
      cloudAction === "enabling_push"
        ? "saving"
        : pushPermission === "denied"
          ? "blocked"
          : hasPushSubscription
            ? "active"
            : cloudStatus.toLowerCase().includes("push") && cloudStatus.toLowerCase().includes("error")
              ? "failed"
              : "idle",
    calendar:
      cloudAction === "connecting_calendar" || cloudAction === "syncing_calendar"
        ? "connecting"
        : state.googleCalendarSyncState.connected
          ? "connected"
          : cloudStatus.toLowerCase().includes("calendar") && cloudStatus.toLowerCase().includes("error")
            ? "sync_error"
            : "disconnected",
    email:
      state.notificationPreferences.email
        ? cloudStatus.toLowerCase().includes("email") && cloudStatus.toLowerCase().includes("error")
          ? "send_error"
          : "active"
        : "off",
  }), [cloudAction, cloudStatus, hasPushSubscription, pushPermission, session, state.cloudSyncMeta.lastUploadedAt, state.googleCalendarSyncState.connected, state.notificationPreferences.email]);

  return {
    session,
    cloudStatus,
    cloudAction,
    trustState,
    signIn,
    signOut,
    uploadCloud,
    restoreCloud,
    enablePush,
    connectCalendar,
    syncCalendarNow,
  };
}
