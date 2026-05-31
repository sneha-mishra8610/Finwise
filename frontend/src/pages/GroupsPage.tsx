/* eslint-disable @typescript-eslint/no-explicit-any */
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

  if (groupDetailView) {
    const grp = groups.find((group: { id: string }) => group.id === groupDetailView)
    const sorted = [...groupExpenses].sort((a: { createdAt?: string }, b: { createdAt?: string }) => {
      const da = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const db = b.createdAt ? new Date(b.createdAt).getTime() : 0
      return db - da
    })
    const groupUnsettled = sorted.filter((expense: { expenseStatus?: string }) => expense.expenseStatus !== 'Settled').length

    return renderWorkspaceDashboard({
      title: grp?.name || 'Group workspace',
      subtitle: `${sorted.length} expenses · ${groupUnsettled} unsettled`,
      breadcrumb: 'Finwise / Groups / Workspace',
      expenses: sorted,
      participants: (grp?.memberIds || []).map((memberId: string) => users.find((user: { id: string }) => user.id === memberId)).filter(Boolean),
      onBack: () => { setGroupDetailView(null); setExpenseDetailView(null) },
      onAddExpense: () => {
        resetExpenseForm()
        setEditingExpense(null)
        setIsGroupExpense(true)
        setIsFriendExpense(false)
        setSelectedGroupId(groupDetailView)
        setShowExpenseModal(true)
      },
      emptyTitle: 'No expenses in this group yet.',
      emptyBody: 'Add an expense to start tracking shared balances.',
      scopeLabel: grp ? `${grp.name} settlements` : 'Group settlements',
      mode: 'group',
      accentLabel: 'Others Spent',
    })
  }

  return (
    <>
      <section className="groups-shell">
        <div className="groups-hero panel">
          <div>
            <p className="dashboard-breadcrumb">Finwise / Groups</p>
            <h2>Groups</h2>
            <p className="groups-subtitle">{sortedGroups.length} active groups</p>
          </div>
        </div>

        <div className="groups-card-grid">
          {groupOverview.map(({ group, total, yourShare, unsettledCount, latestLabel }: any) => (
            <button
              key={group.id}
              type="button"
              className="panel groups-summary-card"
              onClick={() => { setSelectedGroupId(group.id); setGroupDetailView(group.id); fetchGroupExpenses(group.id) }}
            >
              <div className="groups-summary-icon">{group.name.slice(0, 1).toUpperCase()}</div>
              <div className="groups-summary-body">
                <strong>{group.name}</strong>
                <span>{group.memberIds.length} members · {latestLabel}</span>
                <div className="groups-summary-metric">Total: {getCurrencySymbol(defaultCurrency)}{convertINR(total, defaultCurrency).toFixed(2)}</div>
                <div className="groups-summary-metric">Your share: {getCurrencySymbol(defaultCurrency)}{convertINR(yourShare, defaultCurrency).toFixed(2)}</div>
                <div className={`groups-summary-status ${unsettledCount > 0 ? 'negative' : 'positive'}`}>
                  {unsettledCount > 0 ? `${unsettledCount} unsettled` : 'All settled'}
                </div>
              </div>
              <div className="groups-card-actions" onClick={(event) => event.stopPropagation()}>
                <button className="icon-btn" title="Edit" onClick={() => startEditGroup(group)}>Edit</button>
                <button className="icon-btn danger" title="Delete" onClick={() => handleDeleteGroup(group.id)}>Delete</button>
              </div>
            </button>
          ))}

          <button
            type="button"
            className="panel groups-new-card"
            onClick={() => setShowCreateGroupPanel((previous: boolean) => !previous)}
          >
            <span className="groups-new-plus">+</span>
            <span>New group</span>
          </button>
        </div>
      </section>

      {showCreateGroupPanel && (
        <section className="panel">
          <div className="groups-block-head">
            <h3>Create group</h3>
          </div>
          <form onSubmit={handleCreateGroup} className="form-vertical">
            <input
              type="text"
              placeholder="Group name (e.g. Vacation Varkala)"
              value={groupName}
              onChange={(event) => setGroupName(event.target.value)}
              required
            />
            <p className="muted" style={{ margin: '0.25rem 0' }}>Select friends to add:</p>
            <div className="pill-list">
              {currentFriends.length > 0 ? currentFriends.map((user: { id: string; name: string }) => (
                <button
                  key={user.id}
                  type="button"
                  className={groupMemberIds.includes(user.id) ? 'pill pill-selected' : 'pill'}
                  onClick={() => toggleGroupMember(user.id)}
                >
                  {user.name}
                </button>
              )) : (
                <span className="muted">Add friends first to include them in groups</span>
              )}
            </div>
            <button type="submit">Create group</button>
          </form>
        </section>
      )}

      {editingGroup && (
        <section className="panel">
          <h2>Edit Group - {editingGroup!.name}</h2>
          <form onSubmit={handleUpdateGroup} className="form-vertical">
            <label className="field-label">Group name</label>
            <input type="text" value={editGroupName} onChange={(event) => setEditGroupName(event.target.value)} required />

            <label className="field-label" style={{ marginTop: '0.75rem' }}>Members</label>
            <div className="member-list">
              {editGroupMemberIds.map((memberId: string) => {
                const member = users.find((user: { id: string }) => user.id === memberId)
                if (!member) return null
                const isOwner = memberId === editingGroup!.ownerId
                return (
                  <div key={memberId} className="member-row">
                    <span>{member.name} <span className="muted">({member.email})</span></span>
                    {isOwner ? (
                      <span className="badge">Owner</span>
                    ) : (
                      <button type="button" className="icon-btn danger" title="Remove member" onClick={() => toggleEditGroupMember(memberId)}>Remove</button>
                    )}
                  </div>
                )
              })}
            </div>

            <label className="field-label" style={{ marginTop: '0.75rem' }}>Add friends to group</label>
            <div className="pill-list">
              {currentFriends
                .filter((friend: { id: string }) => !editGroupMemberIds.includes(friend.id))
                .map((friend: { id: string; name: string }) => (
                  <button key={friend.id} type="button" className="pill" onClick={() => toggleEditGroupMember(friend.id)}>
                    + {friend.name}
                  </button>
                ))}
              {currentFriends.filter((friend: { id: string }) => !editGroupMemberIds.includes(friend.id)).length === 0 && (
                <span className="muted">All friends already in group</span>
              )}
            </div>

            <div className="form-inline-row" style={{ marginTop: '0.75rem' }}>
              <button type="submit">Save changes</button>
              <button type="button" onClick={() => { setEditingGroup(null); setEditGroupMemberIds([]) }}>Cancel</button>
            </div>
          </form>
        </section>
      )}

      {groupInvitations.length > 0 && (
        <section className="panel">
          <div className="groups-block-head">
            <h3>Group invitations</h3>
          </div>
          <ul className="card-list">
            {groupInvitations.map((inv: any) => {
              const inviterUser = users.find((user: { id: string }) => user.id === inv.inviterUserId)
              return (
                <li key={inv.id} className="card group-card pending-invite">
                  <div className="card-header">
                    <div>
                      <strong>{inv.groupName || 'Unknown group'}</strong>
                      <span className="muted" style={{ marginLeft: '0.5rem' }}>
                        invited by {inviterUser?.name || 'someone'}
                      </span>
                    </div>
                    <div className="card-actions">
                      <button className="accept-btn" title="Accept" onClick={() => handleAcceptGroupInvitation(inv.id)}>Accept</button>
                      <button className="decline-btn" title="Decline" onClick={() => handleDeclineGroupInvitation(inv.id)}>Decline</button>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      )}
    </>
  )
}
