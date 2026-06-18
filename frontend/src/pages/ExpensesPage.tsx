/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react'

export type ExpensesPageProps = Record<string, any>

const CATEGORY_COLORS: Record<string, string> = {
  groceries: '#2dcc8e', rent: '#6c5ce7', transport: '#74b9ff', travel: '#a29bfe',
  insurance: '#f4a93d', investments: '#00cec9', utilities: '#fd79a8', subscriptions: '#e17055',
  health: '#ff7675', education: '#0984e3', childcare: '#fdcb6e', pets: '#55efc4',
  taxes: '#b2bec3', gifts: '#ff9ff3', charity: '#ffeaa7', maintenance: '#636e72',
  loans: '#d63031', fees: '#e84393', entertainment: '#6c5ce7', shopping: '#f4a93d',
  miscellaneous: '#a29bfe',
}

function getCatColor(cat: string) {
  return CATEGORY_COLORS[cat] || '#a29bfe'
}

export default function ExpensesPage(props: ExpensesPageProps) {
  const {
    expenseStats, expenseFilterTabs, expenseViewFilter, setExpenseViewFilter,
    filteredExpenseFeed, expensesPage, EXPENSES_PAGE_SIZE,
    expenseChats, expenseChatInputs, setExpenseChatInputs, editLogDisplayCount, setEditLogDisplayCount,
    currentUserId, currentUserName, users, groups, defaultCurrency, convertINR, getCurrencySymbol,
    setExpenseDetailView, setExpensesPage, handleSettleUp, startEditExpense, setShowExpenseModal,
    handleDeleteExpense, handleFlagExpense, handleUnflagExpense, handleSendExpenseChatMessage,
    shareLabel, userShare, othersOweTotal, getExpenseCategory, payerName, resetExpenseForm,
    setEditingExpense, expenseDescription, expenseTag, setExpenseDescription, setExpenseTag,
    expenseAmount, setExpenseAmount, expenseCurrency, setExpenseCurrency,
    isRecurringExpense, setIsRecurringExpense, recurrenceStartDate, setRecurrenceStartDate,
    recurrenceType, setRecurrenceType, recurrenceInterval, setRecurrenceInterval,
    recurrenceEndDate, setRecurrenceEndDate, isGroupExpense, setIsGroupExpense,
    isFriendExpense, setIsFriendExpense, selectedFriendId, setSelectedFriendId,
    expensePayerId, setExpensePayerId, selectedGroupId, setSelectedGroupId,
    splitMode, setSplitMode, customSplits, setCustomSplits, currentFriends,
    filteredGroups, editingExpense, expenseEditLogs, showExpenseModal, setShowExpenseModalState,
    currentUser,
  } = props

  const sym = getCurrencySymbol(defaultCurrency)
  const fmt = (n: number) => `${sym}${convertINR(n, defaultCurrency).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const [dialogExpense, setDialogExpense] = useState<any>(null)

  function openDialog(exp: any) {
    setDialogExpense(exp)
    setExpenseDetailView(exp)
  }
  function closeDialog() {
    setDialogExpense(null)
  }

  const visibleExpenses = filteredExpenseFeed.slice(0, expensesPage * EXPENSES_PAGE_SIZE)

  // ── Expense dialog ──────────────────────────────────────────────────────────
  function ExpenseDialog({ exp }: { exp: any }) {
    const cat = getExpenseCategory(exp)
    const color = getCatColor(cat)
    const isGroup = exp.type === 'GROUP'
    const participants = exp.participantIds || []
    const youOwe = isGroup && exp.payerId !== currentUserId && participants.includes(currentUserId) && !exp.settledByUser?.[currentUserId]
    const owedToYou = isGroup && exp.payerId === currentUserId && exp.expenseStatus !== 'Settled'
    const settled = exp.expenseStatus === 'Settled'
    const isFlagged = (exp.flaggedBy || []).includes(currentUserId)
    const isMine = exp.createdBy === currentUserId || (!exp.createdBy && exp.payerId === currentUserId)
    const groupName = exp.groupId ? (groups.find((g: any) => g.id === exp.groupId)?.name || 'Group') : null
    const logs = expenseEditLogs[exp.id] || []
    function toggleDialogFlag() {
      if (isMine) return
      const currentFlags = exp.flaggedBy || []
      const nextFlags = isFlagged
        ? currentFlags.filter((id: string) => id !== currentUserId)
        : [...currentFlags, currentUserId]
      const updatedExpense = { ...exp, flaggedBy: nextFlags }
      setDialogExpense(updatedExpense)
      setExpenseDetailView(updatedExpense)
      if (isFlagged) handleUnflagExpense(exp.id)
      else handleFlagExpense(exp.id)
    }

    return (
      <div className="ep-dialog-overlay" onClick={closeDialog}>
        <div className="ep-dialog" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
          {/* Dialog header */}
          <div className="ep-dialog-header">
            <div className="ep-dialog-icon" style={{ background: color + '22', color }}>
              {cat.slice(0, 1).toUpperCase()}
            </div>
            <div className="ep-dialog-title-block">
              <div className="ep-dialog-eyebrow">{isGroup ? groupName || 'Group expense' : 'Personal expense'}</div>
              <h3 className="ep-dialog-title">{exp.description}</h3>
            </div>
            <div className="ep-dialog-amount-block">
              <div className="ep-dialog-amount">{getCurrencySymbol(exp.currency)}{exp.amount.toFixed(2)}</div>
              <div className="ep-dialog-currency">{exp.currency}</div>
            </div>
            {!isMine && (
              <button
                className={isFlagged ? 'ep-dialog-flag ep-dialog-flag-active' : 'ep-dialog-flag'}
                onClick={toggleDialogFlag}
                title={isFlagged ? 'Unflag expense' : 'Flag expense'}
                aria-label={isFlagged ? 'Unflag expense' : 'Flag expense'}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill={isFlagged ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
              </button>
            )}
            <button className="ep-dialog-close" onClick={closeDialog}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          {/* Meta grid */}
          <div className="ep-dialog-meta-grid">
            {[
              { label: 'Paid by', value: payerName(exp.payerId) },
              { label: 'Category', value: cat },
              { label: 'Date', value: exp.createdAt ? new Date(exp.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—' },
              ...(isGroup ? [{ label: 'Status', value: settled ? 'Settled' : 'Unsettled', color: settled ? '#2dcc8e' : '#ff7a7a' }] : []),
            ].map(item => (
              <div key={item.label} className="ep-dialog-kv">
                <span className="ep-dialog-kv-label">{item.label}</span>
                <strong className="ep-dialog-kv-val" style={item.color ? { color: item.color } : {}}>{item.value}</strong>
              </div>
            ))}
          </div>

          {/* Flag alert */}
          {(exp.flaggedBy || []).length > 0 && (
            <div className="ep-dialog-alert">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
              Flagged by {(exp.flaggedBy || []).length} participant{(exp.flaggedBy || []).length > 1 ? 's' : ''}
            </div>
          )}

          {/* Split summary */}
          {isGroup && (
            <div className="ep-dialog-section">
              <div className="ep-dialog-section-title">Split summary</div>
              <div className="ep-dialog-split-info">
                <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.83rem' }}>{shareLabel(exp)}</span>
                {youOwe && <span style={{ color: '#ff7a7a', fontSize: '0.83rem' }}>You owe {fmt(userShare(exp))}</span>}
                {owedToYou && <span style={{ color: '#2dcc8e', fontSize: '0.83rem' }}>Others owe you {fmt(othersOweTotal(exp))}</span>}
                {settled && <span style={{ color: '#2dcc8e', fontSize: '0.83rem' }}>All settled ✓</span>}
              </div>
            </div>
          )}

          {/* Edit history */}
          {logs.length > 0 && (
            <div className="ep-dialog-section">
              <div className="ep-dialog-section-title">Edit history</div>
              <div className="ep-dialog-logs">
                {logs.slice(0, editLogDisplayCount).map((log: any, i: number) => (
                  <div key={log.id || i} className="ep-dialog-log-item">
                    <strong>{new Date(log.editTime).toLocaleString()}</strong>
                    <span>{log.reason || 'Updated expense details'}</span>
                  </div>
                ))}
                {logs.length > editLogDisplayCount && (
                  <button className="ep-link-btn" onClick={() => setEditLogDisplayCount(editLogDisplayCount + 3)}>See more</button>
                )}
              </div>
            </div>
          )}

          {/* Chat */}
          {exp.groupId && (
            <div className="ep-dialog-section">
              <div className="ep-dialog-section-title">Expense chat</div>

              <div className="ep-chat-panel">
                <div className="ep-chat-messages">
                  {(expenseChats[exp.id] || []).length === 0 ? (
                    <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem', textAlign: 'center', padding: '1rem 0' }}>
                      No messages yet. Start the conversation!
                    </div>
                  ) : (
                    (expenseChats[exp.id] || []).map((msg: any, idx: number) => {
                      const isSelf = msg.user === currentUserName
                      const initials = msg.user.split(' ').filter(Boolean).slice(0, 2).map((p: string) => p[0]?.toUpperCase()).join('')
                      const avatarColors = ['#6c5ce7','#0984e3','#00b894','#d63031','#e17055','#fdcb6e','#a29bfe','#fd79a8']
                      const colorIdx = msg.user.split('').reduce((acc: number, c: string) => acc + c.charCodeAt(0), 0) % avatarColors.length

                      return (
                        <div key={idx} className={isSelf ? 'ep-chat-row ep-chat-row-self' : 'ep-chat-row ep-chat-row-other'}>
                          {!isSelf && (
                            <div className="ep-chat-avatar" style={{ background: avatarColors[colorIdx] }}>
                              {initials}
                            </div>
                          )}
                          <div className="ep-chat-bwrap">
                            {!isSelf && <div className="ep-chat-sender">{msg.user}</div>}
                            <div className={isSelf ? 'ep-chat-bubble ep-chat-bubble-self' : 'ep-chat-bubble ep-chat-bubble-other'}>
                              <span className="ep-chat-text">{msg.message}</span>
                              <div className="ep-chat-meta">
                                <span className="ep-chat-time">
                                  {(() => {
                                    try { return new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
                                    catch { return msg.timestamp }
                                  })()}
                                </span>
                                {isSelf && (
                                  <svg className="ep-chat-tick" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M20 6L9 17l-5-5"/>
                                  </svg>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>

                <div className="ep-chat-composer">
                  <input
                    type="text"
                    placeholder="Type a message…"
                    value={expenseChatInputs[exp.id] || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setExpenseChatInputs((p: any) => ({ ...p, [exp.id]: e.target.value }))
                    }
                    onKeyDown={(e: React.KeyboardEvent) => {
                      if (e.key === 'Enter') handleSendExpenseChatMessage(exp.id)
                    }}
                  />
                  <button
                    onClick={() => handleSendExpenseChatMessage(exp.id)}
                    disabled={!(expenseChatInputs[exp.id]?.trim())}
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="ep-dialog-actions">
            {isGroup && youOwe && (
              <button className="ep-action-btn ep-action-settle" onClick={() => { handleSettleUp(exp.id); closeDialog() }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                Settle up
              </button>
            )}
            {isMine && (
              <button className="ep-action-btn ep-action-edit" onClick={() => { startEditExpense(exp); setShowExpenseModal(true); closeDialog() }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                Edit
              </button>
            )}
            {!isMine && (
              isFlagged
                ? <button className="ep-action-btn ep-action-unflag" onClick={toggleDialogFlag}>Unflag</button>
                : <button className="ep-action-btn ep-action-flag" onClick={toggleDialogFlag}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
                    Flag
                  </button>
            )}
            {isMine && (
              <button className="ep-action-btn ep-action-delete" onClick={() => { handleDeleteExpense(exp); closeDialog() }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                Delete
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="ep-shell">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@500&display=swap');

        .ep-shell { font-family:'DM Sans',sans-serif; display:flex; flex-direction:column; gap:1.1rem; padding-bottom:2.5rem; }

        /* ── Hero ── */
        .ep-hero { display:flex; align-items:flex-start; justify-content:space-between; gap:1rem; flex-wrap:wrap; }
        .ep-eyebrow { margin:0 0 0.2rem; font-size:0.78rem; color:rgba(255,255,255,0.38); letter-spacing:0.04em; }
        .ep-hero-title { margin:0 0 0.25rem; font-size:1.9rem; font-weight:700; color:#fff; letter-spacing:-0.02em; }
        .ep-hero-sub { margin:0; font-size:0.84rem; color:rgba(255,255,255,0.42); display:flex; align-items:center; gap:0.4rem; }
        .ep-hero-sub span { width:4px; height:4px; border-radius:50%; background:rgba(255,255,255,0.3); display:inline-block; }
        .ep-hero-actions { display:flex; gap:0.6rem; align-items:center; flex-shrink:0; }
        .ep-btn-clear { padding:0.52em 1.1em; border-radius:10px; border:1px solid rgba(255,255,255,0.12); background:rgba(255,255,255,0.05); color:rgba(255,255,255,0.78); font-size:0.84rem; font-weight:600; cursor:pointer; font-family:'DM Sans',sans-serif; transition:background 0.15s; }
        .ep-btn-clear:hover { background:rgba(255,255,255,0.1); }
        .ep-btn-add { display:flex; align-items:center; gap:0.45rem; padding:0.52em 1.2em; border-radius:10px; border:none; background:#6c5ce7; color:#fff; font-size:0.84rem; font-weight:700; cursor:pointer; font-family:'DM Sans',sans-serif; box-shadow:0 4px 14px rgba(108,92,231,0.38); transition:background 0.15s,transform 0.12s; }
        .ep-btn-add:hover { background:#5b4bd6; transform:translateY(-1px); }

        /* ── Stat strip ── */
        .ep-stats { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:1rem; }
        .ep-stat { background:#1e1e30; border:1px solid rgba(255,255,255,0.07); border-radius:16px; padding:1.1rem 1.3rem; display:flex; align-items:center; justify-content:space-between; gap:1rem; transition:transform 0.18s,box-shadow 0.18s; }
        .ep-stat:hover { transform:translateY(-2px); box-shadow:0 12px 28px rgba(0,0,0,0.28); }
        .ep-stat-body { display:flex; flex-direction:column; gap:0.3rem; }
        .ep-stat-label { font-size:0.78rem; color:rgba(255,255,255,0.42); font-weight:500; }
        .ep-stat-value { font-size:1.7rem; font-weight:700; font-family:'DM Mono',monospace; line-height:1.05; color:#fff; }
        .ep-stat-value.red { color:#ff5c5c; }
        .ep-stat-value.green { color:#2dcc8e; }
        .ep-stat-note { font-size:0.75rem; color:rgba(255,255,255,0.35); }
        .ep-stat-icon { width:46px; height:46px; border-radius:13px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }

        /* ── Main card ── */
        .ep-main-card { background:#1e1e30; border:1px solid rgba(255,255,255,0.07); border-radius:18px; overflow:hidden; }

        /* Toolbar */
        .ep-toolbar { padding:1rem 1.3rem 0.85rem; border-bottom:1px solid rgba(255,255,255,0.06); display:flex; align-items:flex-start; justify-content:space-between; gap:1rem; flex-wrap:wrap; }
        .ep-toolbar-left {}
        .ep-toolbar-title { font-size:1rem; font-weight:700; color:#fff; margin:0 0 0.25rem; }
        .ep-toolbar-sub { font-size:0.78rem; color:rgba(255,255,255,0.38); margin:0; }
        .ep-filters { display:flex; gap:0.35rem; flex-wrap:wrap; align-items:center; }
        .ep-filter-chip { padding:0.36em 0.85em; border-radius:999px; border:1px solid rgba(255,255,255,0.1); background:rgba(255,255,255,0.04); color:rgba(255,255,255,0.6); font-size:0.78rem; font-weight:600; cursor:pointer; font-family:'DM Sans',sans-serif; transition:all 0.15s; white-space:nowrap; }
        .ep-filter-chip:hover { background:rgba(255,255,255,0.08); color:#fff; }
        .ep-filter-chip-active { background:rgba(108,92,231,0.2); border-color:rgba(108,92,231,0.5); color:#fff; }

        /* Expense list */
        .ep-list { display:flex; flex-direction:column; }
        .ep-row { display:flex; align-items:center; gap:1rem; padding:0.85rem 1.3rem; border-bottom:1px solid rgba(255,255,255,0.04); cursor:pointer; transition:background 0.15s; }
        .ep-row:hover { background:rgba(255,255,255,0.025); }
        .ep-row:last-child { border-bottom:none; }
        .ep-row-icon { width:40px; height:40px; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:0.82rem; font-weight:700; color:#fff; flex-shrink:0; }
        .ep-row-main { flex:1; min-width:0; }
        .ep-row-name { font-size:0.9rem; font-weight:600; color:#fff; display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap; }
        .ep-row-meta { font-size:0.75rem; color:rgba(255,255,255,0.38); margin-top:0.2rem; display:flex; align-items:center; gap:0.4rem; flex-wrap:wrap; }
        .ep-row-meta-dot { width:3px; height:3px; border-radius:50%; background:rgba(255,255,255,0.25); }
        .ep-pill-flag { padding:0.15em 0.55em; border-radius:999px; background:rgba(255,159,67,0.16); color:#ffb86b; font-size:0.68rem; font-weight:700; }
        .ep-pill-recurring { padding:0.15em 0.55em; border-radius:999px; background:rgba(139,224,203,0.14); color:#8be0cb; font-size:0.68rem; font-weight:700; }
        .ep-row-right { display:flex; align-items:center; gap:0.75rem; flex-shrink:0; text-align:right; }
        .ep-row-amount { font-family:'DM Mono',monospace; font-weight:700; font-size:0.95rem; color:#fff; }
        .ep-row-amount-note { font-size:0.72rem; color:rgba(255,255,255,0.38); }
        .ep-row-amount-owe { color:#ff7a7a; font-size:0.75rem; font-weight:600; }
        .ep-row-amount-owed { color:#2dcc8e; font-size:0.75rem; font-weight:600; }
        .ep-row-actions { display:flex; gap:0.35rem; align-items:center; }
        .ep-btn-dots { width:30px; height:30px; border-radius:7px; border:none; background:transparent; color:rgba(255,255,255,0.35); cursor:pointer; display:flex; align-items:center; justify-content:center; }
        .ep-btn-dots:hover { background:rgba(255,255,255,0.06); color:rgba(255,255,255,0.7); }

        /* Load more */
        .ep-load-more { display:flex; justify-content:flex-start; padding:0.9rem 1.3rem; border-top:1px solid rgba(255,255,255,0.05); }
        .ep-btn-load { padding:0.48em 1.3em; border-radius:9px; border:1px solid rgba(255,255,255,0.1); background:rgba(255,255,255,0.04); color:rgba(255,255,255,0.65); font-size:0.83rem; font-weight:600; cursor:pointer; font-family:'DM Sans',sans-serif; transition:background 0.15s; }
        .ep-btn-load:hover { background:rgba(255,255,255,0.08); color:#fff; }

        /* Empty */
        .ep-empty { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:0.65rem; padding:3.5rem; text-align:center; }
        .ep-empty-icon { width:52px; height:52px; border-radius:50%; background:rgba(108,92,231,0.12); display:flex; align-items:center; justify-content:center; color:rgba(162,155,254,0.6); }

        /* ── Dialog ── */
        .ep-dialog-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.65); display:flex; align-items:center; justify-content:center; z-index:500; padding:1rem; backdrop-filter:blur(4px); }
        .ep-dialog { background:linear-gradient(180deg,#1e1e30 0%,#18182a 100%); border:1px solid rgba(255,255,255,0.1); border-radius:20px; padding:1.5rem; width:100%; max-width:560px; max-height:90vh; overflow-y:auto; box-shadow:0 24px 60px rgba(0,0,0,0.55); display:flex; flex-direction:column; gap:1.1rem; }
        .ep-dialog-header { display:flex; align-items:flex-start; gap:1rem; }
        .ep-dialog-icon { width:48px; height:48px; border-radius:14px; display:flex; align-items:center; justify-content:center; font-size:1.1rem; font-weight:700; flex-shrink:0; }
        .ep-dialog-title-block { flex:1; min-width:0; }
        .ep-dialog-eyebrow { font-size:0.72rem; color:rgba(255,255,255,0.4); text-transform:uppercase; letter-spacing:0.06em; margin:0 0 0.2rem; }
        .ep-dialog-title { font-size:1.15rem; font-weight:700; color:#fff; margin:0; }
        .ep-dialog-amount-block { text-align:right; flex-shrink:0; }
        .ep-dialog-amount { font-size:1.4rem; font-weight:700; font-family:'DM Mono',monospace; color:#fff; }
        .ep-dialog-currency { font-size:0.72rem; color:rgba(255,255,255,0.38); }
        .ep-dialog-flag { width:30px; height:30px; border-radius:8px; border:1px solid rgba(255,159,67,0.24); background:rgba(255,159,67,0.1); color:#ffb86b; cursor:pointer; display:flex; align-items:center; justify-content:center; flex-shrink:0; transition:background 0.15s,color 0.15s,border-color 0.15s; }
        .ep-dialog-flag:hover { background:rgba(255,159,67,0.18); color:#ffd19a; }
        .ep-dialog-flag-active { border-color:rgba(255,159,67,0.48); background:rgba(255,159,67,0.22); color:#ffd19a; }
        .ep-dialog-close { width:30px; height:30px; border-radius:8px; border:none; background:rgba(255,255,255,0.06); color:rgba(255,255,255,0.5); cursor:pointer; display:flex; align-items:center; justify-content:center; flex-shrink:0; transition:background 0.15s; }
        .ep-dialog-close:hover { background:rgba(255,255,255,0.12); color:#fff; }

        .ep-dialog-meta-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:0.75rem; }
        .ep-dialog-kv { padding:0.75rem 0.9rem; border-radius:12px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.05); display:flex; flex-direction:column; gap:0.2rem; }
        .ep-dialog-kv-label { font-size:0.72rem; color:rgba(255,255,255,0.4); }
        .ep-dialog-kv-val { font-size:0.88rem; font-weight:600; color:#fff; }

        .ep-dialog-alert { padding:0.7rem 0.9rem; border-radius:12px; background:rgba(255,159,67,0.1); border:1px solid rgba(255,159,67,0.22); color:#ffb86b; font-size:0.82rem; display:flex; align-items:center; gap:0.55rem; }

        .ep-dialog-section { display:flex; flex-direction:column; gap:0.6rem; padding-top:0.9rem; border-top:1px solid rgba(255,255,255,0.06); }
        .ep-dialog-section-title { font-size:0.78rem; font-weight:700; text-transform:uppercase; letter-spacing:0.07em; color:rgba(255,255,255,0.4); }
        .ep-dialog-split-info { display:flex; flex-direction:column; gap:0.3rem; }
        .ep-dialog-logs { display:flex; flex-direction:column; gap:0.45rem; }
        .ep-dialog-log-item { padding:0.65rem 0.8rem; border-radius:10px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.05); display:flex; flex-direction:column; gap:0.2rem; font-size:0.8rem; }
        .ep-dialog-log-item strong { color:rgba(255,255,255,0.75); }
        .ep-dialog-log-item span { color:rgba(255,255,255,0.42); }
        .ep-link-btn { background:none; border:none; color:#6c5ce7; font-size:0.8rem; font-weight:600; cursor:pointer; padding:0; font-family:'DM Sans',sans-serif; }

        /* Chat in dialog */
        .ep-chat-messages { max-height:180px; overflow-y:auto; background:rgba(12,12,24,0.5); border:1px solid rgba(255,255,255,0.06); border-radius:12px; padding:0.75rem; display:flex; flex-direction:column; gap:0.55rem; }
        .ep-chat-msg { display:flex; flex-direction:column; gap:0.1rem; }
        .ep-chat-user { font-size:0.75rem; font-weight:700; color:rgba(255,255,255,0.65); }
        .ep-chat-user-self { color:#8bd1ff; }
        .ep-chat-text { font-size:0.83rem; color:rgba(255,255,255,0.8); }
        .ep-chat-time { font-size:0.68rem; color:rgba(255,255,255,0.3); }
        .ep-chat-composer { display:flex; gap:0.5rem; }
        .ep-chat-composer input { flex:1; padding:0.55em 0.85em; border-radius:9px; border:1px solid rgba(255,255,255,0.1); background:rgba(255,255,255,0.04); color:#fff; font-size:0.85rem; font-family:'DM Sans',sans-serif; outline:none; }
        .ep-chat-composer input:focus { border-color:rgba(108,92,231,0.5); }
        .ep-chat-composer button { padding:0.52em 1em; border-radius:9px; border:none; background:#6c5ce7; color:#fff; font-size:0.82rem; font-weight:700; cursor:pointer; font-family:'DM Sans',sans-serif; }
        .ep-chat-composer button:disabled { opacity:0.45; cursor:not-allowed; }

        /* Dialog actions */
        .ep-dialog-actions { display:flex; gap:0.5rem; flex-wrap:wrap; padding-top:0.9rem; border-top:1px solid rgba(255,255,255,0.06); }
        .ep-action-btn { display:flex; align-items:center; gap:0.4rem; padding:0.52em 1.1em; border-radius:9px; font-size:0.82rem; font-weight:700; cursor:pointer; font-family:'DM Sans',sans-serif; border:none; transition:opacity 0.15s,transform 0.12s; }
        .ep-action-btn:hover { opacity:0.88; transform:translateY(-1px); }
        .ep-action-settle { background:#2dcc8e; color:#fff; }
        .ep-action-edit { background:rgba(108,92,231,0.18); color:#a29bfe; border:1px solid rgba(108,92,231,0.3) !important; }
        .ep-action-flag { background:rgba(255,159,67,0.15); color:#ffb86b; border:1px solid rgba(255,159,67,0.25) !important; }
        .ep-action-unflag { background:rgba(255,255,255,0.06); color:rgba(255,255,255,0.65); border:1px solid rgba(255,255,255,0.1) !important; }
        .ep-action-delete { background:rgba(255,92,92,0.12); color:#ff7a7a; border:1px solid rgba(255,92,92,0.22) !important; margin-left:auto; }

        /* Add/Edit expense modal */
        .ep-modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.6); display:flex; align-items:center; justify-content:center; z-index:600; padding:1rem; backdrop-filter:blur(4px); }
        .ep-modal { background:linear-gradient(180deg,#1e1e30,#18182a); border:1px solid rgba(255,255,255,0.1); border-radius:20px; padding:1.5rem; width:100%; max-width:500px; max-height:90vh; overflow-y:auto; box-shadow:0 24px 60px rgba(0,0,0,0.55); display:flex; flex-direction:column; gap:1rem; }
        .ep-modal-head { display:flex; align-items:center; justify-content:space-between; }
        .ep-modal-head h2 { margin:0; font-size:1.15rem; font-weight:700; color:#fff; }
        .ep-modal input,.ep-modal select { width:100%; padding:0.6em 0.85em; border-radius:9px; border:1px solid rgba(255,255,255,0.1); background:rgba(255,255,255,0.05); color:#fff; font-size:0.88rem; font-family:'DM Sans',sans-serif; outline:none; box-sizing:border-box; }
        .ep-modal input:focus,.ep-modal select:focus { border-color:rgba(108,92,231,0.5); }
        .ep-modal select option { background:#1b1b2e; }
        .ep-modal label { font-size:0.78rem; color:rgba(255,255,255,0.52); font-weight:600; display:block; margin-bottom:0.3rem; }
        .ep-modal .ep-field { display:flex; flex-direction:column; gap:0.3rem; }
        .ep-modal .ep-row2 { display:grid; grid-template-columns:1fr 1fr; gap:0.6rem; }
        .ep-modal .ep-radios { display:flex; gap:0.75rem; }
        .ep-modal .ep-radio-label { display:flex; align-items:center; gap:0.4rem; font-size:0.83rem; color:rgba(255,255,255,0.72); cursor:pointer; }
        .ep-modal .ep-checkbox-label { display:flex; align-items:center; gap:0.45rem; font-size:0.83rem; color:rgba(255,255,255,0.72); cursor:pointer; }
        .ep-splits-box { background:rgba(12,12,24,0.5); border:1px solid rgba(255,255,255,0.07); border-radius:10px; padding:0.8rem; display:flex; flex-direction:column; gap:0.5rem; }
        .ep-splits-title { font-size:0.72rem; font-weight:700; text-transform:uppercase; letter-spacing:0.06em; color:rgba(255,255,255,0.4); }
        .ep-split-row { display:flex; align-items:center; gap:0.6rem; }
        .ep-split-name { flex:1; font-size:0.82rem; color:rgba(255,255,255,0.78); }
        .ep-split-row input { width:88px; flex:none; text-align:right; padding:0.35em 0.5em !important; }
        .ep-splits-rem { text-align:center; font-size:0.76rem; font-weight:700; padding:0.35rem; border-radius:7px; margin-top:0.2rem; }
        .ep-splits-ok { background:rgba(45,204,142,0.1); color:#2dcc8e; }
        .ep-splits-off { background:rgba(255,92,92,0.1); color:#ff7a7a; }
        .ep-modal-actions { display:flex; gap:0.5rem; }
        .ep-modal-submit { flex:1; padding:0.65em; border-radius:10px; border:none; background:#6c5ce7; color:#fff; font-size:0.9rem; font-weight:700; cursor:pointer; font-family:'DM Sans',sans-serif; }
        .ep-modal-cancel { padding:0.65em 1.1em; border-radius:10px; border:1px solid rgba(255,255,255,0.1); background:transparent; color:rgba(255,255,255,0.65); font-size:0.9rem; cursor:pointer; font-family:'DM Sans',sans-serif; }

        /* Light mode */
        .app.light-mode .ep-hero-title { color:#1a1040; }
        .app.light-mode .ep-eyebrow,.app.light-mode .ep-hero-sub { color:rgba(47,32,80,0.48); }
        .app.light-mode .ep-stat,.app.light-mode .ep-main-card { background:#fff; border-color:rgba(108,92,231,0.1); box-shadow:0 2px 10px rgba(108,92,231,0.05); }
        .app.light-mode .ep-stat-label,.app.light-mode .ep-stat-note { color:rgba(47,32,80,0.48); }
        .app.light-mode .ep-stat-value { color:#1a1040; }
        .app.light-mode .ep-toolbar-title,.app.light-mode .ep-row-name { color:#1a1040; }
        .app.light-mode .ep-toolbar-sub,.app.light-mode .ep-row-meta,.app.light-mode .ep-row-amount-note { color:rgba(47,32,80,0.42); }
        .app.light-mode .ep-row-amount { color:#1a1040; }
        .app.light-mode .ep-filter-chip { background:rgba(108,92,231,0.06); border-color:rgba(108,92,231,0.12); color:rgba(47,32,80,0.65); }
        .app.light-mode .ep-filter-chip-active { background:rgba(108,92,231,0.16); border-color:rgba(108,92,231,0.4); color:#1a1040; }
        .app.light-mode .ep-row { border-color:rgba(108,92,231,0.06); }
        .app.light-mode .ep-row:hover { background:rgba(108,92,231,0.03); }
        .app.light-mode .ep-toolbar { border-color:rgba(108,92,231,0.08); }
        .app.light-mode .ep-btn-edit-sm { background:rgba(108,92,231,0.06); border-color:rgba(108,92,231,0.14); color:rgba(47,32,80,0.75); }
        .app.light-mode .ep-dialog,.app.light-mode .ep-modal { background:linear-gradient(180deg,#fff,#f7f4ff); border-color:rgba(108,92,231,0.14); }
        .app.light-mode .ep-dialog-title,.app.light-mode .ep-modal-head h2 { color:#1a1040; }
        .app.light-mode .ep-dialog-kv { background:rgba(108,92,231,0.04); border-color:rgba(108,92,231,0.08); }
        .app.light-mode .ep-dialog-kv-label { color:rgba(47,32,80,0.46); }
        .app.light-mode .ep-dialog-kv-val { color:#1a1040; }
        .app.light-mode .ep-dialog-eyebrow { color:rgba(47,32,80,0.42); }
        .app.light-mode .ep-dialog-section { border-color:rgba(108,92,231,0.08); }
        .app.light-mode .ep-dialog-actions { border-color:rgba(108,92,231,0.08); }
        .app.light-mode .ep-dialog-section-title { color:rgba(47,32,80,0.42); }
        .app.light-mode .ep-chat-messages { background:rgba(108,92,231,0.03); border-color:rgba(108,92,231,0.1); }
        .app.light-mode .ep-chat-text { color:rgba(47,32,80,0.8); }
        .app.light-mode .ep-chat-user { color:rgba(47,32,80,0.65); }
        .app.light-mode .ep-modal input,.app.light-mode .ep-modal select { background:rgba(108,92,231,0.05); border-color:rgba(108,92,231,0.15); color:#1a1040; }
        .app.light-mode .ep-modal label { color:rgba(47,32,80,0.55); }
        .app.light-mode .ep-modal .ep-radio-label,.app.light-mode .ep-modal .ep-checkbox-label { color:rgba(47,32,80,0.72); }
        .app.light-mode .ep-load-more { border-color:rgba(108,92,231,0.06); }
        .app.light-mode .ep-btn-load { color:#000; }

        @media(max-width:960px) { .ep-stats{grid-template-columns:1fr 1fr} .ep-row-right{flex-direction:column;align-items:flex-end;gap:0.3rem} }
        @media(max-width:640px) { .ep-stats{grid-template-columns:1fr} .ep-hero{flex-direction:column} .ep-row-actions{display:none} .ep-dialog-meta-grid{grid-template-columns:1fr 1fr} }
      `}</style>

      {/* Dialog */}
      {dialogExpense && <ExpenseDialog exp={dialogExpense} />}

      {/* Hero */}
      <div className="ep-hero">
        <div>
          <h2 className="ep-hero-title">Expenses</h2>
          <p className="ep-hero-sub">
            {new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' }).format(new Date())}
            <span />
            {expenseStats.expenseCount} expenses logged
          </p>
        </div>
        <div className="ep-hero-actions">
          <button className="ep-btn-clear" onClick={() => setExpenseDetailView(null)}>Clear selection</button>
          <button className="ep-btn-add" onClick={() => { resetExpenseForm(); setEditingExpense(null); setShowExpenseModalState(true) }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add expense
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="ep-stats">
        <div className="ep-stat">
          <div className="ep-stat-body">
            <span className="ep-stat-label">Total spent</span>
            <strong className="ep-stat-value">{fmt(expenseStats.totalLogged)}</strong>
            <span className="ep-stat-note">Across personal, group, and recurring items</span>
          </div>
          <div className="ep-stat-icon" style={{ background: 'rgba(108,92,231,0.16)' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a29bfe" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          </div>
        </div>
        <div className="ep-stat">
          <div className="ep-stat-body">
            <span className="ep-stat-label">You owe</span>
            <strong className="ep-stat-value red">{fmt(expenseStats.youOwe)}</strong>
            <span className="ep-stat-note">Outstanding balances waiting on you</span>
          </div>
          <div className="ep-stat-icon" style={{ background: 'rgba(255,92,92,0.13)' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ff7a7a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
        </div>
        <div className="ep-stat">
          <div className="ep-stat-body">
            <span className="ep-stat-label">Owed to you</span>
            <strong className="ep-stat-value green">{fmt(expenseStats.owedToYou)}</strong>
            <span className="ep-stat-note">Incoming settlements from friends &amp; groups</span>
          </div>
          <div className="ep-stat-icon" style={{ background: 'rgba(45,204,142,0.13)' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2dcc8e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
          </div>
        </div>
      </div>

      {/* Main expenses card */}
      <div className="ep-main-card">
        <div className="ep-toolbar">
          <div className="ep-toolbar-left">
            <p className="ep-toolbar-title">All expenses</p>
            <p className="ep-toolbar-sub">Select an expense to inspect, split, and edit details.</p>
          </div>
          <div className="ep-filters">
            {expenseFilterTabs.map((tab: any) => (
              <button
                key={tab.key}
                className={expenseViewFilter === tab.key ? 'ep-filter-chip ep-filter-chip-active' : 'ep-filter-chip'}
                onClick={() => setExpenseViewFilter(tab.key)}
              >
                {tab.label === 'All' ? `All ${tab.count}` : `${tab.label} ${tab.count}`}
              </button>
            ))}
          </div>
        </div>

        <div className="ep-list">
          {visibleExpenses.length === 0 ? (
            <div className="ep-empty">
              <div className="ep-empty-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="9" y1="7" x2="15" y2="7"/><line x1="9" y1="11" x2="15" y2="11"/><line x1="9" y1="15" x2="12" y2="15"/></svg>
              </div>
              <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>No expenses in this view.</p>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)' }}>Try another filter or add a new expense.</p>
            </div>
          ) : (
            visibleExpenses.map((exp: any) => {
              const cat = getExpenseCategory(exp)
              const color = getCatColor(cat)
              const isGroup = exp.type === 'GROUP'
              const participants = exp.participantIds || []
              const payer = payerName(exp.payerId)
              const isRecurring = !!(exp.isRecurring || exp.recurring)
              const isFlagged = (exp.flaggedBy || []).length > 0
              const share = userShare(exp)
              const youOwe = isGroup && exp.payerId !== currentUserId && participants.includes(currentUserId) && !exp.settledByUser?.[currentUserId]
              const owedToYou = isGroup && exp.payerId === currentUserId && (participants || []).length > 1 && exp.expenseStatus !== 'Settled'
              const groupName = exp.groupId ? (groups.find((g: any) => g.id === exp.groupId)?.name || 'Group') : null

              return (
                <div key={exp.id} className="ep-row" onClick={() => openDialog(exp)}>
                  <div className="ep-row-icon" style={{ background: color + '22', color }}>
                    {(exp.description || 'E').slice(0, 1).toUpperCase()}
                  </div>
                  <div className="ep-row-main">
                    <div className="ep-row-name">
                      {exp.description}
                      {isFlagged && <span className="ep-pill-flag">Flagged {(exp.flaggedBy || []).length}</span>}
                      {isRecurring && <span className="ep-pill-recurring">Recurring</span>}
                    </div>
                    <div className="ep-row-meta">
                      <span>{isGroup ? groupName || 'Group expense' : 'Personal expense'}</span>
                      <span className="ep-row-meta-dot" />
                      <span>{payer}</span>
                      <span className="ep-row-meta-dot" />
                      <span>{exp.createdAt ? new Date(exp.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}</span>
                      {isGroup && (
                        <>
                          <span className="ep-row-meta-dot" />
                          <span>{shareLabel(exp)}</span>
                        </>
                      )}
                      {!isGroup && <><span className="ep-row-meta-dot" /><span>No bill attached</span></>}
                    </div>
                    {owedToYou && exp.expenseStatus !== 'Settled' && (
                      <div style={{ fontSize: '0.75rem', marginTop: '0.2rem', color: '#ff7a7a' }}>
                        Owed by Others: <span style={{ fontWeight: 700 }}>{fmt(othersOweTotal(exp))}</span>
                      </div>
                    )}
                  </div>
                  <div className="ep-row-right">
                    <div>
                      <div className="ep-row-amount">{fmt(isGroup ? share : exp.amount)}</div>
                      <div className="ep-row-amount-note">{isGroup ? 'your share' : 'You paid'}</div>
                      {youOwe && <div className="ep-row-amount-owe">You owe {fmt(share)}</div>}
                      {owedToYou && <div className="ep-row-amount-owed">+{fmt(othersOweTotal(exp))}</div>}
                    </div>
                    <div className="ep-row-actions" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                      <button className="ep-btn-dots" onClick={() => openDialog(exp)}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>
                      </button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {filteredExpenseFeed.length > expensesPage * EXPENSES_PAGE_SIZE && (
          <div className="ep-load-more">
            <button className="ep-btn-load" onClick={() => setExpensesPage(expensesPage + 1)}>Load more</button>
          </div>
        )}
      </div>

      {/* Add/Edit Expense Modal */}
      {showExpenseModal && (
        <div className="ep-modal-overlay" onClick={() => { setShowExpenseModalState(false); setEditingExpense(null); if (!editingExpense) resetExpenseForm() }}>
          <div className="ep-modal" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <div className="ep-modal-head">
              <h2>{editingExpense ? 'Edit Expense' : 'Add Expense'}</h2>
              <button className="ep-dialog-close" onClick={() => { setShowExpenseModalState(false); setEditingExpense(null); if (!editingExpense) resetExpenseForm() }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <form onSubmit={(e: React.FormEvent) => { props.handleSaveExpense(e); setShowExpenseModalState(false) }} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div className="ep-field">
                <label>Description</label>
                <input type="text" placeholder="e.g. Dinner at restaurant" value={expenseDescription} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setExpenseDescription(e.target.value)} required />
              </div>
              <div className="ep-row2">
                <div className="ep-field">
                  <label>Amount</label>
                  <input type="number" min="0" step="0.01" placeholder="0.00" value={expenseAmount} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setExpenseAmount(e.target.value)} required />
                </div>
                <div className="ep-field">
                  <label>Currency</label>
                  <select value={expenseCurrency} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setExpenseCurrency(e.target.value)}>
                    <option value="INR">INR ₹</option>
                    <option value="USD">USD $</option>
                    <option value="EUR">EUR €</option>
                    <option value="GBP">GBP £</option>
                    <option value="JPY">JPY ¥</option>
                  </select>
                </div>
              </div>
              <div className="ep-field">
                <label>Category</label>
                <select value={expenseTag} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setExpenseTag(e.target.value)}>
                  {['groceries','rent','transport','travel','insurance','investments','utilities','subscriptions','health','education','childcare','pets','taxes','gifts','charity','maintenance','loans','fees','entertainment','shopping','miscellaneous'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="ep-field">
                <label>Type</label>
                <div className="ep-radios">
                  <label className="ep-radio-label"><input type="radio" name="expType" checked={!isGroupExpense && !isFriendExpense} onChange={() => { setIsGroupExpense(false); setIsFriendExpense(false) }} /> Personal</label>
                  <label className="ep-radio-label"><input type="radio" name="expType" checked={isFriendExpense && !isGroupExpense} onChange={() => { setIsFriendExpense(true); setIsGroupExpense(false) }} /> Friend</label>
                  <label className="ep-radio-label"><input type="radio" name="expType" checked={isGroupExpense} onChange={() => { setIsGroupExpense(true); setIsFriendExpense(false) }} /> Group</label>
                </div>
              </div>
              {isFriendExpense && !isGroupExpense && (
                <div className="ep-row2">
                  <div className="ep-field">
                    <label>Friend</label>
                    <select value={selectedFriendId} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedFriendId(e.target.value)} required>
                      <option value="">Choose friend</option>
                      {currentFriends.map((f: any) => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                  </div>
                  {selectedFriendId && (
                    <div className="ep-field">
                      <label>Paid by</label>
                      <select value={expensePayerId || currentUserId} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setExpensePayerId(e.target.value)}>
                        <option value={currentUserId}>{currentUser?.name || 'You'}</option>
                        <option value={selectedFriendId}>{users.find((u: any) => u.id === selectedFriendId)?.name || 'Friend'}</option>
                      </select>
                    </div>
                  )}
                </div>
              )}
              {isGroupExpense && (
                <div className="ep-row2">
                  <div className="ep-field">
                    <label>Group</label>
                    <select value={selectedGroupId} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedGroupId(e.target.value)} required>
                      <option value="">Select group</option>
                      {filteredGroups.map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                  </div>
                  {selectedGroupId && (
                    <div className="ep-field">
                      <label>Paid by</label>
                      <select value={expensePayerId || currentUserId} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setExpensePayerId(e.target.value)}>
                        {(props.groups?.find((g: any) => g.id === selectedGroupId)?.memberIds || []).map((mid: string) => {
                          const m = users.find((u: any) => u.id === mid)
                          return <option key={mid} value={mid}>{m?.name || mid}{mid === currentUserId ? ' (You)' : ''}</option>
                        })}
                      </select>
                    </div>
                  )}
                </div>
              )}
              {(isGroupExpense || isFriendExpense) && (
                <div className="ep-field">
                  <label>Split method</label>
                  <select value={splitMode} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => { setSplitMode(e.target.value); setCustomSplits({}) }}>
                    <option value="equal">Equal split</option>
                    <option value="unequal">Unequal amounts</option>
                    <option value="percentage">By percentage</option>
                  </select>
                </div>
              )}
              {splitMode !== 'equal' && (isGroupExpense || isFriendExpense) && (
                <div className="ep-splits-box">
                  <div className="ep-splits-title">{splitMode === 'percentage' ? 'Enter percentages' : 'Enter amounts'}</div>
                  {(isGroupExpense
                    ? (props.groups?.find((g: any) => g.id === selectedGroupId)?.memberIds || [])
                    : [currentUserId, selectedFriendId]
                  ).filter(Boolean).map((mid: string) => {
                    const m = users.find((u: any) => u.id === mid)
                    return (
                      <div key={mid} className="ep-split-row">
                        <span className="ep-split-name">{mid === currentUserId ? 'You' : m?.name || mid}</span>
                        <input type="number" min="0" step="0.01" placeholder="0" value={customSplits[mid] || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomSplits((p: any) => ({ ...p, [mid]: e.target.value }))} />
                        <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', width: 16 }}>{splitMode === 'percentage' ? '%' : sym}</span>
                      </div>
                    )
                  })}
                  <div className={`ep-splits-rem ${(splitMode === 'percentage' ? props.remainingPercentage() : props.remainingAmount()) === 0 ? 'ep-splits-ok' : 'ep-splits-off'}`}>
                    {splitMode === 'percentage'
                      ? props.remainingPercentage() === 0 ? '✓ 100%' : `${props.remainingPercentage().toFixed(1)}% remaining`
                      : props.remainingAmount() === 0 ? '✓ Balanced' : `${sym}${Math.abs(props.remainingAmount()).toFixed(2)} ${props.remainingAmount() > 0 ? 'remaining' : 'over'}`}
                  </div>
                </div>
              )}
              <div className="ep-field">
                <label className="ep-checkbox-label">
                  <input type="checkbox" checked={isRecurringExpense} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIsRecurringExpense(e.target.checked)} />
                  Recurring expense
                </label>
              </div>
              {isRecurringExpense && (
                <>
                  <div className="ep-row2">
                    <div className="ep-field">
                      <label>Start date</label>
                      <input type="date" value={recurrenceStartDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRecurrenceStartDate(e.target.value)} required={isRecurringExpense} />
                    </div>
                    <div className="ep-field">
                      <label>Frequency</label>
                      <select value={recurrenceType} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => { setRecurrenceType(e.target.value as any); if (e.target.value !== 'CUSTOM') setRecurrenceInterval('1') }}>
                        <option value="DAILY">Daily</option>
                        <option value="WEEKLY">Weekly</option>
                        <option value="MONTHLY">Monthly</option>
                        <option value="YEARLY">Yearly</option>
                        <option value="CUSTOM">Custom</option>
                      </select>
                    </div>
                  </div>
                  <div className="ep-row2">
                    {recurrenceType === 'CUSTOM' && (
                      <div className="ep-field">
                        <label>Every N days</label>
                        <input type="number" min="1" value={recurrenceInterval} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRecurrenceInterval(e.target.value)} />
                      </div>
                    )}
                    <div className="ep-field">
                      <label>End date (optional)</label>
                      <input type="date" value={recurrenceEndDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRecurrenceEndDate(e.target.value)} />
                    </div>
                  </div>
                </>
              )}
              <div className="ep-field">
                <label>Bill image URL (optional)</label>
                <input type="url" placeholder="https://..." value={props.expenseImageUrl || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => props.setExpenseImageUrl(e.target.value)} />
              </div>
              <div className="ep-modal-actions">
                <button type="submit" className="ep-modal-submit">{editingExpense ? 'Update expense' : 'Add expense'}</button>
                <button type="button" className="ep-modal-cancel" onClick={() => { setShowExpenseModalState(false); setEditingExpense(null); resetExpenseForm() }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
