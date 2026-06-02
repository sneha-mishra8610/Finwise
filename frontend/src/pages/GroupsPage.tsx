/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react'
export type GroupsPageProps = Record<string, any>

export default function GroupsPage(props: GroupsPageProps) {
  const {
    sortedGroups,
    groupOverview,
    showCreateGroupPanel,
    setShowCreateGroupPanel,
    groupName,
    setGroupName,
    currentFriends,
    groupMemberIds,
    toggleGroupMember,
    handleCreateGroup,
    editingGroup,
    editGroupName,
    setEditGroupName,
    editGroupMemberIds,
    handleUpdateGroup,
    toggleEditGroupMember,
    startEditGroup,
    handleDeleteGroup,
    groupInvitations,
    handleAcceptGroupInvitation,
    handleDeclineGroupInvitation,
    users,
    setGroupDetailView,
    setExpenseDetailView,
    renderWorkspaceDashboard,
    resetExpenseForm,
    setEditingExpense,
    setIsGroupExpense,
    setIsFriendExpense,
    setSelectedGroupId,
    setShowExpenseModal,
    groupDetailView,
    groups,
    defaultCurrency,
    convertINR,
    getCurrencySymbol,
    setEditingGroup,
    setEditGroupMemberIds,
    groupExpenses,
    fetchGroupExpenses,
  } = props

  const [filterStatus, setFilterStatus] = useState('All expenses')
  const [sortOrder, setSortOrder] = useState('Newest first')

  const sym = getCurrencySymbol(defaultCurrency)
  const fmt = (n: number) => `${sym}${convertINR(n, defaultCurrency).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  function getInitials(name: string) {
    return name.split(' ').filter(Boolean).slice(0, 1).map((p: string) => p[0]?.toUpperCase()).join('')
  }

  // ── GROUP WORKSPACE (detail view) ──────────────────────────────────────────
  if (groupDetailView) {
    const grp = groups.find((g: any) => g.id === groupDetailView)

    // Apply filter
    const filtered = groupExpenses.filter((e: any) => {
      if (filterStatus === 'Settled') return e.expenseStatus === 'Settled'
      if (filterStatus === 'Unsettled') return e.expenseStatus !== 'Settled'
      return true
    })

    // Apply sort
    const sorted = [...filtered].sort((a: any, b: any) => {
      const da = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const db = b.createdAt ? new Date(b.createdAt).getTime() : 0
      return sortOrder === 'Oldest first' ? da - db : db - da
    })

    // Stats always from all expenses (unfiltered)
    const allExpenses = [...groupExpenses]
    const settledCount = allExpenses.filter((e: any) => e.expenseStatus === 'Settled').length
    const unsettledCount = allExpenses.length - settledCount
    const totalSpent = allExpenses.reduce((s: number, e: any) => s + e.amount, 0)

    // Per-member spending for donut
    const memberIds: string[] = grp?.memberIds || []
    const memberTotals = memberIds.map((mid: string) => {
      const member = users.find((u: any) => u.id === mid)
      const spent = sorted.filter((e: any) => e.payerId === mid).reduce((s: number, e: any) => s + e.amount, 0)
      return { id: mid, name: member?.name || 'Unknown', spent }
    }).sort((a: any, b: any) => b.spent - a.spent)

    // Top categories
    const catMap: Record<string, number> = {}
    sorted.forEach((e: any) => {
      const cat = e.tag || 'miscellaneous'
      catMap[cat] = (catMap[cat] || 0) + e.amount
    })
    const topCats = Object.entries(catMap).sort((a, b) => b[1] - a[1]).slice(0, 3)

    const colors = ['#6c5ce7', '#2dcc8e', '#f4a93d', '#e17055', '#74b9ff', '#fd79a8']

    // Donut SVG
    const donutSize = 160, donutStroke = 22
    const r = (donutSize - donutStroke) / 2
    const circ = 2 * Math.PI * r
    let cursor = 0
    const donutSegments = memberTotals.filter((m: any) => m.spent > 0).map((m: any, i: number) => {
      const pct = totalSpent > 0 ? (m.spent / totalSpent) * 100 : 0
      const dash = (pct / 100) * circ
      const offset = -(cursor / 100) * circ
      cursor += pct
      return { ...m, dash, offset, color: colors[i % colors.length], pct }
    })

    // member since
    const memberSince = grp?.name ? `Group since ${new Date().toLocaleString('default', { month: 'short', year: 'numeric' })}` : ''

    return (
      <div className="gw-shell">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@500&display=swap');
          .gw-shell { font-family:'DM Sans',sans-serif; display:flex; flex-direction:column; gap:1.25rem; padding-bottom:2.5rem; }

          /* breadcrumb */
          .gw-breadcrumb { display:flex; align-items:center; gap:0.5rem; font-size:0.82rem; color:rgba(255,255,255,0.42); margin-bottom:0.25rem; }
          .gw-breadcrumb button { background:none; border:none; color:rgba(255,255,255,0.42); cursor:pointer; font-size:0.82rem; font-family:'DM Sans',sans-serif; padding:0; transition:color 0.15s; }
          .gw-breadcrumb button:hover { color:rgba(255,255,255,0.75); }
          .gw-breadcrumb svg { color:rgba(255,255,255,0.28); }

          /* hero */
          .gw-hero { display:flex; align-items:center; justify-content:space-between; gap:1rem; flex-wrap:wrap; }
          .gw-hero-left { display:flex; align-items:center; gap:1rem; }
          .gw-group-avatar { width:52px; height:52px; border-radius:14px; background:linear-gradient(135deg,#6c5ce7,#a29bfe); display:flex; align-items:center; justify-content:center; font-size:1.3rem; font-weight:700; color:#fff; flex-shrink:0; }
          .gw-hero-name { margin:0 0 0.2rem; font-size:1.55rem; font-weight:700; color:#fff; letter-spacing:-0.02em; }
          .gw-hero-meta { font-size:0.82rem; color:rgba(255,255,255,0.42); display:flex; align-items:center; gap:0.4rem; }
          .gw-hero-actions { display:flex; gap:0.6rem; align-items:center; }
          .gw-btn-primary { display:flex; align-items:center; gap:0.45rem; padding:0.55em 1.15em; border-radius:10px; border:none; background:#6c5ce7; color:#fff; font-size:0.86rem; font-weight:700; cursor:pointer; font-family:'DM Sans',sans-serif; box-shadow:0 4px 14px rgba(108,92,231,0.38); transition:background 0.15s,transform 0.12s; }
          .gw-btn-primary:hover { background:#5b4bd6; transform:translateY(-1px); }
          .gw-btn-ghost { width:34px; height:34px; border-radius:9px; border:1px solid rgba(255,255,255,0.1); background:rgba(255,255,255,0.05); color:rgba(255,255,255,0.6); display:flex; align-items:center; justify-content:center; cursor:pointer; transition:background 0.15s; }
          .gw-btn-ghost:hover { background:rgba(255,255,255,0.1); }

          /* stat strip */
          .gw-stats { display:grid; grid-template-columns:repeat(5,minmax(0,1fr)); gap:0.9rem; }
          .gw-stat { background:#1e1e30; border:1px solid rgba(255,255,255,0.07); border-radius:14px; padding:1rem 1.1rem; display:flex; flex-direction:column; gap:0.3rem; }
          .gw-stat-label { font-size:0.75rem; color:rgba(255,255,255,0.42); font-weight:500; }
          .gw-stat-value { font-size:1.5rem; font-weight:700; font-family:'DM Mono',monospace; color:#fff; line-height:1.1; }
          .gw-stat-value.green { color:#2dcc8e; }
          .gw-stat-value.red { color:#ff5c5c; }
          .gw-stat-note { font-size:0.72rem; color:rgba(255,255,255,0.38); }

          /* insights grid */
          .gw-insights { display:grid; grid-template-columns:1.2fr 1fr 1fr; gap:1rem; }
          .gw-card { background:#1e1e30; border:1px solid rgba(255,255,255,0.07); border-radius:16px; padding:1.2rem; }
          .gw-card-head { display:flex; align-items:center; justify-content:space-between; margin-bottom:1rem; }
          .gw-card-title { font-size:0.9rem; font-weight:600; color:#fff; margin:0; }
          .gw-card-badge { font-size:0.75rem; color:rgba(255,255,255,0.38); display:flex; align-items:center; gap:0.3rem; padding:0.28rem 0.6rem; border:1px solid rgba(255,255,255,0.07); border-radius:7px; background:rgba(255,255,255,0.03); cursor:pointer; }

          /* spending donut */
          .gw-donut-layout { display:flex; align-items:center; gap:1.5rem; }
          .gw-donut-wrap { position:relative; flex-shrink:0; }
          .gw-donut-center { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; gap:0.1rem; }
          .gw-donut-val { font-size:1.1rem; font-weight:700; font-family:'DM Mono',monospace; color:#fff; }
          .gw-donut-sub { font-size:0.64rem; color:rgba(255,255,255,0.42); }
          .gw-donut-legend { display:flex; flex-direction:column; gap:0.55rem; flex:1; }
          .gw-donut-row { display:flex; align-items:center; gap:0.5rem; font-size:0.8rem; color:rgba(255,255,255,0.7); }
          .gw-donut-dot { width:9px; height:9px; border-radius:50%; flex-shrink:0; }
          .gw-donut-row-total { font-size:0.75rem; color:rgba(255,255,255,0.38); margin-top:0.4rem; padding-top:0.4rem; border-top:1px solid rgba(255,255,255,0.06); }

          /* settlement summary */
          .gw-settlement-amount { font-size:1.45rem; font-weight:700; font-family:'DM Mono',monospace; margin:0 0 0.85rem; }
          .gw-settlement-amount.green { color:#2dcc8e; }
          .gw-settlement-amount.red { color:#ff5c5c; }
          .gw-settlement-amount.muted { color:rgba(255,255,255,0.5); }
          .gw-flow-row { display:flex; align-items:center; gap:0.6rem; margin-bottom:0.75rem; }
          .gw-flow-avatar { width:32px; height:32px; border-radius:50%; background:linear-gradient(135deg,#6c5ce7,#a29bfe); display:flex; align-items:center; justify-content:center; font-size:0.72rem; font-weight:700; color:#fff; flex-shrink:0; }
          .gw-flow-track { flex:1; position:relative; height:4px; border-radius:2px; background:rgba(255,255,255,0.07); overflow:visible; display:flex; align-items:center; }
          .gw-flow-fill { height:100%; border-radius:2px; background:linear-gradient(90deg,#6c5ce7,#2dcc8e); }
          .gw-flow-labels { display:flex; justify-content:space-between; font-size:0.62rem; color:rgba(255,255,255,0.35); margin-top:4px; }
          .gw-settlement-note { font-size:0.82rem; color:rgba(255,255,255,0.6); margin:0.5rem 0 0; }
          .gw-view-details { background:none; border:none; color:#6c5ce7; font-size:0.8rem; font-weight:600; cursor:pointer; padding:0; font-family:'DM Sans',sans-serif; margin-top:0.75rem; display:block; }

          /* top categories */
          .gw-cat-list { display:flex; flex-direction:column; gap:0.7rem; }
          .gw-cat-row { display:flex; align-items:center; gap:0.75rem; }
          .gw-cat-icon { width:34px; height:34px; border-radius:9px; background:rgba(108,92,231,0.18); display:flex; align-items:center; justify-content:center; font-size:0.75rem; font-weight:700; color:#a29bfe; flex-shrink:0; }
          .gw-cat-info { flex:1; }
          .gw-cat-name { font-size:0.82rem; font-weight:600; color:rgba(255,255,255,0.85); }
          .gw-cat-bar-wrap { height:4px; border-radius:2px; background:rgba(255,255,255,0.06); margin-top:4px; overflow:hidden; }
          .gw-cat-bar { height:100%; border-radius:2px; background:linear-gradient(90deg,#6c5ce7,#a29bfe); }
          .gw-cat-val { font-size:0.78rem; font-weight:600; font-family:'DM Mono',monospace; color:rgba(255,255,255,0.65); }

          /* expenses table */
          .gw-table-card { background:#1e1e30; border:1px solid rgba(255,255,255,0.07); border-radius:16px; overflow:hidden; }
          .gw-table-toolbar { display:flex; align-items:center; justify-content:space-between; gap:0.75rem; padding:1rem 1.2rem; border-bottom:1px solid rgba(255,255,255,0.06); flex-wrap:wrap; }
          .gw-table-toolbar-left { display:flex; align-items:center; gap:0.6rem; flex-wrap:wrap; }
          .gw-table-title { font-size:0.95rem; font-weight:600; color:#fff; margin:0; }
          .gw-filter-select { appearance:none; padding:0.38em 0.75em; border-radius:8px; border:1px solid rgba(255,255,255,0.1); background:rgba(255,255,255,0.04); color:rgba(255,255,255,0.75); font-size:0.78rem; font-family:'DM Sans',sans-serif; cursor:pointer; outline:none; }
          .gw-filter-select option { background:#1b1b2e; }
          table.gw-table { width:100%; border-collapse:collapse; }
          .gw-table thead tr { border-bottom:1px solid rgba(255,255,255,0.06); }
          .gw-table th { padding:0.75rem 1.2rem; text-align:left; font-size:0.72rem; text-transform:uppercase; letter-spacing:0.07em; color:rgba(255,255,255,0.35); font-weight:600; }
          .gw-table td { padding:0.9rem 1.2rem; font-size:0.84rem; color:rgba(255,255,255,0.8); border-bottom:1px solid rgba(255,255,255,0.04); vertical-align:middle; }
          .gw-table tbody tr:last-child td { border-bottom:none; }
          .gw-table tbody tr:hover td { background:rgba(255,255,255,0.02); }
          .gw-exp-icon { width:34px; height:34px; border-radius:9px; display:flex; align-items:center; justify-content:center; font-size:0.78rem; font-weight:700; color:#fff; flex-shrink:0; }
          .gw-exp-cell { display:flex; align-items:center; gap:0.75rem; }
          .gw-exp-desc { font-size:0.86rem; font-weight:600; color:#fff; }
          .gw-exp-meta { font-size:0.72rem; color:rgba(255,255,255,0.35); margin-top:1px; }
          .gw-amount-cell { font-weight:600; font-family:'DM Mono',monospace; }
          .gw-owe-positive { color:#2dcc8e; font-weight:600; font-family:'DM Mono',monospace; }
          .gw-owe-negative { color:#ff5c5c; font-weight:600; font-family:'DM Mono',monospace; }
          .gw-status-pill { display:inline-flex; padding:0.22em 0.7em; border-radius:6px; font-size:0.72rem; font-weight:600; }
          .gw-status-settled { background:rgba(45,204,142,0.12); color:#2dcc8e; border:1px solid rgba(45,204,142,0.22); }
          .gw-status-unsettled { background:rgba(255,92,92,0.1); color:#ff7a7a; border:1px solid rgba(255,92,92,0.2); }
          .gw-row-menu { width:28px; height:28px; border-radius:7px; border:none; background:transparent; color:rgba(255,255,255,0.35); cursor:pointer; display:flex; align-items:center; justify-content:center; }
          .gw-row-menu:hover { background:rgba(255,255,255,0.06); color:rgba(255,255,255,0.7); }

          /* load more */
          .gw-load-more { display:flex; justify-content:center; padding:1rem 1.2rem; border-top:1px solid rgba(255,255,255,0.05); }
          .gw-load-btn { display:flex; align-items:center; gap:0.45rem; padding:0.52em 1.4em; border-radius:9px; border:1px solid rgba(255,255,255,0.1); background:rgba(255,255,255,0.04); color:rgba(255,255,255,0.6); font-size:0.83rem; font-weight:600; cursor:pointer; font-family:'DM Sans',sans-serif; }
          .gw-load-btn:hover { background:rgba(255,255,255,0.08); color:#fff; }

          /* light mode */
          .app.light-mode .gw-stat,.app.light-mode .gw-card,.app.light-mode .gw-table-card { background:#fff; border-color:rgba(108,92,231,0.1); box-shadow:0 2px 10px rgba(108,92,231,0.05); }
          .app.light-mode .gw-hero-name,.app.light-mode .gw-card-title,.app.light-mode .gw-stat-value,.app.light-mode .gw-table-title,.app.light-mode .gw-exp-desc,.app.light-mode .gw-donut-val { color:#1a1040; }
          .app.light-mode .gw-stat-label,.app.light-mode .gw-stat-note,.app.light-mode .gw-card-badge,.app.light-mode .gw-hero-meta,.app.light-mode .gw-exp-meta,.app.light-mode .gw-donut-sub,.app.light-mode .gw-flow-labels,.app.light-mode .gw-cat-val { color:rgba(47,32,80,0.48); }
          .app.light-mode .gw-table th { color:rgba(47,32,80,0.38); }
          .app.light-mode .gw-table td { color:#000 !important; border-color:rgba(108,92,231,0.06); }
          .app.light-mode .gw-table td span,
          .app.light-mode .gw-table td strong,
          .app.light-mode .gw-owe-positive,
          .app.light-mode .gw-owe-negative { color:#000 !important; }
          .app.light-mode .gw-table-toolbar { border-color:rgba(108,92,231,0.08); }
          .app.light-mode .gw-filter-select { background:rgba(108,92,231,0.05); border-color:rgba(108,92,231,0.12); color:rgba(47,32,80,0.75); }
          .app.light-mode .gw-load-btn { color:#000; }
          .app.light-mode .gw-donut-legend .gw-donut-row { color:rgba(47,32,80,0.7); }
          .app.light-mode .gw-donut-row-total { color:rgba(47,32,80,0.4); border-color:rgba(108,92,231,0.08); }
          .app.light-mode .gw-settlement-note { color:rgba(47,32,80,0.6); }
          .app.light-mode .gw-cat-name { color:rgba(47,32,80,0.85); }

          @media(max-width:1100px) { .gw-stats{grid-template-columns:repeat(3,1fr)} .gw-insights{grid-template-columns:1fr} }
          @media(max-width:640px) { .gw-stats{grid-template-columns:1fr 1fr} .gw-hero{flex-direction:column;align-items:flex-start} }
        `}</style>

        {/* Breadcrumb */}
        <div className="gw-breadcrumb">
          <button onClick={() => { setGroupDetailView(null); setExpenseDetailView(null) }}>Groups</button>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
          <span>{grp?.name || 'Group'}</span>
        </div>

        {/* Hero */}
        <div className="gw-hero">
          <div className="gw-hero-left">
            <div className="gw-group-avatar">{getInitials(grp?.name || 'G')}</div>
            <div>
              <h2 className="gw-hero-name">{grp?.name || 'Group'}</h2>
              <div className="gw-hero-meta">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                {memberIds.length} members · {memberSince}
              </div>
            </div>
          </div>
          <div className="gw-hero-actions">
            <button className="gw-btn-primary" onClick={() => { resetExpenseForm(); setEditingExpense(null); setIsGroupExpense(true); setIsFriendExpense(false); setSelectedGroupId(groupDetailView); setShowExpenseModal(true) }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add Expense
            </button>
            <button className="gw-btn-ghost" title="More options">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>
            </button>
          </div>
        </div>

        {/* Stats strip */}
        <div className="gw-stats">
          {[
            { label: 'Total expenses', value: fmt(totalSpent), note: 'This month', cls: '' },
            { label: 'Your share', value: fmt(totalSpent / Math.max(memberIds.length, 1)), note: 'You owe', cls: '' },
            { label: 'Others owe you', value: fmt(Math.max(0, totalSpent - totalSpent / Math.max(memberIds.length, 1))), note: 'They owe you', cls: '' },
            { label: 'You are owed', value: `+ ${fmt(Math.max(0, totalSpent / Math.max(memberIds.length, 1)))}`, note: "You'll receive", cls: 'green' },
            { label: 'Settlements', value: `${settledCount} of ${sorted.length}`, note: 'Completed', cls: '' },
          ].map((s, i) => (
            <div key={i} className="gw-stat">
              <span className="gw-stat-label">{s.label}</span>
              <span className={`gw-stat-value ${s.cls}`}>{s.value}</span>
              <span className="gw-stat-note">{s.note}</span>
            </div>
          ))}
        </div>

        {/* Insights */}
        <div className="gw-insights">
          {/* Spending overview donut */}
          <div className="gw-card">
            <div className="gw-card-head">
              <h3 className="gw-card-title">Spending overview</h3>
              <span className="gw-card-badge">
                This month
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>
              </span>
            </div>
            <div className="gw-donut-layout">
              <div className="gw-donut-wrap">
                <svg width={donutSize} height={donutSize} viewBox={`0 0 ${donutSize} ${donutSize}`} style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx={donutSize/2} cy={donutSize/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={donutStroke} />
                  {donutSegments.length > 0 ? donutSegments.map((seg: any, i: number) => (
                    <circle key={i} cx={donutSize/2} cy={donutSize/2} r={r} fill="none"
                      stroke={seg.color} strokeWidth={donutStroke}
                      strokeDasharray={`${seg.dash} ${circ - seg.dash}`}
                      strokeDashoffset={seg.offset} strokeLinecap="butt" />
                  )) : (
                    <circle cx={donutSize/2} cy={donutSize/2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={donutStroke} />
                  )}
                </svg>
                <div className="gw-donut-center">
                  <div className="gw-donut-val">{fmt(totalSpent)}</div>
                  <div className="gw-donut-sub">Total spent</div>
                </div>
              </div>
              <div className="gw-donut-legend">
                {memberTotals.slice(0, 4).map((m: any, i: number) => (
                  <div key={m.id} className="gw-donut-row">
                    <div className="gw-donut-dot" style={{ background: colors[i % colors.length] }} />
                    <span style={{ flex: 1 }}>{m.name}</span>
                    <span style={{ fontFamily: "'DM Mono',monospace", fontSize: '0.78rem' }}>
                      {totalSpent > 0 ? Math.round((m.spent / totalSpent) * 100) : 0}% ({fmt(m.spent)})
                    </span>
                  </div>
                ))}
                <div className="gw-donut-row-total">Total · {sorted.length} expenses</div>
              </div>
            </div>
          </div>

          {/* Settlement summary */}
          <div className="gw-card">
            <div className="gw-card-head">
              <h3 className="gw-card-title">Settlement summary</h3>
              <button className="gw-btn-ghost" style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.4)' }}>···</button>
            </div>
            <div>
              <p className={`gw-settlement-amount ${unsettledCount === 0 ? 'muted' : 'green'}`}>
                {unsettledCount === 0 ? 'All settled ✓' : `You are owed ${fmt(totalSpent / Math.max(memberIds.length, 1))}`}
              </p>
              <div className="gw-flow-row">
                <div className="gw-flow-avatar">{getInitials('Y')}</div>
                <div style={{ flex: 1 }}>
                  <div className="gw-flow-track">
                    <div className="gw-flow-fill" style={{ width: `${Math.min(settledCount / Math.max(sorted.length, 1) * 100, 100)}%` }} />
                  </div>
                  <div className="gw-flow-labels">
                    <span>You owe</span><span>You owe →</span><span>You are owed →</span><span style={{ color: '#2dcc8e' }}>You are owed</span>
                  </div>
                </div>
              </div>
              <p className="gw-settlement-note">
                {unsettledCount > 0
                  ? `${unsettledCount} expense${unsettledCount !== 1 ? 's' : ''} still unsettled in this group.`
                  : 'All group expenses are settled.'}
              </p>
              <button className="gw-view-details">View details →</button>
            </div>
          </div>

          {/* Top categories */}
          <div className="gw-card">
            <div className="gw-card-head">
              <h3 className="gw-card-title">Top categories</h3>
              <span className="gw-card-badge">All time</span>
            </div>
            {topCats.length === 0 ? (
              <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.82rem', padding: '0.5rem 0' }}>No expenses yet.</div>
            ) : (
              <div className="gw-cat-list">
                {topCats.map(([cat, val], i) => (
                  <div key={cat} className="gw-cat-row">
                    <div className="gw-cat-icon" style={{ background: colors[i % colors.length] + '22', color: colors[i % colors.length] }}>
                      {cat.slice(0, 1).toUpperCase()}
                    </div>
                    <div className="gw-cat-info">
                      <div className="gw-cat-name" style={{ textTransform: 'capitalize' }}>{cat}</div>
                      <div className="gw-cat-bar-wrap">
                        <div className="gw-cat-bar" style={{ width: `${totalSpent > 0 ? (val / totalSpent) * 100 : 0}%`, background: colors[i % colors.length] }} />
                      </div>
                    </div>
                    <div className="gw-cat-val">{fmt(val)}<br /><span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.68rem' }}>({totalSpent > 0 ? Math.round((val / totalSpent) * 100) : 0}%)</span></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Expenses table */}
        <div className="gw-table-card">
          <div className="gw-table-toolbar">
            <div className="gw-table-toolbar-left">
              <h3 className="gw-table-title">Expenses</h3>
              <select
                className="gw-filter-select"
                value={filterStatus}
                onChange={(e: any) => setFilterStatus(e.target.value)}
              >
                <option>All expenses</option>
                <option>Unsettled</option>
                <option>Settled</option>
              </select>
              <select
                className="gw-filter-select"
                value={sortOrder}
                onChange={(e: any) => setSortOrder(e.target.value)}
              >
                <option>Newest first</option>
                <option>Oldest first</option>
              </select>
            </div>
            <button className="gw-btn-primary" style={{ fontSize: '0.82rem' }} onClick={() => { resetExpenseForm(); setEditingExpense(null); setIsGroupExpense(true); setIsFriendExpense(false); setSelectedGroupId(groupDetailView); setShowExpenseModal(true) }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add Expense
            </button>
          </div>

          {sorted.length === 0 ? (
            <div style={{ padding: '2.5rem', textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontSize: '0.88rem' }}>
              {filterStatus !== 'All expenses' ? `No ${filterStatus.toLowerCase()} expenses found.` : 'No expenses yet. Add one to get started.'}
            </div>
          ) : (
            <>
              <table className="gw-table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Amount</th>
                    <th>Paid By</th>
                    <th>You Owe</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.slice(0, 10).map((exp: any, idx: number) => {
                    const payer = users.find((u: any) => u.id === exp.payerId)
                    const payerName = payer?.name || 'Unknown'
                    const share = exp.customSplits?.[props.currentUserId] ?? (exp.amount / Math.max((exp.participantIds || []).length, 1))
                    const youOwe = exp.payerId !== props.currentUserId && (exp.participantIds || []).includes(props.currentUserId) && !exp.settledByUser?.[props.currentUserId]
                    const owedToYou = exp.payerId === props.currentUserId && exp.expenseStatus !== 'Settled'
                    const settled = exp.expenseStatus === 'Settled'
                    const expColors = ['#6c5ce7', '#2dcc8e', '#f4a93d', '#e17055', '#74b9ff', '#fd79a8']
                    return (
                      <tr key={exp.id}>
                        <td>
                          <div className="gw-exp-cell">
                            <div className="gw-exp-icon" style={{ background: expColors[idx % expColors.length] + '28', color: expColors[idx % expColors.length] }}>
                              {(exp.description || 'E').slice(0, 1).toUpperCase()}
                            </div>
                            <div>
                              <div className="gw-exp-desc">{exp.description}</div>
                              <div className="gw-exp-meta">
                                {exp.createdAt ? new Date(exp.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                                {' · Split equally'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="gw-amount-cell">{fmt(exp.amount)}</td>
                        <td style={{ color: 'rgba(255,255,255,0.7)' }}>{payerName}</td>
                        <td>
                          {youOwe && <span className="gw-owe-positive">+{fmt(share)}</span>}
                          {owedToYou && <span className="gw-owe-negative">-{fmt(share)}</span>}
                          {!youOwe && !owedToYou && <span style={{ color: 'rgba(255,255,255,0.35)' }}>—</span>}
                        </td>
                        <td>
                          <span className={settled ? 'gw-status-pill gw-status-settled' : 'gw-status-pill gw-status-unsettled'}>
                            {settled ? 'Settled' : 'Unsettled'}
                          </span>
                        </td>
                        <td>
                          <button className="gw-row-menu">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {sorted.length > 10 && (
                <div className="gw-load-more">
                  <button className="gw-load-btn">
                    Load more
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    )
  }

  // ── GROUPS LIST ─────────────────────────────────────────────────────────────
  return (
    <div className="gl-shell">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@500&display=swap');
        .gl-shell { font-family:'DM Sans',sans-serif; display:flex; flex-direction:column; gap:1.25rem; padding-bottom:2.5rem; }

        /* hero */
        .gl-hero { display:flex; align-items:flex-start; justify-content:space-between; gap:1rem; flex-wrap:wrap; }
        .gl-hero-title { margin:0 0 0.25rem; font-size:1.9rem; font-weight:700; color:#fff; letter-spacing:-0.02em; }
        .gl-hero-sub { margin:0; font-size:0.88rem; color:rgba(255,255,255,0.45); }
        .gl-btn-new { display:flex; align-items:center; gap:0.45rem; padding:0.58em 1.2em; border-radius:10px; border:none; background:#6c5ce7; color:#fff; font-size:0.86rem; font-weight:700; cursor:pointer; font-family:'DM Sans',sans-serif; box-shadow:0 4px 14px rgba(108,92,231,0.38); transition:background 0.15s,transform 0.12s; }
        .gl-btn-new:hover { background:#5b4bd6; transform:translateY(-1px); }

        /* filter tabs */
        .gl-tabs { display:flex; gap:0.3rem; }
        .gl-tab { padding:0.4em 1em; border-radius:8px; border:1px solid rgba(255,255,255,0.1); background:rgba(255,255,255,0.04); color:rgba(255,255,255,0.6); font-size:0.83rem; font-weight:500; cursor:pointer; font-family:'DM Sans',sans-serif; transition:all 0.15s; }
        .gl-tab:hover { background:rgba(255,255,255,0.08); color:#fff; }
        .gl-tab-active { background:rgba(108,92,231,0.18); border-color:rgba(108,92,231,0.45); color:#fff; }

        /* grid */
        .gl-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:1rem; }

        /* group card */
        .gl-card { background:#1e1e30; border:1px solid rgba(255,255,255,0.07); border-radius:16px; padding:1.2rem; display:flex; flex-direction:column; gap:0.9rem; cursor:pointer; transition:transform 0.18s,box-shadow 0.18s,border-color 0.18s; }
        .gl-card:hover { transform:translateY(-2px); box-shadow:0 14px 32px rgba(0,0,0,0.3); border-color:rgba(108,92,231,0.35); }
        .gl-card-top { display:flex; align-items:flex-start; justify-content:space-between; gap:0.75rem; }
        .gl-card-identity { display:flex; align-items:center; gap:0.85rem; }
        .gl-card-avatar { width:44px; height:44px; border-radius:12px; background:linear-gradient(135deg,#5b4bd6,#a29bfe); display:flex; align-items:center; justify-content:center; font-size:1.1rem; font-weight:700; color:#fff; flex-shrink:0; }
        .gl-card-name { font-size:1rem; font-weight:700; color:#fff; margin:0 0 0.25rem; line-height:1.3; }
        .gl-card-meta { font-size:0.75rem; color:rgba(255,255,255,0.4); display:flex; align-items:center; gap:0.35rem; }
        .gl-card-menu { width:28px; height:28px; border-radius:7px; border:none; background:transparent; color:rgba(255,255,255,0.35); cursor:pointer; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .gl-card-menu:hover { background:rgba(255,255,255,0.08); color:rgba(255,255,255,0.7); }

        /* stats row */
        .gl-card-stats { display:grid; grid-template-columns:1fr 1fr; gap:0.75rem; }
        .gl-card-stat-label { font-size:0.72rem; color:rgba(255,255,255,0.38); margin:0 0 0.2rem; }
        .gl-card-stat-val { font-size:1.05rem; font-weight:700; font-family:'DM Mono',monospace; color:#fff; }

        /* footer row */
        .gl-card-footer { display:flex; align-items:center; justify-content:space-between; }
        .gl-unsettled { display:flex; align-items:center; gap:0.4rem; font-size:0.78rem; font-weight:600; color:#ff7a7a; }
        .gl-unsettled-dot { width:7px; height:7px; border-radius:50%; background:#ff5c5c; flex-shrink:0; }
        .gl-settled { display:flex; align-items:center; gap:0.4rem; font-size:0.78rem; font-weight:600; color:#2dcc8e; }
        .gl-settled-dot { width:7px; height:7px; border-radius:50%; background:#2dcc8e; flex-shrink:0; }
        .gl-card-actions { display:flex; gap:0.45rem; }
        .gl-btn-edit { padding:0.32em 0.9em; border-radius:7px; border:1px solid rgba(255,255,255,0.12); background:rgba(255,255,255,0.05); color:rgba(255,255,255,0.75); font-size:0.78rem; font-weight:600; cursor:pointer; font-family:'DM Sans',sans-serif; transition:background 0.15s; }
        .gl-btn-edit:hover { background:rgba(255,255,255,0.1); }
        .gl-btn-view { padding:0.32em 0.9em; border-radius:7px; border:none; background:#6c5ce7; color:#fff; font-size:0.78rem; font-weight:700; cursor:pointer; font-family:'DM Sans',sans-serif; transition:background 0.15s; }
        .gl-btn-view:hover { background:#5b4bd6; }

        /* create card */
        .gl-create-card { background:rgba(108,92,231,0.06); border:1.5px dashed rgba(108,92,231,0.3); border-radius:16px; padding:1.4rem; display:flex; align-items:center; gap:1rem; cursor:pointer; transition:background 0.15s,border-color 0.15s; }
        .gl-create-card:hover { background:rgba(108,92,231,0.1); border-color:rgba(108,92,231,0.5); }
        .gl-create-icon { width:44px; height:44px; border-radius:50%; background:#6c5ce7; display:flex; align-items:center; justify-content:center; flex-shrink:0; box-shadow:0 4px 14px rgba(108,92,231,0.4); }
        .gl-create-title { font-size:0.95rem; font-weight:600; color:#fff; margin:0 0 0.2rem; }
        .gl-create-sub { font-size:0.78rem; color:rgba(255,255,255,0.42); margin:0; }

        /* create form */
        .gl-form-card { background:#1e1e30; border:1px solid rgba(108,92,231,0.2); border-radius:16px; padding:1.3rem; display:flex; flex-direction:column; gap:0.9rem; }
        .gl-form-title { font-size:0.95rem; font-weight:600; color:#fff; margin:0; }
        .gl-input { padding:0.6em 0.85em; border-radius:9px; border:1px solid rgba(255,255,255,0.1); background:rgba(255,255,255,0.05); color:#fff; font-size:0.88rem; font-family:'DM Sans',sans-serif; outline:none; transition:border-color 0.15s; width:100%; box-sizing:border-box; }
        .gl-input:focus { border-color:rgba(108,92,231,0.5); }
        .gl-member-pills { display:flex; flex-wrap:wrap; gap:0.4rem; }
        .gl-pill { padding:0.32em 0.8em; border-radius:999px; border:1px solid rgba(255,255,255,0.1); background:rgba(255,255,255,0.04); color:rgba(255,255,255,0.65); font-size:0.78rem; cursor:pointer; font-family:'DM Sans',sans-serif; transition:all 0.15s; }
        .gl-pill-selected { background:rgba(108,92,231,0.22); border-color:rgba(108,92,231,0.5); color:#fff; }
        .gl-form-actions { display:flex; gap:0.6rem; }
        .gl-btn-cancel { padding:0.55em 1.2em; border-radius:9px; border:1px solid rgba(255,255,255,0.1); background:transparent; color:rgba(255,255,255,0.65); font-size:0.86rem; font-weight:600; cursor:pointer; font-family:'DM Sans',sans-serif; }

        /* invitations */
        .gl-inv-card { background:#1e1e30; border:1px solid rgba(108,92,231,0.2); border-radius:16px; padding:1.1rem; }
        .gl-inv-head { display:flex; align-items:center; justify-content:space-between; margin-bottom:0.85rem; }
        .gl-inv-title { font-size:0.9rem; font-weight:600; color:#fff; margin:0; }
        .gl-inv-row { display:flex; align-items:center; justify-content:space-between; gap:1rem; padding:0.55rem 0; border-bottom:1px solid rgba(255,255,255,0.05); }
        .gl-inv-row:last-child { border-bottom:none; }
        .gl-inv-name { font-size:0.86rem; font-weight:600; color:#fff; }
        .gl-inv-by { font-size:0.75rem; color:rgba(255,255,255,0.4); }
        .gl-btn-accept { padding:0.3em 0.85em; border-radius:7px; border:none; background:rgba(45,204,142,0.18); color:#2dcc8e; font-size:0.78rem; font-weight:700; cursor:pointer; font-family:'DM Sans',sans-serif; }
        .gl-btn-decline { padding:0.3em 0.85em; border-radius:7px; border:none; background:rgba(255,92,92,0.12); color:#ff7a7a; font-size:0.78rem; font-weight:700; cursor:pointer; font-family:'DM Sans',sans-serif; }

        /* empty */
        .gl-empty { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:0.65rem; padding:3rem; text-align:center; border-radius:16px; border:1px dashed rgba(255,255,255,0.08); background:rgba(255,255,255,0.02); grid-column:1/-1; }

        /* light mode */
        .app.light-mode .gl-hero-title { color:#1a1040; }
        .app.light-mode .gl-hero-sub { color:rgba(47,32,80,0.5); }
        .app.light-mode .gl-card,.app.light-mode .gl-form-card,.app.light-mode .gl-inv-card { background:#fff; border-color:rgba(108,92,231,0.1); box-shadow:0 2px 10px rgba(108,92,231,0.05); }
        .app.light-mode .gl-card-name,.app.light-mode .gl-card-stat-val,.app.light-mode .gl-form-title,.app.light-mode .gl-inv-title,.app.light-mode .gl-inv-name,.app.light-mode .gl-create-title { color:#1a1040; }
        .app.light-mode .gl-card-meta,.app.light-mode .gl-card-stat-label,.app.light-mode .gl-create-sub,.app.light-mode .gl-inv-by { color:rgba(47,32,80,0.48); }
        .app.light-mode .gl-tab { background:rgba(108,92,231,0.06); border-color:rgba(108,92,231,0.12); color:rgba(47,32,80,0.65); }
        .app.light-mode .gl-tab-active { background:rgba(108,92,231,0.15); border-color:rgba(108,92,231,0.4); color:#1a1040; }
        .app.light-mode .gl-create-card { background:rgba(108,92,231,0.04); border-color:rgba(108,92,231,0.25); }
        .app.light-mode .gl-create-card:hover { background:rgba(108,92,231,0.08); }
        .app.light-mode .gl-input { background:rgba(108,92,231,0.04); border-color:rgba(108,92,231,0.15); color:#1a1040; }
        .app.light-mode .gl-pill { background:rgba(108,92,231,0.06); border-color:rgba(108,92,231,0.12); color:rgba(47,32,80,0.7); }
        .app.light-mode .gl-btn-edit { background:rgba(108,92,231,0.06); border-color:rgba(108,92,231,0.14); color:rgba(47,32,80,0.75); }
        .app.light-mode .gl-card-menu { color:rgba(47,32,80,0.38); }
        .app.light-mode .gl-inv-row { border-color:rgba(108,92,231,0.07); }

        @media(max-width:1100px) { .gl-grid{grid-template-columns:repeat(2,1fr)} }
        @media(max-width:640px) { .gl-grid{grid-template-columns:1fr} .gl-hero{flex-direction:column} }
      `}</style>

      {/* Hero */}
      <div className="gl-hero">
        <div>
          <h2 className="gl-hero-title">Groups</h2>
          <p className="gl-hero-sub">Organize expenses, track balances, and settle up with your people.</p>
        </div>
        <button className="gl-btn-new" onClick={() => setShowCreateGroupPanel((p: boolean) => !p)}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New group
        </button>
      </div>

      {/* Filter tabs */}
      <div className="gl-tabs">
        {['All groups', "You're a member", 'You created'].map((t, i) => (
          <button key={t} className={i === 0 ? 'gl-tab gl-tab-active' : 'gl-tab'}>{t}</button>
        ))}
      </div>

      {/* Create form */}
      {showCreateGroupPanel && (
        <div className="gl-form-card">
          <h3 className="gl-form-title">Create new group</h3>
          <form onSubmit={handleCreateGroup} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <input
              className="gl-input"
              type="text"
              placeholder="Group name (e.g. Vacation Varkala)"
              value={groupName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGroupName(e.target.value)}
              required
            />
            <div>
              <p style={{ margin: '0 0 0.5rem', fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)' }}>Add friends:</p>
              <div className="gl-member-pills">
                {currentFriends.length > 0 ? currentFriends.map((u: any) => (
                  <button key={u.id} type="button"
                    className={groupMemberIds.includes(u.id) ? 'gl-pill gl-pill-selected' : 'gl-pill'}
                    onClick={() => toggleGroupMember(u.id)}>
                    {u.name}
                  </button>
                )) : <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)' }}>Add friends first</span>}
              </div>
            </div>
            <div className="gl-form-actions">
              <button type="submit" className="gl-btn-new">Create group</button>
              <button type="button" className="gl-btn-cancel" onClick={() => setShowCreateGroupPanel(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Edit group form */}
      {editingGroup && (
        <div className="gl-form-card">
          <h3 className="gl-form-title">Edit Group — {editingGroup.name}</h3>
          <form onSubmit={handleUpdateGroup} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <input className="gl-input" type="text" value={editGroupName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditGroupName(e.target.value)} required />
            <div className="gl-member-pills">
              {editGroupMemberIds.map((mid: string) => {
                const m = users.find((u: any) => u.id === mid)
                if (!m) return null
                const isOwner = mid === editingGroup.ownerId
                return (
                  <div key={mid} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.3em 0.75em', borderRadius: '999px', background: 'rgba(108,92,231,0.15)', border: '1px solid rgba(108,92,231,0.3)', fontSize: '0.78rem', color: '#fff' }}>
                    {m.name} {isOwner && <span style={{ fontSize: '0.66rem', opacity: 0.6 }}>(owner)</span>}
                    {!isOwner && <button type="button" onClick={() => toggleEditGroupMember(mid)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: 0, marginLeft: 2 }}>✕</button>}
                  </div>
                )
              })}
              {currentFriends.filter((f: any) => !editGroupMemberIds.includes(f.id)).map((f: any) => (
                <button key={f.id} type="button" className="gl-pill" onClick={() => toggleEditGroupMember(f.id)}>+ {f.name}</button>
              ))}
            </div>
            <div className="gl-form-actions">
              <button type="submit" className="gl-btn-new">Save changes</button>
              <button type="button" className="gl-btn-cancel" onClick={() => { setEditingGroup(null); setEditGroupMemberIds([]) }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Groups grid */}
      <div className="gl-grid">
        {groupOverview.length === 0 && !showCreateGroupPanel && (
          <div className="gl-empty">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="rgba(162,155,254,0.5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            <p style={{ margin: 0, fontSize: '0.92rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>No groups yet</p>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)' }}>Create a group to start splitting expenses.</p>
          </div>
        )}

        {groupOverview.map(({ group, total, yourShare, unsettledCount, latestLabel }: any) => (
          <div key={group.id} className="gl-card" onClick={() => { setSelectedGroupId(group.id); setGroupDetailView(group.id); fetchGroupExpenses(group.id) }}>
            <div className="gl-card-top">
              <div className="gl-card-identity">
                <div className="gl-card-avatar">{getInitials(group.name)}</div>
                <div>
                  <h3 className="gl-card-name">{group.name}</h3>
                  <div className="gl-card-meta">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    {group.memberIds.length} members · {latestLabel}
                  </div>
                </div>
              </div>
              <button className="gl-card-menu" onClick={(e: React.MouseEvent) => e.stopPropagation()} title="Options">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>
              </button>
            </div>

            <div className="gl-card-stats">
              <div>
                <p className="gl-card-stat-label">Total spent</p>
                <p className="gl-card-stat-val">{fmt(total)}</p>
              </div>
              <div>
                <p className="gl-card-stat-label">Your share</p>
                <p className="gl-card-stat-val">{fmt(yourShare)}</p>
              </div>
            </div>

            <div className="gl-card-footer">
              {unsettledCount > 0 ? (
                <div className="gl-unsettled">
                  <div className="gl-unsettled-dot" />
                  {unsettledCount} unsettled
                </div>
              ) : (
                <div className="gl-settled">
                  <div className="gl-settled-dot" />
                  All settled
                </div>
              )}
              <div className="gl-card-actions" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                <button className="gl-btn-edit" onClick={() => startEditGroup(group)}>Edit</button>
                <button className="gl-btn-view" onClick={() => { setSelectedGroupId(group.id); setGroupDetailView(group.id); fetchGroupExpenses(group.id) }}>View</button>
              </div>
            </div>
          </div>
        ))}

        {/* Create new group card */}
        <div className="gl-create-card" onClick={() => setShowCreateGroupPanel((p: boolean) => !p)}>
          <div className="gl-create-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </div>
          <div>
            <p className="gl-create-title">Create new group</p>
            <p className="gl-create-sub">Split expenses and manage together</p>
          </div>
        </div>
      </div>

      {/* Group invitations */}
      {groupInvitations.length > 0 && (
        <div className="gl-inv-card">
          <div className="gl-inv-head">
            <h3 className="gl-inv-title">Group invitations</h3>
            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>{groupInvitations.length} pending</span>
          </div>
          {groupInvitations.map((inv: any) => {
            const inviter = users.find((u: any) => u.id === inv.inviterUserId)
            return (
              <div key={inv.id} className="gl-inv-row">
                <div>
                  <div className="gl-inv-name">{inv.groupName || 'Unknown group'}</div>
                  <div className="gl-inv-by">invited by {inviter?.name || 'someone'}</div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="gl-btn-accept" onClick={() => handleAcceptGroupInvitation(inv.id)}>Accept</button>
                  <button className="gl-btn-decline" onClick={() => handleDeclineGroupInvitation(inv.id)}>Decline</button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
