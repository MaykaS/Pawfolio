import { useEffect, useRef } from "react";
import {
  type DailyTask,
  type Reminder,
  type ReminderHistory,
  type RoutineCoachSettings,
  type TaskHistory,
} from "../pawfolio";
import {
  buildMissedTaskNotifications,
  buildReminderNotifications,
  freshestSchedulingStateArgs,
  markLocalNotificationHandled,
  shouldSendScheduledLocalNotification,
  type ScheduledLocalNotification,
  wasLocalNotificationHandled,
} from "../reminderScheduling";

type UseLocalReminderSchedulingArgs = {
  reminders: Reminder[];
  reminderHistory: ReminderHistory;
  tasks: DailyTask[];
  taskHistory: TaskHistory;
  routineCoachSettings: RoutineCoachSettings;
  enabled: boolean;
  skipTaskNudges?: boolean;
};

export function useLocalReminderScheduling({
  reminders,
  reminderHistory,
  tasks,
  taskHistory,
  routineCoachSettings,
  enabled,
  skipTaskNudges = false,
}: UseLocalReminderSchedulingArgs) {
  const scheduledTimers = useRef<number[]>([]);
  const rescanTimer = useRef<number | null>(null);
  const latestArgs = useRef({
    reminders,
    reminderHistory,
    tasks,
    taskHistory,
    routineCoachSettings,
  });

  latestArgs.current = {
    reminders,
    reminderHistory,
    tasks,
    taskHistory,
    routineCoachSettings,
  };

  const clearScheduledTimers = () => {
    scheduledTimers.current.forEach((timer) => window.clearTimeout(timer));
    scheduledTimers.current = [];
  };

  useEffect(() => {
    clearScheduledTimers();
    if (rescanTimer.current) {
      window.clearInterval(rescanTimer.current);
      rescanTimer.current = null;
    }

    if (!enabled || typeof Notification === "undefined" || Notification.permission !== "granted") return undefined;

    const queueNotifications = (notifications: ScheduledLocalNotification[]) => {
      notifications.forEach((notification) => {
        const delay = Math.max(0, notification.fireAt.getTime() - Date.now());
        const timer = window.setTimeout(async () => {
          if (sessionStorage.getItem(notification.key) === "1") return;
          const send = async () => {
            if (wasLocalNotificationHandled(notification.key, localStorage)) return;
            if (!shouldSendScheduledLocalNotification(notification, freshestSchedulingStateArgs(latestArgs.current, localStorage), new Date())) return;
            sessionStorage.setItem(notification.key, "1");
            markLocalNotificationHandled(notification.key, localStorage);
            if ("serviceWorker" in navigator) {
              const registration = await navigator.serviceWorker.ready;
              await registration.showNotification(notification.title, {
                body: notification.body,
                icon: "/pwa-192x192.png",
                badge: "/pwa-192x192.png",
                tag: notification.tag,
                data: { url: notification.url },
              });
              return;
            }

            new Notification(notification.title, { body: notification.body, tag: notification.tag });
          };

          const navigatorWithLocks = navigator as Navigator & {
            locks?: {
              request: <T>(name: string, callback: () => Promise<T> | T) => Promise<T>;
            };
          };
          if (navigatorWithLocks.locks?.request) {
            await navigatorWithLocks.locks.request(`pawfolio-notification:${notification.key}`, send);
            return;
          }
          await send();
        }, delay);
        scheduledTimers.current.push(timer);
      });
    };

    const scheduleUpcomingNotifications = () => {
      clearScheduledTimers();
      const now = new Date();
      queueNotifications(buildReminderNotifications(reminders, reminderHistory, now));
      if (!skipTaskNudges) {
        queueNotifications(buildMissedTaskNotifications(tasks, taskHistory, routineCoachSettings, now));
      }
    };

    scheduleUpcomingNotifications();
    rescanTimer.current = window.setInterval(scheduleUpcomingNotifications, 60_000);

    return () => {
      clearScheduledTimers();
      if (rescanTimer.current) {
        window.clearInterval(rescanTimer.current);
        rescanTimer.current = null;
      }
    };
  }, [enabled, reminders, reminderHistory, routineCoachSettings, skipTaskNudges, taskHistory, tasks]);
}
