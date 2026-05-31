export type ActivityPageProps = Record<string, any>

export default function ActivityPage(props: ActivityPageProps) {
  const {
    activityStats,
    activityFilterTabs,
    activityFilter,
    setActivityFilter,
    activitySortOrder,
    setActivitySortOrder,
    activityGroups,
    activityFilterLoading,
    activityHasMore,
    activityPage,
    setActivityPage,
    fetchActivities,
    currentUserId,
    getActivityTone,
    getActivityCategory,
    getActivityBadge,
    formatRelativeTime,
  } = props

  return (
    <section className="activity-shell">
      <div className="activity-hero panel">
        <div>
          <p className="dashboard-breadcrumb">Finwise / Activity</p>
          <h2>Activity</h2>
          <p className="activity-subtitle">A complete list of your transactions and expense updates.</p>
        </div>
      </div>

      <div className="activity-stat-grid">
        <article className="panel activity-stat-card">
          <span className="activity-stat-label">Total updates</span>
          <strong className="activity-stat-value">{activityStats.total}</strong>
          <span className="activity-stat-note">{activityStats.visible} visible with current filters</span>
        </article>
        <article className="panel activity-stat-card">
          <span className="activity-stat-label">Expense updates</span>
          <strong className="activity-stat-value positive">{activityStats.expenses}</strong>
          <span className="activity-stat-note">Added or changed expense activity</span>
        </article>
        <article className="panel activity-stat-card">
          <span className="activity-stat-label">Settlement activity</span>
          <strong className="activity-stat-value negative">{activityStats.settlements}</strong>
          <span className="activity-stat-note">Balances, dues, and settlement movement</span>
        </article>
      </div>

      <section className="panel activity-panel">
        <div className="activity-toolbar">
          <div className="activity-filter-row">
            {activityFilterTabs.map((tab: any) => (
              <button
                key={tab.key}
                type="button"
                disabled={activityFilterLoading}
                className={activityFilter === tab.key ? 'activity-filter-chip activity-filter-chip-active' : 'activity-filter-chip'}
                onClick={() => setActivityFilter(tab.key)}
              >
                {tab.label} {tab.count}
                {activityFilterLoading && activityFilter === tab.key && <span className="activity-filter-loading"> …</span>}
              </button>
            ))}
          </div>

          <label className="activity-sort">
            <span>Sort by</span>
            <select value={activitySortOrder} onChange={(event) => setActivitySortOrder(event.target.value)}>
              <option value="NEWEST">Newest first</option>
              <option value="OLDEST">Oldest first</option>
            </select>
          </label>
        </div>

        <div className="activity-groups">
          {activityGroups.length === 0 ? (
            <div className="activity-empty-state">
              <strong>No activity yet.</strong>
              <span>Try a different filter or search term.</span>
            </div>
          ) : (
            activityGroups.map((group: any) => (
              <section key={group.key} className="activity-day-group">
                <div className="activity-day-head">
                  <div className="activity-day-title">
                    <span className="activity-day-icon">DT</span>
                    <strong>{group.label}</strong>
                  </div>
                  <span className="muted">{group.items.length} updates</span>
                </div>

                <div className="activity-list">
                  {group.items.map((activity: any) => {
                    const tone = getActivityTone(activity)
                    const category = getActivityCategory(activity)
                    return (
                      <article key={activity.id} className="activity-row">
                        <div className={`activity-row-icon activity-row-icon-${tone}`}>
                          {getActivityBadge(activity)}
                        </div>
                        <div className="activity-row-main">
                          <strong>{activity.description}</strong>
                          <span>{new Date(activity.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className="activity-row-meta">
                          <span className={`activity-category activity-category-${category.toLowerCase()}`}>{category.toLowerCase()}</span>
                          <span className="muted">{formatRelativeTime(activity.createdAt)}</span>
                        </div>
                      </article>
                    )
                  })}
                </div>
              </section>
            ))
          )}
        </div>

        {activityHasMore && (
          <div className="activity-load-more">
            <button
              className="see-more-btn"
              onClick={async () => {
                const nextPage = activityPage + 1
                setActivityPage(nextPage)
                await fetchActivities(currentUserId, nextPage, true)
              }}
            >
              Load more activity
            </button>
          </div>
        )}
      </section>
    </section>
  )
}
