import {
  missedRoutineTasks,
  normalizeState,
  reminderAlertDate,
  tasksForDate,
  toLocalISO,
  visibleReminders,
  type DailyTask,
  type PawfolioState,
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

function dueReminderCandidates(state: PawfolioState, now: Date) {
  return visibleReminders(state)
    .filter((reminder) => reminder.date)
    .map((reminder) => {
      const alertAt = reminderAlertDate(reminder);
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
  const today = toLocalISO(now);
  const todayTasks = tasksForDate(state.tasks, state.taskHistory, today);
  return missedRoutineTasks(todayTasks as DailyTask[], state.taskHistory, now, state.routineCoachSettings.missedRoutineGraceMinutes)
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
