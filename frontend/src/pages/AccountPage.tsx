/* eslint-disable @typescript-eslint/no-explicit-any */
export type AccountPageProps = Record<string, any>

const SETTING_SECTIONS = [
  {
    key: 'security',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
        <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
    title: 'Security',
    desc: 'Update your password and security preferences',
    danger: false,
  },
]

export default function AccountPage(props: AccountPageProps) {
  const {
    currentUser,
    defaultCurrency,
    convertINR,
    getCurrencySymbol,
    getInitials,
    handleToggleEmailNotifications,
    showPasswordModal,
    closePasswordModal,
    currentPassword, setCurrentPassword,
    newPassword, setNewPassword,
    confirmNewPassword, setConfirmNewPassword,
    passwordChangeError, passwordChangeSuccess, passwordChangeLoading,
    handleChangePassword,
    showEditProfileModal, closeEditProfileModal,
    editProfileName, setEditProfileName,
    profilePreviewName, profilePreviewInitials,
    editProfileError, editProfileSuccess, editProfileLoading,
    handleEditProfileSubmit,
    openEditProfileModal, openPasswordModal,
    totalPaid, totalReceived, netSummary,
    settlementRate, avgSettlementDays, memberSince,
    sessionItems,
    settlementRemindersEnabled, reminderDelayDays,
    handleToggleSettlementReminders, handleReminderDelayChange,
    defaultSplitMethod, setDefaultSplitMethod,
    accountThemePreference, setAccountThemePreference, setTheme,
    twoFactorEnabled, setTwoFactorEnabled,
    handleExport,
  } = props

  const sym = getCurrencySymbol(defaultCurrency)
  const fmt = (n: number) => `${sym}${convertINR(Math.abs(n), defaultCurrency).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  return (
    <div className="ap-shell">

      {/* ── Welcome hero ── */}
      <div className="ap-hero">
        <div className="ap-hero-left">
          <div className="ap-avatar-wrap">
            <div className="ap-avatar">{getInitials(currentUser?.name || 'You')}</div>
          </div>
          <div className="ap-hero-copy">
            <h2 className="ap-welcome">Welcome back, {currentUser?.name} 👋</h2>
            <p className="ap-hero-sub">Manage your account and preferences</p>
          </div>
        </div>
        <button type="button" className="ap-edit-profile-btn" onClick={openEditProfileModal}>
          Edit profile
        </button>
      </div>

      {/* ── Financial summary ── */}
      <section className="ap-card">
        <h3 className="ap-section-title">Financial Summary</h3>
        <div className="ap-fin-row">
          <div className="ap-fin-item">
            <span className="ap-fin-label">Paid</span>
            <strong className="ap-fin-value">{fmt(totalPaid)}</strong>
          </div>
          <div className="ap-fin-divider" />
          <div className="ap-fin-item">
            <span className="ap-fin-label">Received</span>
            <strong className="ap-fin-value">{fmt(totalReceived)}</strong>
          </div>
          <div className="ap-fin-divider" />
          <div className="ap-fin-item">
            <span className="ap-fin-label">Net</span>
            <strong className={`ap-fin-value ${netSummary >= 0 ? 'ap-green' : 'ap-red'}`}>
              {netSummary >= 0 ? '+' : '-'}{fmt(netSummary)}
            </strong>
          </div>
        </div>
        <p className="ap-fin-meta">
          Settlement rate: {settlementRate.toFixed(0)}% &nbsp;·&nbsp; Avg settle: {avgSettlementDays.toFixed(1)} days
        </p>
      </section>

      {/* ── Settings menu rows ── */}
      <section className="ap-card ap-settings-card">
        {SETTING_SECTIONS.map((s, idx) => (
          <div key={s.key}>
            {idx > 0 && <div className="ap-row-divider" />}
            <button
              type="button"
              className={`ap-setting-row ${s.danger ? 'ap-setting-row-danger' : ''}`}
              onClick={() => {
                if (s.key === 'security') openPasswordModal()
              }}
            >
              <span className={`ap-setting-icon ${s.danger ? 'ap-setting-icon-danger' : ''}`}>
                {s.icon}
              </span>
              <div className="ap-setting-copy">
                <strong>{s.title}</strong>
                <span>{s.desc}</span>
              </div>
              <span className={`ap-setting-chevron ${s.danger ? 'ap-chevron-danger' : ''}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </span>
            </button>
          </div>
        ))}
      </section>

      {/* ── Preferences inline panel ── */}
      <section className="ap-card ap-prefs-card">
        <h3 className="ap-section-title">Preferences</h3>
        <div className="ap-pref-list">
          <div className="ap-pref-row">
            <div className="ap-pref-label-wrap">
              <span className="ap-pref-label">Default currency</span>
            </div>
            <select
              className="ap-pref-select"
              value={defaultCurrency}
              onChange={(e: any) => props.setDefaultCurrency(e.target.value)}
            >
              <option value="INR">INR ₹</option>
              <option value="USD">USD $</option>
              <option value="EUR">EUR €</option>
              <option value="GBP">GBP £</option>
            </select>
          </div>
          <div className="ap-pref-row">
            <span className="ap-pref-label">Email notifications</span>
            <button
              type="button"
              className={currentUser?.emailNotificationsEnabled ? 'ap-toggle ap-toggle-on' : 'ap-toggle'}
              onClick={() => currentUser && handleToggleEmailNotifications(currentUser)}
            >
              {currentUser?.emailNotificationsEnabled ? 'On' : 'Off'}
            </button>
          </div>
          <div className="ap-pref-row">
            <span className="ap-pref-label">Settlement reminders</span>
            <button
              type="button"
              className={settlementRemindersEnabled ? 'ap-toggle ap-toggle-on' : 'ap-toggle'}
              onClick={() => currentUser && handleToggleSettlementReminders(currentUser)}
            >
              {settlementRemindersEnabled ? 'On' : 'Off'}
            </button>
          </div>
          <div className="ap-pref-row">
            <span className="ap-pref-label">Reminder delay</span>
            <select
              className="ap-pref-select"
              value={reminderDelayDays}
              onChange={(e: any) => currentUser && handleReminderDelayChange(currentUser, e.target.value)}
              disabled={!settlementRemindersEnabled}
            >
              <option value="3">3 days</option>
              <option value="5">5 days</option>
              <option value="7">7 days</option>
            </select>
          </div>
          <div className="ap-pref-row">
            <span className="ap-pref-label">Default split method</span>
            <select
              className="ap-pref-select"
              value={defaultSplitMethod}
              onChange={(e: any) => setDefaultSplitMethod(e.target.value)}
            >
              <option value="equal">Equal</option>
              <option value="unequal">Unequal</option>
              <option value="percentage">By %</option>
            </select>
          </div>
          <div className="ap-pref-row">
            <span className="ap-pref-label">Theme</span>
            <select
              className="ap-pref-select"
              value={accountThemePreference}
              onChange={(e: any) => {
                const v = e.target.value
                setAccountThemePreference(v)
                if (v === 'light' || v === 'dark') setTheme(v)
              }}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System</option>
            </select>
          </div>
          <div className="ap-pref-row">
            <span className="ap-pref-label">Two-factor authentication</span>
            <button
              type="button"
              className={twoFactorEnabled ? 'ap-toggle ap-toggle-on' : 'ap-toggle'}
              onClick={() => setTwoFactorEnabled((v: boolean) => !v)}
            >
              {twoFactorEnabled ? 'On' : 'Off'}
            </button>
          </div>
        </div>
      </section>

      {/* ── Active sessions ── */}
      <section className="ap-card">
        <h3 className="ap-section-title">Active Sessions</h3>
        <div className="ap-session-list">
          {sessionItems.map((s: any) => (
            <div key={s.device} className="ap-session-row">
              <div className="ap-session-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
                  strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                  <rect x="2" y="3" width="20" height="14" rx="2" />
                  <line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
                </svg>
              </div>
              <div className="ap-session-meta">
                <strong>{s.device}</strong>
                <span>{s.status}</span>
              </div>
              <span className="ap-session-time">{s.lastActive}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Password change modal ── */}
      {showPasswordModal && (
        <div className="ap-modal-overlay" onClick={closePasswordModal}>
          <div className="ap-modal" onClick={(e: any) => e.stopPropagation()}>
            <div className="ap-modal-head">
              <h3>Change password</h3>
              <button type="button" className="ap-modal-close" onClick={closePasswordModal}>✕</button>
            </div>
            <form className="ap-modal-form" onSubmit={handleChangePassword}>
              <label className="ap-modal-label">Current password</label>
              <input type="password" className="ap-modal-input" value={currentPassword}
                onChange={(e: any) => setCurrentPassword(e.target.value)} required autoComplete="current-password" />
              <label className="ap-modal-label">New password</label>
              <input type="password" className="ap-modal-input" value={newPassword}
                onChange={(e: any) => setNewPassword(e.target.value)} required minLength={6} autoComplete="new-password" />
              <label className="ap-modal-label">Confirm new password</label>
              <input type="password" className="ap-modal-input" value={confirmNewPassword}
                onChange={(e: any) => setConfirmNewPassword(e.target.value)} required minLength={6} autoComplete="new-password" />
              {passwordChangeError && <p className="ap-error">{passwordChangeError}</p>}
              {passwordChangeSuccess && <p className="ap-success">{passwordChangeSuccess}</p>}
              <div className="ap-modal-actions">
                <button type="submit" className="ap-btn-solid" disabled={passwordChangeLoading}>
                  {passwordChangeLoading ? 'Updating…' : 'Update password'}
                </button>
                <button type="button" className="ap-btn-outline" onClick={closePasswordModal}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit profile modal ── */}
      {showEditProfileModal && (
        <div className="ap-modal-overlay" onClick={closeEditProfileModal}>
          <div className="ap-modal" onClick={(e: any) => e.stopPropagation()}>
            <div className="ap-modal-head">
              <div>
                <h3>Edit profile</h3>
                <p className="ap-modal-sub">Update the name shown across your account.</p>
              </div>
              <button type="button" className="ap-modal-close" onClick={closeEditProfileModal}>✕</button>
            </div>
            <form className="ap-modal-form" onSubmit={handleEditProfileSubmit}>
              <label className="ap-modal-label">Display name</label>
              <input type="text" className="ap-modal-input" value={editProfileName}
                onChange={(e: any) => setEditProfileName(e.target.value)}
                placeholder="Your display name" required autoComplete="name" />
              <div className="ap-profile-preview">
                <div className="ap-preview-avatar">{profilePreviewInitials}</div>
                <div>
                  <span className="ap-preview-label">Preview</span>
                  <strong className="ap-preview-name">{profilePreviewName}</strong>
                </div>
              </div>
              {editProfileError && <p className="ap-error">{editProfileError}</p>}
              {editProfileSuccess && <p className="ap-success">{editProfileSuccess}</p>}
              <div className="ap-modal-actions">
                <button type="submit" className="ap-btn-solid" disabled={editProfileLoading}>
                  {editProfileLoading ? 'Saving…' : 'Save changes'}
                </button>
                <button type="button" className="ap-btn-outline" onClick={closeEditProfileModal}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Danger Zone ── */}
      <section className="ap-card ap-danger-card">
        <div className="ap-danger-header">
          <span className="ap-danger-icon-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
              <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
            </svg>
          </span>
          <div>
            <h3 className="ap-danger-title">Danger Zone</h3>
            <p className="ap-danger-desc">These actions are irreversible. Please proceed with caution.</p>
          </div>
        </div>
        <div className="ap-danger-actions">
          <div className="ap-danger-action-row">
            <div>
              <strong className="ap-danger-action-label">Delete account</strong>
              <p className="ap-danger-action-sub">Permanently remove your account and all associated data.</p>
            </div>
            <button type="button" className="ap-danger-btn">Delete account</button>
          </div>
        </div>
      </section>

      <style>{`
        .ap-shell { display: flex; flex-direction: column; gap: 1rem; }

        /* Hero */
        .ap-hero {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          padding: 1.25rem 1.4rem;
          background: linear-gradient(180deg, rgba(25,24,42,0.98) 0%, rgba(18,17,34,0.98) 100%);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 16px;
        }
        .ap-hero-left { display: flex; align-items: center; gap: 1rem; }
        .ap-avatar-wrap {
          width: 48px; height: 48px; border-radius: 50%;
          background: linear-gradient(135deg,rgba(108,92,231,0.5),rgba(139,224,203,0.4));
          display: inline-flex; align-items: center; justify-content: center;
          font-size: 1rem; font-weight: 700; color: #fff; flex-shrink: 0;
        }
        .ap-avatar { font-size: 1rem; font-weight: 700; }
        .ap-hero-copy { display: flex; flex-direction: column; gap: 0.2rem; }
        .ap-welcome { margin: 0; font-size: 1.15rem; font-weight: 700; color: #fff; }
        .ap-hero-sub { margin: 0; font-size: 0.82rem; color: rgba(255,255,255,0.5); }
        .ap-edit-profile-btn {
          padding: 0.5em 1.1em; border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.14);
          background: transparent; color: rgba(255,255,255,0.78);
          font-size: 0.82rem; font-weight: 600; cursor: pointer;
          transition: border-color 0.15s, background 0.15s;
        }
        .ap-edit-profile-btn:hover { border-color: rgba(255,255,255,0.3); background: rgba(255,255,255,0.05); }

        /* Cards */
        .ap-card {
          background: linear-gradient(180deg, rgba(25,24,42,0.98) 0%, rgba(18,17,34,0.98) 100%);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 16px;
          padding: 1.3rem 1.4rem;
        }
        .ap-section-title {
          margin: 0 0 1rem;
          font-size: 0.92rem;
          font-weight: 700;
          color: #fff;
        }

        /* Financial summary */
        .ap-fin-row {
          display: flex;
          align-items: center;
          gap: 2rem;
          flex-wrap: wrap;
        }
        .ap-fin-item { display: flex; flex-direction: column; gap: 0.2rem; }
        .ap-fin-label { font-size: 0.78rem; color: rgba(255,255,255,0.5); }
        .ap-fin-value { font-size: 1.05rem; font-weight: 700; color: #fff; }
        .ap-green { color: #4ade80 !important; }
        .ap-red { color: #f87171 !important; }
        .ap-fin-divider { width: 1px; height: 36px; background: rgba(255,255,255,0.08); flex-shrink: 0; }
        .ap-fin-meta { margin: 0.85rem 0 0; font-size: 0.78rem; color: rgba(255,255,255,0.4); }

        /* Settings rows */
        .ap-settings-card { padding: 0.25rem 0; }
        .ap-row-divider { height: 1px; background: rgba(255,255,255,0.05); margin: 0; }
        .ap-setting-row {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem 1.4rem;
          background: transparent;
          border: none;
          cursor: pointer;
          text-align: left;
          transition: background 0.15s;
        }
        .ap-setting-row:hover { background: rgba(255,255,255,0.03); }
        .ap-setting-row-danger:hover { background: rgba(248,113,113,0.04); }
        .ap-setting-icon {
          width: 38px; height: 38px; border-radius: 10px;
          background: rgba(255,255,255,0.05);
          color: rgba(255,255,255,0.55);
          display: inline-flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .ap-setting-icon-danger { background: rgba(248,113,113,0.1); color: #f87171; }
        .ap-setting-copy { flex: 1; display: flex; flex-direction: column; gap: 0.18rem; }
        .ap-setting-copy strong { font-size: 0.88rem; color: #fff; font-weight: 600; }
        .ap-setting-copy span { font-size: 0.78rem; color: rgba(255,255,255,0.46); }
        .ap-setting-chevron { color: rgba(255,255,255,0.3); display: inline-flex; align-items: center; }
        .ap-chevron-danger { color: #f87171; }

        /* Prefs */
        .ap-prefs-card { }
        .ap-pref-list { display: flex; flex-direction: column; }
        .ap-pref-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          padding: 0.7rem 0;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .ap-pref-row:last-child { border-bottom: none; }
        .ap-pref-label { font-size: 0.84rem; color: rgba(255,255,255,0.68); }
        .ap-pref-select {
          appearance: none;
          padding: 0.38em 2em 0.38em 0.75em;
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.05)
            url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.4)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")
            no-repeat right 0.6rem center;
          color: #fff;
          font-size: 0.84rem;
          cursor: pointer;
          min-width: 110px;
        }
        .ap-toggle {
          padding: 0.35em 1em;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.14);
          background: transparent;
          color: rgba(255,255,255,0.55);
          font-size: 0.8rem; font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
          min-width: 52px;
        }
        .ap-toggle-on {
          background: rgba(74,222,128,0.12);
          border-color: rgba(74,222,128,0.35);
          color: #4ade80;
        }

        /* Sessions */
        .ap-session-list { display: flex; flex-direction: column; gap: 0.75rem; }
        .ap-session-row {
          display: flex; align-items: center; gap: 0.85rem;
          padding: 0.75rem 0.9rem;
          border-radius: 10px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.05);
        }
        .ap-session-icon {
          width: 34px; height: 34px; border-radius: 8px;
          background: rgba(108,92,231,0.15); color: #c8b1ff;
          display: inline-flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .ap-session-meta { flex: 1; display: flex; flex-direction: column; gap: 0.12rem; }
        .ap-session-meta strong { font-size: 0.86rem; color: #fff; }
        .ap-session-meta span { font-size: 0.76rem; color: rgba(255,255,255,0.45); }
        .ap-session-time { font-size: 0.76rem; color: rgba(255,255,255,0.38); white-space: nowrap; }

        /* Modals */
        .ap-modal-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.55);
          display: flex; align-items: center; justify-content: center;
          z-index: 200; backdrop-filter: blur(4px);
        }
        .ap-modal {
          background: linear-gradient(180deg,rgba(28,27,46,0.99),rgba(20,19,38,0.99));
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 18px;
          padding: 1.75rem 1.85rem;
          width: 90%; max-width: 440px;
          box-shadow: 0 20px 50px rgba(0,0,0,0.5);
        }
        .ap-modal-head {
          display: flex; align-items: flex-start;
          justify-content: space-between; gap: 1rem;
          margin-bottom: 1.25rem;
        }
        .ap-modal-head h3 { margin: 0; font-size: 1.1rem; font-weight: 700; color: #fff; }
        .ap-modal-sub { margin: 0.2rem 0 0; font-size: 0.82rem; color: rgba(255,255,255,0.5); }
        .ap-modal-close {
          background: none; border: none;
          color: rgba(255,255,255,0.45); font-size: 1.2rem;
          cursor: pointer; padding: 0; flex-shrink: 0;
          transition: color 0.15s;
        }
        .ap-modal-close:hover { color: #fff; }
        .ap-modal-form { display: flex; flex-direction: column; gap: 0.75rem; }
        .ap-modal-label { font-size: 0.8rem; font-weight: 600; color: rgba(255,255,255,0.7); }
        .ap-modal-input {
          padding: 0.68em 0.9em;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.09);
          background: rgba(255,255,255,0.04);
          color: #fff; font-size: 0.9rem;
          transition: border-color 0.18s, box-shadow 0.18s;
        }
        .ap-modal-input:focus {
          outline: none;
          border-color: rgba(108,92,231,0.6);
          box-shadow: 0 0 0 3px rgba(108,92,231,0.15);
        }
        .ap-modal-actions { display: flex; gap: 0.65rem; margin-top: 0.25rem; }
        .ap-btn-solid {
          padding: 0.6em 1.2em; border-radius: 9px; border: none;
          background: linear-gradient(90deg,#5c4de0,#6c5ce7);
          color: #fff; font-size: 0.88rem; font-weight: 700;
          cursor: pointer; box-shadow: 0 4px 12px rgba(108,92,231,0.35);
          transition: opacity 0.15s;
        }
        .ap-btn-solid:disabled { opacity: 0.55; cursor: not-allowed; }
        .ap-btn-solid:hover:not(:disabled) { opacity: 0.88; }
        .ap-btn-outline {
          padding: 0.6em 1.2em; border-radius: 9px;
          border: 1px solid rgba(255,255,255,0.14);
          background: transparent; color: rgba(255,255,255,0.7);
          font-size: 0.88rem; font-weight: 600; cursor: pointer;
          transition: border-color 0.15s, background 0.15s;
        }
        .ap-btn-outline:hover { border-color: rgba(255,255,255,0.28); background: rgba(255,255,255,0.05); }
        .ap-error { color: #f87171; font-size: 0.82rem; margin: 0; }
        .ap-success { color: #4ade80; font-size: 0.82rem; margin: 0; }
        .ap-profile-preview {
          display: flex; align-items: center; gap: 0.85rem;
          padding: 0.85rem 1rem; border-radius: 12px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
        }
        .ap-preview-avatar {
          width: 42px; height: 42px; border-radius: 50%;
          background: linear-gradient(135deg,rgba(108,92,231,0.5),rgba(139,224,203,0.4));
          display: inline-flex; align-items: center; justify-content: center;
          font-size: 0.9rem; font-weight: 700; color: #fff; flex-shrink: 0;
        }
        .ap-preview-label { display: block; font-size: 0.72rem; color: rgba(255,255,255,0.42); margin-bottom: 0.15rem; }
        .ap-preview-name { display: block; font-size: 0.92rem; font-weight: 600; color: #fff; }

        /* Danger Zone */
        .ap-danger-card {
          border-color: rgba(248,113,113,0.18);
          background: linear-gradient(180deg, rgba(30,18,18,0.98) 0%, rgba(20,12,12,0.98) 100%);
        }
        .ap-danger-header {
          display: flex; align-items: flex-start; gap: 0.9rem;
          margin-bottom: 1.25rem;
        }
        .ap-danger-icon-wrap {
          width: 42px; height: 42px; border-radius: 10px; flex-shrink: 0;
          background: rgba(248,113,113,0.12); color: #f87171;
          display: inline-flex; align-items: center; justify-content: center;
        }
        .ap-danger-title { margin: 0; font-size: 0.92rem; font-weight: 700; color: #f87171; }
        .ap-danger-desc { margin: 0.2rem 0 0; font-size: 0.78rem; color: rgba(248,113,113,0.6); }
        .ap-danger-actions { display: flex; flex-direction: column; gap: 0; }
        .ap-danger-action-row {
          display: flex; align-items: center; justify-content: space-between;
          gap: 1rem;
          padding: 1rem 0;
          border-top: 1px solid rgba(248,113,113,0.1);
        }
        .ap-danger-action-label { font-size: 0.86rem; color: rgba(255,255,255,0.8); font-weight: 600; display: block; }
        .ap-danger-action-sub { margin: 0.2rem 0 0; font-size: 0.76rem; color: rgba(255,255,255,0.38); }
        .ap-danger-btn {
          padding: 0.5em 1.1em; border-radius: 8px; flex-shrink: 0;
          border: 1px solid rgba(248,113,113,0.4);
          background: rgba(248,113,113,0.08); color: #f87171;
          font-size: 0.82rem; font-weight: 600; cursor: pointer;
          transition: background 0.15s, border-color 0.15s;
        }
        .ap-danger-btn:hover { background: rgba(248,113,113,0.16); border-color: rgba(248,113,113,0.65); }

        /* ── Light mode ── */
        .app.light-mode .ap-hero,
        .app.light-mode .ap-card {
          background: #fff;
          border-color: rgba(108,92,231,0.1);
          box-shadow: 0 4px 14px rgba(108,92,231,0.07);
        }
        .app.light-mode .ap-welcome { color: var(--text-light,#2f2050); }
        .app.light-mode .ap-hero-sub,
        .app.light-mode .ap-fin-meta { color: rgba(47,32,80,0.5); }
        .app.light-mode .ap-fin-label { color: rgba(47,32,80,0.55); }
        .app.light-mode .ap-fin-value { color: var(--text-light,#2f2050); }
        .app.light-mode .ap-fin-divider { background: rgba(108,92,231,0.1); }
        .app.light-mode .ap-section-title { color: var(--text-light,#2f2050); }
        .app.light-mode .ap-row-divider { background: rgba(108,92,231,0.07); }
        .app.light-mode .ap-setting-row:hover { background: rgba(108,92,231,0.03); }
        .app.light-mode .ap-setting-icon { background: rgba(108,92,231,0.07); color: #5e4dcf; }
        .app.light-mode .ap-setting-copy strong { color: var(--text-light,#2f2050); }
        .app.light-mode .ap-setting-copy span { color: rgba(47,32,80,0.5); }
        .app.light-mode .ap-setting-chevron { color: rgba(47,32,80,0.28); }
        .app.light-mode .ap-pref-row { border-bottom-color: rgba(108,92,231,0.07); }
        .app.light-mode .ap-pref-label { color: rgba(47,32,80,0.7); }
        .app.light-mode .ap-pref-select {
          background-color: #f7f4ff;
          border-color: rgba(108,92,231,0.14);
          color: var(--text-light,#2f2050);
        }
        .app.light-mode .ap-toggle { border-color: rgba(108,92,231,0.18); color: rgba(47,32,80,0.55); }
        .app.light-mode .ap-session-row { background: rgba(108,92,231,0.03); border-color: rgba(108,92,231,0.08); }
        .app.light-mode .ap-session-meta strong { color: var(--text-light,#2f2050); }
        .app.light-mode .ap-session-meta span,
        .app.light-mode .ap-session-time { color: rgba(47,32,80,0.45); }
        .app.light-mode .ap-modal {
          background: #fff;
          border-color: rgba(108,92,231,0.14);
          box-shadow: 0 16px 40px rgba(108,92,231,0.12);
        }
        .app.light-mode .ap-modal-head h3 { color: var(--text-light,#2f2050); }
        .app.light-mode .ap-modal-close { color: rgba(47,32,80,0.4); }
        .app.light-mode .ap-modal-input {
          background: #f7f4ff;
          border-color: rgba(108,92,231,0.14);
          color: var(--text-light,#2f2050);
        }
        .app.light-mode .ap-btn-outline {
          border-color: rgba(108,92,231,0.18);
          color: rgba(47,32,80,0.72);
        }
        .app.light-mode .ap-profile-preview {
          background: rgba(108,92,231,0.04);
          border-color: rgba(108,92,231,0.1);
        }
        .app.light-mode .ap-preview-name { color: var(--text-light,#2f2050); }
        .app.light-mode .ap-edit-profile-btn {
          border-color: rgba(108,92,231,0.18);
          color: rgba(47,32,80,0.72);
        }

        @media (max-width: 640px) {
          .ap-hero { flex-direction: column; align-items: flex-start; }
          .ap-fin-row { gap: 1.25rem; }
          .ap-fin-divider { display: none; }
        }
      `}</style>
    </div>
  )
}