/* eslint-disable @typescript-eslint/no-explicit-any */
export type BudgetPageProps = Record<string, any>

export default function BudgetPage(props: BudgetPageProps) {
  const {
    convertINR,
    getCurrencySymbol,
    selectedBudgetPeriod,
    setSelectedBudgetPeriod,
    selectedBudgetMeta,
    budgetInput,
    setBudgetInput,
    budgetSummaryCurrency,
    setBudgetSummaryCurrency,
    budgetAmount,
    budgetRemaining,
    budgetProgress,
    spentForSelectedPeriod,
    handleSaveBudget,
    budgetSummaries,
    allExpenses,
    getBudgetPeriodMeta,
  } = props
  const fmt = (n: number) =>
    `${getCurrencySymbol(budgetSummaryCurrency)}${convertINR(Math.abs(n), budgetSummaryCurrency).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  // Build budget history from summaries or fake from past periods
  const now = new Date()
  const historyRows: { month: string; budget: number; used: number; left: number }[] = []
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const meta = getBudgetPeriodMeta ? getBudgetPeriodMeta('MONTHLY', d) : null
    if (!meta) continue
    const summary = budgetSummaries?.find((s: any) => s.period === 'MONTHLY' && s.storageToken === meta.storageToken)
    const budgetAmt = summary?.amount ?? (i === 0 ? budgetAmount : 0)
    const used = summary?.spent ?? (allExpenses || []).filter((e: any) => {
      if (!e.createdAt) return false
      const ed = new Date(e.createdAt)
      return ed >= meta.rangeStart && ed < meta.rangeEnd
    }).reduce((s: number, e: any) => s + (e.amount || 0), 0)
    if (budgetAmt > 0 || used > 0) {
      historyRows.push({
        month: d.toLocaleString('default', { month: 'long', year: 'numeric' }),
        budget: budgetAmt,
        used,
        left: budgetAmt - used,
      })
    }
  }

  const progressColor = budgetProgress > 90 ? '#f87171' : budgetProgress > 70 ? '#fbbf24' : '#6c5ce7'

  return (
    <div className="bp-shell">

      {/* ── Back header ── */}
      <div className="bp-page-head">
        <h2 className="bp-title">
          {selectedBudgetMeta?.titleLabel || 'Monthly'} Budget
        </h2>
        <p className="bp-sub">Plan and track your {(selectedBudgetMeta?.titleLabel || 'monthly').toLowerCase()} spending</p>
        <span className="bp-period-badge">
          {selectedBudgetMeta?.label || new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
        </span>
      </div>

      {/* ── Budget input card ── */}
      <section className="bp-card">
        <form onSubmit={handleSaveBudget} className="bp-form-row">
          <div className="bp-form-left">
            <label className="bp-label">Budget</label>
            <strong className="bp-budget-display">
              {getCurrencySymbol(budgetSummaryCurrency)}{budgetInput || '0'}
            </strong>
          </div>
          <div className="bp-form-controls">
            <select
              className="bp-select"
              value={selectedBudgetPeriod}
              onChange={(e: any) => setSelectedBudgetPeriod(e.target.value)}
            >
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
              <option value="QUARTERLY">Quarterly</option>
              <option value="YEARLY">Yearly</option>
            </select>
            <select
              className="bp-select"
              value={budgetSummaryCurrency}
              onChange={(e: any) => setBudgetSummaryCurrency(e.target.value)}
            >
              <option value="INR">INR ₹</option>
              <option value="USD">USD $</option>
              <option value="EUR">EUR €</option>
              <option value="GBP">GBP £</option>
              <option value="JPY">JPY ¥</option>
            </select>
            <input
              type="number"
              className="bp-amount-input"
              min="0" step="0.01"
              placeholder={selectedBudgetMeta?.placeholder || 'Enter amount'}
              value={budgetInput}
              onChange={(e: any) => setBudgetInput(e.target.value)}
            />
            <button type="submit" className="bp-save-btn">Save budget</button>
          </div>
        </form>

        {/* Progress bar */}
        <div className="bp-progress-section">
          <div className="bp-progress-labels">
            <div>
              <span className="bp-prog-label">Used</span>
              <strong className="bp-prog-value">{fmt(spentForSelectedPeriod)}</strong>
            </div>
            <div className="bp-prog-right">
              <span className="bp-prog-label">Left</span>
              <strong className={`bp-prog-value ${budgetRemaining >= 0 ? 'bp-green' : 'bp-red'}`}>
                {fmt(budgetRemaining)}
              </strong>
            </div>
          </div>
          <div className="bp-bar-track">
            <div
              className="bp-bar-fill"
              style={{ width: `${Math.min(budgetProgress, 100)}%`, background: progressColor }}
            />
          </div>
          <p className="bp-bar-note">
            {budgetAmount > 0
              ? `${budgetProgress.toFixed(0)}% of budget used`
              : `Set a budget above to start tracking your ${(selectedBudgetMeta?.titleLabel || 'monthly').toLowerCase()} target`}
          </p>
        </div>
      </section>

      {/* ── Budget history ── */}
      <section className="bp-card">
        <div className="bp-section-head">
          <div>
            <h3 className="bp-section-title">Budget History</h3>
            <p className="bp-section-sub">View and manage your past budgets</p>
          </div>
        </div>

        {historyRows.length === 0 ? (
          <div className="bp-empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
              strokeLinecap="round" strokeLinejoin="round" width="32" height="32" opacity="0.25">
              <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
            </svg>
            <span>No budget history yet. Set a budget above to get started.</span>
          </div>
        ) : (
          <>
            <div className="bp-table-head">
              <span className="bp-th">Month</span>
              <span className="bp-th">Budget</span>
              <span className="bp-th">Used</span>
              <span className="bp-th">Left</span>
              <span className="bp-th bp-th-actions">Actions</span>
            </div>
            <div className="bp-table-body">
              {historyRows.map((row, i) => {
                const rowLeft = row.left
                const rowProg = row.budget > 0 ? Math.min((row.used / row.budget) * 100, 100) : 0
                return (
                  <div key={i} className="bp-table-row">
                    <span className="bp-td">{row.month}</span>
                    <span className="bp-td">{getCurrencySymbol(budgetSummaryCurrency)}{convertINR(row.budget, budgetSummaryCurrency).toLocaleString('en-IN', { minimumFractionDigits: 0 })}</span>
                    <span className="bp-td">
                      <div className="bp-row-used-wrap">
                        {getCurrencySymbol(budgetSummaryCurrency)}{convertINR(row.used, budgetSummaryCurrency).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        {row.budget > 0 && (
                          <div className="bp-row-mini-bar">
                            <div className="bp-row-mini-fill" style={{
                              width: `${rowProg}%`,
                              background: rowProg > 90 ? '#f87171' : rowProg > 70 ? '#fbbf24' : '#6c5ce7'
                            }} />
                          </div>
                        )}
                      </div>
                    </span>
                    <span className={`bp-td ${rowLeft >= 0 ? 'bp-green' : 'bp-red'}`}>
                      {getCurrencySymbol(budgetSummaryCurrency)}{convertINR(Math.abs(rowLeft), budgetSummaryCurrency).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="bp-td bp-td-actions">
                      <button type="button" className="bp-more-btn" title="Options">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                          strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                          <circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>
                        </svg>
                      </button>
                    </span>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </section>

      <style>{`
        .bp-shell { display: flex; flex-direction: column; gap: 1rem; }

        .bp-page-head {
          display: flex;
          align-items: baseline;
          gap: 0.75rem;
          flex-wrap: wrap;
          padding: 0.25rem 0 0.5rem;
        }
        .bp-title { margin: 0; font-size: 1.45rem; font-weight: 700; color: #fff; letter-spacing: -0.02em; }
        .bp-sub { margin: 0; font-size: 0.84rem; color: rgba(255,255,255,0.5); flex: 1; }
        .bp-period-badge {
          padding: 0.3em 0.8em; border-radius: 999px;
          background: rgba(108,92,231,0.18);
          border: 1px solid rgba(108,92,231,0.3);
          color: #c8b1ff; font-size: 0.78rem; font-weight: 600;
          white-space: nowrap;
        }

        .bp-card {
          background: linear-gradient(180deg,rgba(25,24,42,0.98) 0%,rgba(18,17,34,0.98) 100%);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 16px;
          padding: 1.3rem 1.5rem;
        }

        /* Budget form */
        .bp-form-row {
          display: flex; align-items: flex-end;
          justify-content: space-between; gap: 1.5rem;
          flex-wrap: wrap;
          padding-bottom: 1.25rem;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          margin-bottom: 1.25rem;
        }
        .bp-form-left { display: flex; flex-direction: column; gap: 0.3rem; }
        .bp-label { font-size: 0.78rem; color: rgba(255,255,255,0.48); }
        .bp-budget-display { font-size: 1.55rem; font-weight: 700; color: #fff; letter-spacing: -0.02em; }
        .bp-form-controls { display: flex; align-items: center; gap: 0.65rem; flex-wrap: wrap; }
        .bp-select {
          appearance: none;
          padding: 0.5em 2em 0.5em 0.85em;
          border-radius: 9px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.05)
            url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='11' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.4)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")
            no-repeat right 0.55rem center;
          color: rgba(255,255,255,0.78);
          font-size: 0.84rem; cursor: pointer;
        }
        .bp-amount-input {
          padding: 0.5em 0.85em;
          border-radius: 9px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.04);
          color: #fff; font-size: 0.9rem;
          width: 130px;
          transition: border-color 0.18s;
        }
        .bp-amount-input:focus {
          outline: none;
          border-color: rgba(108,92,231,0.6);
          box-shadow: 0 0 0 3px rgba(108,92,231,0.14);
        }
        .bp-save-btn {
          padding: 0.52em 1.1em;
          border-radius: 9px; border: none;
          background: linear-gradient(90deg,#5c4de0,#6c5ce7);
          color: #fff; font-size: 0.86rem; font-weight: 700;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(108,92,231,0.32);
          transition: opacity 0.15s;
          white-space: nowrap;
        }
        .bp-save-btn:hover { opacity: 0.88; }

        /* Progress */
        .bp-progress-section { display: flex; flex-direction: column; gap: 0.65rem; }
        .bp-progress-labels {
          display: flex; justify-content: space-between; align-items: flex-start;
        }
        .bp-prog-right { text-align: right; }
        .bp-prog-label { display: block; font-size: 0.75rem; color: rgba(255,255,255,0.46); margin-bottom: 0.18rem; }
        .bp-prog-value { font-size: 1.1rem; font-weight: 700; color: #fff; }
        .bp-green { color: #4ade80 !important; }
        .bp-red { color: #f87171 !important; }
        .bp-bar-track {
          width: 100%; height: 8px; border-radius: 999px;
          background: rgba(255,255,255,0.07); overflow: hidden;
        }
        .bp-bar-fill { height: 100%; border-radius: inherit; transition: width 0.4s ease, background 0.4s ease; }
        .bp-bar-note { margin: 0; font-size: 0.76rem; color: rgba(255,255,255,0.4); }

        /* History section */
        .bp-section-head {
          display: flex; align-items: flex-start;
          justify-content: space-between; gap: 1rem;
          margin-bottom: 1rem;
        }
        .bp-section-title { margin: 0 0 0.2rem; font-size: 0.95rem; font-weight: 700; color: #fff; }
        .bp-section-sub { margin: 0; font-size: 0.78rem; color: rgba(255,255,255,0.44); }

        /* Table */
        .bp-table-head {
          display: grid;
          grid-template-columns: 1.4fr 1fr 1.4fr 1fr 60px;
          padding: 0.5rem 0.75rem;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          margin-bottom: 0.25rem;
        }
        .bp-th {
          font-size: 0.71rem; text-transform: uppercase;
          letter-spacing: 0.07em; color: rgba(255,255,255,0.35); font-weight: 600;
        }
        .bp-th-actions { text-align: right; }
        .bp-table-body { display: flex; flex-direction: column; }
        .bp-table-row {
          display: grid;
          grid-template-columns: 1.4fr 1fr 1.4fr 1fr 60px;
          align-items: center;
          padding: 0.9rem 0.75rem;
          border-bottom: 1px solid rgba(255,255,255,0.04);
          transition: background 0.14s;
        }
        .bp-table-row:last-child { border-bottom: none; }
        .bp-table-row:hover { background: rgba(108,92,231,0.05); }
        .bp-td { font-size: 0.86rem; color: rgba(255,255,255,0.78); }
        .bp-td-actions { display: flex; justify-content: flex-end; }
        .bp-row-used-wrap { display: flex; flex-direction: column; gap: 0.3rem; }
        .bp-row-mini-bar {
          width: 80px; height: 4px; border-radius: 999px;
          background: rgba(255,255,255,0.07); overflow: hidden;
        }
        .bp-row-mini-fill { height: 100%; border-radius: inherit; transition: width 0.3s; }
        .bp-more-btn {
          width: 28px; height: 28px; border-radius: 7px;
          border: 1px solid rgba(255,255,255,0.09);
          background: transparent; color: rgba(255,255,255,0.4);
          display: inline-flex; align-items: center; justify-content: center;
          cursor: pointer; transition: background 0.14s;
        }
        .bp-more-btn:hover { background: rgba(255,255,255,0.07); color: #fff; }

        .bp-empty {
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          min-height: 140px; gap: 0.5rem;
          text-align: center; color: rgba(255,255,255,0.4);
          font-size: 0.82rem;
        }

        /* ── Light mode ── */
        .app.light-mode .bp-title { color: var(--text-light,#2f2050); }
        .app.light-mode .bp-sub { color: rgba(47,32,80,0.52); }
        .app.light-mode .bp-card {
          background: #fff;
          border-color: rgba(108,92,231,0.1);
          box-shadow: 0 4px 14px rgba(108,92,231,0.07);
        }
        .app.light-mode .bp-budget-display { color: var(--text-light,#2f2050); }
        .app.light-mode .bp-label,
        .app.light-mode .bp-prog-label,
        .app.light-mode .bp-bar-note { color: rgba(47,32,80,0.5); }
        .app.light-mode .bp-prog-value { color: var(--text-light,#2f2050); }
        .app.light-mode .bp-select {
          background-color: #f7f4ff;
          border-color: rgba(108,92,231,0.14);
          color: rgba(47,32,80,0.78);
        }
        .app.light-mode .bp-amount-input {
          background: #f7f4ff;
          border-color: rgba(108,92,231,0.14);
          color: var(--text-light,#2f2050);
        }
        .app.light-mode .bp-form-row { border-bottom-color: rgba(108,92,231,0.08); }
        .app.light-mode .bp-bar-track { background: rgba(108,92,231,0.1); }
        .app.light-mode .bp-section-title { color: var(--text-light,#2f2050); }
        .app.light-mode .bp-section-sub { color: rgba(47,32,80,0.48); }
        .app.light-mode .bp-th { color: rgba(47,32,80,0.36); }
        .app.light-mode .bp-td { color: rgba(47,32,80,0.78); }
        .app.light-mode .bp-table-row { border-bottom-color: rgba(108,92,231,0.06); }
        .app.light-mode .bp-table-row:hover { background: rgba(108,92,231,0.03); }
        .app.light-mode .bp-table-head { border-bottom-color: rgba(108,92,231,0.08); }
        .app.light-mode .bp-more-btn { border-color: rgba(108,92,231,0.12); color: rgba(47,32,80,0.4); }
        .app.light-mode .bp-more-btn:hover { background: rgba(108,92,231,0.06); }
        .app.light-mode .bp-row-mini-bar { background: rgba(108,92,231,0.1); }
        .app.light-mode .bp-empty { color: rgba(47,32,80,0.38); }

        @media (max-width: 768px) {
          .bp-form-row { flex-direction: column; align-items: flex-start; }
          .bp-form-controls { width: 100%; }
          .bp-amount-input { flex: 1; min-width: 0; }
          .bp-table-head,
          .bp-table-row { grid-template-columns: 1fr 1fr 1fr; }
          .bp-th:nth-child(4), .bp-td:nth-child(4),
          .bp-th-actions, .bp-td-actions { display: none; }
          .bp-page-head { flex-direction: column; align-items: flex-start; }
        }
      `}</style>
    </div>
  )
}