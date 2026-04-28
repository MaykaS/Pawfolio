import { useEffect, useRef } from "react";
import { getUpcomingReminders, reminderAlertDate, type Reminder, type ReminderHistory } from "../pawfolio";

type UseLocalReminderSchedulingArgs = {
  reminders: Reminder[];
  reminderHistory: ReminderHistory;
  enabled: boolean;
};

export function useLocalReminderScheduling({ reminders, reminderHistory, enabled }: UseLocalReminderSchedulingArgs) {
  const scheduledReminderTimers = useRef<number[]>([]);

  useEffect(() => {
    scheduledReminderTimers.current.forEach((timer) => window.clearTimeout(timer));
    scheduledReminderTimers.current = [];

    if (!enabled || Notification.permission !== "granted") return undefined;

    const now = new Date();
    const upcoming = getUpcomingReminders(reminders, now, reminderHistory).slice(0, 12);
    const withinNextHour = upcoming.filter((reminder) => {
      const alertAt = reminderAlertDate(reminder);
      const delay = alertAt.getTime() - now.getTime();
      return delay >= 0 && delay <= 60 * 60 * 1000;
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
            tag: `pawfolio-local-${reminder.id}-${reminder.date}`,
            data: { url: "/?tab=calendar" },
          });
          return;
        }

        new Notification("Pawfolio reminder", { body });
      }, delay);
      scheduledReminderTimers.current.push(timer);
    });

    return () => {
      scheduledReminderTimers.current.forEach((timer) => window.clearTimeout(timer));
      scheduledReminderTimers.current = [];
    };
  }, [enabled, reminders, reminderHistory]);
}
