export type FriendsPageProps = Record<string, any>

// Consistent avatar colors per initials
const AVATAR_COLORS = [
  '#6c5ce7','#3b82f6','#d946b1','#34d399','#f59e0b',
  '#ef4444','#8b5cf6','#06b6d4','#10b981','#f97316',
]
function avatarColor(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h)
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}
function initials(name: string) {
  return name.split(' ').filter(Boolean).slice(0,2).map((p: string) => p[0].toUpperCase()).join('')
}

export default function FriendsPage(props: FriendsPageProps) {
  const {
    currentFriends,
    friendInvitations,
    pendingInvitations,
    friendBalances,
    users,
    currentUser,
    currentUserId,
    defaultCurrency,
    convertINR,
    friendSearch,
    setFriendSearch,
    friendAddError,
    friendAddSuccess,
    friendNameToAdd,
    setFriendNameToAdd,
    friendEmailToAdd,
    setFriendEmailToAdd,
    editingFriend,
    editFriendName,
    setEditFriendName,
    editFriendEmail,
    setEditFriendEmail,
    handleAddFriend,
    handleAcceptFriendInvitation,
    handleDeclineFriendInvitation,
    handleUpdateFriend,
    startEditFriend,
    handleRemoveFriend,
    handleRemindFriend,
    setFriendDetailView,
    setExpenseDetailView,
    expenseWorkspacePool,
    isExpenseUnsettledForCurrentUser,
    renderWorkspaceDashboard,
    resetExpenseForm,
    setEditingExpense,
    setIsFriendExpense,
    setIsGroupExpense,
    setSelectedFriendId,
    setShowExpenseModal,
    friendDetailView,
    getCurrencySymbol,
    setEditingFriend,
  } = props

  const sym = getCurrencySymbol(defaultCurrency)
  const fmt = (n: number) => `${sym}${convertINR(Math.abs(n), defaultCurrency).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  // ── Workspace detail view ──
  if (friendDetailView) {
    const friend = users.find((u: any) => u.id === friendDetailView) || null
    const friendPairExpenses = expenseWorkspacePool
      .filter((e: any) => {
        const p = e.participantIds || []
        return e.type === 'GROUP' && p.length === 2 && p.includes(currentUserId) && p.includes(friendDetailView)
      })
      .sort((a: any, b: any) => (b.createdAt ? new Date(b.createdAt).getTime() : 0) - (a.createdAt ? new Date(a.createdAt).getTime() : 0))
    const unsettledCount = friendPairExpenses.filter((e: any) => isExpenseUnsettledForCurrentUser(e)).length

    return renderWorkspaceDashboard({
      title: friend ? `${currentUser?.name || 'You'} & ${friend.name}` : 'Friend workspace',
      subtitle: `${friendPairExpenses.length} shared expenses · ${unsettledCount} unsettled`,
      breadcrumb: 'Finwise / Friends / Workspace',
      expenses: friendPairExpenses,
      participants: [currentUser, friend].filter(Boolean),
      onBack: () => { setFriendDetailView(null); setExpenseDetailView(null) },
      onAddExpense: () => {
        resetExpenseForm(); setEditingExpense(null)
        setIsFriendExpense(true); setIsGroupExpense(false)
        setSelectedFriendId(friendDetailView); setShowExpenseModal(true)
      },
      emptyTitle: 'No shared expenses yet.',
      emptyBody: `Add an expense to start tracking with ${friend?.name || 'this friend'}.`,
      scopeLabel: friend ? `Balances with ${friend.name}` : 'Balances in this workspace',
      mode: 'friend',
      primaryParticipantId: friend?.id,
      accentLabel: friend ? `${friend.name} Spent` : 'Friend Spent',
    })
  }

  // ── Total shared for a friend across all shared expenses ──
  function totalShared(friendId: string): number {
    return expenseWorkspacePool
      .filter((e: any) => {
        const p = e.participantIds || []
        return e.type === 'GROUP' && p.includes(currentUserId) && p.includes(friendId)
      })
      .reduce((s: number, e: any) => s + e.amount, 0)
  }

  return (
    <div className="fp-shell">

      {/* ── Page header ── */}
      <div className="fp-page-header">
        <div className="fp-page-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
            strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        </div>
        <div>
          <h2 className="fp-page-title">Friends</h2>
          <p className="fp-page-sub">Manage your friends and settle up easily.</p>
        </div>
      </div>

      {/* ── Top split: pending invitations + add friend ── */}
      <div className="fp-top-grid">

        {/* Pending invitations */}
        <section className="fp-card fp-invite-card">
          <div className="fp-card-head">
            <div className="fp-card-title-row">
              <h3>Pending invitations</h3>
              {friendInvitations.length > 0 && (
                <span className="fp-badge">{friendInvitations.length}</span>
              )}
            </div>
            <p className="fp-card-sub">People who can view, add, and share expenses with you.</p>
          </div>

          {friendInvitations.length === 0 ? (
            <div className="fp-empty-invites">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                strokeLinecap="round" strokeLinejoin="round" width="28" height="28" opacity="0.3">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 12 19.79 19.79 0 0 1 1.1 3.41 2 2 0 0 1 3.08 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
              <span>No pending invitations.</span>
            </div>
          ) : (
            <div className="fp-invite-list">
              {friendInvitations.map((inv: any) => {
                const inviter = users.find((u: any) => u.id === inv.inviterUserId)
                const name = inviter?.name || 'Someone'
                const email = inviter?.email || inv.inviteeEmail
                return (
                  <div key={inv.id} className="fp-invite-row">
                    <div className="fp-avatar" style={{ background: avatarColor(name) }}>
                      {initials(name)}
                    </div>
                    <div className="fp-invite-meta">
                      <strong>{name}</strong>
                      <span>{email}</span>
                    </div>
                    <div className="fp-invite-actions">
                      <button type="button" className="fp-btn-outline"
                        onClick={() => handleDeclineFriendInvitation(inv.id)}>
                        Decline
                      </button>
                      <button type="button" className="fp-btn-solid"
                        onClick={() => handleAcceptFriendInvitation(inv.id)}>
                        Accept
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {friendInvitations.length > 2 && (
            <button type="button" className="fp-view-all-link">
              View all invitations →
            </button>
          )}
        </section>

        {/* Add friend */}
        <section className="fp-card fp-add-card">
          <div className="fp-card-head">
            <h3>Add friend</h3>
            <p className="fp-card-sub">Search by name or email to add a friend.</p>
          </div>

          <form onSubmit={handleAddFriend} className="fp-add-form">
            <div className="fp-input-wrap">
              <span className="fp-input-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
                  strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </span>
              <input
                type="text"
                className="fp-input"
                placeholder="Full name"
                value={friendNameToAdd}
                onChange={(e: any) => setFriendNameToAdd(e.target.value)}
              />
            </div>
            <div className="fp-input-wrap">
              <span className="fp-input-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
                  strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
                  <rect x="2" y="4" width="20" height="16" rx="2"/>
                  <path d="m22 7-10 7L2 7"/>
                </svg>
              </span>
              <input
                type="email"
                className="fp-input"
                placeholder="Email address"
                value={friendEmailToAdd}
                onChange={(e: any) => setFriendEmailToAdd(e.target.value)}
                required
              />
            </div>
            <div className="fp-input-wrap">
              <span className="fp-input-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
                  strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </span>
              <input
                type="text"
                className="fp-input"
                placeholder="Add a message (optional)"
              />
            </div>
            {friendAddError && (
              <div className="fp-form-error">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="13" height="13"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {friendAddError}
              </div>
            )}
            {friendAddSuccess && (
              <div className="fp-form-success">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="13" height="13"><polyline points="20 6 9 17 4 12"/></svg>
                {friendAddSuccess}
              </div>
            )}
            <button type="submit" className="fp-send-btn">
              Send friend request
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </form>
        </section>
      </div>

      {/* ── Edit friend inline panel ── */}
      {editingFriend && (
        <section className="fp-card">
          <div className="fp-card-head">
            <h3>Edit friend</h3>
          </div>
          <form onSubmit={handleUpdateFriend} className="fp-edit-form">
            <div className="fp-input-wrap">
              <input type="text" className="fp-input" value={editFriendName}
                onChange={(e: any) => setEditFriendName(e.target.value)} required placeholder="Name" />
            </div>
            <div className="fp-input-wrap">
              <input type="email" className="fp-input" value={editFriendEmail}
                onChange={(e: any) => setEditFriendEmail(e.target.value)} required placeholder="Email" />
            </div>
            <div className="fp-edit-actions">
              <button type="submit" className="fp-btn-solid">Save changes</button>
              <button type="button" className="fp-btn-outline" onClick={() => setEditingFriend(null)}>Cancel</button>
            </div>
          </form>
        </section>
      )}

      {/* ── My friends table ── */}
      <section className="fp-card fp-friends-card">
        <div className="fp-friends-header">
          <div>
            <h3>My friends</h3>
            <p className="fp-card-sub">Your friends on Finwise.</p>
          </div>
          <div className="fp-friends-controls">
            <div className="fp-search-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
                strokeLinecap="round" strokeLinejoin="round" width="15" height="15"
                className="fp-search-icon">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                type="text"
                className="fp-search-input"
                placeholder="Search friends..."
                value={friendSearch}
                onChange={(e: any) => setFriendSearch(e.target.value)}
              />
            </div>
            <div className="fp-filter-select-wrap">
              <select className="fp-filter-select">
                <option>All friends</option>
                <option>Owes you</option>
                <option>You owe</option>
                <option>Settled</option>
              </select>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" width="13" height="13"
                className="fp-select-arrow">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </div>
          </div>
        </div>

        {currentFriends.length === 0 ? (
          <div className="fp-empty-friends">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
              strokeLinecap="round" strokeLinejoin="round" width="40" height="40" opacity="0.25">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <strong>No friends yet</strong>
            <span>Use the form above to send your first friend request.</span>
          </div>
        ) : (
          <>
            {/* Table header */}
            <div className="fp-table-head">
              <span className="fp-th fp-th-friend">Friend</span>
              <span className="fp-th">Total shared</span>
              <span className="fp-th">You owe</span>
              <span className="fp-th">Owes you</span>
              <span className="fp-th fp-th-actions" />
            </div>

            {/* Rows */}
            <div className="fp-table-body">
              {currentFriends.map((friend: any) => {
                const bal = Number(friendBalances[friend.id] ?? 0)
                const youOwe = bal < 0 ? Math.abs(bal) : 0
                const owesYou = bal > 0 ? bal : 0
                const shared = totalShared(friend.id)
                const col = avatarColor(friend.name)

                return (
                  <div key={friend.id} className="fp-table-row"
                    onClick={() => { setFriendDetailView(friend.id); setExpenseDetailView(null) }}>
                    {/* Friend identity */}
                    <div className="fp-td fp-td-friend">
                      <div className="fp-avatar fp-avatar-lg" style={{ background: col }}>
                        {initials(friend.name)}
                      </div>
                      <div className="fp-friend-info">
                        <strong>{friend.name}</strong>
                        <span>{friend.email}</span>
                      </div>
                    </div>

                    {/* Total shared */}
                    <div className="fp-td fp-td-amount">
                      <span className="fp-col-label">Total shared</span>
                      <strong>{fmt(shared)}</strong>
                    </div>

                    {/* You owe */}
                    <div className="fp-td fp-td-amount">
                      <span className="fp-col-label">You owe</span>
                      <strong className={youOwe > 0 ? 'fp-green' : 'fp-muted'}>{fmt(youOwe)}</strong>
                    </div>

                    {/* Owes you */}
                    <div className="fp-td fp-td-amount">
                      <span className="fp-col-label">Owes you</span>
                      <strong className={owesYou > 0 ? 'fp-red' : 'fp-muted'}>{fmt(owesYou)}</strong>
                    </div>

                    {/* Actions */}
                    <div className="fp-td fp-td-actions" onClick={(e: any) => e.stopPropagation()}>
                      <button type="button" className="fp-view-btn"
                        onClick={() => { setFriendDetailView(friend.id); setExpenseDetailView(null) }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
                          strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                          <rect x="2" y="3" width="20" height="14" rx="2"/>
                          <line x1="8" y1="21" x2="16" y2="21"/>
                          <line x1="12" y1="17" x2="12" y2="21"/>
                        </svg>
                        View
                      </button>
                      <div className="fp-more-menu">
                        <button type="button" className="fp-more-btn" title="More options"
                          onClick={(e: any) => {
                            e.stopPropagation()
                            const menu = e.currentTarget.nextElementSibling as HTMLElement | null
                            if (menu) menu.classList.toggle('fp-dropdown-open')
                          }}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                            strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                            <circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>
                          </svg>
                        </button>
                        <div className="fp-dropdown">
                          <button type="button" className="fp-dropdown-item"
                            onClick={() => startEditFriend(friend)}>Edit</button>
                          {bal !== 0 && (
                            <button type="button" className="fp-dropdown-item"
                              onClick={() => handleRemindFriend(friend.id)}>Remind</button>
                          )}
                          <button type="button" className="fp-dropdown-item fp-dropdown-danger"
                            onClick={() => handleRemoveFriend(friend.id)}>Remove</button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Load more */}
            {currentFriends.length > 5 && (
              <div className="fp-load-more">
                <button type="button" className="fp-load-more-btn">
                  Load more
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* ── Sent requests ── */}
      {pendingInvitations.filter((inv: any) => inv.type === 'FRIEND').length > 0 && (
        <section className="fp-card">
          <div className="fp-card-head">
            <h3>Sent requests</h3>
            <p className="fp-card-sub">Awaiting response from these people.</p>
          </div>
          <div className="fp-invite-list">
            {pendingInvitations.filter((inv: any) => inv.type === 'FRIEND').map((inv: any) => {
              const name = inv.inviteeName || inv.inviteeEmail
              return (
                <div key={inv.id} className="fp-invite-row fp-sent-row">
                  <div className="fp-avatar" style={{ background: avatarColor(name) }}>
                    {initials(name)}
                  </div>
                  <div className="fp-invite-meta">
                    <strong>{name}</strong>
                    <span>{inv.inviteeEmail}</span>
                  </div>
                  <span className="fp-awaiting-badge">Awaiting response</span>
                </div>
              )
            })}
          </div>
        </section>
      )}

      <style>{`
        .fp-shell {
          display: flex;
          flex-direction: column;
          gap: 1.1rem;
        }

        /* ── Page header ── */
        .fp-page-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.25rem 0 0.5rem;
        }
        .fp-page-icon {
          width: 52px;
          height: 52px;
          border-radius: 16px;
          background: rgba(108,92,231,0.18);
          color: #c8b1ff;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .fp-page-title {
          margin: 0 0 0.2rem;
          font-size: 1.55rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: #fff;
        }
        .fp-page-sub {
          margin: 0;
          font-size: 0.86rem;
          color: rgba(255,255,255,0.52);
        }

        /* ── Cards ── */
        .fp-card {
          background: linear-gradient(180deg, rgba(25,24,42,0.98) 0%, rgba(18,17,34,0.98) 100%);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 16px;
          padding: 1.4rem 1.5rem;
        }
        .fp-card-head { margin-bottom: 1.1rem; }
        .fp-card-title-row {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          margin-bottom: 0.3rem;
        }
        .fp-card-title-row h3,
        .fp-card-head h3 {
          margin: 0;
          font-size: 1rem;
          font-weight: 700;
          color: #fff;
        }
        .fp-card-sub {
          margin: 0;
          font-size: 0.82rem;
          color: rgba(255,255,255,0.5);
        }
        .fp-badge {
          background: rgba(108,92,231,0.28);
          color: #c8b1ff;
          border: 1px solid rgba(108,92,231,0.4);
          border-radius: 999px;
          font-size: 0.72rem;
          font-weight: 700;
          padding: 0.1em 0.55em;
          min-width: 20px;
          text-align: center;
        }

        /* ── Top grid ── */
        .fp-top-grid {
          display: grid;
          grid-template-columns: minmax(0,1fr) minmax(320px,0.85fr);
          gap: 1rem;
        }

        /* ── Invitations ── */
        .fp-invite-list { display: flex; flex-direction: column; gap: 0.85rem; }
        .fp-invite-row {
          display: flex;
          align-items: center;
          gap: 0.9rem;
          padding: 0.5rem 0;
        }
        .fp-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8rem;
          font-weight: 700;
          color: #fff;
          flex-shrink: 0;
          letter-spacing: 0.02em;
        }
        .fp-avatar-lg {
          width: 44px;
          height: 44px;
          font-size: 0.85rem;
          border-radius: 50%;
        }
        .fp-invite-meta {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.12rem;
          min-width: 0;
        }
        .fp-invite-meta strong {
          font-size: 0.92rem;
          color: #fff;
          font-weight: 600;
        }
        .fp-invite-meta span {
          font-size: 0.78rem;
          color: rgba(255,255,255,0.5);
        }
        .fp-invite-actions { display: flex; gap: 0.5rem; flex-shrink: 0; }
        .fp-btn-outline {
          padding: 0.42em 0.95em;
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.14);
          background: transparent;
          color: rgba(255,255,255,0.75);
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          transition: border-color 0.15s, background 0.15s;
        }
        .fp-btn-outline:hover { border-color: rgba(255,255,255,0.3); background: rgba(255,255,255,0.05); }
        .fp-btn-solid {
          padding: 0.42em 0.95em;
          border-radius: 8px;
          border: none;
          background: linear-gradient(90deg, #5c4de0, #6c5ce7);
          color: #fff;
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 3px 10px rgba(108,92,231,0.35);
          transition: opacity 0.15s;
        }
        .fp-btn-solid:hover { opacity: 0.88; }
        .fp-view-all-link {
          background: none;
          border: none;
          color: #7c6dff;
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          padding: 0;
          margin-top: 0.75rem;
          display: block;
          transition: color 0.15s;
        }
        .fp-view-all-link:hover { color: #a89fff; }
        .fp-empty-invites {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100px;
          gap: 0.4rem;
          text-align: center;
          color: rgba(255,255,255,0.4);
          font-size: 0.82rem;
        }

        /* ── Add friend form ── */
        .fp-add-form { display: flex; flex-direction: column; gap: 0.75rem; }
        .fp-edit-form { display: flex; flex-direction: column; gap: 0.75rem; }
        .fp-input-wrap { position: relative; display: flex; align-items: center; }
        .fp-input-icon {
          position: absolute;
          left: 0.85rem;
          color: rgba(255,255,255,0.28);
          display: inline-flex;
          align-items: center;
          pointer-events: none;
        }
        .fp-input {
          width: 100%;
          padding: 0.7em 0.9em 0.7em 2.5em;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.09);
          background: rgba(255,255,255,0.04);
          color: #fff;
          font-size: 0.88rem;
          box-sizing: border-box;
          transition: border-color 0.18s, box-shadow 0.18s;
        }
        .fp-input::placeholder { color: rgba(255,255,255,0.26); }
        .fp-input:focus {
          outline: none;
          border-color: rgba(108,92,231,0.6);
          background: rgba(108,92,231,0.05);
          box-shadow: 0 0 0 3px rgba(108,92,231,0.14);
        }
        .fp-form-error {
          display: flex; align-items: center; gap: 0.45rem;
          padding: 0.6rem 0.8rem; border-radius: 8px;
          background: rgba(255,107,107,0.1); border: 1px solid rgba(255,107,107,0.2);
          color: #ff8a8a; font-size: 0.81rem;
        }
        .fp-form-success {
          display: flex; align-items: center; gap: 0.45rem;
          padding: 0.6rem 0.8rem; border-radius: 8px;
          background: rgba(74,222,128,0.1); border: 1px solid rgba(74,222,128,0.2);
          color: #4ade80; font-size: 0.81rem;
        }
        .fp-send-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.6rem;
          padding: 0.78em 1em;
          border-radius: 10px;
          border: none;
          background: linear-gradient(90deg, #5c4de0, #6c5ce7);
          color: #fff;
          font-size: 0.92rem;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 5px 15px rgba(108,92,231,0.36);
          transition: opacity 0.15s, transform 0.15s;
        }
        .fp-send-btn:hover { opacity: 0.9; transform: translateY(-1px); }
        .fp-edit-actions { display: flex; gap: 0.65rem; }

        /* ── Friends table card ── */
        .fp-friends-card { padding: 1.4rem 0 0; overflow: hidden; }
        .fp-friends-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1rem;
          flex-wrap: wrap;
          padding: 0 1.5rem 1.1rem;
        }
        .fp-friends-controls {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          flex-wrap: wrap;
        }
        .fp-search-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }
        .fp-search-icon {
          position: absolute;
          left: 0.75rem;
          color: rgba(255,255,255,0.28);
          pointer-events: none;
        }
        .fp-search-input {
          padding: 0.55em 0.85em 0.55em 2.2em;
          border-radius: 9px;
          border: 1px solid rgba(255,255,255,0.09);
          background: rgba(255,255,255,0.04);
          color: #fff;
          font-size: 0.84rem;
          width: 190px;
          transition: border-color 0.18s;
        }
        .fp-search-input::placeholder { color: rgba(255,255,255,0.26); }
        .fp-search-input:focus {
          outline: none;
          border-color: rgba(108,92,231,0.5);
          box-shadow: 0 0 0 3px rgba(108,92,231,0.12);
        }
        .fp-filter-select-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }
        .fp-filter-select {
          appearance: none;
          padding: 0.55em 2rem 0.55em 0.85em;
          border-radius: 9px;
          border: 1px solid rgba(255,255,255,0.09);
          background: rgba(255,255,255,0.04);
          color: rgba(255,255,255,0.75);
          font-size: 0.84rem;
          cursor: pointer;
        }
        .fp-select-arrow {
          position: absolute;
          right: 0.6rem;
          color: rgba(255,255,255,0.35);
          pointer-events: none;
        }

        /* Table */
        .fp-table-head {
          display: grid;
          grid-template-columns: minmax(0,1.8fr) 1fr 1fr 1fr 160px;
          gap: 0;
          padding: 0.6rem 1.5rem;
          border-top: 1px solid rgba(255,255,255,0.06);
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .fp-th {
          font-size: 0.72rem;
          text-transform: uppercase;
          letter-spacing: 0.07em;
          color: rgba(255,255,255,0.38);
          font-weight: 600;
        }
        .fp-th-actions { text-align: right; }
        .fp-table-body { display: flex; flex-direction: column; }
        .fp-table-row {
          display: grid;
          grid-template-columns: minmax(0,1.8fr) 1fr 1fr 1fr 160px;
          gap: 0;
          padding: 0.95rem 1.5rem;
          align-items: center;
          border-bottom: 1px solid rgba(255,255,255,0.04);
          cursor: pointer;
          transition: background 0.15s;
        }
        .fp-table-row:last-child { border-bottom: none; }
        .fp-table-row:hover { background: rgba(108,92,231,0.06); }
        .fp-td { display: flex; align-items: center; }
        .fp-td-friend { gap: 0.85rem; }
        .fp-td-amount {
          flex-direction: column;
          align-items: flex-start;
          gap: 0.12rem;
        }
        .fp-td-actions { gap: 0.5rem; justify-content: flex-end; }
        .fp-col-label {
          font-size: 0.72rem;
          color: rgba(255,255,255,0.4);
          font-weight: 500;
        }
        .fp-friend-info {
          display: flex;
          flex-direction: column;
          gap: 0.1rem;
          min-width: 0;
        }
        .fp-friend-info strong {
          font-size: 0.92rem;
          color: #fff;
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .fp-friend-info span {
          font-size: 0.76rem;
          color: rgba(255,255,255,0.45);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .fp-td-amount strong { font-size: 0.88rem; color: #fff; }
        .fp-green { color: #4ade80 !important; }
        .fp-red { color: #f87171 !important; }
        .fp-muted { color: rgba(255,255,255,0.4) !important; }

        /* View / more buttons */
        .fp-view-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.42em 0.9em;
          border-radius: 8px;
          border: 1px solid rgba(108,92,231,0.3);
          background: rgba(108,92,231,0.1);
          color: #c8b1ff;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s, border-color 0.15s;
        }
        .fp-view-btn:hover { background: rgba(108,92,231,0.2); border-color: rgba(108,92,231,0.5); }
        .fp-more-menu { position: relative; }
        .fp-more-btn {
          width: 30px;
          height: 30px;
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.09);
          background: transparent;
          color: rgba(255,255,255,0.5);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.15s;
        }
        .fp-more-btn:hover { background: rgba(255,255,255,0.07); color: #fff; }
        .fp-dropdown {
          display: none;
          position: absolute;
          right: 0;
          top: calc(100% + 4px);
          background: #1e1d35;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px;
          padding: 0.35rem;
          min-width: 130px;
          z-index: 50;
          box-shadow: 0 10px 24px rgba(0,0,0,0.4);
        }
        .fp-dropdown-open { display: flex; flex-direction: column; }
        .fp-dropdown-item {
          background: none;
          border: none;
          color: rgba(255,255,255,0.78);
          font-size: 0.83rem;
          padding: 0.5em 0.75em;
          border-radius: 7px;
          text-align: left;
          cursor: pointer;
          transition: background 0.12s;
        }
        .fp-dropdown-item:hover { background: rgba(255,255,255,0.06); }
        .fp-dropdown-danger { color: #f87171 !important; }
        .fp-dropdown-danger:hover { background: rgba(248,113,113,0.1) !important; }

        /* Load more */
        .fp-load-more {
          display: flex;
          justify-content: center;
          padding: 1rem;
          border-top: 1px solid rgba(255,255,255,0.05);
        }
        .fp-load-more-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: none;
          border: none;
          color: #7c6dff;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          padding: 0;
          transition: color 0.15s;
        }
        .fp-load-more-btn:hover { color: #a89fff; }

        /* Empty states */
        .fp-empty-friends {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          min-height: 180px;
          text-align: center;
          padding: 2rem 1.5rem;
        }
        .fp-empty-friends strong { font-size: 0.95rem; color: rgba(255,255,255,0.55); }
        .fp-empty-friends span { font-size: 0.82rem; color: rgba(255,255,255,0.35); }

        /* Sent requests */
        .fp-sent-row { opacity: 0.85; }
        .fp-awaiting-badge {
          font-size: 0.75rem;
          color: rgba(255,255,255,0.42);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 999px;
          padding: 0.22em 0.65em;
          white-space: nowrap;
        }

        /* ── Light mode ── */
        .app.light-mode .fp-page-title { color: var(--text-light, #2f2050); }
        .app.light-mode .fp-page-sub,
        .app.light-mode .fp-card-sub { color: rgba(47,32,80,0.56); }
        .app.light-mode .fp-page-icon { background: rgba(108,92,231,0.1); color: #5e4dcf; }
        .app.light-mode .fp-card {
          background: #fff;
          border-color: rgba(108,92,231,0.12);
          box-shadow: 0 4px 16px rgba(108,92,231,0.07);
        }
        .app.light-mode .fp-card-head h3,
        .app.light-mode .fp-card-title-row h3 { color: var(--text-light, #2f2050); }
        .app.light-mode .fp-invite-meta strong,
        .app.light-mode .fp-friend-info strong { color: var(--text-light, #2f2050); }
        .app.light-mode .fp-invite-meta span,
        .app.light-mode .fp-friend-info span { color: rgba(47,32,80,0.5); }
        .app.light-mode .fp-input {
          background: #f7f4ff;
          border-color: rgba(108,92,231,0.14);
          color: var(--text-light, #2f2050);
        }
        .app.light-mode .fp-input::placeholder { color: rgba(47,32,80,0.28); }
        .app.light-mode .fp-input-icon { color: rgba(47,32,80,0.3); }
        .app.light-mode .fp-input:focus {
          border-color: rgba(108,92,231,0.45);
          background: rgba(108,92,231,0.03);
        }
        .app.light-mode .fp-search-input {
          background: #f7f4ff;
          border-color: rgba(108,92,231,0.14);
          color: var(--text-light, #2f2050);
        }
        .app.light-mode .fp-search-icon { color: rgba(47,32,80,0.3); }
        .app.light-mode .fp-filter-select {
          background: #f7f4ff;
          border-color: rgba(108,92,231,0.14);
          color: rgba(47,32,80,0.75);
        }
        .app.light-mode .fp-th { color: rgba(47,32,80,0.4); }
        .app.light-mode .fp-table-row:hover { background: rgba(108,92,231,0.04); }
        .app.light-mode .fp-col-label { color: rgba(47,32,80,0.42); }
        .app.light-mode .fp-td-amount strong { color: var(--text-light, #2f2050); }
        .app.light-mode .fp-view-btn {
          border-color: rgba(108,92,231,0.22);
          background: rgba(108,92,231,0.07);
          color: #5e4dcf;
        }
        .app.light-mode .fp-more-btn {
          border-color: rgba(108,92,231,0.14);
          color: rgba(47,32,80,0.5);
        }
        .app.light-mode .fp-more-btn:hover { background: rgba(108,92,231,0.06); color: var(--text-light,#2f2050); }
        .app.light-mode .fp-dropdown {
          background: #fff;
          border-color: rgba(108,92,231,0.14);
          box-shadow: 0 8px 20px rgba(108,92,231,0.1);
        }
        .app.light-mode .fp-dropdown-item { color: rgba(47,32,80,0.8); }
        .app.light-mode .fp-dropdown-item:hover { background: rgba(108,92,231,0.05); }
        .app.light-mode .fp-awaiting-badge { color: rgba(47,32,80,0.44); border-color: rgba(47,32,80,0.14); }
        .app.light-mode .fp-btn-outline {
          border-color: rgba(108,92,231,0.2);
          color: rgba(47,32,80,0.7);
        }
        .app.light-mode .fp-btn-outline:hover { background: rgba(108,92,231,0.05); }
        .app.light-mode .fp-badge {
          background: rgba(108,92,231,0.12);
          color: #5e4dcf;
          border-color: rgba(108,92,231,0.22);
        }
        .app.light-mode .fp-table-head,
        .app.light-mode .fp-table-row { border-color: rgba(108,92,231,0.07); }
        .app.light-mode .fp-load-more { border-top-color: rgba(108,92,231,0.07); }
        .app.light-mode .fp-empty-friends strong { color: rgba(47,32,80,0.45); }
        .app.light-mode .fp-empty-friends span { color: rgba(47,32,80,0.3); }

        /* ── Responsive ── */
        @media (max-width: 1000px) {
          .fp-top-grid { grid-template-columns: 1fr; }
          .fp-table-head,
          .fp-table-row { grid-template-columns: minmax(0,1.4fr) 0.8fr 0.8fr 0.8fr 120px; }
        }
        @media (max-width: 768px) {
          .fp-table-head { display: none; }
          .fp-table-row {
            grid-template-columns: 1fr;
            gap: 0.5rem;
            padding: 0.9rem 1.25rem;
          }
          .fp-td-actions { justify-content: flex-start; }
          .fp-friends-header { flex-direction: column; }
          .fp-friends-controls { width: 100%; }
          .fp-search-input { width: 100%; }
        }
      `}</style>
    </div>
  )
}
