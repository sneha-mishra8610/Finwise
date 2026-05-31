export type FriendsPageProps = Record<string, any>

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

  if (friendDetailView) {
    const friend = users.find((user: { id: string }) => user.id === friendDetailView) || null
    const friendPairExpenses = expenseWorkspacePool
      .filter((expense: { type: string; participantIds?: string[] }) => {
        const participants = expense.participantIds || []
        return (
          expense.type === 'GROUP'
          && participants.length === 2
          && participants.includes(currentUserId)
          && participants.includes(friendDetailView)
        )
      })
      .sort((a: { createdAt?: string }, b: { createdAt?: string }) => {
        const da = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const db = b.createdAt ? new Date(b.createdAt).getTime() : 0
        return db - da
      })
    const unsettledCount = friendPairExpenses.filter((expense: any) => isExpenseUnsettledForCurrentUser(expense)).length

    return renderWorkspaceDashboard({
      title: friend ? `${currentUser?.name || 'You'} & ${friend.name}` : 'Friend workspace',
      subtitle: `${friendPairExpenses.length} shared expenses · ${unsettledCount} unsettled`,
      breadcrumb: 'Finwise / Friends / Workspace',
      expenses: friendPairExpenses,
      participants: [currentUser, friend].filter(Boolean),
      onBack: () => { setFriendDetailView(null); setExpenseDetailView(null) },
      onAddExpense: () => {
        resetExpenseForm()
        setEditingExpense(null)
        setIsFriendExpense(true)
        setIsGroupExpense(false)
        setSelectedFriendId(friendDetailView)
        setShowExpenseModal(true)
      },
      emptyTitle: 'No shared expenses yet.',
      emptyBody: `Add an expense to start tracking with ${friend?.name || 'this friend'}.`,
      scopeLabel: friend ? `Balances with ${friend.name}` : 'Balances in this workspace',
      mode: 'friend',
      primaryParticipantId: friend?.id,
      accentLabel: friend ? `${friend.name} Spent` : 'Friend Spent',
    })
  }

  return (
    <>
      <section className="friends-shell">
        <div className="friends-hero panel">
          <div>
            <p className="dashboard-breadcrumb">Finwise / Friends</p>
            <h2>Friends</h2>
            <p className="friends-subtitle">{currentFriends.length} friends · {friendInvitations.length} pending</p>
          </div>
          <div className="friends-search-wrap">
            <input
              type="text"
              className="search-input"
              placeholder="Search friends"
              value={friendSearch}
              onChange={(event) => setFriendSearch(event.target.value)}
            />
          </div>
        </div>

        <div className="friends-top-grid">
          <section className="panel friends-block">
            <div className="friends-block-head">
              <h3>Pending invitations</h3>
            </div>
            <div className="friends-invite-list">
              {friendInvitations.length > 0 ? friendInvitations.map((inv: any) => {
                const inviterUser = users.find((user: { id: string }) => user.id === inv.inviterUserId)
                const displayName = inviterUser?.name || 'Someone'
                const displayEmail = inviterUser?.email || inv.inviteeEmail
                return (
                  <div key={inv.id} className="friends-invite-row">
                    <div className="friends-avatar invite-avatar">{displayName.slice(0, 2).toUpperCase()}</div>
                    <div className="friends-person-meta">
                      <strong>{displayName}</strong>
                      <span>{displayEmail}</span>
                    </div>
                    <div className="friends-inline-actions">
                      <button className="accept-btn" onClick={() => handleAcceptFriendInvitation(inv.id)}>Accept</button>
                      <button className="decline-btn" onClick={() => handleDeclineFriendInvitation(inv.id)}>Decline</button>
                    </div>
                  </div>
                )
              }) : (
                <p className="muted">No pending invitations right now.</p>
              )}
            </div>
          </section>

          <section className="panel friends-block">
            <div className="friends-block-head">
              <h3>Add friend</h3>
            </div>
            <form onSubmit={handleAddFriend} className="friends-add-form">
              <label className="friends-field">
                <span>Friend's name</span>
                <input
                  type="text"
                  placeholder="Friend's name"
                  value={friendNameToAdd}
                  onChange={(event) => setFriendNameToAdd(event.target.value)}
                />
              </label>
              <label className="friends-field">
                <span>Friend's email (required)</span>
                <input
                  type="email"
                  placeholder="Friend's email (required)"
                  value={friendEmailToAdd}
                  onChange={(event) => setFriendEmailToAdd(event.target.value)}
                  required
                />
              </label>
              <button type="submit" className="friends-primary-btn">Send friend request</button>
            </form>
            {friendAddError && <p className="error-text" style={{ marginTop: '0.5rem' }}>{friendAddError}</p>}
            {friendAddSuccess && <p className="success-text" style={{ marginTop: '0.5rem' }}>{friendAddSuccess}</p>}
          </section>
        </div>
      </section>

      {editingFriend && (
        <section className="panel">
          <h2>Edit Friend</h2>
          <form onSubmit={handleUpdateFriend} className="form-inline-row">
            <input type="text" value={editFriendName} onChange={(event) => setEditFriendName(event.target.value)} required />
            <input type="email" value={editFriendEmail} onChange={(event) => setEditFriendEmail(event.target.value)} required />
            <button type="submit">Save</button>
            <button type="button" onClick={() => setEditingFriend(null)}>Cancel</button>
          </form>
        </section>
      )}

      <section className="panel">
        <div className="friends-block-head">
          <h3>My friends</h3>
        </div>
        {currentFriends.length === 0 ? (
          <p className="muted">No friends yet - add someone above!</p>
        ) : (
          <ul className="friends-list">
            {currentFriends.map((friend: { id: string; name: string; email: string }) => (
              <li key={friend.id} className="friends-list-row" onClick={() => { setFriendDetailView(friend.id); setExpenseDetailView(null) }} style={{ cursor: 'pointer' }}>
                <div className="friends-person">
                  <div className="friends-avatar">{friend.name.slice(0, 2).toUpperCase()}</div>
                  <div className="friends-person-meta">
                    <strong>{friend.name}</strong>
                    <span>{friend.email}</span>
                  </div>
                </div>
                <div className="friends-balance-area">
                  <span className={`friends-balance ${friendBalances[friend.id] > 0 ? 'positive' : friendBalances[friend.id] < 0 ? 'negative' : ''}`}>
                    {friendBalances[friend.id] > 0
                      ? `Owes you ${getCurrencySymbol(defaultCurrency)}${convertINR(Number(friendBalances[friend.id]), defaultCurrency).toFixed(2)}`
                      : friendBalances[friend.id] < 0
                      ? `You owe ${getCurrencySymbol(defaultCurrency)}${Math.abs(convertINR(Number(friendBalances[friend.id]), defaultCurrency)).toFixed(2)}`
                      : 'Settled'}
                  </span>
                  <div className="friends-inline-actions">
                    {friendBalances[friend.id] < 0 ? (
                      <button
                        className="accept-btn"
                        onClick={async (event) => {
                          event.stopPropagation()
                          await handleRemindFriend(friend.id)
                        }}
                      >
                        Remind
                      </button>
                    ) : friendBalances[friend.id] > 0 ? (
                      <button
                        className="decline-btn friends-remind-btn"
                        onClick={async (event) => {
                          event.stopPropagation()
                          await handleRemindFriend(friend.id)
                        }}
                      >
                        Remind
                      </button>
                    ) : null}
                    <button className="icon-btn" title="Edit" onClick={(event) => { event.stopPropagation(); startEditFriend(friend) }}>Edit</button>
                    <button className="icon-btn danger" title="Remove" onClick={(event) => { event.stopPropagation(); handleRemoveFriend(friend.id) }}>Remove</button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {pendingInvitations.filter((inv: any) => inv.type === 'FRIEND').length > 0 && (
        <section className="panel">
          <div className="friends-block-head">
            <h3>Sent friend requests</h3>
          </div>
          <div className="friends-invite-list">
            {pendingInvitations.filter((inv: any) => inv.type === 'FRIEND').map((inv: any) => (
              <div key={inv.id} className="friends-invite-row sent-request-row">
                <div className="friends-avatar request-avatar">{(inv.inviteeName || inv.inviteeEmail).slice(0, 2).toUpperCase()}</div>
                <div className="friends-person-meta">
                  <strong>{inv.inviteeName || inv.inviteeEmail}</strong>
                  <span>{inv.inviteeEmail}</span>
                </div>
                <span className="friends-awaiting">Awaiting response</span>
              </div>
            ))}
          </div>
          <p className="muted" style={{ marginTop: '0.5rem' }}>These people will see your friend request when they log in.</p>
        </section>
      )}
    </>
  )
}
