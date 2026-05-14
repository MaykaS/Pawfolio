import { describe, expect, it } from "vitest";
import {
  buildMissedTaskNotifications,
  buildReminderNotifications,
  shouldSendScheduledLocalNotification,
} from "./reminderScheduling";
import type { Reminder, RoutineCoachSettings } from "./pawfolio";

const routineCoachSettings: RoutineCoachSettings = {
  enabled: true,
  missedRoutineNudges: true,
  missedRoutineGraceMinutes: 60,
};

describe("local reminder scheduling helpers", () => {
  it("builds a missed-task notification exactly one hour after a timed task", () => {
    const notifications = buildMissedTaskNotifications(
      [{ id: "snacks", title: "Snacks", time: "13:00", done: false, note: "" }],
      {},
      routineCoachSettings,
      new Date(2026, 4, 12, 14, 0),
    );

    expect(notifications).toHaveLength(1);
    expect(notifications[0]?.key).toBe("pawfolio-local-task-alert:snacks:2026-05-12");
    expect(notifications[0]?.title).toBe("Pawfolio check-in");
  });

  it("does not build a missed-task notification when the task is already marked done", () => {
    const notifications = buildMissedTaskNotifications(
      [{ id: "snacks", title: "Snacks", time: "13:00", done: false, note: "" }],
      { "2026-05-12": { snacks: true } },
      routineCoachSettings,
      new Date(2026, 4, 12, 14, 0),
    );

    expect(notifications).toEqual([]);
  });

  it("catches a missed-task notification shortly after the alert time when the app wakes up", () => {
    const notifications = buildMissedTaskNotifications(
      [{ id: "walk", title: "Walk", time: "09:00", done: false, note: "" }],
      {},
      routineCoachSettings,
      new Date(2026, 4, 12, 10, 3),
    );

    expect(notifications).toHaveLength(1);
  });

  it("suppresses a scheduled missed-task notification if the task was marked done before it fires", () => {
    const [notification] = buildMissedTaskNotifications(
      [{ id: "snacks", title: "Snacks", time: "13:00", done: false, note: "" }],
      {},
      routineCoachSettings,
      new Date(2026, 4, 12, 14, 0),
    );

    expect(notification).toBeDefined();
    expect(shouldSendScheduledLocalNotification(notification!, {
      reminders: [],
      reminderHistory: {},
      tasks: [{ id: "snacks", title: "Snacks", time: "13:00", done: false, note: "" }],
      taskHistory: { "2026-05-12": { snacks: true } },
      routineCoachSettings,
    }, new Date(2026, 4, 12, 14, 0))).toBe(false);
  });

  it("builds a standard dated reminder notification inside the next-hour window", () => {
    const reminders: Reminder[] = [{
      id: "vet",
      title: "Vet visit",
      type: "Vet",
      date: "2026-05-12",
      time: "15:00",
      note: "",
      recurrence: "none",
      notifyLeadMinutes: 60,
    }];

    const notifications = buildReminderNotifications(reminders, {}, new Date(2026, 4, 12, 14, 0));

    expect(notifications).toHaveLength(1);
    expect(notifications[0]?.title).toBe("Pawfolio reminder");
  });
});
