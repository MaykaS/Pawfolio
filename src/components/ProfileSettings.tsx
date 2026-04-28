import { ChevronRight } from "lucide-react";

export function SettingRow({
  label,
  value,
  checked,
  onToggle,
}: {
  label: string;
  value: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button className="setting-row" type="button" onClick={onToggle}>
      <span>
        <strong>{label}</strong>
        <small>{value}</small>
      </span>
      <span className={checked ? "toggle-pill on" : "toggle-pill"}>{checked ? "On" : "Off"}</span>
    </button>
  );
}

export function IntegrationsCard({
  googleCalendarValue,
  googleCalendarChecked,
  onToggleGoogleCalendar,
  inAppChecked,
  onToggleInApp,
}: {
  googleCalendarValue: string;
  googleCalendarChecked: boolean;
  onToggleGoogleCalendar: () => void;
  inAppChecked: boolean;
  onToggleInApp: () => void;
}) {
  return (
    <section className="card settings-card">
      <p className="label no-margin">Integrations</p>
      <SettingRow
        label="Google Calendar"
        value={googleCalendarValue}
        checked={googleCalendarChecked}
        onToggle={onToggleGoogleCalendar}
      />
      <div className="setting-row static">
        <span>
          <strong>Email reminders</strong>
          <small>On hold for now.</small>
        </span>
        <span className="badge badge-gray">On hold</span>
      </div>
      <SettingRow label="In-app reminders" value="Active now" checked={inAppChecked} onToggle={onToggleInApp} />
      <p className="settings-note">Google Calendar is live. Email is on hold, and phone push is managed below.</p>
    </section>
  );
}

export function AccountDeviceSection({
  accountText,
  accountButtonLabel,
  accountConnected,
  backupLabel,
  syncLabel,
  phonePushLabel,
  uploadLabel,
  uploadDetail,
  restoreLabel,
  restoreDetail,
  pushActionLabel,
  pushDetail,
  calendarActionLabel,
  calendarDetail,
  cloudStatus,
  accountDisabled,
  actionDisabled,
  pushDisabled,
  onAccountAction,
  onUpload,
  onRestore,
  onPush,
  onCalendar,
  onOpenDetails,
}: {
  accountText: string;
  accountButtonLabel: string;
  accountConnected: boolean;
  backupLabel: string;
  syncLabel: string;
  phonePushLabel: string;
  uploadLabel: string;
  uploadDetail: string;
  restoreLabel: string;
  restoreDetail: string;
  pushActionLabel: string;
  pushDetail: string;
  calendarActionLabel: string;
  calendarDetail: string;
  cloudStatus: string;
  accountDisabled: boolean;
  actionDisabled: boolean;
  pushDisabled: boolean;
  onAccountAction: () => void;
  onUpload: () => void;
  onRestore: () => void;
  onPush: () => void;
  onCalendar: () => void;
  onOpenDetails: () => void;
}) {
  return (
    <section className="profile-stack-section">
      <p className="label no-margin">Account & device</p>
      <div className="cloud-card">
        <div className="cloud-copy">
          <div className="cloud-title-row">
            <h3>Private account</h3>
            <span className={accountConnected ? "badge badge-green" : "badge badge-gray"}>
              {accountConnected ? "Connected" : "Not signed in"}
            </span>
          </div>
          <p>{accountText}</p>
        </div>
        <button className="btn btn-sm btn-secondary" type="button" onClick={onAccountAction} disabled={accountDisabled}>
          {accountButtonLabel}
        </button>
      </div>
      <section className="card diagnostics-card trust-summary-card">
        <div className="diagnostic-row">
          <span>Private account</span>
          <strong>{accountConnected ? "Connected" : "Signed out"}</strong>
        </div>
        <div className="diagnostic-row">
          <span>This device</span>
          <strong>Local</strong>
        </div>
        <div className="diagnostic-row">
          <span>Backup</span>
          <strong>{backupLabel}</strong>
        </div>
        <div className="diagnostic-row">
          <span>Sync</span>
          <strong>{syncLabel}</strong>
        </div>
        <div className="diagnostic-row">
          <span>Phone push</span>
          <strong>{phonePushLabel}</strong>
        </div>
      </section>
      <section className="card settings-card cloud-actions-card">
        <p className="label no-margin">Actions</p>
        <button className="setting-row" type="button" onClick={onUpload} disabled={actionDisabled}>
          <span>
            <strong>{uploadLabel}</strong>
            <small>{uploadDetail}</small>
          </span>
          <ChevronRight size={17} />
        </button>
        <button className="setting-row" type="button" onClick={onRestore} disabled={actionDisabled}>
          <span>
            <strong>{restoreLabel}</strong>
            <small>{restoreDetail}</small>
          </span>
          <ChevronRight size={17} />
        </button>
        <button className="setting-row" type="button" onClick={onPush} disabled={pushDisabled}>
          <span>
            <strong>{pushActionLabel}</strong>
            <small>{pushDetail}</small>
          </span>
          <ChevronRight size={17} />
        </button>
        <button className="setting-row" type="button" onClick={onCalendar} disabled={actionDisabled}>
          <span>
            <strong>{calendarActionLabel}</strong>
            <small>{calendarDetail}</small>
          </span>
          <ChevronRight size={17} />
        </button>
        <button className="setting-row" type="button" onClick={onOpenDetails}>
          <span>
            <strong>Account details</strong>
            <small>See backup, photos, push, calendar, and device details.</small>
          </span>
          <ChevronRight size={17} />
        </button>
      </section>
      {cloudStatus && <p className="settings-note">{cloudStatus}</p>}
    </section>
  );
}
