/* eslint-disable @typescript-eslint/no-explicit-any */
export type AccountPageProps = Record<string, any>

export default function AccountPage(props: AccountPageProps) {
  const {
    currentUser,
    defaultCurrency,
    convertINR,
    getCurrencySymbol,
    selectedBudgetPeriod,
    selectedBudgetMeta,
    budgetInput,
    setBudgetInput,
    setSelectedBudgetPeriod,
    budgetSummaryCurrency,
    setBudgetSummaryCurrency,
    budgetAmount,
    budgetRemaining,
    budgetProgress,
    spentForSelectedPeriod,
    handleSaveBudget,
    settlementRemindersEnabled,
    reminderDelayDays,
    handleToggleSettlementReminders,
    handleReminderDelayChange,
    defaultSplitMethod,
    setDefaultSplitMethod,
    accountThemePreference,
    setAccountThemePreference,
    setTheme,
    twoFactorEnabled,
    setTwoFactorEnabled,
    openPasswordModal,
    openEditProfileModal,
    sessionItems,
    handleExport,
    getInitials,
    handleToggleEmailNotifications,
    showPasswordModal,
    closePasswordModal,
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmNewPassword,
    setConfirmNewPassword,
    passwordChangeError,
    passwordChangeSuccess,
    passwordChangeLoading,
    handleChangePassword,
    showEditProfileModal,
    closeEditProfileModal,
    editProfileName,
    setEditProfileName,
    profilePreviewName,
    profilePreviewInitials,
    editProfileError,
    editProfileSuccess,
    editProfileLoading,
    handleEditProfileSubmit,
  } = props

  return (
    <section className="account-shell">
      <div className="account-hero panel">
        <div className="account-hero-grid">
          <div className="account-profile-header">
            <div className="account-profile-avatar">{getInitials(currentUser?.name || 'You')}</div>
            <div className="account-profile-copy">
              <h3>{currentUser?.name || 'Rahul Sharma'}</h3>
              <p>{currentUser?.email || 'rahul@gmail.com'} · Member since {props.memberSince}</p>
              <div className="account-inline-actions">
                <button type="button" className="icon-btn" onClick={openEditProfileModal}>Edit profile</button>
                <button type="button" className="ghost-btn" onClick={openPasswordModal}>Change password</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="account-grid">
        <div className="account-stack">
          <section className="panel account-summary-panel">
            <div className="account-panel-head">
              <h3>Financial Summary</h3>
            </div>
            <div className="account-financial-grid">
              <article className="account-financial-pill">
                <span>Paid</span>
                <strong>{getCurrencySymbol(defaultCurrency)}{convertINR(props.totalPaid, defaultCurrency).toFixed(2)}</strong>
              </article>
              <article className="account-financial-pill">
                <span>Received</span>
                <strong>{getCurrencySymbol(defaultCurrency)}{convertINR(props.totalReceived, defaultCurrency).toFixed(2)}</strong>
              </article>
              <article className="account-financial-pill">
                <span>Net</span>
                <strong className={props.netSummary >= 0 ? 'positive' : 'negative'}>
                  {props.netSummary >= 0 ? '+' : '-'}{getCurrencySymbol(defaultCurrency)}{convertINR(Math.abs(props.netSummary), defaultCurrency).toFixed(2)}
                </strong>
              </article>
            </div>
            <p className="muted">
              Settlement rate: {props.settlementRate.toFixed(0)}% · Avg settle: {props.avgSettlementDays.toFixed(1)} days
            </p>
          </section>

          <section className="panel workspace-panel workspace-panel-wide account-budget-panel">
            <div className="account-panel-head">
              <h3>{selectedBudgetMeta.titleLabel} budget</h3>
              <span className="muted">{selectedBudgetMeta.label}</span>
            </div>

            <form className="account-budget-form" onSubmit={handleSaveBudget}>
              <label className="field-label">Budget</label>
              <div className="account-budget-entry">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder={selectedBudgetMeta.placeholder}
                  value={budgetInput}
                  onChange={(event) => setBudgetInput(event.target.value)}
                  aria-label="Budget amount"
                />
                <select
                  className="period-select"
                  value={selectedBudgetPeriod}
                  onChange={(event) => setSelectedBudgetPeriod(event.target.value)}
                  aria-label="Budget period"
                >
                  <option value="DAILY">Daily</option>
                  <option value="WEEKLY">Weekly</option>
                  <option value="MONTHLY">Monthly</option>
                  <option value="QUARTERLY">Quarterly</option>
                  <option value="YEARLY">Yearly</option>
                </select>
                <select className="currency-select" value={budgetSummaryCurrency} onChange={(event) => setBudgetSummaryCurrency(event.target.value)} aria-label="Summary currency">
                  <option value="INR">INR ₹</option>
                  <option value="USD">USD $</option>
                  <option value="EUR">EUR €</option>
                  <option value="GBP">GBP £</option>
                  <option value="JPY">JPY ¥</option>
                </select>
                <button type="submit">Save</button>
              </div>
            </form>

            <div className="account-budget-horizontal-stats" style={{ display: 'flex', gap: '2rem', margin: '12px 0 0 0', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--muted-text, #aaa)' }}>Used</span><br />
                <strong>{getCurrencySymbol(budgetSummaryCurrency)}{convertINR(spentForSelectedPeriod, budgetSummaryCurrency).toFixed(2)}</strong>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--muted-text, #aaa)' }}>Left</span><br />
                <strong className={budgetRemaining >= 0 ? 'positive' : 'negative'}>
                  {budgetRemaining >= 0 ? '' : '-'}{getCurrencySymbol(budgetSummaryCurrency)}{Math.abs(convertINR(budgetRemaining, budgetSummaryCurrency)).toFixed(2)}
                </strong>
              </div>
            </div>

            <div className="account-budget-progress">
              <div className="account-budget-progress-bar">
                <div className="account-budget-progress-fill" style={{ width: `${budgetProgress}%` }} />
              </div>
              <span className="muted">
                {budgetAmount > 0 ? `${budgetProgress.toFixed(0)}% of budget used` : `Add a budget to track your ${selectedBudgetMeta.titleLabel.toLowerCase()} target`}
              </span>
            </div>
          </section>

          <section className="panel workspace-panel workspace-panel-wide account-preferences-panel">
            <div className="account-panel-head">
              <h3>Preferences</h3>
            </div>

            <div className="account-settings-section">
              <h4>General</h4>
              <div className="account-form-list">
                <label className="account-form-row">
                  <span className="account-form-label">Default currency</span>
                  <select value={defaultCurrency} onChange={(event) => props.setDefaultCurrency(event.target.value)}>
                    <option value="INR">INR ₹</option>
                    <option value="USD">USD $</option>
                    <option value="EUR">EUR €</option>
                    <option value="GBP">GBP £</option>
                  </select>
                </label>

                <label className="account-form-row">
                  <span className="account-form-label">Email notifications</span>
                  <button
                    type="button"
                    className={currentUser?.emailNotificationsEnabled ? 'toggle-btn toggle-btn-on' : 'toggle-btn'}
                    onClick={() => currentUser && handleToggleEmailNotifications(currentUser)}
                  >
                    {currentUser?.emailNotificationsEnabled ? 'On' : 'Off'}
                  </button>
                </label>

                <label className="account-form-row">
                  <span className="account-form-label">Default split method</span>
                  <select value={defaultSplitMethod} onChange={(event) => setDefaultSplitMethod(event.target.value)}>
                    <option value="equal">Equal</option>
                    <option value="unequal">Unequal</option>
                    <option value="percentage">By %</option>
                  </select>
                </label>

                <label className="account-form-row">
                  <span className="account-form-label">Theme</span>
                  <select
                    value={accountThemePreference}
                    onChange={(event) => {
                      const value = event.target.value
                      setAccountThemePreference(value)
                      if (value === 'light' || value === 'dark') {
                        setTheme(value)
                      }
                    }}
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="system">System</option>
                  </select>
                </label>
              </div>
            </div>

            <div className="account-settings-section">
              <h4>Reminders</h4>
              <div className="account-form-list">
                <label className="account-form-row">
                  <span className="account-form-label">Settlement reminders</span>
                  <button
                    type="button"
                    className={settlementRemindersEnabled ? 'toggle-btn toggle-btn-on' : 'toggle-btn'}
                    onClick={() => currentUser && handleToggleSettlementReminders(currentUser)}
                  >
                    {settlementRemindersEnabled ? 'On' : 'Off'}
                  </button>
                </label>

                <label className="account-form-row">
                  <span className="account-form-label">Reminder delay</span>
                  <select
                    value={reminderDelayDays}
                    onChange={(event) => currentUser && handleReminderDelayChange(currentUser, event.target.value)}
                    disabled={!settlementRemindersEnabled}
                  >
                    <option value="3">3 days</option>
                    <option value="5">5 days</option>
                    <option value="7">7 days</option>
                  </select>
                </label>
              </div>
            </div>
          </section>

          <section className="panel account-security-panel">
            <div className="account-panel-head">
              <h3>Security</h3>
            </div>
            <div className="account-settings-section">
              <div className="account-form-list">
                <label className="account-form-row">
                  <span className="account-form-label">Two-factor authentication</span>
                  <button
                    type="button"
                    className={twoFactorEnabled ? 'toggle-btn toggle-btn-on' : 'toggle-btn'}
                    onClick={() => setTwoFactorEnabled((value: boolean) => !value)}
                  >
                    {twoFactorEnabled ? 'On' : 'Off'}
                  </button>
                </label>
              </div>
              <div className="account-inline-actions">
                <button type="button" className="icon-btn" onClick={openPasswordModal}>Change password</button>
              </div>
            </div>
          </section>

          <section className="panel">
            <div className="account-panel-head">
              <h3>Active Sessions</h3>
            </div>
            <div className="account-session-list">
              {sessionItems.map((session: any) => (
                <div key={session.device} className="account-session-row">
                  <div>
                    <strong>{session.device}</strong>
                    <p>{session.status}</p>
                  </div>
                  <span className="muted">{session.lastActive}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="panel">
            <div className="account-panel-head">
              <h3>Data & Export</h3>
            </div>
            <div className="account-inline-actions">
              <button type="button" className="icon-btn" onClick={() => handleExport('pdf')}>Export PDF</button>
              <button type="button" className="ghost-btn" onClick={() => handleExport('word')}>Export Word</button>
              <button type="button" className="ghost-btn" onClick={() => handleExport('excel')}>Export Excel</button>
            </div>
          </section>

          <section className="panel account-danger-panel">
            <div className="account-panel-head">
              <h3>Danger Zone</h3>
            </div>
            <p className="muted">Delete your account and permanently remove your profile, expenses, and history.</p>
            <div className="account-inline-actions">
              <button type="button" className="ghost-btn negative">Delete account</button>
            </div>
          </section>
        </div>
      </div>

      {showPasswordModal && (
        <div className="modal-overlay" onClick={closePasswordModal}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h2>Change password</h2>
              <button className="modal-close" onClick={closePasswordModal}>✕</button>
            </div>
            <form className="form-vertical" onSubmit={handleChangePassword}>
              <label className="field-label">Current password</label>
              <input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} autoComplete="current-password" required />
              <label className="field-label">New password</label>
              <input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} autoComplete="new-password" minLength={6} required />
              <label className="field-label">Confirm new password</label>
              <input type="password" value={confirmNewPassword} onChange={(event) => setConfirmNewPassword(event.target.value)} autoComplete="new-password" minLength={6} required />
              {passwordChangeError && <p className="error-text">{passwordChangeError}</p>}
              {passwordChangeSuccess && <p className="success-text">{passwordChangeSuccess}</p>}
              <div className="account-inline-actions">
                <button type="submit" disabled={passwordChangeLoading}>{passwordChangeLoading ? 'Updating...' : 'Update password'}</button>
                <button type="button" className="ghost-btn" onClick={closePasswordModal}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditProfileModal && (
        <div className="modal-overlay" onClick={closeEditProfileModal}>
          <div className="modal profile-edit-modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Edit profile</h2>
                <p className="profile-edit-subtitle">Update the name shown across your account.</p>
              </div>
              <button className="modal-close" onClick={closeEditProfileModal}>✕</button>
            </div>

            <form className="form-vertical" onSubmit={handleEditProfileSubmit}>
              <label className="field-label">Display name</label>
              <input type="text" value={editProfileName} onChange={(event) => setEditProfileName(event.target.value)} autoComplete="name" placeholder="Enter your display name" required />

              <div className="profile-edit-preview">
                <div className="profile-edit-avatar">{profilePreviewInitials}</div>
                <div>
                  <div className="profile-edit-preview-label">Preview</div>
                  <div className="profile-edit-preview-name">{profilePreviewName}</div>
                </div>
              </div>

              {editProfileError && <p className="error-text">{editProfileError}</p>}
              {editProfileSuccess && <p className="success-text">{editProfileSuccess}</p>}

              <div className="account-inline-actions profile-edit-actions">
                <button type="submit" disabled={editProfileLoading}>{editProfileLoading ? 'Saving...' : 'Save changes'}</button>
                <button type="button" className="ghost-btn" onClick={closeEditProfileModal}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}
