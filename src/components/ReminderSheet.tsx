import { ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  defaultReminderLeadMinutes,
  reminderRecurrenceOptions,
  reminderTypes,
  timeZoneAbbreviation,
  timeZoneLabel,
  type Reminder,
  type ReminderRecurrence,
} from "../pawfolio";
import { Field, Sheet } from "./Sheet";

type ReminderDraft = {
  title: string;
  type: string;
  date: string;
  time: string;
  note: string;
  recurrence: ReminderRecurrence;
  notifyLeadMinutes: number;
};

function availableTimeZones(current?: string) {
  const supported = typeof Intl.supportedValuesOf === "function"
    ? Intl.supportedValuesOf("timeZone")
    : [
        "UTC",
        "America/New_York",
        "America/Chicago",
        "America/Denver",
        "America/Los_Angeles",
        "Europe/London",
        "Europe/Paris",
        "Asia/Tokyo",
        "Australia/Sydney",
      ];
  return current && !supported.includes(current) ? [current, ...supported] : supported;
}

function isValidTimeZone(timeZone: string) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone }).format(new Date());
    return true;
  } catch {
    return false;
  }
}


export function ReminderSheet({
  mode,
  deviceTimeZone,
  onClose,
  onSave,
  renderLeadChips,
}: {
  mode: { mode: "create"; date?: string; draft?: Partial<Reminder> } | { mode: "edit"; reminder: Reminder };
  deviceTimeZone: string;
  onClose: () => void;
  onSave: (reminder: Reminder) => void;
  renderLeadChips: (value: number, onChange: (value: number) => void) => React.ReactNode;
}) {
  const existing = mode.mode === "edit" ? mode.reminder : undefined;
  const draft = mode.mode === "create" ? mode.draft : undefined;
  const [reminder, setReminder] = useState<ReminderDraft>({
    title: existing?.title || draft?.title || "",
    type: existing?.type || draft?.type || "Vet",
    date: existing?.date || draft?.date || (mode.mode === "create" ? mode.date : undefined) || new Date().toISOString().slice(0, 10),
    time: existing?.time || draft?.time || "",
    note: existing?.note || draft?.note || "",
    recurrence: existing?.recurrence || draft?.recurrence || ("none" as ReminderRecurrence),
    notifyLeadMinutes:
      existing?.notifyLeadMinutes
      ?? draft?.notifyLeadMinutes
      ?? defaultReminderLeadMinutes(existing?.type || draft?.type || "Vet"),
  });
  const [timeZoneSheetOpen, setTimeZoneSheetOpen] = useState(false);
  const [timeZoneMode, setTimeZoneMode] = useState<"device" | "custom">(existing?.timeZone || draft?.timeZone ? "custom" : "device");
  const [timeZoneDraft, setTimeZoneDraft] = useState(existing?.timeZone || draft?.timeZone || deviceTimeZone);
  const [timeZoneError, setTimeZoneError] = useState("");
  const timeZoneOptions = useMemo(
    () => availableTimeZones(timeZoneDraft || deviceTimeZone),
    [deviceTimeZone, timeZoneDraft],
  );

  useEffect(() => {
    if (timeZoneMode === "device") setTimeZoneDraft(deviceTimeZone);
  }, [deviceTimeZone, timeZoneMode]);

  const effectiveTimeZone = timeZoneMode === "custom" ? timeZoneDraft : deviceTimeZone;
  const effectiveTimeZoneAbbreviation = timeZoneAbbreviation(effectiveTimeZone);

  const update = (key: keyof ReminderDraft, value: string) => {
    setReminder((current) => ({ ...current, [key]: value }));
  };

  return (
    <Sheet title={mode.mode === "edit" ? "Edit reminder" : "Add reminder"} onClose={onClose}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (timeZoneMode === "custom" && !isValidTimeZone(timeZoneDraft)) {
            setTimeZoneError("Pick a time zone from the list.");
            setTimeZoneSheetOpen(true);
            return;
          }
          onSave({
            id: existing?.id || `reminder-${crypto.randomUUID()}`,
            ...reminder,
            timeZone:
              timeZoneMode === "custom" && timeZoneDraft !== deviceTimeZone
                ? timeZoneDraft
                : undefined,
          });
        }}
      >
        <Field label="Title">
          <input className="input" value={reminder.title} onChange={(event) => update("title", event.target.value)} required />
        </Field>
        <div className="form-two">
          <Field label="Type">
            <select
              className="input"
              value={reminder.type}
              onChange={(event) =>
                setReminder((current) => ({
                  ...current,
                  type: event.target.value,
                  notifyLeadMinutes:
                    mode.mode === "create" ? defaultReminderLeadMinutes(event.target.value) : current.notifyLeadMinutes,
                }))
              }
            >
              {reminderTypes.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
          </Field>
          <div className="time-block">
            <Field label="Time">
              <input className="input time-input" type="time" value={reminder.time} onChange={(event) => update("time", event.target.value)} />
            </Field>
            <button
              className="time-zone-link"
              type="button"
              onClick={() => setTimeZoneSheetOpen(true)}
              aria-label={`Change time zone, currently ${effectiveTimeZone}`}
            >
              <span>Time zone</span>
              <span className="time-zone-link-value">
                {effectiveTimeZoneAbbreviation}
                <ChevronRight size={14} />
              </span>
            </button>
          </div>
        </div>
        <Field label="Repeat">
          <select
            className="input"
            value={reminder.recurrence}
            onChange={(event) => update("recurrence", event.target.value as ReminderRecurrence)}
          >
            {reminderRecurrenceOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Notify">
          {renderLeadChips(reminder.notifyLeadMinutes, (value) => setReminder((current) => ({ ...current, notifyLeadMinutes: value })))}
        </Field>
        <Field label="Date">
          <input className="input" type="date" value={reminder.date} onChange={(event) => update("date", event.target.value)} />
        </Field>
        <Field label="Note">
          <textarea className="input" value={reminder.note} onChange={(event) => update("note", event.target.value)} />
        </Field>
        <button className="btn btn-primary">Save reminder</button>
      </form>
      {timeZoneSheetOpen && (
        <Sheet title="Time zone" onClose={() => setTimeZoneSheetOpen(false)}>
          <section className="card reminder-timezone-panel">
            <div className="time-zone-mode-row">
              <button
                className={timeZoneMode === "device" ? "choice-chip active" : "choice-chip"}
                type="button"
                onClick={() => {
                  setTimeZoneMode("device");
                  setTimeZoneDraft(deviceTimeZone);
                  setTimeZoneError("");
                }}
              >
                Use this device
              </button>
              <button
                className={timeZoneMode === "custom" ? "choice-chip active" : "choice-chip"}
                type="button"
                onClick={() => setTimeZoneMode("custom")}
              >
                Custom
              </button>
            </div>
            {timeZoneMode === "custom" && (
              <div className="time-zone-list" role="listbox" aria-label="Time zones">
                {timeZoneOptions.map((timeZone) => (
                  <button
                    key={timeZone}
                    className={timeZoneDraft === timeZone ? "time-zone-option active" : "time-zone-option"}
                    type="button"
                    onClick={() => {
                      setTimeZoneDraft(timeZone);
                      setTimeZoneError("");
                    }}
                  >
                    <span className="time-zone-option-title">{timeZoneAbbreviation(timeZone)}</span>
                    <span className="time-zone-option-detail">{timeZoneLabel(timeZone)}</span>
                  </button>
                ))}
              </div>
            )}
            <p className={timeZoneError ? "field-error" : "settings-note"}>
              {timeZoneError || "New reminders use this device time zone unless you choose a different one here."}
            </p>
            <button
              className="btn btn-primary"
              type="button"
              onClick={() => {
                if (timeZoneMode === "custom" && !isValidTimeZone(timeZoneDraft)) {
                  setTimeZoneError("Pick a time zone from the list.");
                  return;
                }
                setTimeZoneSheetOpen(false);
              }}
            >
              Done
            </button>
          </section>
        </Sheet>
      )}
    </Sheet>
  );
}
