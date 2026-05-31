/* eslint-disable @typescript-eslint/no-explicit-any */
export type DashboardPageProps = Record<string, any>

export default function DashboardPage(props: DashboardPageProps) {
  const {
    currentUser,
    greeting,
    dashboardDateLabel,
    dashboardPeriod,
    setDashboardPeriod,
    dashboardPeriodMeta,
    dashboardLoading,
    dashboardError,
    dashboardSummary,
    defaultCurrency,
    convertINR,
    dashboardActionFriends,
    dashboardFriendBalances,
    dashboardAnalytics,
    dashboardBudgetAmount,
    dashboardBudgetProgress,
    dashboardBudgetRemaining,
    dashboardMixMode,
    setDashboardMixMode,
    expenseMix,
    dashboardCategoryMix,
    recentDashboardActivities,
    getCurrencySymbol,
    getCategoryColor,
    authedFetch,
    API_BASE,
    currentUserId,
    fetchFriendBalances,
    fetchDashboardSummary,
    fetchActivities,
  } = props

  return (
    <section className="dashboard-shell">
      <div className="dashboard-hero panel">
        <div>
          <p className="dashboard-breadcrumb">Finwise / Dashboard</p>
          <h2>{greeting}, {currentUser.name}</h2>
          <p className="dashboard-subtitle">{dashboardDateLabel} - here is your {dashboardPeriodMeta.titleLabel.toLowerCase()} financial snapshot</p>
        </div>
        <div className="dashboard-range">
          <label className="field-label" style={{ margin: 0 }}>Analytics period</label>
          <select
            value={dashboardPeriod}
            onChange={(event) => setDashboardPeriod(event.target.value)}
            style={{ minWidth: 170 }}
          >
            <option value="DAILY">Daily</option>
            <option value="WEEKLY">Weekly</option>
            <option value="MONTHLY">Monthly</option>
            <option value="QUARTERLY">Quarterly</option>
            <option value="YEARLY">Yearly</option>
          </select>
        </div>
      </div>

      {dashboardLoading ? (
        <section className="panel">
          <div>Loading dashboard...</div>
        </section>
      ) : dashboardError ? (
        <section className="panel">
          <div className="error-text">{dashboardError}</div>
        </section>
      ) : dashboardSummary ? (
        <>
          <div className="dashboard-stats">
            <article className="panel dashboard-stat-card">
              <span className="dashboard-stat-label">You owe</span>
              <strong className="dashboard-stat-value negative">{getCurrencySymbol(defaultCurrency)}{convertINR(dashboardSummary.totalUserOwes, defaultCurrency).toFixed(2)}</strong>
              <span className="dashboard-stat-note">{dashboardActionFriends.length} friend{dashboardActionFriends.length === 1 ? '' : 's'} need settlement</span>
            </article>
            <article className="panel dashboard-stat-card">
              <span className="dashboard-stat-label">Owed to you</span>
              <strong className="dashboard-stat-value positive">{getCurrencySymbol(defaultCurrency)}{convertINR(dashboardSummary.totalOwedToUser, defaultCurrency).toFixed(2)}</strong>
              <span className="dashboard-stat-note">{dashboardFriendBalances.filter((friend: { balance: number }) => friend.balance > 0).length} incoming balance{dashboardFriendBalances.filter((friend: { balance: number }) => friend.balance > 0).length === 1 ? '' : 's'}</span>
            </article>
            <article className="panel dashboard-stat-card">
              <span className="dashboard-stat-label">Total spent</span>
              <strong className="dashboard-stat-value">{getCurrencySymbol(defaultCurrency)}{convertINR(dashboardAnalytics.spent, defaultCurrency).toFixed(2)}</strong>
              <span className="dashboard-stat-note">
                {dashboardBudgetAmount > 0
                  ? `${dashboardBudgetProgress.toFixed(0)}% of ${dashboardPeriodMeta.titleLabel.toLowerCase()} budget used`
                  : `No ${dashboardPeriodMeta.titleLabel.toLowerCase()} budget set`}
              </span>
            </article>
            <article className="panel dashboard-stat-card">
              <span className="dashboard-stat-label">{dashboardPeriodMeta.titleLabel} budget</span>
              <strong className={`dashboard-stat-value ${dashboardBudgetRemaining >= 0 ? 'positive' : 'negative'}`}>
                {dashboardBudgetRemaining >= 0 ? '' : '-'}{getCurrencySymbol(defaultCurrency)}{Math.abs(convertINR(dashboardBudgetRemaining, defaultCurrency)).toFixed(2)}
              </strong>
              <span className="dashboard-stat-note">
                {dashboardBudgetAmount > 0
                  ? `${getCurrencySymbol(defaultCurrency)}${convertINR(dashboardBudgetAmount, defaultCurrency).toFixed(2)} budget for ${dashboardAnalytics.periodMeta.label}`
                  : `Set budget in Account for ${dashboardAnalytics.periodMeta.label}`}
              </span>
            </article>
          </div>

          <div className="dashboard-main-grid">
            <article className="panel dashboard-trend-panel">
              <div className="dashboard-panel-head">
                <h3>Spending trend</h3>
                <span className="muted">{dashboardAnalytics.trendSubLabel}</span>
              </div>
              <div className="dashboard-trend-chart">
                {dashboardAnalytics.buckets.map((bucket: { key: string; label: string; total: number }) => (
                  <div key={bucket.key} className="dashboard-trend-col">
                    <div
                      className="dashboard-trend-bar"
                      style={{ height: `${Math.max((bucket.total / dashboardAnalytics.max) * 100, bucket.total > 0 ? 8 : 0)}%` }}
                      title={`${bucket.label}: ${getCurrencySymbol(defaultCurrency)}${convertINR(bucket.total, defaultCurrency).toFixed(2)}`}
                    />
                    <span>{bucket.label}</span>
                  </div>
                ))}
              </div>
            </article>

            <article
              className="panel dashboard-mix-panel dashboard-mix-panel-clickable"
              role="button"
              tabIndex={0}
              aria-label={`Toggle expense mix to ${dashboardMixMode === 'TYPE' ? 'category-wise spending' : 'personal and group expenses'}`}
              onClick={() => setDashboardMixMode((mode: string) => mode === 'TYPE' ? 'CATEGORY' : 'TYPE')}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  setDashboardMixMode((mode: string) => mode === 'TYPE' ? 'CATEGORY' : 'TYPE')
                }
              }}
            >
              <div className="dashboard-panel-head">
                <h3>Expense mix</h3>
                <span className="muted">{dashboardMixMode === 'TYPE' ? 'Personal vs shared' : 'Category wise'}</span>
              </div>
              <div className="dashboard-mix-layout">
                <div
                  className="dashboard-donut"
                  style={{
                    background: dashboardMixMode === 'TYPE'
                      ? `conic-gradient(#6c5ce7 0 ${expenseMix.personalPct}%, #8be0cb ${expenseMix.personalPct}% 100%)`
                      : `conic-gradient(${dashboardCategoryMix.gradient})`,
                  }}
                >
                  <div className="dashboard-donut-hole">
                    {dashboardMixMode === 'TYPE' ? (
                      <>
                        <strong>{expenseMix.total > 0 ? `${Math.round(expenseMix.personalPct)}%` : '0%'}</strong>
                        <span>Personal</span>
                      </>
                    ) : (
                      <>
                        <strong>{dashboardCategoryMix.total > 0 ? `${Math.round(dashboardCategoryMix.topPct)}%` : '0%'}</strong>
                        <span>{dashboardCategoryMix.topCategory?.label || 'No spend'}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="dashboard-legend">
                  {dashboardMixMode === 'TYPE' ? (
                    <>
                      <div className="dashboard-legend-row">
                        <span className="dashboard-legend-dot personal-dot" />
                        <span>Personal</span>
                        <strong>{getCurrencySymbol(defaultCurrency)}{convertINR(expenseMix.personal, defaultCurrency).toFixed(2)}</strong>
                      </div>
                      <div className="dashboard-legend-row">
                        <span className="dashboard-legend-dot group-dot" />
                        <span>Group share</span>
                        <strong>{getCurrencySymbol(defaultCurrency)}{convertINR(expenseMix.group, defaultCurrency).toFixed(2)}</strong>
                      </div>
                    </>
                  ) : dashboardCategoryMix.totals.length > 0 ? (
                    dashboardCategoryMix.totals.map((entry: { label: string; total: number }, index: number) => (
                      <div key={entry.label} className="dashboard-legend-row">
                        <span className="dashboard-legend-dot" style={{ background: getCategoryColor(index) }} />
                        <span>{entry.label}</span>
                        <strong>{getCurrencySymbol(defaultCurrency)}{convertINR(entry.total, defaultCurrency).toFixed(2)}</strong>
                      </div>
                    ))
                  ) : (
                    <div className="muted">No spending in this period</div>
                  )}
                </div>
              </div>
            </article>
          </div>

          <div className="dashboard-bottom-grid">
            <article className="panel dashboard-list-panel">
              <div className="dashboard-panel-head">
                <h3>Friend balances</h3>
                <span className="muted">Top relationships</span>
              </div>
              <div className="dashboard-balance-list">
                {dashboardFriendBalances.slice(0, 4).map((friend: { id: string; name: string; balance: number }) => (
                  <div key={friend.id} className="dashboard-balance-row">
                    <div className="dashboard-avatar">{friend.name.slice(0, 2).toUpperCase()}</div>
                    <div className="dashboard-balance-meta">
                      <strong>{friend.name}</strong>
                      <span className={friend.balance > 0 ? 'positive' : friend.balance < 0 ? 'negative' : 'muted'}>
                        {friend.balance > 0
                          ? `owes you ${getCurrencySymbol(defaultCurrency)}${convertINR(friend.balance, defaultCurrency).toFixed(2)}`
                          : friend.balance < 0
                          ? `you owe ${getCurrencySymbol(defaultCurrency)}${Math.abs(convertINR(friend.balance, defaultCurrency)).toFixed(2)}`
                          : 'settled'}
                      </span>
                    </div>
                  </div>
                ))}
                {dashboardFriendBalances.length === 0 && <div className="muted">No friend balances yet.</div>}
              </div>
            </article>

            <article className="panel dashboard-list-panel">
              <div className="dashboard-panel-head">
                <h3>Action required</h3>
                <span className="muted">Pending settlements</span>
              </div>
              <div className="dashboard-action-list">
                {dashboardActionFriends.slice(0, 4).map((friend: { id: string; name: string }) => (
                  <div key={friend.id} className="dashboard-action-row">
                    <div>
                      <strong>Settle with {friend.name}</strong>
                      <div className="muted">Outstanding balance is still open</div>
                    </div>
                    <button
                      className="settle-btn"
                      onClick={async () => {
                        await authedFetch(`${API_BASE}/expenses/settle-with-friend?userId=${currentUserId}&friendId=${friend.id}`, { method: 'POST' })
                        await fetchFriendBalances()
                        await fetchDashboardSummary()
                        await fetchActivities(currentUserId)
                      }}
                    >
                      Settle
                    </button>
                  </div>
                ))}
                {dashboardActionFriends.length === 0 && <div className="muted">No action needed right now.</div>}
              </div>
            </article>

            <article className="panel dashboard-list-panel">
              <div className="dashboard-panel-head">
                <h3>Recent activity</h3>
                <span className="muted">Latest updates</span>
              </div>
              <div className="dashboard-activity-list">
                {recentDashboardActivities.map((activity: { id: string; description: string; createdAt: string }) => (
                  <div key={activity.id} className="dashboard-activity-row">
                    <span className="dashboard-activity-dot" />
                    <div>
                      <strong>{activity.description}</strong>
                      <div className="muted">{new Date(activity.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                  </div>
                ))}
                {recentDashboardActivities.length === 0 && <div className="muted">No activity yet.</div>}
              </div>
            </article>
          </div>
        </>
      ) : (
        <section className="panel">
          <div>No summary available.</div>
        </section>
      )}
    </section>
  )
}
