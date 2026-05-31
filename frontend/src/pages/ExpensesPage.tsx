/* eslint-disable @typescript-eslint/no-explicit-any */
export type ExpensesPageProps = Record<string, any>

export default function ExpensesPage(props: ExpensesPageProps) {
  const {
    expenseStats,
    expensePageTitle,
    expenseFilterTabs,
    expenseViewFilter,
    setExpenseViewFilter,
    filteredExpenseFeed,
    expensesPage,
    EXPENSES_PAGE_SIZE,
    expenseDetailView,
    expenseChats,
    expenseChatInputs,
    setExpenseChatInputs,
    editLogDisplayCount,
    setEditLogDisplayCount,
    currentUserId,
    currentUserName,
    users,
    groups,
    defaultCurrency,
    convertINR,
    getCurrencySymbol,
    setExpenseDetailView,
    setExpensesPage,
    handleSettleUp,
    startEditExpense,
    setShowExpenseModal,
    handleDeleteExpense,
    handleFlagExpense,
    handleUnflagExpense,
    handleSendExpenseChatMessage,
    shareLabel,
    userShare,
    othersOweTotal,
    getExpenseCategory,
    payerName,
    resetExpenseForm,
    setEditingExpense,
    expenseDescription,
    expenseTag,
    setExpenseDescription,
    setExpenseTag,
    expenseAmount,
    setExpenseAmount,
    expenseCurrency,
    setExpenseCurrency,
    isRecurringExpense,
    setIsRecurringExpense,
    recurrenceStartDate,
    setRecurrenceStartDate,
    recurrenceType,
    setRecurrenceType,
    recurrenceInterval,
    setRecurrenceInterval,
    recurrenceEndDate,
    setRecurrenceEndDate,
    isGroupExpense,
    setIsGroupExpense,
    isFriendExpense,
    setIsFriendExpense,
    selectedFriendId,
    setSelectedFriendId,
    expensePayerId,
    setExpensePayerId,
    selectedGroupId,
    setSelectedGroupId,
    splitMode,
    setSplitMode,
    customSplits,
    setCustomSplits,
    currentFriends,
    filteredGroups,
    editingExpense,
    expenseEditLogs,
    showExpenseModal,
    setShowExpenseModalState,
  } = props

  return (
    <section className="expenses-shell">
      <div className="expenses-hero panel">
        <div>
          <p className="dashboard-breadcrumb">Finwise / Expenses</p>
          <h2>Expenses</h2>
          <p className="expenses-subtitle">
            {new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' }).format(new Date())} - {expenseStats.expenseCount} expenses logged
          </p>
        </div>
        <div className="expenses-hero-actions">
          <button type="button" className="icon-btn" onClick={() => setExpenseDetailView(null)}>Clear selection</button>
          <button type="button" onClick={() => { resetExpenseForm(); setEditingExpense(null); setShowExpenseModalState(true) }}>Add expense</button>
        </div>
      </div>

      <div className="expenses-stat-grid">
        <article className="panel expenses-stat-card">
          <span className="expenses-stat-label">Total logged</span>
          <strong className="expenses-stat-value">{getCurrencySymbol(defaultCurrency)}{convertINR(expenseStats.totalLogged, defaultCurrency).toFixed(2)}</strong>
          <span className="expenses-stat-note">Across personal, group, and recurring items</span>
        </article>
        <article className="panel expenses-stat-card">
          <span className="expenses-stat-label">You owe</span>
          <strong className="expenses-stat-value negative">{getCurrencySymbol(defaultCurrency)}{convertINR(expenseStats.youOwe, defaultCurrency).toFixed(2)}</strong>
          <span className="expenses-stat-note">Outstanding balances waiting on you</span>
        </article>
        <article className="panel expenses-stat-card">
          <span className="expenses-stat-label">Owed to you</span>
          <strong className="expenses-stat-value positive">{getCurrencySymbol(defaultCurrency)}{convertINR(expenseStats.owedToYou, defaultCurrency).toFixed(2)}</strong>
          <span className="expenses-stat-note">Incoming settlements from shared expenses</span>
        </article>
        <article className="panel expenses-stat-card">
          <span className="expenses-stat-label">Review queue</span>
          <strong className="expenses-stat-value">{expenseStats.flaggedCount}</strong>
          <span className="expenses-stat-note">{expenseStats.recurringCount} recurring templates active</span>
        </article>
      </div>

      <div className="expenses-main-grid">
        <div className="expenses-feed">
          <section className="panel expenses-feed-panel">
            <div className="expenses-feed-head">
              <div>
                <h3>{expensePageTitle}</h3>
                <p className="muted">Select an expense to inspect history, chat, and actions.</p>
              </div>
              <div className="expenses-filter-bar">
                {expenseFilterTabs.map((tab: any) => (
                  <button
                    key={tab.key}
                    type="button"
                    className={expenseViewFilter === tab.key ? 'expenses-filter-chip expenses-filter-chip-active' : 'expenses-filter-chip'}
                    onClick={() => setExpenseViewFilter(tab.key)}
                  >
                    {tab.label} {tab.count}
                  </button>
                ))}
              </div>
            </div>

            <div className="expenses-stream">
              {filteredExpenseFeed.length === 0 ? (
                <div className="expenses-empty-state">
                  <strong>No expenses in this view yet.</strong>
                  <span>Try another filter or add a new expense.</span>
                </div>
              ) : (
                filteredExpenseFeed.slice(0, expensesPage * EXPENSES_PAGE_SIZE).map((expense: any) => {
                  const isGroupExpense = expense.type === 'GROUP'
                  const participants = expense.participantIds || []
                  const friendCounterpartyId = isGroupExpense && participants.length === 2 && participants.includes(currentUserId)
                    ? participants.find((participantId: string) => participantId !== currentUserId) || ''
                    : ''
                  const isFriendToFriendExpense = !!friendCounterpartyId
                  const friendCounterpartyName = friendCounterpartyId
                    ? users.find((user: any) => user.id === friendCounterpartyId)?.name || 'Friend'
                    : ''
                  const groupName = expense.groupId ? (groups.find((group: any) => group.id === expense.groupId)?.name || 'Unknown group') : null
                  const isRecurring = !!(expense.isRecurring || expense.recurring)
                  const isSelected = expenseDetailView?.id === expense.id

                  return (
                    <article
                      key={expense.id}
                      className={isSelected ? 'expense-stream-card expense-stream-card-active' : 'expense-stream-card'}
                      onClick={() => setExpenseDetailView(expense)}
                    >
                      <div className="expense-stream-main">
                        <div className="expense-stream-icon">{isFriendToFriendExpense ? 'F' : isGroupExpense ? 'G' : 'P'}</div>
                        <div className="expense-stream-copy">
                          <div className="expense-stream-topline">
                            <strong>{expense.description}</strong>
                            {expense.flaggedBy && expense.flaggedBy.length > 0 && (
                              <span className="expense-flag-pill">Flagged {expense.flaggedBy.length}</span>
                            )}
                            {isRecurring && <span className="expense-recurring-pill">Recurring</span>}
                          </div>
                          <div className="expense-stream-meta">
                            <span>{getExpenseCategory(expense)}</span>
                            <span>
                              {isFriendToFriendExpense
                                ? `Friend expense with ${friendCounterpartyName}`
                                : isGroupExpense
                                ? (groupName || 'Group expense')
                                : 'Personal expense'}
                            </span>
                            <span>{payerName(expense.payerId)}</span>
                            {expense.createdAt && <span>{new Date(expense.createdAt).toLocaleDateString()}</span>}
                          </div>
                          <div className="expense-stream-support">
                            {isGroupExpense ? (
                              <>
                                <span>{shareLabel(expense)}</span>
                                {expense.payerId === currentUserId && (expense.participantIds || []).length > 1 && expense.expenseStatus !== 'Settled' && (
                                  <span className="positive">Others owe {getCurrencySymbol(defaultCurrency)}{convertINR(othersOweTotal(expense), defaultCurrency).toFixed(2)}</span>
                                )}
                                {expense.payerId !== currentUserId && (expense.participantIds || []).includes(currentUserId) && !expense.settledByUser?.[currentUserId] && (
                                  <span className="negative">You owe {getCurrencySymbol(defaultCurrency)}{convertINR(userShare(expense), defaultCurrency).toFixed(2)}</span>
                                )}
                              </>
                            ) : (
                              <span>{expense.imageUrl ? 'Bill attached' : 'No bill attached'}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="expense-stream-side">
                        <strong>{getCurrencySymbol(defaultCurrency)}{convertINR(isGroupExpense ? userShare(expense) : expense.amount, defaultCurrency).toFixed(2)}</strong>
                        <span className="muted">
                          {isGroupExpense ? `your share of ${getCurrencySymbol(defaultCurrency)}${convertINR(expense.amount, defaultCurrency).toFixed(2)}` : defaultCurrency}
                        </span>
                        <div className="expense-stream-actions">
                          {isGroupExpense && expense.payerId !== currentUserId && (expense.participantIds || []).includes(currentUserId) && !expense.settledByUser?.[currentUserId] && (
                            <button className="settle-btn" onClick={(event) => { event.stopPropagation(); handleSettleUp(expense.id) }}>Settle</button>
                          )}
                          {expense.createdBy === currentUserId && (
                            <button onClick={(event) => { event.stopPropagation(); startEditExpense(expense); setShowExpenseModal(true) }}>Edit</button>
                          )}
                          {(expense.createdBy === currentUserId || (!expense.createdBy && expense.payerId === currentUserId)) && (
                            <button onClick={(event) => { event.stopPropagation(); handleDeleteExpense(expense) }}>Delete</button>
                          )}
                        </div>
                      </div>
                    </article>
                  )
                })
              )}
            </div>
          </section>
          {filteredExpenseFeed.length > expensesPage * EXPENSES_PAGE_SIZE && (
            <div style={{ textAlign: 'left', margin: '1rem 0' }}>
              <button onClick={() => setExpensesPage(expensesPage + 1)}>Load more</button>
            </div>
          )}
        </div>

        <aside className="panel expenses-detail-panel">
          {expenseDetailView ? (
            <>
              <div className="expenses-detail-head">
                <div>
                  {(() => {
                    const detailParticipants = expenseDetailView.participantIds || []
                    const detailCounterpartyId = expenseDetailView.type === 'GROUP' && detailParticipants.length === 2 && detailParticipants.includes(currentUserId)
                      ? detailParticipants.find((participantId: string) => participantId !== currentUserId) || ''
                      : ''
                    const detailCounterpartyName = detailCounterpartyId
                      ? users.find((user: any) => user.id === detailCounterpartyId)?.name || 'Friend'
                      : ''
                    return (
                      <p className="expenses-detail-eyebrow">
                        {detailCounterpartyId
                          ? `Friend expense with ${detailCounterpartyName}`
                          : expenseDetailView.type === 'GROUP'
                          ? (groups.find((group: any) => group.id === expenseDetailView.groupId)?.name || 'Group expense')
                          : 'Personal expense'}
                      </p>
                    )
                  })()}
                  <h3>{expenseDetailView.description}</h3>
                </div>
                <div className="expenses-detail-amount">
                  <strong>{getCurrencySymbol(expenseDetailView.currency)}{expenseDetailView.amount.toFixed(2)}</strong>
                  <span>{expenseDetailView.currency}</span>
                </div>
              </div>

              <div className="expenses-detail-summary">
                <div className="expenses-detail-kv">
                  <span>Payer</span>
                  <strong>{payerName(expenseDetailView.payerId)}</strong>
                </div>
                <div className="expenses-detail-kv">
                  <span>Category</span>
                  <strong>{getExpenseCategory(expenseDetailView)}</strong>
                </div>
                <div className="expenses-detail-kv">
                  <span>Created</span>
                  <strong>{expenseDetailView.createdAt ? new Date(expenseDetailView.createdAt).toLocaleString() : 'Unknown'}</strong>
                </div>
                <div className="expenses-detail-kv">
                  <span>Status</span>
                  <strong>{expenseDetailView.expenseStatus || 'Open'}</strong>
                </div>
              </div>

              {expenseDetailView.flaggedBy && expenseDetailView.flaggedBy.length > 0 && (
                <div className="expenses-alert">
                  This expense has been flagged by {expenseDetailView.flaggedBy.length} participant{expenseDetailView.flaggedBy.length > 1 ? 's' : ''}.
                </div>
              )}

              <div className="expenses-detail-actions">
                {expenseDetailView.createdBy === currentUserId && (
                  <button type="button" onClick={() => { startEditExpense(expenseDetailView); setShowExpenseModal(true) }}>Edit expense</button>
                )}
                {(expenseDetailView.createdBy === currentUserId || (!expenseDetailView.createdBy && expenseDetailView.payerId === currentUserId)) && (
                  <button type="button" onClick={() => handleDeleteExpense(expenseDetailView)}>Delete</button>
                )}
                {expenseDetailView.createdBy !== currentUserId && (
                  expenseDetailView.flaggedBy?.includes(currentUserId) ? (
                    <button type="button" onClick={() => handleUnflagExpense(expenseDetailView.id)}>Unflag expense</button>
                  ) : (
                    <button type="button" className="flag-btn" onClick={() => handleFlagExpense(expenseDetailView.id)}>Flag expense</button>
                  )
                )}
                {expenseDetailView.groupId && expenseDetailView.payerId !== currentUserId && (expenseDetailView.participantIds || []).includes(currentUserId) && !expenseDetailView.settledByUser?.[currentUserId] && (
                  <button type="button" className="settle-btn" onClick={() => handleSettleUp(expenseDetailView.id)}>Settle up</button>
                )}
              </div>

              {expenseDetailView.type === 'GROUP' && (
                <div className="expenses-detail-section">
                  <h4>Split summary</h4>
                  <div className="expenses-detail-copy">
                    <div>{shareLabel(expenseDetailView)}</div>
                    {expenseDetailView.payerId === currentUserId && (expenseDetailView.participantIds || []).length > 1 && (
                      expenseDetailView.expenseStatus === 'Settled' ? (
                        <div className="settled-text">All settled</div>
                      ) : (
                        <div className="you-paid-info">Others owe you {getCurrencySymbol(expenseDetailView.currency)}{othersOweTotal(expenseDetailView).toFixed(2)}</div>
                      )
                    )}
                    {expenseDetailView.payerId !== currentUserId && (expenseDetailView.participantIds || []).includes(currentUserId) && (
                      expenseDetailView.settledByUser?.[currentUserId] ? (
                        <div className="settled-text">You already settled this expense.</div>
                      ) : (
                        <div className="owes-amount">You owe {getCurrencySymbol(expenseDetailView.currency)}{userShare(expenseDetailView).toFixed(2)}</div>
                      )
                    )}
                  </div>
                </div>
              )}

              {expenseDetailView.imageUrl && (
                <div className="expenses-detail-section">
                  <h4>Attachment</h4>
                  <a href={expenseDetailView.imageUrl} target="_blank" rel="noreferrer">View bill</a>
                </div>
              )}

              <div className="expenses-detail-section">
                <h4>Edit history</h4>
                {expenseEditLogs[expenseDetailView.id]?.length ? (
                  <>
                    <div className="expenses-history-list">
                      {expenseEditLogs[expenseDetailView.id]
                        .slice(0, editLogDisplayCount)
                        .map((log: any, idx: number) => (
                          <div key={log.id || idx} className="expenses-history-item">
                            <strong>{new Date(log.editTime).toLocaleString()}</strong>
                            <span>{log.reason || 'Updated expense details'}</span>
                          </div>
                        ))}
                    </div>
                    {expenseEditLogs[expenseDetailView.id].length > editLogDisplayCount && (
                      <button type="button" className="icon-btn" onClick={() => setEditLogDisplayCount(editLogDisplayCount + 3)}>See more</button>
                    )}
                  </>
                ) : (
                  <div className="muted">No edits yet.</div>
                )}
              </div>

              <div className="expenses-detail-section">
                <h4>Expense chat</h4>
                {expenseDetailView.groupId ? (
                  <div className="expense-chat-panel">
                    <div className="expense-chat-messages">
                      {(expenseChats[expenseDetailView.id] || []).length === 0 && <div className="muted">No messages yet.</div>}
                      {(expenseChats[expenseDetailView.id] || []).map((msg: any, idx: number) => (
                        <div key={idx} className="expense-chat-message">
                          <span className={msg.user === currentUserName ? 'expense-chat-user expense-chat-user-self' : 'expense-chat-user'}>{msg.user}</span>
                          <span>{msg.message}</span>
                          <div className="muted" style={{ fontSize: '0.7rem' }}>{msg.timestamp}</div>
                        </div>
                      ))}
                    </div>
                    <div className="expense-chat-composer">
                      <input
                        type="text"
                        value={expenseChatInputs[expenseDetailView.id] || ''}
                        onChange={(event) => setExpenseChatInputs((prev: any) => ({ ...prev, [expenseDetailView.id]: event.target.value }))}
                        placeholder="Type a message..."
                        onKeyDown={(event) => { if (event.key === 'Enter') handleSendExpenseChatMessage(expenseDetailView.id) }}
                      />
                      <button type="button" onClick={() => handleSendExpenseChatMessage(expenseDetailView.id)} disabled={!(expenseChatInputs[expenseDetailView.id]?.trim())}>Send</button>
                    </div>
                  </div>
                ) : (
                  <div className="muted">Expense chat is only available for group expenses.</div>
                )}
              </div>
            </>
          ) : (
            <div className="expenses-placeholder">
              <div className="expenses-placeholder-icon">[]</div>
              <h3>Select an expense</h3>
              <p className="muted">Click any expense from the list to open its breakdown, edit history, flag status, and expense chat.</p>
            </div>
          )}
        </aside>
      </div>

      {showExpenseModal && (
        <div className="modal-overlay" onClick={() => {
          setShowExpenseModalState(false)
          setEditingExpense(null)
          if (!editingExpense) resetExpenseForm()
        }}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingExpense ? 'Edit Expense' : 'Add Expense'}</h2>
              <button className="modal-close" onClick={() => {
                setShowExpenseModalState(false)
                setEditingExpense(null)
                if (!editingExpense) resetExpenseForm()
              }}>✕</button>
            </div>
            <form onSubmit={(event) => { props.handleSaveExpense(event); setShowExpenseModalState(false) }} className="form-vertical">
              <input
                type="text"
                placeholder="Description (e.g. Shopping)"
                value={expenseDescription}
                onChange={(event) => setExpenseDescription(event.target.value)}
                required
              />
              <select value={expenseTag} onChange={(event) => setExpenseTag(event.target.value)}>
                <option value="groceries">groceries</option>
                <option value="rent">rent</option>
                <option value="transport">transport</option>
                <option value="travel">travel</option>
                <option value="insurance">insurance</option>
                <option value="investments">investments</option>
                <option value="utilities">utilities</option>
                <option value="subscriptions">subscriptions</option>
                <option value="health">health</option>
                <option value="education">education</option>
                <option value="childcare">childcare</option>
                <option value="pets">pets</option>
                <option value="taxes">taxes</option>
                <option value="gifts">gifts</option>
                <option value="charity">charity</option>
                <option value="maintenance">maintenance</option>
                <option value="loans">loans</option>
                <option value="fees">fees</option>
                <option value="entertainment">entertainment</option>
                <option value="shopping">shopping</option>
                <option value="miscellaneous">miscellaneous</option>
              </select>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Amount"
                  value={expenseAmount}
                  onChange={(event) => setExpenseAmount(event.target.value)}
                  required
                  style={{ flex: 2 }}
                />
                <select value={expenseCurrency} onChange={(event) => setExpenseCurrency(event.target.value)} style={{ flex: 1, minWidth: 80 }} required>
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="JPY">JPY (¥)</option>
                </select>
              </div>
              <label className="checkbox-row">
                <input type="checkbox" checked={isRecurringExpense} onChange={(event) => setIsRecurringExpense(event.target.checked)} />
                {' '}Is this a recurring expense?
              </label>
              {isRecurringExpense && (
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                  <label className="field-label">Start date</label>
                  <input type="date" value={recurrenceStartDate} onChange={(event) => setRecurrenceStartDate(event.target.value)} required={isRecurringExpense} />
                  <label className="field-label">Recurs every</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {recurrenceType === 'CUSTOM' && (
                      <input type="number" min="1" step="1" value={recurrenceInterval} onChange={(event) => setRecurrenceInterval(event.target.value)} style={{ flex: 1 }} placeholder="Days" />
                    )}
                    <select value={recurrenceType} onChange={(event) => {
                      const value = event.target.value as 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | 'CUSTOM'
                      setRecurrenceType(value)
                      if (value !== 'CUSTOM') setRecurrenceInterval('1')
                    }} style={{ flex: 2 }}>
                      <option value="DAILY">Day(s)</option>
                      <option value="WEEKLY">Week(s)</option>
                      <option value="MONTHLY">Month(s)</option>
                      <option value="YEARLY">Year(s)</option>
                      <option value="CUSTOM">Custom (N days)</option>
                    </select>
                  </div>
                  <label className="field-label">End date (optional)</label>
                  <input type="date" value={recurrenceEndDate} onChange={(event) => setRecurrenceEndDate(event.target.value)} />
                </div>
              )}
              <label className="field-label" style={{ marginTop: '0.25rem' }}>Expense type</label>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <label className="checkbox-row"><input type="radio" name="expType" checked={!isGroupExpense && !isFriendExpense} onChange={() => { setIsGroupExpense(false); setIsFriendExpense(false) }} /> Personal</label>
                <label className="checkbox-row"><input type="radio" name="expType" checked={isFriendExpense && !isGroupExpense} onChange={() => { setIsFriendExpense(true); setIsGroupExpense(false) }} /> Friend</label>
                <label className="checkbox-row"><input type="radio" name="expType" checked={isGroupExpense} onChange={() => { setIsGroupExpense(true); setIsFriendExpense(false) }} /> Group</label>
              </div>
              {isFriendExpense && !isGroupExpense && (
                <>
                  <label className="field-label">Select friend</label>
                  <select value={selectedFriendId} onChange={(event) => setSelectedFriendId(event.target.value)} required>
                    <option value="">Choose a friend</option>
                    {currentFriends.map((friend: any) => (
                      <option key={friend.id} value={friend.id}>{friend.name}</option>
                    ))}
                  </select>
                  {selectedFriendId && (
                    <>
                      <label className="field-label">Paid by</label>
                      <select value={expensePayerId || currentUserId} onChange={(event) => setExpensePayerId(event.target.value)}>
                        <option value={currentUserId}>{props.currentUser?.name || 'You'} (You)</option>
                        <option value={selectedFriendId}>{users.find((user: any) => user.id === selectedFriendId)?.name || 'Friend'}</option>
                      </select>
                    </>
                  )}
                </>
              )}
              {isGroupExpense && (
                <>
                  <select value={selectedGroupId} onChange={(event) => setSelectedGroupId(event.target.value)} required>
                    <option value="">Select group</option>
                    {filteredGroups.map((group: any) => (
                      <option key={group.id} value={group.id}>{group.name}</option>
                    ))}
                  </select>
                  {selectedGroupId && (
                    <>
                      <label className="field-label">Paid by</label>
                      <select value={expensePayerId || currentUserId} onChange={(event) => setExpensePayerId(event.target.value)}>
                        {(props.groups.find((group: any) => group.id === selectedGroupId)?.memberIds || []).map((memberId: string) => {
                          const member = users.find((user: any) => user.id === memberId)
                          return (
                            <option key={memberId} value={memberId}>
                              {member ? member.name : memberId}{memberId === currentUserId ? ' (You)' : ''}
                            </option>
                          )
                        })}
                      </select>
                    </>
                  )}
                </>
              )}
              {(isGroupExpense || isFriendExpense) && (
                <select value={splitMode} onChange={(event) => {
                  setSplitMode(event.target.value)
                  setCustomSplits({})
                }}>
                  <option value="equal">Divide equally</option>
                  <option value="unequal">Divide unequally</option>
                  <option value="percentage">Divide by percentage</option>
                </select>
              )}
              {splitMode === 'percentage' && (isGroupExpense || isFriendExpense) && (
                <div className="custom-splits-box">
                  <div className="custom-splits-title">Enter each person's percentage share:</div>
                  {(isGroupExpense ? props.groups.find((group: any) => group.id === selectedGroupId)?.memberIds : [currentUserId, selectedFriendId])?.filter(Boolean).map((memberId: string) => {
                    const member = users.find((user: any) => user.id === memberId)
                    return (
                      <div key={memberId} className="custom-split-row">
                        <span className="custom-split-name">{memberId === currentUserId ? 'You' : member?.name || memberId}</span>
                        <input type="number" min="0" max="100" step="0.1" placeholder="0.00" value={customSplits[memberId] || ''} onChange={(event) => setCustomSplits((previous: any) => ({ ...previous, [memberId]: event.target.value }))} />
                        <span className="custom-split-rupee">%</span>
                      </div>
                    )
                  })}
                  <div className={`splits-remaining ${props.remainingPercentage() === 0 ? 'splits-ok' : 'splits-off'}`}>
                    {props.remainingPercentage() === 0
                      ? '✓ Percentages add up to 100%!'
                      : props.remainingPercentage() > 0
                        ? `${props.remainingPercentage().toFixed(1)}% still to assign`
                        : `${Math.abs(props.remainingPercentage()).toFixed(1)}% over 100% — reduce someone's share`}
                  </div>
                </div>
              )}
              {splitMode === 'unequal' && (isGroupExpense || isFriendExpense) && (
                <div className="custom-splits-box">
                  <div className="custom-splits-title">Enter each person's share:</div>
                  {(isGroupExpense ? props.groups.find((group: any) => group.id === selectedGroupId)?.memberIds : [currentUserId, selectedFriendId])?.filter(Boolean).map((memberId: string) => {
                    const member = users.find((user: any) => user.id === memberId)
                    return (
                      <div key={memberId} className="custom-split-row">
                        <span className="custom-split-name">{memberId === currentUserId ? 'You' : member?.name || memberId}</span>
                        <input type="number" min="0" step="0.01" placeholder="0.00" value={customSplits[memberId] || ''} onChange={(event) => setCustomSplits((previous: any) => ({ ...previous, [memberId]: event.target.value }))} />
                        <span className="custom-split-rupee">₹</span>
                      </div>
                    )
                  })}
                  <div className={`splits-remaining ${props.remainingAmount() === 0 ? 'splits-ok' : 'splits-off'}`}>
                    {props.remainingAmount() === 0
                      ? '✓ Splits balanced!'
                      : props.remainingAmount() > 0
                        ? `₹${props.remainingAmount().toFixed(2)} still to assign`
                        : `₹${Math.abs(props.remainingAmount()).toFixed(2)} over total — reduce someone's share`}
                  </div>
                </div>
              )}
              <input type="url" placeholder="Image URL (bill / screenshot, optional)" value={props.expenseImageUrl} onChange={(event) => props.setExpenseImageUrl(event.target.value)} />
              <button type="submit">{editingExpense ? 'Update expense' : 'Add expense'}</button>
              {editingExpense && (
                <button type="button" onClick={() => {
                  setEditingExpense(null)
                  setExpenseDescription('')
                  setExpenseTag('miscellaneous')
                  setExpenseAmount('')
                  props.setExpenseImageUrl('')
                  setIsRecurringExpense(false)
                  setRecurrenceStartDate('')
                  setRecurrenceType('MONTHLY')
                  setRecurrenceInterval('1')
                  setRecurrenceEndDate('')
                }}>
                  Cancel edit
                </button>
              )}
            </form>
          </div>
        </div>
      )}
    </section>
  )
}
