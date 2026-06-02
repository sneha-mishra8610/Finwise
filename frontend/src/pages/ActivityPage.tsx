/* eslint-disable @typescript-eslint/no-explicit-any */
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
  } = props

  // Map category to color/label/icon
  function getCategoryStyle(cat: string): { color: string; bg: string; label: string } {
    switch (cat) {
      case 'EXPENSE':
        return { color: '#74b9ff', bg: 'rgba(116,185,255,0.14)', label: 'Expense' }
      case 'SETTLEMENT':
        return { color: '#2dcc8e', bg: 'rgba(45,204,142,0.14)', label: 'Settlement' }
      case 'GROUP':
        return { color: '#a29bfe', bg: 'rgba(162,155,254,0.14)', label: 'Update' }
      case 'FRIEND':
        return { color: '#ffeaa7', bg: 'rgba(255,234,167,0.14)', label: 'Friends' }
      default:
        return { color: '#b2bec3', bg: 'rgba(178,190,195,0.14)', label: 'Activity' }
    }
  }

  function getRowIcon(tone: string, cat: string) {
    const base = {
      positive: { bg: 'linear-gradient(135deg,#00b894,#00cec9)', icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
      )},
      negative: { bg: 'linear-gradient(135deg,#d63031,#e17055)', icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg>
      )},
      neutral: { bg: cat === 'SETTLEMENT'
        ? 'linear-gradient(135deg,#00b894,#2dcc8e)'
        : cat === 'EXPENSE'
        ? 'linear-gradient(135deg,#6c5ce7,#a29bfe)'
        : cat === 'FRIEND'
        ? 'linear-gradient(135deg,#e17055,#fd79a8)'
        : 'linear-gradient(135deg,#0984e3,#74b9ff)', icon: (
        cat === 'SETTLEMENT'
          ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          : cat === 'EXPENSE'
          ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
      )},
    }
    const key = tone as 'positive' | 'negative' | 'neutral'
    return base[key] || base.neutral
  }

  // Parse user name from activity description (heuristic)
  function extractUser(description: string): string {
    const parts = description.split(' ')
    if (parts.length > 0) return parts[0]
    return 'User'
  }

  const totalActivities = activityStats?.total || 0
  const completedActivities = activityStats?.expenses || 0
  const unsettled = activityStats?.settlements || 0

  const filterChips = [
    { key: 'ALL', label: 'All' },
    { key: 'EXPENSE', label: 'Expenses' },
    { key: 'SETTLEMENT', label: 'Settlements' },
    { key: 'GROUP', label: 'Updates' },
    { key: 'FRIEND', label: 'Friends' },
  ]

  return (
    <div className="av2-shell">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@500&display=swap');

        .av2-shell {
          font-family: 'DM Sans', sans-serif;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          padding-bottom: 2.5rem;
        }

        /* ── Hero ── */
        .av2-hero {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1rem;
          flex-wrap: wrap;
        }
        .av2-hero-title {
          margin: 0 0 0.25rem;
          font-size: 1.9rem;
          font-weight: 700;
          color: #fff;
          letter-spacing: -0.02em;
        }
        .av2-hero-sub {
          margin: 0;
          font-size: 0.88rem;
          color: rgba(255,255,255,0.45);
        }
        .av2-hero-actions {
          display: flex;
          gap: 0.65rem;
          align-items: center;
          flex-shrink: 0;
        }
        .av2-btn-export {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          padding: 0.55em 1.1em;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.05);
          color: rgba(255,255,255,0.82);
          font-size: 0.86rem;
          font-weight: 600;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          transition: background 0.15s, border-color 0.15s;
        }
        .av2-btn-export:hover {
          background: rgba(255,255,255,0.09);
          border-color: rgba(255,255,255,0.2);
        }
        .av2-btn-add {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          padding: 0.55em 1.2em;
          border-radius: 10px;
          border: none;
          background: #6c5ce7;
          color: #fff;
          font-size: 0.86rem;
          font-weight: 700;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          box-shadow: 0 4px 16px rgba(108,92,231,0.4);
          transition: background 0.15s, transform 0.12s, box-shadow 0.15s;
        }
        .av2-btn-add:hover {
          background: #5b4bd6;
          transform: translateY(-1px);
          box-shadow: 0 8px 20px rgba(108,92,231,0.5);
        }

        /* ── Stat cards ── */
        .av2-stats {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 1rem;
        }
        .av2-stat {
          border-radius: 16px;
          padding: 1.2rem 1.4rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          border: 1px solid rgba(255,255,255,0.06);
          background: linear-gradient(135deg, rgba(30,28,50,0.98) 0%, rgba(24,22,44,0.98) 100%);
          transition: transform 0.18s, box-shadow 0.18s;
        }
        .av2-stat:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 28px rgba(0,0,0,0.3);
        }
        .av2-stat-icon {
          width: 52px;
          height: 52px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .av2-stat-body {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
        }
        .av2-stat-label {
          font-size: 0.8rem;
          color: rgba(255,255,255,0.48);
          font-weight: 500;
        }
        .av2-stat-value {
          font-size: 2rem;
          font-weight: 700;
          font-family: 'DM Mono', monospace;
          line-height: 1;
          color: #fff;
        }
        .av2-stat-value.purple { color: #a29bfe; }
        .av2-stat-value.green { color: #2dcc8e; }
        .av2-stat-value.red { color: #ff5c5c; }
        .av2-stat-note {
          font-size: 0.76rem;
          color: rgba(255,255,255,0.38);
        }

        /* ── Filter toolbar ── */
        .av2-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          flex-wrap: wrap;
        }
        .av2-chips {
          display: flex;
          gap: 0.45rem;
          flex-wrap: wrap;
        }
        .av2-chip {
          padding: 0.42em 1em;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.04);
          color: rgba(255,255,255,0.65);
          font-size: 0.83rem;
          font-weight: 500;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          transition: all 0.15s;
        }
        .av2-chip:hover {
          background: rgba(255,255,255,0.08);
          color: #fff;
        }
        .av2-chip-active {
          background: rgba(108,92,231,0.2);
          border-color: rgba(108,92,231,0.5);
          color: #fff;
        }
        .av2-sort-wrap {
          display: flex;
          align-items: center;
          gap: 0.6rem;
        }
        .av2-sort-btn {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.42em 0.9em;
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.04);
          color: rgba(255,255,255,0.65);
          font-size: 0.82rem;
          font-weight: 500;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
        }
        .av2-sort-select {
          appearance: none;
          background: transparent;
          border: none;
          color: rgba(255,255,255,0.65);
          font-size: 0.82rem;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          outline: none;
          padding-right: 4px;
        }
        .av2-sort-select option { background: #1b1b2e; }
        .av2-filter-icon-btn {
          width: 34px;
          height: 34px;
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.04);
          color: rgba(255,255,255,0.55);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        /* ── Timeline ── */
        .av2-timeline {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        /* Day group */
        .av2-day-group {}
        .av2-day-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          margin-bottom: 0.75rem;
        }
        .av2-day-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.88rem;
          font-weight: 600;
          color: rgba(255,255,255,0.7);
        }
        .av2-day-label svg { color: rgba(255,255,255,0.4); }
        .av2-day-count {
          font-size: 0.75rem;
          color: rgba(255,255,255,0.35);
        }

        /* Timeline rows */
        .av2-rows {
          display: flex;
          flex-direction: column;
          position: relative;
        }
        .av2-rows::before {
          content: '';
          position: absolute;
          left: 19px;
          top: 0;
          bottom: 0;
          width: 1px;
          background: rgba(255,255,255,0.06);
          pointer-events: none;
        }
        .av2-row {
          display: flex;
          align-items: center;
          gap: 0.9rem;
          padding: 0.7rem 0.85rem 0.7rem 0;
          border-radius: 12px;
          cursor: default;
          transition: background 0.15s;
          position: relative;
        }
        .av2-row:hover {
          background: rgba(255,255,255,0.03);
        }
        .av2-row-bullet {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: rgba(255,255,255,0.15);
          border: 1px solid rgba(255,255,255,0.1);
          flex-shrink: 0;
          margin-left: 16px;
          z-index: 1;
        }
        .av2-row-icon {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .av2-row-main {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
        }
        .av2-row-desc {
          font-size: 0.88rem;
          font-weight: 600;
          color: #fff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .av2-row-sub {
          font-size: 0.75rem;
          color: rgba(255,255,255,0.38);
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }
        .av2-row-sub-dot {
          width: 3px;
          height: 3px;
          border-radius: 50%;
          background: rgba(255,255,255,0.25);
        }
        .av2-row-right {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          flex-shrink: 0;
        }
        .av2-cat-pill {
          padding: 0.22em 0.72em;
          border-radius: 6px;
          font-size: 0.74rem;
          font-weight: 600;
          border: 1px solid transparent;
          white-space: nowrap;
        }
        .av2-row-user {
          font-size: 0.8rem;
          color: rgba(255,255,255,0.5);
          font-weight: 500;
          min-width: 80px;
          text-align: right;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 130px;
        }

        /* Load more */
        .av2-load-more {
          display: flex;
          justify-content: center;
          padding-top: 0.5rem;
        }
        .av2-load-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.6em 1.6em;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.04);
          color: rgba(255,255,255,0.65);
          font-size: 0.86rem;
          font-weight: 600;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          transition: background 0.15s, color 0.15s;
        }
        .av2-load-btn:hover {
          background: rgba(255,255,255,0.08);
          color: #fff;
        }

        /* Empty state */
        .av2-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.65rem;
          padding: 3rem 1rem;
          text-align: center;
          border-radius: 16px;
          border: 1px dashed rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.02);
        }
        .av2-empty-icon {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: rgba(108,92,231,0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(162,155,254,0.7);
        }
        .av2-empty-title {
          font-size: 0.95rem;
          font-weight: 600;
          color: rgba(255,255,255,0.6);
          margin: 0;
        }
        .av2-empty-sub {
          font-size: 0.82rem;
          color: rgba(255,255,255,0.35);
          margin: 0;
        }

        /* Light mode */
        .app.light-mode .av2-hero-title { color: #1a1040; }
        .app.light-mode .av2-hero-sub { color: rgba(47,32,80,0.52); }
        .app.light-mode .av2-stat {
          background: linear-gradient(135deg, #fff 0%, #f7f4ff 100%);
          border-color: rgba(108,92,231,0.1);
        }
        .app.light-mode .av2-stat-value { color: #1a1040; }
        .app.light-mode .av2-stat-label { color: rgba(47,32,80,0.52); }
        .app.light-mode .av2-stat-note { color: rgba(47,32,80,0.38); }
        .app.light-mode .av2-chip {
          background: rgba(108,92,231,0.06);
          border-color: rgba(108,92,231,0.12);
          color: rgba(47,32,80,0.7);
        }
        .app.light-mode .av2-chip-active {
          background: rgba(108,92,231,0.15);
          border-color: rgba(108,92,231,0.4);
          color: #1a1040;
        }
        .app.light-mode .av2-day-label { color: rgba(47,32,80,0.65); }
        .app.light-mode .av2-day-count { color: rgba(47,32,80,0.38); }
        .app.light-mode .av2-row-desc { color: #1a1040; }
        .app.light-mode .av2-row-sub { color: rgba(47,32,80,0.42); }
        .app.light-mode .av2-row-user { color: rgba(47,32,80,0.5); }
        .app.light-mode .av2-rows::before { background: rgba(108,92,231,0.1); }
        .app.light-mode .av2-row:hover { background: rgba(108,92,231,0.04); }
        .app.light-mode .av2-empty {
          border-color: rgba(108,92,231,0.1);
          background: rgba(108,92,231,0.02);
        }
        .app.light-mode .av2-empty-title { color: rgba(47,32,80,0.6); }
        .app.light-mode .av2-empty-sub { color: rgba(47,32,80,0.38); }
        .app.light-mode .av2-btn-export {
          background: rgba(108,92,231,0.06);
          border-color: rgba(108,92,231,0.14);
          color: rgba(47,32,80,0.8);
        }
        .app.light-mode .av2-sort-btn {
          background: rgba(108,92,231,0.06);
          border-color: rgba(108,92,231,0.12);
        }
        .app.light-mode .av2-sort-select { color: rgba(47,32,80,0.65); }
        .app.light-mode .av2-filter-icon-btn {
          background: rgba(108,92,231,0.06);
          border-color: rgba(108,92,231,0.12);
          color: rgba(47,32,80,0.55);
        }
        .app.light-mode .av2-load-btn {
          background: rgba(108,92,231,0.06);
          border-color: rgba(108,92,231,0.12);
          color: rgba(47,32,80,0.65);
        }

        @media (max-width: 900px) {
          .av2-stats { grid-template-columns: 1fr; }
          .av2-row-right { display: none; }
        }
        @media (max-width: 640px) {
          .av2-hero { flex-direction: column; }
          .av2-hero-actions { width: 100%; }
          .av2-toolbar { flex-direction: column; align-items: flex-start; }
        }
      `}</style>

      {/* ── Hero ── */}
      <div className="av2-hero">
        <div>
          <h2 className="av2-hero-title">Activity</h2>
          <p className="av2-hero-sub">Stay updated with all your transactions and important updates.</p>
        </div>
        <div className="av2-hero-actions">
          <button className="av2-btn-export">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export
          </button>
          <button className="av2-btn-add">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add activity
          </button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="av2-stats">
        <div className="av2-stat">
          <div className="av2-stat-icon" style={{ background: 'rgba(108,92,231,0.18)' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a29bfe" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
          </div>
          <div className="av2-stat-body">
            <span className="av2-stat-label">Total activities</span>
            <span className="av2-stat-value purple">{totalActivities}</span>
            <span className="av2-stat-note">All time activities</span>
          </div>
        </div>

        <div className="av2-stat">
          <div className="av2-stat-icon" style={{ background: 'rgba(45,204,142,0.15)' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2dcc8e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <div className="av2-stat-body">
            <span className="av2-stat-label">Completed</span>
            <span className="av2-stat-value green">{completedActivities}</span>
            <span className="av2-stat-note">Activities completed</span>
          </div>
        </div>

        <div className="av2-stat">
          <div className="av2-stat-icon" style={{ background: 'rgba(255,92,92,0.14)' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ff5c5c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>
            </svg>
          </div>
          <div className="av2-stat-body">
            <span className="av2-stat-label">Unsettled &amp; reminders</span>
            <span className="av2-stat-value red">{unsettled}</span>
            <span className="av2-stat-note">Items need attention</span>
          </div>
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div className="av2-toolbar">
        <div className="av2-chips">
          {filterChips.map(chip => {
            const tabObj = activityFilterTabs?.find((t: any) => t.key === chip.key)
            return (
              <button
                key={chip.key}
                disabled={activityFilterLoading}
                className={activityFilter === chip.key ? 'av2-chip av2-chip-active' : 'av2-chip'}
                onClick={() => setActivityFilter(chip.key)}
              >
                {chip.label}{tabObj ? ` ${tabObj.count}` : ''}
              </button>
            )
          })}
        </div>
        <div className="av2-sort-wrap">
          <div className="av2-sort-btn">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
            <select
              className="av2-sort-select"
              value={activitySortOrder}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setActivitySortOrder(e.target.value)}
            >
              <option value="NEWEST">Newest first</option>
              <option value="OLDEST">Oldest first</option>
            </select>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>
          </div>
          <div className="av2-filter-icon-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/></svg>
          </div>
        </div>
      </div>

      {/* ── Timeline ── */}
      {activityFilterLoading ? (
        <div className="av2-empty">
          <div className="av2-empty-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          </div>
          <p className="av2-empty-title">Loading activities…</p>
        </div>
      ) : activityGroups.length === 0 ? (
        <div className="av2-empty">
          <div className="av2-empty-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <p className="av2-empty-title">No activity yet</p>
          <p className="av2-empty-sub">Try a different filter or add an expense to get started.</p>
        </div>
      ) : (
        <div className="av2-timeline">
          {activityGroups.map((group: any) => (
            <div key={group.key} className="av2-day-group">
              <div className="av2-day-header">
                <div className="av2-day-label">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
                  </svg>
                  {group.label}
                </div>
                <span className="av2-day-count">{group.items.length} {group.items.length === 1 ? 'activity' : 'activities'}</span>
              </div>

              <div className="av2-rows">
                {group.items.map((activity: any) => {
                  const tone = getActivityTone(activity)
                  const cat = getActivityCategory(activity)
                  const catStyle = getCategoryStyle(cat)
                  const rowIcon = getRowIcon(tone, cat)
                  const user = extractUser(activity.description)
                  const time = new Date(activity.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  // Determine subtitle
                  let subtitle = 'Activity'
                  if (cat === 'SETTLEMENT') subtitle = 'Settlement completed'
                  else if (cat === 'EXPENSE') subtitle = 'Expense added'
                  else if (cat === 'GROUP') subtitle = 'Group update'
                  else if (cat === 'FRIEND') subtitle = 'Friend activity'

                  return (
                    <div key={activity.id} className="av2-row">
                      <div className="av2-row-bullet" />
                      <div className="av2-row-icon" style={{ background: rowIcon.bg }}>
                        {rowIcon.icon}
                      </div>
                      <div className="av2-row-main">
                        <div className="av2-row-desc">{activity.description}</div>
                        <div className="av2-row-sub">
                          <span>{subtitle}</span>
                          <span className="av2-row-sub-dot" />
                          <span>{time}</span>
                        </div>
                      </div>
                      <div className="av2-row-right">
                        <span
                          className="av2-cat-pill"
                          style={{
                            color: catStyle.color,
                            background: catStyle.bg,
                            borderColor: catStyle.color + '33',
                          }}
                        >
                          {catStyle.label}
                        </span>
                        <span className="av2-row-user">{user}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Load more ── */}
      {activityHasMore && (
        <div className="av2-load-more">
          <button
            className="av2-load-btn"
            onClick={async () => {
              const next = activityPage + 1
              setActivityPage(next)
              await fetchActivities(currentUserId, next, true)
            }}
          >
            Load more activities
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>
          </button>
        </div>
      )}
    </div>
  )
}
