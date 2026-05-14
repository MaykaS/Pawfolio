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
} from "./pawfolio";

export type ScheduledLocalNotification = {
  key: string;
  title: string;
  body: string;
  tag: string;
  url: string;
  fireAt: Date;
  kind: "reminder" | "task";
};

function parseTaskClock(time?: string) {
  const [hours = "9", minutes = "0"] = (time || "09:00").split(":");
  return {
    hours: Number.parseInt(hours, 10) || 9,
    minutes: Number.parseInt(minutes, 10) || 0,
  };
}

export function taskMissedAlertDate(task: Pick<DailyTask, "time">, date: string, graceMinutes: number) {
  const [year, month, day] = date.split("-").map((value) => Number.parseInt(value, 10));
  const { hours, minutes } = parseTaskClock(task.time);
  const alertAt = new Date(year, month - 1, day, hours, minutes, 0, 0);
  alertAt.setMinutes(alertAt.getMinutes() + graceMinutes);
  return alertAt;
}

function isWithinLocalSchedulingWindow(fireAt: Date, now: Date) {
  const delay = fireAt.getTime() - now.getTime();
  return delay >= -5 * 60 * 1000 && delay <= 60 * 60 * 1000;
}

export function buildReminderNotifications(
  reminders: Reminder[],
  reminderHistory: ReminderHistory,
  now = new Date(),
): ScheduledLocalNotification[] {
  return getUpcomingReminders(reminders, now, reminderHistory)
    .slice(0, 12)
    .map((reminder) => {
      const fireAt = reminderAlertDate(reminder);
      return {
        reminder,
        fireAt,
      };
    })
    .filter(({ fireAt }) => isWithinLocalSchedulingWindow(fireAt, now))
    .map(({ reminder, fireAt }) => ({
      key: `pawfolio-local-alert:${reminder.id}:${reminder.date}`,
      kind: "reminder" as const,
      title: "Pawfolio reminder",
      body: `${reminder.title} is due ${reminder.time || "today"}.`,
      tag: `pawfolio-reminder-${reminder.id}-${reminder.date}`,
      url: "/?tab=calendar",
      fireAt,
    }));
}

export function buildMissedTaskNotifications(
  tasks: DailyTask[],
  taskHistory: TaskHistory,
  routineCoachSettings: RoutineCoachSettings,
  now = new Date(),
): ScheduledLocalNotification[] {
  if (!routineCoachSettings.enabled || !routineCoachSettings.missedRoutineNudges) return [];
  const today = todayISO(now);

  return tasksForDate(tasks, taskHistory, today)
    .filter((task) => !task.done && task.time && task.time !== "Anytime")
    .map((task) => {
      const fireAt = taskMissedAlertDate(task, today, routineCoachSettings.missedRoutineGraceMinutes);
      return {
        task,
        fireAt,
      };
    })
    .filter(({ fireAt }) => isWithinLocalSchedulingWindow(fireAt, now))
    .map(({ task, fireAt }) => ({
      key: `pawfolio-local-task-alert:${task.id}:${today}`,
      kind: "task" as const,
      title: "Pawfolio check-in",
      body: `Did you forget to mark ${task.title.toLowerCase()}?`,
      tag: `pawfolio-task-${task.id}-${today}`,
      url: "/?tab=today",
      fireAt,
    }));
}

export function shouldSendScheduledLocalNotification(
  notification: ScheduledLocalNotification,
  args: {
    reminders: Reminder[];
    reminderHistory: ReminderHistory;
    tasks: DailyTask[];
    taskHistory: TaskHistory;
    routineCoachSettings: RoutineCoachSettings;
  },
  now = new Date(),
) {
  if (notification.kind === "reminder") {
    return buildReminderNotifications(args.reminders, args.reminderHistory, now)
      .some((candidate) => candidate.key === notification.key);
  }

  return buildMissedTaskNotifications(args.tasks, args.taskHistory, args.routineCoachSettings, now)
    .some((candidate) => candidate.key === notification.key);
}
