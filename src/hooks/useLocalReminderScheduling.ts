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
  type ScheduledLocalNotification,
} from "../reminderScheduling";

type UseLocalReminderSchedulingArgs = {
  reminders: Reminder[];
  reminderHistory: ReminderHistory;
  tasks: DailyTask[];
  taskHistory: TaskHistory;
  routineCoachSettings: RoutineCoachSettings;
  enabled: boolean;
};

export function useLocalReminderScheduling({
  reminders,
  reminderHistory,
  tasks,
  taskHistory,
  routineCoachSettings,
  enabled,
}: UseLocalReminderSchedulingArgs) {
  const scheduledTimers = useRef<number[]>([]);
  const rescanTimer = useRef<number | null>(null);

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

    if (!enabled || Notification.permission !== "granted") return undefined;

    const queueNotifications = (notifications: ScheduledLocalNotification[]) => {
      notifications.forEach((notification) => {
        const delay = Math.max(0, notification.fireAt.getTime() - Date.now());
        const timer = window.setTimeout(async () => {
          if (sessionStorage.getItem(notification.key) === "1") return;
          sessionStorage.setItem(notification.key, "1");
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
        }, delay);
        scheduledTimers.current.push(timer);
      });
    };

    const scheduleUpcomingNotifications = () => {
      clearScheduledTimers();
      const now = new Date();
      queueNotifications(buildReminderNotifications(reminders, reminderHistory, now));
      queueNotifications(buildMissedTaskNotifications(tasks, taskHistory, routineCoachSettings, now));
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
  }, [enabled, reminders, reminderHistory, routineCoachSettings, taskHistory, tasks]);
}
