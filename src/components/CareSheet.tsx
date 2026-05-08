import { useState, type ChangeEvent, type ReactNode } from "react";
import {
  careRecordDocCategory,
  careTypeToReminderType,
  careTypes,
  defaultReminderLeadMinutes,
  healthDocTitleFromFileName,
  isSharedCareType,
  medicationDoseUnits,
  medicationFrequencyOptions,
  normalizeMedicationDose,
  normalizeMedicationFrequency,
  todayISO,
  type CareRecord,
  type HealthDoc,
} from "../pawfolio";
import { Field, Sheet } from "./Sheet";

export type CareSheetMode = { mode: "create" } | { mode: "edit"; record: CareRecord };

export function CareSheet({
  mode,
  onClose,
  onSave,
  existingDocs,
  onUploadDocs,
  renderLeadChips,
  validate,
}: {
  mode: CareSheetMode;
  onClose: () => void;
  onSave: (record: CareRecord, attachedDocIds: string[]) => void;
  existingDocs: HealthDoc[];
  onUploadDocs: (files: File[], options?: { linkedCareRecordId?: string; category?: HealthDoc["category"] }) => Promise<HealthDoc[]>;
  renderLeadChips: (value: number, onChange: (value: number) => void) => ReactNode;
  validate: (record: Partial<CareRecord>) => Partial<Record<keyof CareRecord, string>>;
}) {
  const existing = mode.mode === "edit" ? mode.record : undefined;
  const normalizedExisting = existing ? normalizeMedicationFrequency(normalizeMedicationDose(existing)) : undefined;
  const [record, setRecord] = useState({
    type: normalizedExisting?.type || "Weight",
    title: normalizedExisting?.title || "",
    date: normalizedExisting?.date || todayISO(),
    startDate: normalizedExisting?.startDate || "",
    endDate: normalizedExisting?.endDate || "",
    adherenceNotes: normalizedExisting?.adherenceNotes || "",
    nextDueDate: normalizedExisting?.nextDueDate || "",
    note: normalizedExisting?.note || "",
    dose: normalizedExisting?.dose || "",
    doseAmount: normalizedExisting?.doseAmount || "",
    doseUnit: normalizedExisting?.doseUnit || "chew",
    frequency: normalizedExisting?.frequency || "",
    frequencyType: normalizedExisting?.frequencyType || "monthly",
    frequencyInterval: normalizedExisting?.frequencyInterval || 1,
    refillDate: normalizedExisting?.refillDate || "",
    notifyLeadMinutes: normalizedExisting?.notifyLeadMinutes ?? defaultReminderLeadMinutes(normalizedExisting?.type || "Weight"),
    clinic: normalizedExisting?.clinic || "",
    vetName: normalizedExisting?.vetName || "",
    reason: normalizedExisting?.reason || "",
    weightValue: normalizedExisting?.weightValue || "",
    weightUnit: normalizedExisting?.weightUnit || "lb",
    timeZone: normalizedExisting?.timeZone,
  });
  const [attachedDocs, setAttachedDocs] = useState<HealthDoc[]>(existingDocs);

  const update = (key: keyof typeof record, value: string) => {
    setRecord((current) => ({ ...current, [key]: value }));
  };
  const errors = validate(record);
  const canSave = Object.keys(errors).length === 0;
  const supportsDocs = record.type === "Medication" || record.type === "Vaccine" || record.type === "Vet visit";

  const uploadDocs = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = [...(event.target.files || [])];
    if (!files.length) return;
    const uploaded = await onUploadDocs(files, {
      linkedCareRecordId: existing?.id,
      category: careRecordDocCategory(record.type),
    });
    setAttachedDocs((current) => {
      const byId = new Map(current.map((doc) => [doc.id, doc]));
      uploaded.forEach((doc) => byId.set(doc.id, {
        ...doc,
        title: doc.title || healthDocTitleFromFileName(doc.fileName),
      }));
      return [...byId.values()];
    });
    event.currentTarget.value = "";
  };

  return (
    <Sheet title={mode.mode === "edit" ? "Edit care record" : "Add care record"} onClose={onClose}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!canSave) return;

          const title =
            record.type === "Weight" && record.weightValue
              ? `${record.weightValue} ${record.weightUnit || "lb"}`
              : record.title;
          const nextRecord = { id: existing?.id || `care-${crypto.randomUUID()}`, ...record, title };
          const savedRecord = record.type === "Medication"
            ? normalizeMedicationFrequency(normalizeMedicationDose(nextRecord))
            : nextRecord;
          onSave(savedRecord, attachedDocs.map((doc) => doc.id));
        }}
      >
        <div className="form-two">
          <Field label="Type">
            <select
              className="input"
              value={record.type}
              onChange={(event) =>
                setRecord((current) => ({
                  ...current,
                  type: event.target.value,
                  notifyLeadMinutes: isSharedCareType(event.target.value)
                    ? defaultReminderLeadMinutes(careTypeToReminderType(event.target.value))
                    : current.notifyLeadMinutes,
                }))
              }
            >
              {careTypes.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
          </Field>
          <Field label="Date">
            <input className="input" type="date" value={record.date} onChange={(event) => update("date", event.target.value)} />
          </Field>
        </div>
        <Field label={record.type === "Weight" ? "Label" : record.type === "Medication" ? "Medication name" : record.type === "Vaccine" ? "Vaccine name" : "Title"}>
          <input
            className="input"
            value={record.title}
            onChange={(event) => update("title", event.target.value)}
            required={record.type !== "Weight" && record.type !== "Vet visit"}
          />
          {errors.title && <span className="field-error">{errors.title}</span>}
        </Field>
        {record.type === "Weight" && (
          <div className="form-two">
            <Field label="Weight">
              <input className="input" inputMode="decimal" value={record.weightValue} onChange={(event) => update("weightValue", event.target.value)} placeholder="27.8" />
              {errors.weightValue && <span className="field-error">{errors.weightValue}</span>}
            </Field>
            <Field label="Unit">
              <select className="input" value={record.weightUnit} onChange={(event) => update("weightUnit", event.target.value)}>
                <option>lb</option>
                <option>kg</option>
              </select>
            </Field>
          </div>
        )}
        {record.type === "Medication" && (
          <>
            <Field label="Dose">
              <div className="dose-builder">
                <input
                  className="input dose-amount"
                  inputMode="decimal"
                  value={record.doseAmount}
                  onChange={(event) => update("doseAmount", event.target.value)}
                  placeholder="1"
                />
                <div className="choice-chip-row unit-chip-row">
                  {medicationDoseUnits.map((unit) => (
                    <button
                      className={record.doseUnit === unit.value ? "choice-chip active" : "choice-chip"}
                      key={unit.value}
                      type="button"
                      onClick={() => setRecord((current) => ({ ...current, doseUnit: unit.value }))}
                    >
                      {unit.label}
                    </button>
                  ))}
                </div>
              </div>
              {errors.dose && <span className="field-error">{errors.dose}</span>}
            </Field>
            <Field label="Frequency">
              <div className="frequency-builder">
                <div className="choice-chip-row frequency-chip-row">
                  {medicationFrequencyOptions.map((option) => (
                    <button
                      className={record.frequencyType === option.value ? "choice-chip active" : "choice-chip"}
                      key={option.value}
                      type="button"
                      onClick={() =>
                        setRecord((current) => ({
                          ...current,
                          frequencyType: option.value,
                          frequencyInterval: option.value === "as_needed" ? 1 : current.frequencyInterval || 1,
                        }))
                      }
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                {record.frequencyType !== "as_needed" && (
                  <div className="interval-control">
                    <span>Every</span>
                    <input
                      className="interval-input"
                      type="number"
                      min="1"
                      max="12"
                      value={record.frequencyInterval}
                      onChange={(event) =>
                        setRecord((current) => ({
                          ...current,
                          frequencyInterval: Math.max(1, Number(event.target.value) || 1),
                        }))
                      }
                    />
                    <span>
                      {medicationFrequencyOptions.find((option) => option.value === record.frequencyType)?.noun || "dose"}
                      {record.frequencyInterval > 1 ? "s" : ""}
                    </span>
                  </div>
                )}
              </div>
              {errors.frequency && <span className="field-error">{errors.frequency}</span>}
            </Field>
            <div className="form-two">
              <Field label="Start date">
                <input className="input" type="date" value={record.startDate} onChange={(event) => update("startDate", event.target.value)} />
              </Field>
              <Field label="End date">
                <input className="input" type="date" value={record.endDate} onChange={(event) => update("endDate", event.target.value)} />
                {errors.endDate && <span className="field-error">{errors.endDate}</span>}
              </Field>
            </div>
            <div className="form-two">
              <Field label="Refill / next dose">
                <input className="input" type="date" value={record.refillDate} onChange={(event) => update("refillDate", event.target.value)} />
              </Field>
              <Field label="Reminder">
                {renderLeadChips(record.notifyLeadMinutes, (value) => setRecord((current) => ({ ...current, notifyLeadMinutes: value })))}
              </Field>
            </div>
            <Field label="Missed dose / reaction notes">
              <textarea
                className="input"
                value={record.adherenceNotes}
                onChange={(event) => update("adherenceNotes", event.target.value)}
                placeholder="Skipped dose, upset stomach, gave with food, or anything worth remembering."
              />
            </Field>
          </>
        )}
        {record.type === "Vaccine" && (
          <Field label="Next due date">
            <input className="input" type="date" value={record.nextDueDate} onChange={(event) => update("nextDueDate", event.target.value)} />
            {errors.nextDueDate && <span className="field-error">{errors.nextDueDate}</span>}
          </Field>
        )}
        {record.type === "Vet visit" && (
          <>
            <div className="form-two">
              <Field label="Clinic">
                <input className="input" value={record.clinic} onChange={(event) => update("clinic", event.target.value)} />
                {errors.clinic && <span className="field-error">{errors.clinic}</span>}
              </Field>
              <Field label="Vet">
                <input className="input" value={record.vetName} onChange={(event) => update("vetName", event.target.value)} />
              </Field>
            </div>
            <Field label="Reason">
              <input className="input" value={record.reason} onChange={(event) => update("reason", event.target.value)} placeholder="Annual checkup" />
              {errors.title && <span className="field-error">{errors.title}</span>}
            </Field>
            <div className="form-two">
              <Field label="Follow-up date">
                <input className="input" type="date" value={record.nextDueDate} onChange={(event) => update("nextDueDate", event.target.value)} />
              </Field>
              <Field label="Reminder">
                {renderLeadChips(record.notifyLeadMinutes, (value) => setRecord((current) => ({ ...current, notifyLeadMinutes: value })))}
              </Field>
            </div>
          </>
        )}
        {record.type === "Medication" || record.type === "Vet visit" ? null : isSharedCareType(record.type) && (
          <Field label="Reminder">
            {renderLeadChips(record.notifyLeadMinutes, (value) => setRecord((current) => ({ ...current, notifyLeadMinutes: value })))}
          </Field>
        )}
        {supportsDocs && (
          <Field label="Health documents">
            <label className="btn btn-secondary upload-btn">
              Upload image or PDF
              <input type="file" accept="image/*,application/pdf" multiple onChange={uploadDocs} />
            </label>
            {attachedDocs.length > 0 ? (
              <div className="care-doc-list">
                {attachedDocs.map((doc) => (
                  <div className="care-doc-pill" key={doc.id}>
                    <strong>{doc.title}</strong>
                    <span>{doc.mimeType === "application/pdf" ? "PDF" : "Image"}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="settings-note">
                Save certificates, visit summaries, or medication paperwork so the proof stays with the record.
              </p>
            )}
          </Field>
        )}
        <Field label="Note">
          <textarea className="input" value={record.note} onChange={(event) => update("note", event.target.value)} />
        </Field>
        <button className="btn btn-primary" disabled={!canSave}>Save care record</button>
      </form>
    </Sheet>
  );
}
