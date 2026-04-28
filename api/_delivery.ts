import {
  missedRoutineTasks,
  normalizeState,
  resolvedScheduleTimeZone,
  tasksForDate,
  toLocalISO,
  visibleReminders,
  type DailyTask,
  type PawfolioState,
  type Reminder,
} from "../src/pawfolio.js";

export type DeliveryCandidate = {
  channelItemType: "reminder" | "task";
  itemId: string;
  occurrenceAt: string;
  title: string;
  body: string;
  url: string;
};

function withinDeliveryWindow(date: Date, now: Date, lookbackMinutes = 5, lookaheadMinutes = 5) {
  const start = now.getTime() - lookbackMinutes * 60_000;
  const end = now.getTime() + lookaheadMinutes * 60_000;
  return date.getTime() >= start && date.getTime() <= end;
}

function parseReminderClock(time?: string) {
  const [hours = "9", minutes = "0"] = (time || "09:00").split(":");
  return {
    hours: Number.parseInt(hours, 10) || 9,
    minutes: Number.parseInt(minutes, 10) || 0,
  };
}

function timeZoneOffsetMs(date: Date, timeZone: string) {
  const formatted = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "shortOffset",
  }).formatToParts(date);
  const offsetValue = formatted.find((part) => part.type === "timeZoneName")?.value || "GMT+0";
  const match = offsetValue.match(/^GMT([+-])(\d{1,2})(?::?(\d{2}))?$/i);
  if (!match) return 0;
  const [, sign, hours, minutes = "0"] = match;
  const totalMinutes = (Number.parseInt(hours, 10) * 60) + Number.parseInt(minutes, 10);
  return (sign === "-" ? -1 : 1) * totalMinutes * 60_000;
}

function wallClockDateInTimeZone(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const map = Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
  return new Date(
    Number.parseInt(map.year || "1970", 10),
    Math.max(0, Number.parseInt(map.month || "1", 10) - 1),
    Number.parseInt(map.day || "1", 10),
    Number.parseInt(map.hour || "0", 10),
    Number.parseInt(map.minute || "0", 10),
    Number.parseInt(map.second || "0", 10),
    0,
  );
}

function zonedDateTimeToUtc(dateText: string, timeText: string | undefined, timeZone: string) {
  const [year, month, day] = dateText.split("-").map((value) => Number.parseInt(value, 10));
  const { hours, minutes } = parseReminderClock(timeText);
  let guess = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0, 0));
  for (let index = 0; index < 2; index += 1) {
    const offset = timeZoneOffsetMs(guess, timeZone);
    guess = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0, 0) - offset);
  }
  return guess;
}

function reminderAlertDateForTimeZone(reminder: Reminder, timeZone: string) {
  const alertDate = zonedDateTimeToUtc(reminder.date, reminder.time, timeZone);
  const leadMinutes = reminder.notifyLeadMinutes ?? 0;
  if (leadMinutes === 720) {
    const sameDay = zonedDateTimeToUtc(reminder.date, "09:00", timeZone);
    return sameDay.getTime() <= alertDate.getTime() ? sameDay : alertDate;
  }
  alertDate.setMinutes(alertDate.getMinutes() - leadMinutes);
  return alertDate;
}

function stateTimeZone(state: PawfolioState) {
  return resolvedScheduleTimeZone(state.cloudSyncMeta);
}

function dueReminderCandidates(state: PawfolioState, now: Date) {
  const timeZone = stateTimeZone(state);
  return visibleReminders(state)
    .filter((reminder) => reminder.date)
    .map((reminder) => {
      const alertAt = reminderAlertDateForTimeZone(reminder, timeZone);
      return {
        reminder,
        alertAt,
      };
    })
    .filter(({ alertAt }) => withinDeliveryWindow(alertAt, now))
    .map(({ reminder, alertAt }) => ({
      channelItemType: "reminder" as const,
      itemId: reminder.id,
      occurrenceAt: alertAt.toISOString(),
      title: "Pawfolio reminder",
      body: `${reminder.title} is due ${reminder.time || "today"}.`,
      url: "/?tab=calendar",
    }));
}

function dueMissedTaskCandidates(state: PawfolioState, now: Date) {
  if (!state.routineCoachSettings?.missedRoutineNudges) return [];
  const timeZone = stateTimeZone(state);
  const localNow = wallClockDateInTimeZone(now, timeZone);
  const today = toLocalISO(localNow);
  const todayTasks = tasksForDate(state.tasks, state.taskHistory, today);
  return missedRoutineTasks(todayTasks as DailyTask[], state.taskHistory, localNow, state.routineCoachSettings.missedRoutineGraceMinutes)
    .filter((task) => task.time && task.time !== "Anytime")
    .map((task) => {
      const occurrenceAt = new Date(now.getTime()).toISOString();
      return {
        channelItemType: "task" as const,
        itemId: task.id,
        occurrenceAt,
        title: "Pawfolio check-in",
        body: `Did you forget to mark ${task.title.toLowerCase()}?`,
        url: "/?tab=today",
      };
    });
}

export function collectDueDeliveryCandidates(rawState: unknown, now = new Date()) {
  const state = normalizeState(rawState as Partial<PawfolioState>);
  return [...dueReminderCandidates(state, now), ...dueMissedTaskCandidates(state, now)];
}
