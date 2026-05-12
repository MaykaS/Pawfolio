import { useEffect, useRef } from "react";
import {
  getUpcomingReminders,
  reminderAlertDate,
  tasksForDate,
  todayISO,
  type DailyTask,
  type Reminder,
  type ReminderHistory,
  type RoutineCoachSettings,
  type TaskHistory,
} from "../pawfolio";

type UseLocalReminderSchedulingArgs = {
  reminders: Reminder[];
  reminderHistory: ReminderHistory;
  tasks: DailyTask[];
  taskHistory: TaskHistory;
  routineCoachSettings: RoutineCoachSettings;
  enabled: boolean;
};

function parseTaskClock(time?: string) {
  const [hours = "9", minutes = "0"] = (time || "09:00").split(":");
  return {
    hours: Number.parseInt(hours, 10) || 9,
    minutes: Number.parseInt(minutes, 10) || 0,
  };
}

function taskMissedAlertDate(task: Pick<DailyTask, "time">, date: string, graceMinutes: number) {
  const [year, month, day] = date.split("-").map((value) => Number.parseInt(value, 10));
  const { hours, minutes } = parseTaskClock(task.time);
  const alertAt = new Date(year, month - 1, day, hours, minutes, 0, 0);
  alertAt.setMinutes(alertAt.getMinutes() + graceMinutes);
  return alertAt;
}

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

    const scheduleUpcomingNotifications = () => {
      clearScheduledTimers();
      const now = new Date();
      const upcoming = getUpcomingReminders(reminders, now, reminderHistory).slice(0, 12);
      const withinNextHour = upcoming.filter((reminder) => {
        const alertAt = reminderAlertDate(reminder);
        const delay = alertAt.getTime() - now.getTime();
        return delay >= -5 * 60 * 1000 && delay <= 60 * 60 * 1000;
      });

      withinNextHour.forEach((reminder) => {
        const alertAt = reminderAlertDate(reminder);
        const delay = Math.max(0, alertAt.getTime() - Date.now());
        const notificationKey = `pawfolio-local-alert:${reminder.id}:${reminder.date}`;
        const timer = window.setTimeout(async () => {
          if (sessionStorage.getItem(notificationKey) === "1") return;
          sessionStorage.setItem(notificationKey, "1");
          const body = `${reminder.title} is due ${reminder.time || "today"}.`;
          if ("serviceWorker" in navigator) {
            const registration = await navigator.serviceWorker.ready;
            await registration.showNotification("Pawfolio reminder", {
              body,
              icon: "/pwa-192x192.png",
              badge: "/pwa-192x192.png",
              tag: `pawfolio-reminder-${reminder.id}-${reminder.date}`,
              data: { url: "/?tab=calendar" },
            });
            return;
          }

          new Notification("Pawfolio reminder", { body, tag: `pawfolio-reminder-${reminder.id}-${reminder.date}` });
        }, delay);
        scheduledTimers.current.push(timer);
      });

      if (!routineCoachSettings.enabled || !routineCoachSettings.missedRoutineNudges) return;

      const today = todayISO(now);
      tasksForDate(tasks, taskHistory, today)
        .filter((task) => !task.done && task.time && task.time !== "Anytime")
        .forEach((task) => {
          const alertAt = taskMissedAlertDate(task, today, routineCoachSettings.missedRoutineGraceMinutes);
          const delay = alertAt.getTime() - now.getTime();
          if (delay < -5 * 60 * 1000 || delay > 60 * 60 * 1000) return;

          const notificationKey = `pawfolio-local-task-alert:${task.id}:${today}`;
          const timer = window.setTimeout(async () => {
            if (sessionStorage.getItem(notificationKey) === "1") return;
            sessionStorage.setItem(notificationKey, "1");
            const body = `Did you forget to mark ${task.title.toLowerCase()}?`;
            if ("serviceWorker" in navigator) {
              const registration = await navigator.serviceWorker.ready;
              await registration.showNotification("Pawfolio check-in", {
                body,
                icon: "/pwa-192x192.png",
                badge: "/pwa-192x192.png",
                tag: `pawfolio-task-${task.id}-${today}`,
                data: { url: "/?tab=today" },
              });
              return;
            }

            new Notification("Pawfolio check-in", { body, tag: `pawfolio-task-${task.id}-${today}` });
          }, delay);
          scheduledTimers.current.push(timer);
        });
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
