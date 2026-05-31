/* eslint-disable @typescript-eslint/no-unused-expressions */
import './App.css'
import React, { useEffect, useState, useCallback } from 'react'
import AuthPage from './pages/AuthPage'
import DashboardPage from './pages/DashboardPage'
import ActivityPage from './pages/ActivityPage'
import AccountPage from './pages/AccountPage'
import ExpensesPage from './pages/ExpensesPage'
import FriendsPage from './pages/FriendsPage'
import GroupsPage from './pages/GroupsPage'

const API_BASE = import.meta.env.VITE_API_BASE_URL
  || import.meta.env.VITE_API_BASE_FALLBACK_URL
  || (import.meta.env.PROD
    ? 'https://splitwise-clone-gxkq.onrender.com/api'
    : 'http://localhost:8080/api')

const API_FALLBACK_BASE = (() => {
  const configuredFallback = import.meta.env.VITE_API_BASE_FALLBACK_URL || ''
  return configuredFallback && configuredFallback !== API_BASE ? configuredFallback : ''
})()

function toRequestTarget(input: RequestInfo | URL): string | null {
  if (typeof input === 'string') return input
  if (input instanceof URL) return input.toString()
  return null
}

function toFallbackTarget(input: RequestInfo | URL): string | null {
  if (!API_FALLBACK_BASE) return null
  const target = toRequestTarget(input)
  if (!target || !target.startsWith(API_BASE)) return null
  return target.replace(API_BASE, API_FALLBACK_BASE)
}

function isRetryableStatus(status: number): boolean {
  return status === 502 || status === 503 || status === 504
}

function isRetryableNetworkError(error: unknown): boolean {
  if (!(error instanceof Error)) return false
  return error.name === 'AbortError' || error.name === 'TypeError'
}

async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit = {}, timeoutMs = 20000) {
  const runFetch = async (target: RequestInfo | URL) => {
    const controller = new AbortController()
    const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs)
    try {
      return await fetch(target, { ...init, signal: controller.signal })
    } finally {
      window.clearTimeout(timeoutId)
    }
  }

  const fallbackTarget = toFallbackTarget(input)

  try {
    const primaryRes = await runFetch(input)
    if (fallbackTarget && isRetryableStatus(primaryRes.status)) {
      return await runFetch(fallbackTarget)
    }
    return primaryRes
  } catch (error) {
    if (fallbackTarget && isRetryableNetworkError(error)) {
      return await runFetch(fallbackTarget)
    }
    throw error
  }
}

const EXPENSE_CATEGORIES = [
  'groceries',
  'rent',
  'transport',
  'travel',
  'insurance',
  'investments',
  'utilities',
  'subscriptions',
  'health',
  'education',
  'childcare',
  'pets',
  'taxes',
  'gifts',
  'charity',
  'maintenance',
  'loans',
  'fees',
  'entertainment',
  'shopping',
  'miscellaneous',
] as const

type User = {
  id: string
  name: string
  email: string
  friendIds: string[]
  budgetPreferences?: Record<string, number>
  emailNotificationsEnabled: boolean
  settlementReminderEnabled?: boolean
  remainderDelays?: number
}

type Group = {
  id: string
  name: string
  ownerId: string
  memberIds: string[]
}

type ExpenseType = 'PERSONAL' | 'GROUP'

type Expense = {
  id: string
  description: string
  tag?: string
  amount: number
  currency: string
  payerId: string
  participantIds: string[]
  groupId?: string
  type: ExpenseType
  createdAt?: string
  createdBy?: string
  imageUrl?: string
  customSplits?: Record<string, number>
  isRecurring?: boolean
  recurring?: boolean
  recurrenceStartDate?: string
  recurrenceType?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | 'CUSTOM'
  recurrenceInterval?: number
  recurrenceEndDate?: string
  generatedFromRecurringId?: string
  recurrenceOccurrenceDate?: string
  flaggedBy?: string[]
  expenseStatus?: 'Settled' | 'Unsettled'
  settledByUser?: Record<string, boolean>
}

type Activity = {
  id: string
  description: string
  createdAt: string
}

type ActivityFilter = 'ALL' | 'EXPENSE' | 'SETTLEMENT' | 'GROUP' | 'FRIEND'
type ActivitySortOrder = 'NEWEST' | 'OLDEST'
type DashboardMixMode = 'TYPE' | 'CATEGORY'

type PendingInvitation = {
  id: string
  inviterUserId: string
  inviteeEmail: string
  inviteeName: string
  inviteeUserId?: string
  type: 'FRIEND' | 'GROUP'
  groupId?: string
  groupName?: string
  createdAt: string
}

type AppNotification = {
  id: string
  userId: string
  expenseId: string
  type: 'OWE' | 'OWED'
  message: string
  read?: boolean
  lastSent?: string
  createdAt?: string
}

type AuthResponse = {
  user: User
  token: string
}

type DashboardSummary = {
  totalOwedToUser: number
  totalUserOwes: number
  netBalance: number
  spentThisMonth: number
}

type BudgetPeriod = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY'

type BudgetSummary = {
  period: BudgetPeriod
  storageToken: string
  amount: number
  spent: number
  remaining: number
  rangeStart?: string
  rangeEnd?: string
  label?: string
}

function getBudgetPeriodMeta(period: BudgetPeriod, now: Date) {
  const year = now.getFullYear()
  const month = now.getMonth()
  const day = now.getDate()
  const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`

  if (period === 'DAILY') {
    const start = new Date(year, month, day)
    const end = new Date(year, month, day + 1)
    return {
      storageToken: dateKey,
      rangeStart: start,
      rangeEnd: end,
      label: now.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }),
      titleLabel: 'Daily',
      placeholder: 'Set daily budget',
    }
  }
  if (period === 'WEEKLY') {
    const start = new Date(year, month, day)
    const mondayOffset = (start.getDay() + 6) % 7
    start.setDate(start.getDate() - mondayOffset)
    const end = new Date(start)
    end.setDate(start.getDate() + 7)
    const startKey = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`
    const endLabel = new Date(end.getTime() - 1).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
    return {
      storageToken: startKey,
      rangeStart: start,
      rangeEnd: end,
      label: `${start.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} - ${endLabel}`,
      titleLabel: 'Weekly',
      placeholder: 'Set weekly budget',
    }
  }
  if (period === 'MONTHLY') {
    return {
      storageToken: `${year}-${String(month + 1).padStart(2, '0')}`,
      rangeStart: new Date(year, month, 1),
      rangeEnd: new Date(year, month + 1, 1),
      label: now.toLocaleString('default', { month: 'long', year: 'numeric' }),
      titleLabel: 'Monthly',
      placeholder: 'Set monthly budget',
    }
  }
  if (period === 'QUARTERLY') {
    const quarterIndex = Math.floor(month / 3)
    const quarter = quarterIndex + 1
    return {
      storageToken: `${year}-Q${quarter}`,
      rangeStart: new Date(year, quarterIndex * 3, 1),
      rangeEnd: new Date(year, quarterIndex * 3 + 3, 1),
      label: `Q${quarter} ${year}`,
      titleLabel: 'Quarterly',
      placeholder: 'Set quarterly budget',
    }
  }
  return {
    storageToken: String(year),
    rangeStart: new Date(year, 0, 1),
    rangeEnd: new Date(year + 1, 0, 1),
    label: String(year),
    titleLabel: 'Yearly',
    placeholder: 'Set yearly budget',
  }
}

function getPreviousPeriodDate(period: BudgetPeriod, now: Date) {
  const prev = new Date(now.getTime())
  switch (period) {
    case 'DAILY': prev.setDate(prev.getDate() - 1); return prev
    case 'WEEKLY': prev.setDate(prev.getDate() - 7); return prev
    case 'MONTHLY': prev.setMonth(prev.getMonth() - 1); return prev
    case 'QUARTERLY': prev.setMonth(prev.getMonth() - 3); return prev
    case 'YEARLY': prev.setFullYear(prev.getFullYear() - 1); return prev
    default: prev.setMonth(prev.getMonth() - 1); return prev
  }
}

function getCurrencySymbol(currency: string) {
  switch (currency) {
    case 'USD': return '$'
    case 'EUR': return '€'
    case 'GBP': return '£'
    case 'JPY': return '¥'
    case 'INR': return '₹'
    default: return currency
  }
}

function getSidebarIcon(tab: 'Home' | 'Groups' | 'Expenses' | 'Friends' | 'Activity' | 'Account') {
  const commonProps = {
    viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
    strokeWidth: 1.9, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
    className: 'sidebar-icon-svg', 'aria-hidden': true,
  }
  switch (tab) {
    case 'Home': return <svg {...commonProps}><path d="M3 10.5 12 4l9 6.5" /><path d="M5.5 9.5V20h13V9.5" /></svg>
    case 'Groups': return <svg {...commonProps}><circle cx="8" cy="9" r="2.5" /><circle cx="16.5" cy="8" r="2" /><path d="M4.5 18c.7-2.3 2.5-3.5 5-3.5s4.3 1.2 5 3.5" /><path d="M13.5 17c.4-1.6 1.7-2.5 3.5-2.5 1.3 0 2.3.4 3 .9" /></svg>
    case 'Expenses': return <svg {...commonProps}><rect x="5" y="4.5" width="14" height="15" rx="2.5" /><path d="M8.5 9h7" /><path d="M8.5 13h7" /><path d="M8.5 17h4" /></svg>
    case 'Friends': return <svg {...commonProps}><circle cx="9" cy="9" r="2.5" /><circle cx="16.5" cy="10" r="2.2" /><path d="M4.5 18c.8-2.4 2.7-3.7 5.2-3.7 2.4 0 4.2 1.2 5.1 3.3" /><path d="M14.2 17.4c.6-1.4 1.7-2.1 3.3-2.1 1.1 0 2 .2 2.8.8" /></svg>
    case 'Activity': return <svg {...commonProps}><circle cx="12" cy="12" r="8" /><path d="M12 7.8v4.7l3 1.9" /></svg>
    case 'Account': return <svg {...commonProps}><circle cx="12" cy="8.5" r="3" /><path d="M6 19c1.1-2.8 3.2-4.2 6-4.2s4.9 1.4 6 4.2" /></svg>
    default: return null
  }
}

function App() {
  const [editLogDisplayCount, setEditLogDisplayCount] = useState(3)
  const [currentUserId, setCurrentUserId] = useState<string>(() => localStorage.getItem('currentUserId') || '')
  const [selectedGroupId, setSelectedGroupId] = useState<string>('')
  const [users, setUsers] = useState<User[]>([])
  const [groupChats, setGroupChats] = useState<{ [groupId: string]: { user: string; message: string; timestamp: string }[] }>({})
  const [groupChatInputs, setGroupChatInputs] = useState<{ [groupId: string]: string }>({})
  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const [expenseChats, setExpenseChats] = useState<{ [expenseId: string]: { user: string; message: string; timestamp: string }[] }>({})
  const [expenseChatInputs, setExpenseChatInputs] = useState<{ [expenseId: string]: string }>({})
  const [showNotifications, setShowNotifications] = useState(false)
  const [showEditProfileModal, setShowEditProfileModal] = useState(false)
  const [editProfileName, setEditProfileName] = useState('')
  const [editProfileError, setEditProfileError] = useState('')
  const [editProfileSuccess, setEditProfileSuccess] = useState('')
  const [editProfileLoading, setEditProfileLoading] = useState(false)
  const [unreadNotifications, setUnreadNotifications] = useState<AppNotification[]>([])
  const [readNotifications, setReadNotifications] = useState<AppNotification[]>([])
  const [loadingNotifications, setLoadingNotifications] = useState(false)
  const [notificationError, setNotificationError] = useState('')
  const [readNotificationsPage, setReadNotificationsPage] = useState(0)
  const [hasMoreReadNotifications, setHasMoreReadNotifications] = useState(false)
  const [loadingMoreReadNotifications, setLoadingMoreReadNotifications] = useState(false)
  const [expensesPage, setExpensesPage] = useState(1)
  const EXPENSES_PAGE_SIZE = 10
  const WORKSPACE_EXPENSES_PAGE_SIZE = 10
  const [workspaceExpensesPage, setWorkspaceExpensesPage] = useState(1)

  const currentUser: User | null = users.find((u) => u.id === currentUserId) || null
  const currentUserName = currentUser?.name || 'You'

  const [dashboardSummary, setDashboardSummary] = useState<DashboardSummary | null>(null)
  const [dashboardLoading, setDashboardLoading] = useState(false)
  const [dashboardError, setDashboardError] = useState('')

  const [authToken, setAuthToken] = useState<string | null>(() => localStorage.getItem('authToken'))

  const authedFetch = React.useCallback(async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const headers = new Headers(init.headers || {})
    if (authToken) headers.set('Authorization', `Bearer ${authToken}`)
    headers.set('Content-Type', headers.get('Content-Type') || 'application/json')

    const runFetch = (target: RequestInfo | URL) => fetch(target, { ...init, headers })
    const fallbackTarget = toFallbackTarget(input)

    let res: Response
    try {
      res = await runFetch(input)
      if (fallbackTarget && isRetryableStatus(res.status)) {
        res = await runFetch(fallbackTarget)
      }
    } catch (error) {
      if (fallbackTarget && isRetryableNetworkError(error)) {
        res = await runFetch(fallbackTarget)
      } else {
        throw error
      }
    }

    if (res.status === 401) {
      localStorage.removeItem('authToken')
      localStorage.removeItem('currentUserId')
      setAuthToken(null)
      setCurrentUserId('')
    }
    return res
  }, [authToken])

  const fetchGroupChatMessages = React.useCallback(async (groupId: string | null) => {
    if (!groupId) return
    try {
      const res = await authedFetch(`${API_BASE}/chat/${groupId}`)
      if (!res.ok) return
      const data = await res.json()
      const mapped = Array.isArray(data)
        ? data.map((msg: { senderId: string; message: string; timestamp: string }) => ({
            user: users.find(u => u.id === msg.senderId)?.name || msg.senderId || 'Unknown',
            message: msg.message,
            timestamp: msg.timestamp,
          }))
        : []
      setGroupChats(prev => ({ ...prev, [groupId]: mapped }))
    } catch { /* ignore */ }
  }, [authedFetch, users])

  const fetchExpenseChatMessages = useCallback(async (expenseId: string | null, groupId?: string | null) => {
    if (!expenseId) return
    let gid = groupId
    if (!gid) {
      const exp = allGroupExpenses.find(e => e.id === expenseId) || personalExpenses.find(e => e.id === expenseId)
      gid = exp?.groupId || ''
    }
    if (!gid) return
    try {
      const res = await authedFetch(`${API_BASE}/chat/${gid}/expense/${expenseId}`)
      if (!res.ok) return
      const data = await res.json()
      const mapped = Array.isArray(data)
        ? data.map((msg: { senderId: string; message: string; timestamp: string }) => ({
            user: users.find(u => u.id === msg.senderId)?.name || msg.senderId || 'Unknown',
            message: msg.message,
            timestamp: msg.timestamp,
          }))
        : []
      setExpenseChats(prev => ({ ...prev, [expenseId]: mapped }))
    } catch { /* ignore */ }
  }, [authedFetch, users]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSendExpenseChatMessage(expenseId: string) {
    const input = expenseChatInputs[expenseId]?.trim()
    if (!input) return
    const exp = allGroupExpenses.find(e => e.id === expenseId) || personalExpenses.find(e => e.id === expenseId)
    const groupId = exp?.groupId
    if (!groupId) return
    try {
      const res = await authedFetch(`${API_BASE}/chat/${groupId}/expense/${expenseId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderId: currentUserId, message: input }),
      })
      if (res.ok) await fetchExpenseChatMessages(expenseId, groupId)
    } catch { /* ignore */ }
    setExpenseChatInputs(prev => ({ ...prev, [expenseId]: '' }))
  }

  async function handleSendGroupChatMessage(groupId: string) {
    const input = groupChatInputs[groupId]?.trim()
    if (!input) return
    try {
      const res = await authedFetch(`${API_BASE}/chat/${groupId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderId: currentUserId, message: input }),
      })
      if (res.ok) await fetchGroupChatMessages(groupId)
    } catch { /* ignore */ }
    setGroupChatInputs(prev => ({ ...prev, [groupId]: '' }))
  }

  function resetExpenseForm() {
    setExpenseDescription(''); setExpenseTag('miscellaneous'); setExpenseAmount('')
    setExpenseCurrency('INR'); setIsGroupExpense(false); setIsFriendExpense(false)
    setSelectedFriendId(''); setExpenseImageUrl(''); setExpensePayerId('')
    setSplitMode('equal'); setCustomSplits({}); setIsRecurringExpense(false)
    setRecurrenceStartDate(''); setRecurrenceType('MONTHLY')
    setRecurrenceInterval('1'); setRecurrenceEndDate(''); setSelectedGroupId('')
  }

  const [theme, setTheme] = useState<'dark' | 'light'>(() => localStorage.getItem('theme') === 'light' ? 'light' : 'dark')
  const [groups, setGroups] = useState<Group[]>([])
  const [personalExpenses, setPersonalExpenses] = useState<Expense[]>([])
  const [groupExpenses, setGroupExpenses] = useState<Expense[]>([])
  const [allGroupExpenses, setAllGroupExpenses] = useState<Expense[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [activityPage, setActivityPage] = useState(0)
  const [activityHasMore, setActivityHasMore] = useState(true)
  const [activityFilterLoading, setActivityFilterLoading] = useState(false)
  const [expenseDetailView, setExpenseDetailView] = useState<Expense | null>(null)
  const [friendBalances, setFriendBalances] = useState<{ [friendId: string]: number }>({})

  const [friendNameToAdd, setFriendNameToAdd] = useState('')
  const [friendEmailToAdd, setFriendEmailToAdd] = useState('')
  const [friendAddError, setFriendAddError] = useState('')
  const [friendAddSuccess, setFriendAddSuccess] = useState('')
  const [groupName, setGroupName] = useState('')
  const [groupMemberIds, setGroupMemberIds] = useState<string[]>([])
  const [showCreateGroupPanel, setShowCreateGroupPanel] = useState(false)
  const [expenseDescription, setExpenseDescription] = useState('')
  const [expenseTag, setExpenseTag] = useState('miscellaneous')
  const [expenseAmount, setExpenseAmount] = useState('')
  const [expenseCurrency, setExpenseCurrency] = useState('INR')
  const [isGroupExpense, setIsGroupExpense] = useState(false)
  const [isFriendExpense, setIsFriendExpense] = useState(false)
  const [selectedFriendId, setSelectedFriendId] = useState('')
  const [expenseImageUrl, setExpenseImageUrl] = useState('')
  const [expensePayerId, setExpensePayerId] = useState('')
  const [splitMode, setSplitMode] = useState<'equal' | 'unequal' | 'percentage'>('equal')
  const [customSplits, setCustomSplits] = useState<Record<string, string>>({})
  const [isRecurringExpense, setIsRecurringExpense] = useState(false)
  const [recurrenceStartDate, setRecurrenceStartDate] = useState('')
  const [recurrenceType, setRecurrenceType] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | 'CUSTOM'>('MONTHLY')
  const [recurrenceInterval, setRecurrenceInterval] = useState('1')
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('')

  type ExpenseEditLog = { id?: string; editedBy: string; editTime: string; oldValues: Record<string, unknown>; newValues: Record<string, unknown>; reason: string }
  const [expenseEditLogs, setExpenseEditLogs] = useState<{ [expenseId: string]: ExpenseEditLog[] }>({})
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [expenseViewFilter, setExpenseViewFilter] = useState<'ALL' | 'PERSONAL' | 'GROUP' | 'UNSETTLED' | 'RECURRING' | 'FLAGGED'>('ALL')
  const [activeTab, setActiveTab] = useState<'Home' | 'Groups' | 'Expenses' | 'Friends' | 'Activity' | 'Account'>('Home')
  const [groupDetailView, setGroupDetailView] = useState<string | null>(null)
  const [friendDetailView, setFriendDetailView] = useState<string | null>(null)
  const [showQuickGroupChat, setShowQuickGroupChat] = useState(false)
  const [quickChatGroupId, setQuickChatGroupId] = useState('')
  const [groupSearch, setGroupSearch] = useState('')
  const [friendSearch, setFriendSearch] = useState('')
  const [workspaceExpenseSearch, setWorkspaceExpenseSearch] = useState('')
  const [workspaceExpenseStatusFilter, setWorkspaceExpenseStatusFilter] = useState<'ALL' | 'SETTLED' | 'UNSETTLED'>('ALL')
  const [workspaceExpenseDateFilter, setWorkspaceExpenseDateFilter] = useState<'ALL' | '7_DAYS' | '30_DAYS' | '90_DAYS'>('ALL')
  const [activitySearch, setActivitySearch] = useState('')
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>('ALL')
  const [activitySortOrder, setActivitySortOrder] = useState<ActivitySortOrder>('NEWEST')
  const [dashboardPeriod, setDashboardPeriod] = useState<BudgetPeriod>('MONTHLY')
  const [dashboardMixMode, setDashboardMixMode] = useState<DashboardMixMode>('TYPE')
  const [dashboardBudgetAmount, setDashboardBudgetAmount] = useState<number>(0)
  const [selectedBudgetPeriod, setSelectedBudgetPeriod] = useState<BudgetPeriod>('MONTHLY')
  const [budgetInput, setBudgetInput] = useState('')
  const [budgetAmount, setBudgetAmount] = useState<number>(0)
  const [budgetSummaries, setBudgetSummaries] = useState<BudgetSummary[]>([])
  const [defaultCurrency, setDefaultCurrency] = useState(() => localStorage.getItem('defaultCurrency') || 'INR')
  const [exchangeRates, setExchangeRates] = useState<{ [key: string]: number }>({ INR: 1 })
  const [budgetSummaryCurrency, setBudgetSummaryCurrency] = useState<string>(defaultCurrency)
  const [settlementRemindersEnabled, setSettlementRemindersEnabled] = useState(true)
  const [reminderDelayDays, setReminderDelayDays] = useState<'3' | '5' | '7'>('5')
  const [defaultSplitMethod, setDefaultSplitMethod] = useState<'equal' | 'unequal' | 'percentage'>('equal')
  const [accountThemePreference, setAccountThemePreference] = useState<'light' | 'dark' | 'system'>('system')
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [passwordChangeError, setPasswordChangeError] = useState('')
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState('')
  const [passwordChangeLoading, setPasswordChangeLoading] = useState(false)
  const [editingFriend, setEditingFriend] = useState<User | null>(null)
  const [editFriendName, setEditFriendName] = useState('')
  const [editFriendEmail, setEditFriendEmail] = useState('')
  const [editingGroup, setEditingGroup] = useState<Group | null>(null)
  const [editGroupName, setEditGroupName] = useState('')
  const [editGroupMemberIds, setEditGroupMemberIds] = useState<string[]>([])
  const [signupName, setSignupName] = useState('')
  const [signupEmail, setSignupEmail] = useState('')
  const [signupPassword, setSignupPassword] = useState('')
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [signupLoading, setSignupLoading] = useState(false)
  const [signupError, setSignupError] = useState('')
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([])
  const [groupInvitations, setGroupInvitations] = useState<PendingInvitation[]>([])
  const [friendInvitations, setFriendInvitations] = useState<PendingInvitation[]>([])

  const isAuthenticated = !!authToken

  const dashboardPeriodMeta = getBudgetPeriodMeta(dashboardPeriod, new Date())
  const dashboardBudgetStorageKey = `budget:${dashboardPeriod}:${dashboardPeriodMeta.storageToken}`
  const budgetPeriodMeta = getBudgetPeriodMeta(selectedBudgetPeriod, new Date())
  const budgetStorageKey = `budget:${selectedBudgetPeriod}:${budgetPeriodMeta.storageToken}`

  // ── Effects ──────────────────────────────────────────────────────────────

  useEffect(() => { setEditLogDisplayCount(3) }, [expenseDetailView])
  useEffect(() => { setWorkspaceExpenseSearch(''); setWorkspaceExpenseStatusFilter('ALL'); setWorkspaceExpenseDateFilter('ALL') }, [groupDetailView, friendDetailView])
  useEffect(() => { setWorkspaceExpensesPage(1) }, [groupDetailView, friendDetailView])
  useEffect(() => { setExpensesPage(1) }, [expenseViewFilter])
  useEffect(() => { localStorage.setItem('theme', theme) }, [theme])
  useEffect(() => { localStorage.setItem('defaultCurrency', defaultCurrency) }, [defaultCurrency])

  useEffect(() => {
    const needsRates = defaultCurrency !== 'INR' || budgetSummaryCurrency !== 'INR'
    if (!needsRates) { setExchangeRates({ INR: 1 }); return }
    let mounted = true
    fetch('https://api.exchangerate-api.com/v4/latest/INR')
      .then(r => r.json())
      .then(data => { if (mounted && data?.rates) setExchangeRates(data.rates) })
      .catch(() => { if (mounted) setExchangeRates({ INR: 1 }) })
    return () => { mounted = false }
  }, [defaultCurrency, budgetSummaryCurrency])

  useEffect(() => {
    const storageToken = dashboardBudgetStorageKey.split(':').pop() || ''
    const summary = budgetSummaries.find(s => s.period === dashboardPeriod && s.storageToken === storageToken)
    const amt = summary ? summary.amount : (currentUser?.budgetPreferences?.[dashboardBudgetStorageKey] ?? 0)
    setDashboardBudgetAmount(Number.isFinite(amt) ? amt : 0)
  }, [dashboardBudgetStorageKey, currentUser, budgetSummaries, dashboardPeriod])

  useEffect(() => {
    const storageToken = budgetPeriodMeta.storageToken
    const summary = budgetSummaries.find(s => s.period === selectedBudgetPeriod && s.storageToken === storageToken)
    const amt = summary ? summary.amount : (currentUser?.budgetPreferences?.[budgetStorageKey] ?? 0)
    const parsed = Number(amt)
    setBudgetAmount(Number.isFinite(parsed) ? parsed : 0)
    setBudgetInput(Number.isFinite(parsed) && parsed > 0 ? String(parsed) : '')
  }, [budgetStorageKey, currentUser, budgetSummaries, selectedBudgetPeriod, budgetPeriodMeta.storageToken])

  useEffect(() => {
    if (!budgetAmount || budgetAmount <= 0) { setBudgetInput(''); return }
    try {
      const converted = convertINR(budgetAmount, budgetSummaryCurrency)
      setBudgetInput(Number.isFinite(converted) ? String(converted.toFixed(2)) : '')
    } catch { setBudgetInput(budgetAmount ? String(budgetAmount) : '') }
  }, [budgetSummaryCurrency, budgetAmount, exchangeRates]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!currentUser) return
    const nextPrefs = { ...(currentUser.budgetPreferences || {}) }
    let hasChanges = false
    const migrate = (key: string, period: BudgetPeriod, meta: ReturnType<typeof getBudgetPeriodMeta>) => {
      if (nextPrefs[key] != null) return
      const legacy = localStorage.getItem(`budget:${period}:${currentUser.id}:${meta.storageToken}`)
      const parsed = legacy ? Number(legacy) : 0
      if (Number.isFinite(parsed) && parsed > 0) { nextPrefs[key] = parsed; hasChanges = true; return }
      const prevMeta = getBudgetPeriodMeta(period, getPreviousPeriodDate(period, new Date()))
      const prevVal = nextPrefs[`budget:${period}:${prevMeta.storageToken}`]
      if (Number.isFinite(prevVal) && prevVal > 0) { nextPrefs[key] = prevVal; hasChanges = true }
    }
    migrate(dashboardBudgetStorageKey, dashboardPeriod, dashboardPeriodMeta)
    migrate(budgetStorageKey, selectedBudgetPeriod, budgetPeriodMeta)
    if (!hasChanges) return
    void authedFetch(`${API_BASE}/users/${currentUser.id}`, {
      method: 'PUT',
      body: JSON.stringify({ ...currentUser, budgetPreferences: nextPrefs }),
    }).then(res => {
      if (!res.ok) return
      res.json().then((u: User) => setUsers(prev => prev.map(x => x.id === u.id ? u : x)))
    })
  }, [authedFetch, budgetPeriodMeta.storageToken, budgetStorageKey, currentUser, dashboardBudgetStorageKey, dashboardPeriod, dashboardPeriodMeta.storageToken, selectedBudgetPeriod]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!showQuickGroupChat || quickChatGroupId) return
    const available = groupDetailView
      ? groups.find(g => g.id === groupDetailView)
      : groups.find(g => (g.memberIds || []).includes(currentUserId))
    if (available) setQuickChatGroupId(available.id)
  }, [showQuickGroupChat, quickChatGroupId, groups, currentUserId, groupDetailView])

  useEffect(() => {
    if (!groupDetailView) return
    let stopped = false
    async function poll() { await fetchGroupChatMessages(groupDetailView); if (!stopped) setTimeout(poll, 3000) }
    poll()
    return () => { stopped = true }
  }, [groupDetailView, fetchGroupChatMessages])

  useEffect(() => {
    if (!showQuickGroupChat || !quickChatGroupId) return
    let stopped = false
    async function poll() { await fetchGroupChatMessages(quickChatGroupId); if (!stopped) setTimeout(poll, 3000) }
    poll()
    return () => { stopped = true }
  }, [showQuickGroupChat, quickChatGroupId, fetchGroupChatMessages])

  useEffect(() => {
    const expense = editingExpense || expenseDetailView
    if (!(showExpenseModal && editingExpense) && !expenseDetailView) return
    let stopped = false
    async function poll() {
      if (expense) await fetchExpenseChatMessages(expense.id, expense.groupId)
      if (!stopped) setTimeout(poll, 3000)
    }
    poll()
    return () => { stopped = true }
  }, [showExpenseModal, editingExpense, expenseDetailView, fetchExpenseChatMessages])

  useEffect(() => {
    if (!currentUser) return
    setSettlementRemindersEnabled(currentUser.settlementReminderEnabled ?? true)
    const d = currentUser.remainderDelays
    setReminderDelayDays((d === 3 || d === 5 || d === 7) ? String(d) as '3' | '5' | '7' : '5')
  }, [currentUser])

  useEffect(() => {
    if (activeTab === 'Home' && isAuthenticated && currentUserId) fetchDashboardSummary()
  }, [activeTab, isAuthenticated, currentUserId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (activeTab === 'Friends' && isAuthenticated && currentUserId) fetchFriendBalances()
  }, [activeTab, isAuthenticated, currentUserId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (authToken) fetchUsers()
  }, [authToken]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (authToken && currentUserId) {
      ;(async () => {
        await fetchPersonalExpenses(currentUserId)
        setActivityPage(0)
        await fetchActivities(currentUserId, 0, false)
        await fetchGroups()
        await fetchPendingInvitations()
        await fetchGroupInvitations()
        await fetchFriendInvitations()
        await fetchAllGroupExpenses()
      })()
    }
  }, [authToken, currentUserId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!authToken || !currentUserId || activityFilter === 'ALL') return
    let cancelled = false
    ;(async () => {
      setActivityFilterLoading(true)
      setActivityPage(0)
      setActivities([])
      let matchesFound = 0, lastPage = 0
      for (let page = 0; page < 12 && !cancelled; page++) {
        const data = await fetchActivities(currentUserId, page, page !== 0)
        lastPage = page
        if (!data) break
        matchesFound += data.filter(a => getActivityCategory(a) === activityFilter).length
        if (matchesFound >= 3 || !activityHasMore) break
      }
      setActivityPage(lastPage)
      setActivityFilterLoading(false)
    })()
    return () => { cancelled = true }
  }, [activityFilter, authToken, currentUserId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (selectedGroupId) fetchGroupExpenses(selectedGroupId)
  }, [selectedGroupId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (expenseDetailView) fetchExpenseEditLogs(expenseDetailView.id)
  }, [expenseDetailView]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!currentUserId) { setUnreadNotifications([]); setReadNotifications([]); setNotificationError(''); return }
    void fetchNotifications(false, true)
  }, [currentUserId, defaultCurrency]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!showNotifications || unreadNotifications.length === 0) return
    const ids = unreadNotifications.filter(n => n?.id && !n.read).map(n => n.id)
    if (!ids.length) return
    const timer = setTimeout(() => {
      setReadNotifications(prev => [...unreadNotifications.map(n => ({ ...n, read: true })), ...prev])
      setUnreadNotifications([])
      void markNotificationsAsRead(ids)
    }, 900)
    return () => clearTimeout(timer)
  }, [showNotifications, unreadNotifications]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Helpers ───────────────────────────────────────────────────────────────

  function convertINR(amount: number, toCurrency: string): number {
    return amount * (exchangeRates[toCurrency] || 1)
  }

  function equalShare(expense: Expense): number {
    return Math.round((expense.amount / (expense.participantIds?.length || 1)) * 100) / 100
  }

  function userShare(expense: Expense, userId: string = currentUserId): number {
    return expense.customSplits?.[userId] != null ? expense.customSplits[userId] : equalShare(expense)
  }

  function expenseAmountForCurrentUser(expense: Expense): number {
    if (expense.type === 'GROUP' && (expense.participantIds || []).includes(currentUserId)) return userShare(expense)
    if (expense.type === 'PERSONAL' && expense.payerId === currentUserId) return expense.amount
    return 0
  }

  function isExpenseUnsettledForCurrentUser(expense: Expense): boolean {
    const participants = expense.participantIds || []
    if (participants.length < 2 || !participants.includes(currentUserId)) return false
    if (expense.payerId === currentUserId) return expense.expenseStatus !== 'Settled'
    return !expense.settledByUser?.[currentUserId]
  }

  function othersOweTotal(expense: Expense): number {
    return expense.amount - userShare(expense, expense.payerId)
  }

  function shareLabel(expense: Expense): string {
    if (expense.customSplits) {
      const values = Object.values(expense.customSplits)
      if (values.length > 0) {
        const first = Number(values[0])
        if (!values.every(v => Math.abs(Number(v) - first) < 0.01)) return 'Custom split'
      }
    }
    return `Equal share: ${getCurrencySymbol(expense.currency)}${equalShare(expense).toFixed(2)} per person`
  }

  function remainingAmount(): number {
    const total = parseFloat(expenseAmount) || 0
    return Math.round((total - Object.values(customSplits).reduce((s, v) => s + (parseFloat(v) || 0), 0)) * 100) / 100
  }

  function remainingPercentage(): number {
    return 100 - Object.values(customSplits).reduce((s, v) => s + (parseFloat(v) || 0), 0)
  }

  function payerName(payerId: string): string {
    return users.find(u => u.id === payerId)?.name || 'Unknown'
  }

  function getInitials(name: string): string {
    return name.split(' ').filter(Boolean).slice(0, 2).map(p => p[0]?.toUpperCase() || '').join('') || '?'
  }

  function normalizeExpenseTag(tag?: string): string {
    const normalized = (tag || '').trim().toLowerCase()
    if (!normalized) return 'miscellaneous'
    if ((EXPENSE_CATEGORIES as readonly string[]).includes(normalized)) return normalized

    const legacyMap: Record<string, string> = {
      'food & drinks': 'groceries',
      food: 'groceries',
      travel: 'transport',
      bills: 'utilities',
      subsciptions: 'subscriptions',
      others: 'miscellaneous',
    }
    return legacyMap[normalized] || 'miscellaneous'
  }

  function inferExpenseCategory(description: string): string {
    const text = description.toLowerCase()
    if (/(grocery|groceries|food|drink|dinner|lunch|breakfast|coffee|cafe|restaurant|meal|snack)/.test(text)) return 'groceries'
    if (/(rent|lease|landlord)/.test(text)) return 'rent'
    if (/(travel|trip|flight|train|bus|cab|taxi|uber|ola|fuel|petrol)/.test(text)) return 'travel'
    if (/(insurance|premium|policy)/.test(text)) return 'insurance'
    if (/(invest|investment|mutual|stock|sip|fd)/.test(text)) return 'investments'
    if (/(bill|electric|water|wifi|internet|utility|gas)/.test(text)) return 'utilities'
    if (/(subscription|subsciption|netflix|spotify|prime|membership|saas)/.test(text)) return 'subscriptions'
    if (/(health|doctor|medical|medicine|pharmacy|hospital|clinic)/.test(text)) return 'health'
    if (/(education|school|college|tuition|course|class|exam|books?)/.test(text)) return 'education'
    if (/(child|childcare|daycare|babysit|nanny)/.test(text)) return 'childcare'
    if (/(pet|veterinary|vet|dog|cat|grooming)/.test(text)) return 'pets'
    if (/(tax|taxes|gst|income tax|property tax)/.test(text)) return 'taxes'
    if (/(gift|gifts|present|birthday gift|anniversary gift)/.test(text)) return 'gifts'
    if (/(charity|donation|donate|zakat|tithe)/.test(text)) return 'charity'
    if (/(maintenance|repair|servicing|service charge|upkeep)/.test(text)) return 'maintenance'
    if (/(loan|emi|debt|repayment|installment)/.test(text)) return 'loans'
    if (/(fee|fees|bank charge|platform fee|processing fee)/.test(text)) return 'fees'
    if (/(movie|game|party|concert|fun|entertainment)/.test(text)) return 'entertainment'
    if (/(shop|shopping|mall|cloth|dress|shoe|amazon|flipkart|gadget)/.test(text)) return 'shopping'
    return 'miscellaneous'
  }

  function getExpenseCategory(expense: Expense): string {
    return expense.tag?.trim() ? normalizeExpenseTag(expense.tag) : inferExpenseCategory(expense.description)
  }

  function getCategoryColor(index: number): string {
    return ['#6f42d9', '#3b82f6', '#d946b1', '#34d399', '#fbbf24', '#f97316'][index % 6]
  }

  function getActivityCategory(activity: Activity): Exclude<ActivityFilter, 'ALL'> {
    const d = activity.description.toLowerCase()
    if (d.includes('settle') || d.includes('you owe') || d.includes('owes you')) return 'SETTLEMENT'
    if (d.includes('group')) return 'GROUP'
    if (d.includes('friend')) return 'FRIEND'
    return 'EXPENSE'
  }

  function getActivityTone(activity: Activity): 'positive' | 'negative' | 'neutral' {
    const d = activity.description.toLowerCase()
    if (d.includes('owes you') || d.includes('received') || d.includes('added')) return 'positive'
    if (d.includes('you owe') || d.includes('removed') || d.includes('deleted')) return 'negative'
    return 'neutral'
  }

  function getActivityBadge(activity: Activity): string {
    const cat = getActivityCategory(activity)
    if (cat === 'SETTLEMENT') return 'ST'
    if (cat === 'GROUP') return 'GR'
    if (cat === 'FRIEND') return 'FR'
    return 'EX'
  }

  function formatRelativeTime(iso?: string) {
    if (!iso) return ''
    const diffMs = Date.now() - new Date(iso).getTime()
    const diffMin = Math.max(1, Math.floor(diffMs / 60000))
    if (diffMin < 60) return `${diffMin} min ago`
    const diffHours = Math.floor(diffMin / 60)
    if (diffHours < 24) return `${diffHours} hr ago`
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`
  }

  function getOutstandingShareForParticipant(expense: Expense, participantId: string): number {
    if (participantId === expense.payerId || expense.settledByUser?.[participantId]) return 0
    return userShare(expense, participantId)
  }

  function getParticipantNetBalance(expenses: Expense[], participantId: string): number {
    return expenses.reduce((net, expense) => {
      const participants = expense.participantIds || []
      if (!participants.includes(currentUserId) || !participants.includes(participantId)) return net
      if (expense.payerId === currentUserId) return net + getOutstandingShareForParticipant(expense, participantId)
      if (expense.payerId === participantId) return net - getOutstandingShareForParticipant(expense, currentUserId)
      return net
    }, 0)
  }

  // ── API calls ─────────────────────────────────────────────────────────────

  const fetchUserBudgets = React.useCallback(async (userId?: string) => {
    if (!userId) return
    try {
      const res = await authedFetch(`${API_BASE}/users/${userId}/budgets`)
      if (res.ok) setBudgetSummaries(await res.json())
    } catch { /* ignore */ }
  }, [authedFetch])

  const fetchUsers = React.useCallback(async () => {
    try {
      const res = await authedFetch(`${API_BASE}/users`)
      if (!res.ok) return
      const data = await res.json()
      setUsers(Array.isArray(data) ? data : [])
      if (!currentUserId && data.length > 0) setCurrentUserId(data[0].id)
    } catch { /* ignore */ }
  }, [authedFetch, currentUserId])

  const fetchExpenseEditLogs = React.useCallback(async (expenseId: string) => {
  try {
    const res = await authedFetch(`${API_BASE}/expense-edit-logs/${expenseId}`)
    if (res.ok) {
      const logs = await res.json()
      setExpenseEditLogs(prev => ({ ...prev, [expenseId]: logs }))
    }
  } catch {
    /* ignore */
  }
}, [authedFetch])

  async function fetchFriendBalances() {
    if (!currentUserId) return
    const res = await authedFetch(`${API_BASE}/users/${currentUserId}/friend-balances`)
    if (res.ok) setFriendBalances(await res.json())
  }

  async function fetchGroups() {
    try {
      const url = currentUserId ? `${API_BASE}/groups?userId=${currentUserId}` : `${API_BASE}/groups`
      const res = await authedFetch(url)
      if (res.ok) setGroups(await res.json())
    } catch { /* ignore */ }
  }

  async function fetchGroupInvitations() {
    if (!currentUserId || !authToken) return
    try {
      const res = await authedFetch(`${API_BASE}/groups/invitations/${currentUserId}`)
      if (res.ok) setGroupInvitations(await res.json())
    } catch { /* ignore */ }
  }

  const fetchGroupExpenses = React.useCallback(async (groupId: string) => {
    try {
      const res = await authedFetch(`${API_BASE}/expenses/group/${groupId}`)
      if (res.ok) setGroupExpenses(await res.json())
    } catch { /* ignore */ }
  }, [authedFetch])

  const fetchPersonalExpenses = React.useCallback(async (userId: string) => {
    try {
      const res = await authedFetch(`${API_BASE}/expenses/personal/${userId}`)
      if (res.ok) setPersonalExpenses(await res.json())
    } catch { /* ignore */ }
  }, [authedFetch])

  const fetchAllGroupExpenses = React.useCallback(async () => {
    try {
      const res = await authedFetch(`${API_BASE}/groups?userId=${currentUserId}`)
      if (!res.ok) return
      const grps: Group[] = await res.json()
      const all: Expense[] = []
      for (const g of grps) {
        const r = await authedFetch(`${API_BASE}/expenses/group/${g.id}`)
        if (r.ok) { const d = await r.json(); if (Array.isArray(d)) all.push(...d) }
      }
      setAllGroupExpenses(all)
    } catch { /* ignore */ }
  }, [authedFetch, currentUserId])

  async function fetchActivities(userId: string, page = 0, append = false): Promise<Activity[] | undefined> {
    try {
      const res = await authedFetch(`${API_BASE}/activities/${userId}?page=${page}&size=20`)
      if (!res.ok) return undefined
      const data = await res.json()
      if (Array.isArray(data)) {
        append ? setActivities(prev => [...prev, ...data]) : setActivities(data)
        setActivityHasMore(data.length === 20)
        return data
      }
      if (!append) setActivities([])
      setActivityHasMore(false)
      return []
    } catch { return undefined }
  }

  async function fetchPendingInvitations() {
    if (!currentUserId || !authToken) return
    try {
      const res = await authedFetch(`${API_BASE}/users/${currentUserId}/invitations`)
      if (res.ok) setPendingInvitations(await res.json())
    } catch { /* ignore */ }
  }

  async function fetchFriendInvitations() {
    if (!currentUserId || !authToken) return
    try {
      const res = await authedFetch(`${API_BASE}/users/${currentUserId}/friend-invitations`)
      if (res.ok) setFriendInvitations(await res.json())
    } catch { /* ignore */ }
  }

  async function fetchDashboardSummary() {
    if (!currentUserId) return
    setDashboardLoading(true); setDashboardError('')
    try {
      const res = await authedFetch(`${API_BASE}/dashboard/summary/${currentUserId}`)
      res.ok ? setDashboardSummary(await res.json()) : setDashboardError('Failed to fetch dashboard summary')
    } catch { setDashboardError('Could not reach server') }
    finally { setDashboardLoading(false) }
  }

  // ── Auth handlers ─────────────────────────────────────────────────────────

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault(); setSignupError('')
    setSignupLoading(true)
    try {
      const res = await fetchWithTimeout(`${API_BASE}/auth/signup`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: signupName, email: signupEmail, password: signupPassword }),
      })
      if (res.ok) {
        const data: AuthResponse = await res.json()
        localStorage.setItem('authToken', data.token); localStorage.setItem('currentUserId', data.user.id)
        setAuthToken(data.token); setSignupName(''); setSignupEmail(''); setSignupPassword('')
        setUsers([data.user]); setCurrentUserId(data.user.id)
      } else {
        const message = await res.text().catch(() => '')
        setSignupError(res.status === 409 ? 'User with this email already exists' : message || `Signup failed (${res.status})`)
      }
    } catch (error) {
      setSignupError(error instanceof DOMException && error.name === 'AbortError'
        ? 'Signup request timed out. The server may be waking up - try again.'
        : 'Could not reach server')
    }
    finally { setSignupLoading(false) }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault(); setLoginError('')
    setLoginLoading(true)
    try {
      const res = await fetchWithTimeout(`${API_BASE}/auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      })
      if (res.ok) {
        const data: AuthResponse = await res.json()
        localStorage.setItem('authToken', data.token); localStorage.setItem('currentUserId', data.user.id)
        setAuthToken(data.token); setLoginEmail(''); setLoginPassword('')
        setUsers([data.user]); setCurrentUserId(data.user.id)
      } else {
        const message = await res.text().catch(() => '')
        setLoginError(res.status === 401 ? 'Invalid email or password' : message || `Login failed (${res.status})`)
      }
    } catch (error) {
      setLoginError(error instanceof DOMException && error.name === 'AbortError'
        ? 'Login request timed out. The server may be waking up - try again.'
        : 'Could not reach server')
    }
    finally { setLoginLoading(false) }
  }

  // ── Expense handlers ──────────────────────────────────────────────────────

  async function handleSaveExpense(e: React.FormEvent) {
    e.preventDefault()
    if (!currentUserId || !expenseDescription || !expenseAmount) return
    let resolvedGroupId: string | undefined = isGroupExpense ? selectedGroupId : undefined
    if (isFriendExpense && selectedFriendId && !isGroupExpense) {
      let existingGroup = groups.find(g => g.memberIds.length === 2 && g.memberIds.includes(currentUserId) && g.memberIds.includes(selectedFriendId))
      if (!existingGroup) {
        const friend = users.find(u => u.id === selectedFriendId)
        const res = await authedFetch(`${API_BASE}/groups`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: `${currentUser?.name || 'You'} & ${friend?.name || 'Friend'}`, ownerId: currentUserId, memberIds: [currentUserId, selectedFriendId] }),
        })
        if (res.ok) { existingGroup = await res.json(); await fetchGroups() } else return
      }
      resolvedGroupId = existingGroup!.id
    }
    const useGroup = isGroupExpense || isFriendExpense
    const payer = useGroup && expensePayerId ? expensePayerId : currentUserId
    const payload: Record<string, unknown> = {
      description: expenseDescription, tag: normalizeExpenseTag(expenseTag),
      amount: parseFloat(expenseAmount), currency: expenseCurrency, payerId: payer,
      createdBy: editingExpense ? editingExpense.createdBy : currentUserId,
      participantIds: useGroup && resolvedGroupId
        ? (isFriendExpense && !isGroupExpense ? [currentUserId, selectedFriendId] : groups.find(g => g.id === resolvedGroupId)?.memberIds ?? [currentUserId])
        : [currentUserId],
      groupId: resolvedGroupId, type: useGroup ? 'GROUP' : 'PERSONAL',
      imageUrl: expenseImageUrl || undefined,
      customSplits: splitMode === 'unequal'
        ? Object.fromEntries(Object.entries(customSplits).map(([k, v]) => [k, parseFloat(v) || 0]))
        : splitMode === 'percentage'
        ? Object.fromEntries(Object.entries(customSplits).map(([k, v]) => {
            const pct = parseFloat(v) || 0
            return [k, Math.round((pct / 100) * parseFloat(expenseAmount) * 100) / 100]
          }))
        : undefined,
      isRecurring: isRecurringExpense,
      recurrenceStartDate: isRecurringExpense && recurrenceStartDate ? new Date(`${recurrenceStartDate}T00:00:00.000Z`).toISOString() : undefined,
      recurrenceType: isRecurringExpense ? recurrenceType.toUpperCase() : undefined,
      recurrenceInterval: isRecurringExpense ? Math.max(1, parseInt(recurrenceInterval || '1', 10)) : undefined,
      recurrenceEndDate: isRecurringExpense && recurrenceEndDate ? new Date(`${recurrenceEndDate}T00:00:00.000Z`).toISOString() : undefined,
    }
    if (editingExpense) payload.id = editingExpense.id
    const res = await authedFetch(
      editingExpense ? `${API_BASE}/expenses/${editingExpense.id}` : `${API_BASE}/expenses`,
      { method: editingExpense ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }
    )
    if (res.ok) {
      resetExpenseForm(); setEditingExpense(null)
      await fetchPersonalExpenses(currentUserId)
      if (selectedGroupId) await fetchGroupExpenses(selectedGroupId)
      await fetchAllGroupExpenses(); await fetchActivities(currentUserId); await fetchFriendBalances()
    }
  }

  function startEditExpense(expense: Expense) {
    setEditingExpense(expense); setExpenseDescription(expense.description)
    setExpenseTag(normalizeExpenseTag(expense.tag)); setExpenseAmount(String(expense.amount))
    setIsGroupExpense(expense.type === 'GROUP'); setSelectedGroupId(expense.groupId || '')
    setExpenseImageUrl(expense.imageUrl || ''); setExpensePayerId(expense.payerId)
    setIsRecurringExpense(!!(expense.isRecurring || expense.recurring))
    setRecurrenceStartDate(expense.recurrenceStartDate ? new Date(expense.recurrenceStartDate).toISOString().slice(0, 10) : '')
    setRecurrenceType(expense.recurrenceType || 'MONTHLY')
    setRecurrenceInterval(String(expense.recurrenceInterval || 1))
    setRecurrenceEndDate(expense.recurrenceEndDate ? new Date(expense.recurrenceEndDate).toISOString().slice(0, 10) : '')
    if (expense.customSplits && Object.keys(expense.customSplits).length > 0) {
      const vals = Object.values(expense.customSplits)
      const allEqual = vals.length > 1 && vals.every(v => v === vals[0])
      if (allEqual) { setSplitMode('equal'); setCustomSplits({}) }
      else { setSplitMode('unequal'); setCustomSplits(Object.fromEntries(Object.entries(expense.customSplits).map(([k, v]) => [k, String(v)]))) }
    } else { setSplitMode('equal'); setCustomSplits({}) }
  }

  async function handleDeleteExpense(expense: Expense) {
    await authedFetch(`${API_BASE}/expenses/${expense.id}`, { method: 'DELETE' })
    if (currentUserId) { await fetchPersonalExpenses(currentUserId); await fetchActivities(currentUserId) }
    if (expense.groupId) await fetchGroupExpenses(expense.groupId)
    await fetchAllGroupExpenses()
  }

  async function handleSettleUp(expenseId: string) {
    try { await authedFetch(`${API_BASE}/expenses/${expenseId}/settle?userId=${currentUserId}`, { method: 'POST' }) } catch { /* ignore */ }
    await fetchActivities(currentUserId)
    if (selectedGroupId) await fetchGroupExpenses(selectedGroupId)
    await fetchPersonalExpenses(currentUserId); await fetchAllGroupExpenses()
    await fetchDashboardSummary(); await fetchFriendBalances()
  }

  const refreshExpenseDetail = React.useCallback(async (expenseId: string) => {
    let updated: Expense | undefined = allGroupExpenses.find(e => e.id === expenseId) || personalExpenses.find(e => e.id === expenseId)
    if (!updated) {
      try { const res = await authedFetch(`${API_BASE}/expenses/${expenseId}`); if (res.ok) updated = await res.json() } catch { /* ignore */ }
    }
    if (updated) {
      setExpenseDetailView(updated)
      setAllGroupExpenses(prev => { const i = prev.findIndex(e => e.id === expenseId); if (i !== -1) { const c = [...prev]; c[i] = updated!; return c } return prev })
      setPersonalExpenses(prev => { const i = prev.findIndex(e => e.id === expenseId); if (i !== -1) { const c = [...prev]; c[i] = updated!; return c } return prev })
    }
  }, [allGroupExpenses, personalExpenses, authedFetch])

  const handleFlagExpense = React.useCallback(async (expenseId: string) => {
    try {
      const res = await authedFetch(`${API_BASE}/expenses/${expenseId}/flag?userId=${currentUserId}`, { method: 'POST' })
      if (res.ok) {
        await refreshExpenseDetail(expenseId)
        const exp = allGroupExpenses.find(e => e.id === expenseId) || personalExpenses.find(e => e.id === expenseId)
        if (exp?.groupId) { await fetchGroupExpenses(exp.groupId); await fetchAllGroupExpenses() }
        else await fetchPersonalExpenses(currentUserId)
      }
    } catch { /* ignore */ }
  }, [authedFetch, currentUserId, refreshExpenseDetail, allGroupExpenses, personalExpenses, fetchAllGroupExpenses, fetchGroupExpenses, fetchPersonalExpenses])

  const handleUnflagExpense = React.useCallback(async (expenseId: string) => {
    try {
      const res = await authedFetch(`${API_BASE}/expenses/${expenseId}/unflag?userId=${currentUserId}`, { method: 'POST' })
      if (res.ok) {
        await refreshExpenseDetail(expenseId)
        const exp = allGroupExpenses.find(e => e.id === expenseId) || personalExpenses.find(e => e.id === expenseId)
        if (exp?.groupId) { await fetchGroupExpenses(exp.groupId); await fetchAllGroupExpenses() }
        else await fetchPersonalExpenses(currentUserId)
      }
    } catch { /* ignore */ }
  }, [authedFetch, currentUserId, refreshExpenseDetail, allGroupExpenses, personalExpenses, fetchAllGroupExpenses, fetchGroupExpenses, fetchPersonalExpenses])

  // ── Friend handlers ───────────────────────────────────────────────────────

  async function handleAddFriend(e: React.FormEvent) {
    e.preventDefault()
    if (!currentUserId || !friendEmailToAdd.trim()) return
    setFriendAddError(''); setFriendAddSuccess('')
    try {
      const res = await authedFetch(`${API_BASE}/users/${currentUserId}/friends/add-by-email`, {
        method: 'POST', body: JSON.stringify({ email: friendEmailToAdd.trim(), name: friendNameToAdd.trim() || undefined }),
      })
      if (res.ok) {
        const data = await res.json()
        setFriendNameToAdd(''); setFriendEmailToAdd('')
        setFriendAddSuccess(`Friend request sent to ${data.invitation.inviteeEmail}!`)
        await fetchPendingInvitations()
        setTimeout(() => setFriendAddSuccess(''), 4000)
      } else if (res.status === 409) {
        const err = await res.json().catch(() => null)
        setFriendAddError(err?.error || 'Cannot add this friend')
      } else { setFriendAddError('Failed to send friend request') }
    } catch { setFriendAddError('Could not reach server') }
  }

  async function handleAcceptFriendInvitation(id: string) {
    try {
      const res = await authedFetch(`${API_BASE}/users/friend-invitations/${id}/accept`, { method: 'POST' })
      if (res.ok) { await fetchFriendInvitations(); await fetchUsers(); await fetchActivities(currentUserId) }
    } catch { /* ignore */ }
  }

  async function handleDeclineFriendInvitation(id: string) {
    try {
      const res = await authedFetch(`${API_BASE}/users/friend-invitations/${id}`, { method: 'DELETE' })
      if (res.ok) await fetchFriendInvitations()
    } catch { /* ignore */ }
  }

  function startEditFriend(friend: User) { setEditingFriend(friend); setEditFriendName(friend.name); setEditFriendEmail(friend.email) }

  async function handleUpdateFriend(e: React.FormEvent) {
    e.preventDefault()
    if (!editingFriend) return
    try {
      await authedFetch(`${API_BASE}/users/${editingFriend.id}`, { method: 'PUT', body: JSON.stringify({ ...editingFriend, name: editFriendName, email: editFriendEmail }) })
      setEditingFriend(null); await fetchUsers()
    } catch { /* ignore */ }
  }

  async function handleRemoveFriend(friendId: string) {
    if (!currentUserId) return
    try { await authedFetch(`${API_BASE}/users/${currentUserId}/friends/${friendId}`, { method: 'DELETE' }); await fetchUsers() } catch { /* ignore */ }
  }

  async function handleRemindFriend(friendId: string) {
    if (!currentUserId) return
    try { await authedFetch(`${API_BASE}/expenses/remind-with-friend?userId=${currentUserId}&friendId=${friendId}`, { method: 'POST' }) } catch { /* ignore */ }
    await fetchActivities(currentUserId)
  }

  // ── Group handlers ────────────────────────────────────────────────────────

  async function handleCreateGroup(e: React.FormEvent) {
    e.preventDefault()
    if (!currentUserId || !groupName) return
    const res = await authedFetch(`${API_BASE}/groups`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: groupName, ownerId: currentUserId, memberIds: Array.from(new Set([currentUserId, ...groupMemberIds])) }),
    })
    if (res.ok) { setGroupName(''); setGroupMemberIds([]); await fetchGroups(); await fetchActivities(currentUserId); await fetchGroupInvitations() }
  }

  function startEditGroup(group: Group) { setEditingGroup(group); setEditGroupName(group.name); setEditGroupMemberIds([...group.memberIds]) }
  function toggleGroupMember(userId: string) { setGroupMemberIds(prev => prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]) }
  function toggleEditGroupMember(userId: string) { setEditGroupMemberIds(prev => prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]) }

  async function handleUpdateGroup(e: React.FormEvent) {
    e.preventDefault()
    if (!editingGroup) return
    try {
      await authedFetch(`${API_BASE}/groups/${editingGroup.id}`, {
        method: 'PUT',
        body: JSON.stringify({ ...editingGroup, name: editGroupName, memberIds: Array.from(new Set([editingGroup.ownerId, ...editGroupMemberIds])) }),
      })
      setEditingGroup(null); setEditGroupMemberIds([]); await fetchGroups()
    } catch { /* ignore */ }
  }

  async function handleDeleteGroup(groupId: string) {
    try { await authedFetch(`${API_BASE}/groups/${groupId}`, { method: 'DELETE' }); if (selectedGroupId === groupId) setSelectedGroupId(''); await fetchGroups() } catch { /* ignore */ }
  }

  async function handleAcceptGroupInvitation(id: string) {
    try {
      const res = await authedFetch(`${API_BASE}/groups/invitations/${id}/accept`, { method: 'POST' })
      if (res.ok) { await fetchGroupInvitations(); await fetchGroups(); await fetchActivities(currentUserId) }
    } catch { /* ignore */ }
  }

  async function handleDeclineGroupInvitation(id: string) {
    try {
      const res = await authedFetch(`${API_BASE}/groups/invitations/${id}`, { method: 'DELETE' })
      if (res.ok) await fetchGroupInvitations()
    } catch { /* ignore */ }
  }

  // ── Account handlers ──────────────────────────────────────────────────────

  async function handleSaveBudget(event: React.FormEvent) {
    event.preventDefault()
    const parsed = Number(budgetInput)
    const sanitized = Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed * 100) / 100 : 0
    if (!currentUser) return
    const rate = exchangeRates[budgetSummaryCurrency] || 1
    const amountInINR = rate > 0 ? Math.round((sanitized / rate) * 100) / 100 : sanitized
    const res = await authedFetch(`${API_BASE}/users/${currentUser.id}/budgets`, {
      method: 'POST',
      body: JSON.stringify({ period: selectedBudgetPeriod, storageToken: budgetPeriodMeta.storageToken, amount: amountInINR }),
    })
    if (res.ok) {
      try { const u: User = await res.json(); setUsers(prev => prev.map(x => x.id === u.id ? u : x)) } catch { /* ignore */ }
      setBudgetAmount(amountInINR); setBudgetInput(sanitized > 0 ? String(sanitized) : '')
      void fetchUserBudgets(currentUser.id)
    }
  }

  async function handleToggleEmailNotifications(user: User) {
    const res = await authedFetch(`${API_BASE}/users/${user.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...user, emailNotificationsEnabled: !user.emailNotificationsEnabled }),
    })
    if (res.ok) await fetchUsers()
  }

  async function handleToggleSettlementReminders(user: User) {
    const next = !settlementRemindersEnabled; setSettlementRemindersEnabled(next)
    const res = await authedFetch(`${API_BASE}/users/${user.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...user, settlementReminderEnabled: next, remainderDelays: Number(reminderDelayDays) }),
    })
    if (res.ok) await fetchUsers(); else setSettlementRemindersEnabled(!next)
  }

  async function handleReminderDelayChange(user: User, value: string) {
    const v = value as '3' | '5' | '7'; setReminderDelayDays(v)
    const res = await authedFetch(`${API_BASE}/users/${user.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...user, settlementReminderEnabled: settlementRemindersEnabled, remainderDelays: Number(v) }),
    })
    if (res.ok) await fetchUsers()
  }

  async function handleExport(format: 'pdf' | 'word' | 'excel') {
    if (!currentUserId) return
    const map = {
      pdf: { endpoint: `${API_BASE}/export/pdf/${currentUserId}`, filename: 'finwise-data.pdf', mime: 'application/pdf' },
      word: { endpoint: `${API_BASE}/export/word/${currentUserId}`, filename: 'finwise-data.docx', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
      excel: { endpoint: `${API_BASE}/export/excel/${currentUserId}`, filename: 'finwise-data.xlsx', mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
    }
    const { endpoint, filename, mime } = map[format]
    try {
      const headers = new Headers(); if (authToken) headers.set('Authorization', `Bearer ${authToken}`)
      const res = await fetch(endpoint, { method: 'GET', headers })
      if (!res.ok) throw new Error()
      const blob = await res.blob()
      const url = window.URL.createObjectURL(new Blob([blob], { type: mime }))
      const a = document.createElement('a'); a.href = url; a.setAttribute('download', filename)
      document.body.appendChild(a); a.click(); a.parentNode?.removeChild(a); window.URL.revokeObjectURL(url)
    } catch { alert('Failed to export data. Please try again.') }
  }

  function resetPasswordForm() { setCurrentPassword(''); setNewPassword(''); setConfirmNewPassword(''); setPasswordChangeError(''); setPasswordChangeSuccess(''); setPasswordChangeLoading(false) }
  function openPasswordModal() { resetPasswordForm(); setShowPasswordModal(true) }
  function closePasswordModal() { setShowPasswordModal(false); resetPasswordForm() }

  function openEditProfileModal() {
    setEditProfileName(currentUser?.name || ''); setEditProfileError(''); setEditProfileSuccess(''); setEditProfileLoading(false); setShowEditProfileModal(true)
  }
  function closeEditProfileModal() { setShowEditProfileModal(false); setEditProfileError(''); setEditProfileSuccess(''); setEditProfileLoading(false) }

  async function handleEditProfileSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setEditProfileError(''); setEditProfileSuccess('')
    const nextName = editProfileName.trim()
    if (!nextName) { setEditProfileError('Name cannot be empty.'); return }
    if (!currentUserId) { setEditProfileError('Please log in again.'); return }
    setEditProfileLoading(true)
    try {
      const res = await authedFetch(`${API_BASE}/users/${currentUserId}`, { method: 'PUT', body: JSON.stringify({ name: nextName }) })
      if (!res.ok) { setEditProfileError(await res.text() || 'Unable to update profile.'); return }
      const u = await res.json(); setUsers(prev => prev.map(x => x.id === u.id ? u : x)); await fetchUsers()
      setEditProfileSuccess('Profile updated successfully.'); setShowEditProfileModal(false)
    } catch { setEditProfileError('Unable to reach the profile update service.') }
    finally { setEditProfileLoading(false) }
  }

  async function handleChangePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPasswordChangeError(''); setPasswordChangeSuccess('')
    if (!currentUser?.email) { setPasswordChangeError('Please log in again.'); return }
    if (newPassword.length < 6) { setPasswordChangeError('New password must be at least 6 characters.'); return }
    if (newPassword !== confirmNewPassword) { setPasswordChangeError('Passwords do not match.'); return }
    setPasswordChangeLoading(true)
    try {
      const res = await authedFetch(`${API_BASE}/auth/reset-password`, {
        method: 'POST', body: JSON.stringify({ email: currentUser.email, oldPassword: currentPassword, newPassword }),
      })
      const msg = await res.text()
      if (!res.ok) { setPasswordChangeError(msg || 'Unable to change password.'); return }
      setPasswordChangeSuccess(msg || 'Password reset successful'); setCurrentPassword(''); setNewPassword(''); setConfirmNewPassword('')
    } catch { setPasswordChangeError('Unable to reach the password reset service.') }
    finally { setPasswordChangeLoading(false) }
  }

  // ── Notification handlers ─────────────────────────────────────────────────

  const markNotificationsAsRead = useCallback(async (ids: string[]) => {
    if (!currentUserId || !ids.length) return
    try {
      await authedFetch(`${API_BASE}/notifications/${currentUserId}/mark-read`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(ids),
      })
    } catch { /* ignore */ }
  }, [authedFetch, currentUserId])

  const fetchReadNotificationsPage = useCallback(async (page: number, append: boolean) => {
    if (!currentUserId) return
    if (append) setLoadingMoreReadNotifications(true)
    try {
      const res = await authedFetch(`${API_BASE}/notifications/${currentUserId}/read?page=${page}&size=10`)
      if (!res.ok) return
      const data = await res.json()
      const items = Array.isArray(data?.items) ? data.items : []
      setHasMoreReadNotifications(Boolean(data?.hasMore)); setReadNotificationsPage(page)
      append ? setReadNotifications(prev => [...prev, ...items]) : setReadNotifications(items)
    } catch { /* ignore */ }
    finally { if (append) setLoadingMoreReadNotifications(false) }
  }, [authedFetch, currentUserId])

  const fetchNotifications = useCallback(async (showSpinner = false, resetRead = false) => {
    if (!currentUserId) return
    if (showSpinner) setLoadingNotifications(true)
    try {
      const res = await authedFetch(`${API_BASE}/notifications/${currentUserId}/unread?preferredCurrency=${encodeURIComponent(defaultCurrency)}`)
      if (res.ok) {
        const data = await res.json()
        setUnreadNotifications(Array.isArray(data) ? data : [])
        if (resetRead) await fetchReadNotificationsPage(0, false)
        setNotificationError('')
      } else {
        if (showSpinner) setNotificationError(res.status === 401 ? 'Session expired.' : `Failed to fetch notifications (${res.status}).`)
      }
    } catch { if (showSpinner) setNotificationError('Could not reach server.') }
    finally { if (showSpinner) setLoadingNotifications(false) }
  }, [authedFetch, currentUserId, defaultCurrency, fetchReadNotificationsPage])

  const handleLoadMoreReadNotifications = useCallback(() => {
    if (loadingMoreReadNotifications || !hasMoreReadNotifications) return
    void fetchReadNotificationsPage(readNotificationsPage + 1, true)
  }, [fetchReadNotificationsPage, hasMoreReadNotifications, loadingMoreReadNotifications, readNotificationsPage])

  async function handleShowNotifications() {
    setShowNotifications(true)
    if (!currentUserId) { setNotificationError('No user selected.'); return }
    void fetchNotifications(true, true)
  }

  // ── Derived data ──────────────────────────────────────────────────────────

  const filteredGroups = groups.filter(g => g.name.toLowerCase().includes(groupSearch.toLowerCase()))
  const sortedGroups = [...filteredGroups].sort((a, b) => a.name.localeCompare(b.name))

  const currentFriends: User[] = currentUser
    ? currentUser.friendIds.map(fid => users.find(u => u.id === fid)).filter((u): u is User => !!u)
        .filter(u => u.name.toLowerCase().includes(friendSearch.toLowerCase()))
        .sort((a, b) => a.name.localeCompare(b.name))
    : []

  const dashboardFriendBalances = currentFriends
    .map(f => ({ ...f, balance: Number(friendBalances[f.id] ?? 0) }))
    .sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance))

  const dashboardActionFriends = dashboardFriendBalances.filter(f => f.balance < 0)
  const recentDashboardActivities = activities.slice(0, 4)

  const greeting = (() => {
    const h = new Date().getHours()
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
  })()

  const dashboardDateLabel = new Intl.DateTimeFormat('en-IN', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date())

  const expenseWorkspacePool: Expense[] = [...personalExpenses, ...allGroupExpenses]
    .filter((e, i, arr) => arr.findIndex(x => x.id === e.id) === i)
    .sort((a, b) => (b.createdAt ? new Date(b.createdAt).getTime() : 0) - (a.createdAt ? new Date(a.createdAt).getTime() : 0))

  const recurringTemplates = expenseWorkspacePool.filter(e => e.isRecurring || e.recurring)
  const flaggedExpenses = expenseWorkspacePool.filter(e => (e.flaggedBy?.length || 0) > 0)
  const nonRecurringExpenses = expenseWorkspacePool.filter(e => !(e.isRecurring || e.recurring))

  const expenseStats = {
    totalLogged: expenseWorkspacePool.reduce((s, e) => s + e.amount, 0),
    youOwe: dashboardSummary?.totalUserOwes ?? 0,
    owedToYou: dashboardSummary?.totalOwedToUser ?? 0,
    recurringCount: recurringTemplates.length,
    flaggedCount: flaggedExpenses.length,
    expenseCount: expenseWorkspacePool.length,
  }

  const expenseFilterTabs = [
    { key: 'ALL' as const, label: 'All', count: nonRecurringExpenses.length },
    { key: 'PERSONAL' as const, label: 'Personal', count: nonRecurringExpenses.filter(e => e.type === 'PERSONAL').length },
    { key: 'GROUP' as const, label: 'Group', count: nonRecurringExpenses.filter(e => e.type === 'GROUP').length },
    { key: 'UNSETTLED' as const, label: 'Unsettled', count: nonRecurringExpenses.filter(e => isExpenseUnsettledForCurrentUser(e)).length },
    { key: 'RECURRING' as const, label: 'Recurring', count: recurringTemplates.length },
    { key: 'FLAGGED' as const, label: 'Flagged', count: flaggedExpenses.length },
  ]

  const filteredExpenseFeed = expenseWorkspacePool.filter(e => {
    switch (expenseViewFilter) {
      case 'PERSONAL': return e.type === 'PERSONAL' && !(e.isRecurring || e.recurring)
      case 'GROUP': return e.type === 'GROUP' && !(e.isRecurring || e.recurring)
      case 'UNSETTLED': return isExpenseUnsettledForCurrentUser(e) && !(e.isRecurring || e.recurring)
      case 'RECURRING': return !!(e.isRecurring || e.recurring)
      case 'FLAGGED': return (e.flaggedBy?.length || 0) > 0
      default: return !(e.isRecurring || e.recurring)
    }
  })

  const expensePageTitle = expenseFilterTabs.find(t => t.key === expenseViewFilter)?.label + ' expenses' || 'Expenses'

  const filteredActivities = activities
    .filter(a => a.description.toLowerCase().includes(activitySearch.toLowerCase()))
    .filter(a => activityFilter === 'ALL' || getActivityCategory(a) === activityFilter)
    .sort((a, b) => {
      const diff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      return activitySortOrder === 'NEWEST' ? diff : -diff
    })

  const activityFilterTabs = [
    { key: 'ALL' as ActivityFilter, label: 'All', count: activities.length },
    { key: 'EXPENSE' as ActivityFilter, label: 'Expenses', count: activities.filter(a => getActivityCategory(a) === 'EXPENSE').length },
    { key: 'SETTLEMENT' as ActivityFilter, label: 'Settlements', count: activities.filter(a => getActivityCategory(a) === 'SETTLEMENT').length },
    { key: 'GROUP' as ActivityFilter, label: 'Groups', count: activities.filter(a => getActivityCategory(a) === 'GROUP').length },
    { key: 'FRIEND' as ActivityFilter, label: 'Friends', count: activities.filter(a => getActivityCategory(a) === 'FRIEND').length },
  ]

  const activityGroups = filteredActivities.reduce<Array<{ key: string; label: string; items: Activity[] }>>((acc, activity) => {
    const d = new Date(activity.createdAt)
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
    const label = new Intl.DateTimeFormat('en-IN', { month: 'long', day: 'numeric', year: 'numeric' }).format(d)
    const existing = acc.find(g => g.key === key)
    if (existing) existing.items.push(activity)
    else acc.push({ key, label, items: [activity] })
    return acc
  }, [])

  const activityStats = {
    total: activities.length,
    visible: filteredActivities.length,
    settlements: activities.filter(a => getActivityCategory(a) === 'SETTLEMENT').length,
    expenses: activities.filter(a => getActivityCategory(a) === 'EXPENSE').length,
  }

  const dashboardAnalytics = (() => {
    const now = new Date()
    const periodMeta = getBudgetPeriodMeta(dashboardPeriod, now)
    const { rangeStart, rangeEnd } = periodMeta
    const pool = [...personalExpenses, ...allGroupExpenses].filter((e, i, arr) => arr.findIndex(x => x.id === e.id) === i)
    const inRange = pool.filter(e => e.createdAt && new Date(e.createdAt) >= rangeStart && new Date(e.createdAt) < rangeEnd)

    type Bucket = { key: string; label: string; total: number; start: Date; end: Date }
    const buckets: Bucket[] = []
    const cursor = new Date(rangeStart)
    let weekIndex = 1
    while (cursor < rangeEnd) {
      const start = new Date(cursor), end = new Date(cursor)
      let label = ''
      if (dashboardPeriod === 'DAILY') { end.setHours(end.getHours() + 1); label = `${String(start.getHours()).padStart(2, '0')}:00` }
      else if (dashboardPeriod === 'WEEKLY' || dashboardPeriod === 'MONTHLY') {
        end.setDate(end.getDate() + 1)
        label = dashboardPeriod === 'WEEKLY' ? start.toLocaleDateString(undefined, { weekday: 'short' }) : String(start.getDate())
      } else if (dashboardPeriod === 'QUARTERLY') { end.setDate(end.getDate() + 7); label = `W${weekIndex++}` }
      else { end.setMonth(end.getMonth() + 1); label = start.toLocaleDateString(undefined, { month: 'short' }) }
      if (end > rangeEnd) end.setTime(rangeEnd.getTime())
      buckets.push({ key: `${start.toISOString()}-${dashboardPeriod}`, label, total: 0, start, end })
      cursor.setTime(end.getTime())
    }
    inRange.forEach(e => {
      if (!e.createdAt) return
      const amt = expenseAmountForCurrentUser(e); if (amt <= 0) return
      const b = buckets.find(x => new Date(e.createdAt!) >= x.start && new Date(e.createdAt!) < x.end)
      if (b) b.total += amt
    })
    const spent = inRange.reduce((s, e) => s + expenseAmountForCurrentUser(e), 0)
    const max = Math.max(...buckets.map(b => b.total), 1)
    const trendSubLabel = dashboardPeriod === 'DAILY' ? 'By hour' : dashboardPeriod === 'WEEKLY' ? 'This week by day' : dashboardPeriod === 'MONTHLY' ? 'This month by day' : dashboardPeriod === 'QUARTERLY' ? 'This quarter by week' : 'This year by month'
    return { spent, trendSubLabel, periodMeta, buckets, max }
  })()

  const expenseMix = (() => {
    let personal = 0, group = 0
    const { rangeStart, rangeEnd } = dashboardAnalytics.periodMeta
    const pool = [...personalExpenses, ...allGroupExpenses].filter((e, i, arr) => arr.findIndex(x => x.id === e.id) === i)
    pool.forEach(e => {
      if (!e.createdAt) return
      const d = new Date(e.createdAt)
      if (d < rangeStart || d >= rangeEnd) return
      if (e.type === 'GROUP' && (e.participantIds || []).includes(currentUserId)) group += userShare(e)
      else if (e.type === 'PERSONAL' && e.payerId === currentUserId) personal += e.amount
    })
    const total = personal + group
    return { personal, group, total, personalPct: total > 0 ? (personal / total) * 100 : 50, groupPct: total > 0 ? (group / total) * 100 : 50 }
  })()

  const dashboardCategoryMix = (() => {
    const { rangeStart, rangeEnd } = dashboardAnalytics.periodMeta
    const pool = [...personalExpenses, ...allGroupExpenses].filter((e, i, arr) => arr.findIndex(x => x.id === e.id) === i)
    const map: Record<string, number> = {}
    pool.forEach(e => {
      if (!e.createdAt) return
      const d = new Date(e.createdAt)
      if (d < rangeStart || d >= rangeEnd) return
      const amt = expenseAmountForCurrentUser(e); if (amt <= 0) return
      const cat = getExpenseCategory(e); map[cat] = (map[cat] || 0) + amt
    })
    const totals = Object.entries(map).map(([label, total]) => ({ label, total })).sort((a, b) => b.total - a.total)
    const total = totals.reduce((s, e) => s + e.total, 0)
    let cursor = 0
    const gradient = total > 0 ? totals.map((e, i) => { const s = cursor; cursor += (e.total / total) * 100; return `${getCategoryColor(i)} ${s}% ${cursor}%` }).join(', ') : '#6c5ce7 0 100%'
    return { totals, total, gradient, topCategory: totals[0], topPct: total > 0 && totals[0] ? (totals[0].total / total) * 100 : 0 }
  })()

  const dashboardBudgetRemaining = dashboardBudgetAmount - dashboardAnalytics.spent
  const dashboardBudgetProgress = dashboardBudgetAmount > 0 ? Math.min((dashboardAnalytics.spent / dashboardBudgetAmount) * 100, 100) : 0

  // Account-page derived values
  const now = new Date()
  const selectedBudgetMeta = getBudgetPeriodMeta(selectedBudgetPeriod, now)
  const allExpenses: Expense[] = [...personalExpenses, ...allGroupExpenses].filter((e, i, arr) => arr.findIndex(x => x.id === e.id) === i)
  const spentForSelectedPeriod = allExpenses.reduce((sum, e) => {
    if (!e.createdAt) return sum
    const d = new Date(e.createdAt)
    if (d < selectedBudgetMeta.rangeStart || d >= selectedBudgetMeta.rangeEnd) return sum
    return sum + expenseAmountForCurrentUser(e)
  }, 0)
  const budgetRemaining = budgetAmount - spentForSelectedPeriod
  const budgetProgress = budgetAmount > 0 ? Math.min((spentForSelectedPeriod / budgetAmount) * 100, 100) : 0
  const totalPaid = allExpenses.filter(e => e.payerId === currentUserId).reduce((s, e) => s + e.amount, 0)
  const totalReceived = dashboardSummary?.totalOwedToUser ?? 0
  const netSummary = totalPaid - totalReceived
  const sharedExpenses = allExpenses.filter(e => (e.participantIds || []).length > 1)
  const settledExpenses = sharedExpenses.filter(e => e.expenseStatus === 'Settled')
  const settlementRate = sharedExpenses.length ? (settledExpenses.length / sharedExpenses.length) * 100 : 0
  const avgSettlementDays = settledExpenses.length
    ? settledExpenses.reduce((sum, e) => {
        if (!e.createdAt) return sum
        return sum + Math.max((now.getTime() - new Date(e.createdAt).getTime()) / (1000 * 60 * 60 * 24), 0)
      }, 0) / settledExpenses.length
    : 0
  const memberSinceDates = [...allExpenses.map(e => e.createdAt), ...activities.map(a => a.createdAt)].filter(Boolean) as string[]
  const memberSince = memberSinceDates.length
    ? new Intl.DateTimeFormat('en-IN', { month: 'short', year: 'numeric' }).format(new Date(memberSinceDates.map(v => new Date(v).getTime()).sort((a, b) => a - b)[0]))
    : 'Jan 2024'
  const sessionItems = [
    { device: 'Chrome on Windows', status: 'Current session', lastActive: 'Active now' },
    { device: 'Android app', status: authToken ? 'Trusted device' : 'Signed out', lastActive: '2 days ago' },
  ]

  const groupOverview = sortedGroups.map(group => {
    const expenses = allGroupExpenses.filter(e => e.groupId === group.id)
    const total = expenses.reduce((s, e) => s + e.amount, 0)
    const yourShare = expenses.reduce((s, e) => (e.participantIds || []).includes(currentUserId) ? s + userShare(e) : s, 0)
    const unsettledCount = expenses.filter(e => e.expenseStatus !== 'Settled').length
    const latest = [...expenses].sort((a, b) => (b.createdAt ? new Date(b.createdAt).getTime() : 0) - (a.createdAt ? new Date(a.createdAt).getTime() : 0))[0]
    return {
      group, total, yourShare, unsettledCount,
      latestLabel: latest?.createdAt ? new Date(latest.createdAt).toLocaleString('default', { month: 'short', year: 'numeric' }) : 'No activity yet',
    }
  })

  // ── Workspace dashboard renderer ──────────────────────────────────────────

  function renderWorkspaceDashboard(config: {
    title: string; subtitle: string; breadcrumb: string; expenses: Expense[]
    participants: User[]; onBack: () => void; onAddExpense: () => void
    emptyTitle: string; emptyBody: string; scopeLabel: string; mode: 'group' | 'friend'
    primaryParticipantId?: string; accentLabel?: string
  }) {
    const { title, subtitle, breadcrumb, expenses, participants, onBack, onAddExpense, emptyTitle, emptyBody, scopeLabel, mode, primaryParticipantId, accentLabel } = config

    const wsSearch = workspaceExpenseSearch.trim().toLowerCase()
    const dateWindowMap: Record<string, number> = { ALL: 0, '7_DAYS': 7, '30_DAYS': 30, '90_DAYS': 90 }

    const filteredExpenses = expenses.filter(e => {
      const matchSearch = !wsSearch || e.description.toLowerCase().includes(wsSearch) || payerName(e.payerId).toLowerCase().includes(wsSearch)
      const matchStatus = workspaceExpenseStatusFilter === 'ALL' || (workspaceExpenseStatusFilter === 'SETTLED' ? e.expenseStatus === 'Settled' : e.expenseStatus !== 'Settled')
      const days = dateWindowMap[workspaceExpenseDateFilter]
      const createdMs = e.createdAt ? new Date(e.createdAt).getTime() : 0
      const matchDate = !days || !createdMs || Date.now() - createdMs <= days * 24 * 60 * 60 * 1000
      return matchSearch && matchStatus && matchDate
    })

    const totalSpent = expenses.reduce((s, e) => s + e.amount, 0)
    const youSpent = expenses.filter(e => e.payerId === currentUserId).reduce((s, e) => s + e.amount, 0)
    const focusParticipant = primaryParticipantId ? participants.find(p => p.id === primaryParticipantId) || null : null
    const secondarySpent = focusParticipant
      ? expenses.filter(e => e.payerId === focusParticipant.id).reduce((s, e) => s + e.amount, 0)
      : Math.max(0, totalSpent - youSpent)

    const payerTotals = participants
      .map(p => ({ id: p.id, name: p.id === currentUserId ? 'You' : p.name, total: expenses.filter(e => e.payerId === p.id).reduce((s, e) => s + e.amount, 0) }))
      .filter(e => e.total > 0).sort((a, b) => b.total - a.total)

    const categoryTotals = Object.entries(
      expenses.reduce<Record<string, number>>((acc, e) => { const c = getExpenseCategory(e); acc[c] = (acc[c] || 0) + e.amount; return acc }, {})
    ).map(([label, total]) => ({ label, total })).sort((a, b) => b.total - a.total)

    const settledCount = expenses.filter(e => e.expenseStatus === 'Settled').length
    const unsettledCount = expenses.length - settledCount

    const participantBalances = participants
      .filter(p => p.id !== currentUserId)
      .map(p => ({ id: p.id, name: p.name, initials: getInitials(p.name), amount: getParticipantNetBalance(expenses, p.id) }))
      .filter(e => Math.abs(e.amount) > 0.009)
      .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))

    const netBalance = participantBalances.reduce((s, e) => s + e.amount, 0)
    const selectedWorkspaceExpense = expenseDetailView && expenses.some(e => e.id === expenseDetailView.id) ? expenseDetailView : null
    const selectedCanSettle = !!(selectedWorkspaceExpense && selectedWorkspaceExpense.payerId !== currentUserId && (selectedWorkspaceExpense.participantIds || []).includes(currentUserId) && !selectedWorkspaceExpense.settledByUser?.[currentUserId])
    const topSettlement = participantBalances[0] || null

    const balanceDescriptor = netBalance > 0.009
      ? `You are owed ${getCurrencySymbol(defaultCurrency)}${convertINR(netBalance, defaultCurrency).toFixed(2)}`
      : netBalance < -0.009 ? `You owe ${getCurrencySymbol(defaultCurrency)}${convertINR(Math.abs(netBalance), defaultCurrency).toFixed(2)}` : 'All balances are settled'
    const balanceCardNote = focusParticipant
      ? netBalance > 0.009 ? `${focusParticipant.name} owes you` : netBalance < -0.009 ? `You owe ${focusParticipant.name}` : `Nothing pending with ${focusParticipant.name}`
      : netBalance > 0.009 ? 'Overall you are owed by the group' : netBalance < -0.009 ? 'Overall you owe the group' : 'Nothing pending in this group'

    const visibleExpenses = filteredExpenses.slice(0, workspaceExpensesPage * WORKSPACE_EXPENSES_PAGE_SIZE)

    return (
      <section className="workspace-shell">
        <div className="workspace-header">
          <div className="workspace-heading">
            <div className="workspace-breadcrumb-row">
              <button type="button" className="workspace-back-btn" onClick={onBack}>← Back</button>
              <div><p className="workspace-breadcrumb">{breadcrumb}</p><h2>{title}</h2><p className="workspace-subtitle">{subtitle}</p></div>
            </div>
          </div>
          <div className="workspace-header-actions">
            <button type="button" className="workspace-primary-btn" onClick={onAddExpense}>+ Add Expense</button>
          </div>
        </div>

        <div className="workspace-stat-grid">
          {[
            { icon: '□', color: 'purple', label: 'Total Spent', value: `${getCurrencySymbol(defaultCurrency)}${convertINR(totalSpent, defaultCurrency).toFixed(2)}`, note: 'All time' },
            { icon: '▣', color: 'blue', label: 'You Spent', value: `${getCurrencySymbol(defaultCurrency)}${convertINR(youSpent, defaultCurrency).toFixed(2)}`, note: totalSpent > 0 ? `${((youSpent / totalSpent) * 100).toFixed(1)}% of total` : 'No spends yet' },
            { icon: '◌', color: 'pink', label: accentLabel || (focusParticipant ? `${focusParticipant.name} Spent` : 'Others Spent'), value: `${getCurrencySymbol(defaultCurrency)}${convertINR(secondarySpent, defaultCurrency).toFixed(2)}`, note: totalSpent > 0 ? `${((secondarySpent / totalSpent) * 100).toFixed(1)}% of total` : 'No spends yet' },
            { icon: '◍', color: netBalance < -0.009 ? 'amber' : 'green', label: 'Your Balance', value: `${netBalance > 0.009 ? '+' : netBalance < -0.009 ? '-' : ''}${getCurrencySymbol(defaultCurrency)}${convertINR(Math.abs(netBalance), defaultCurrency).toFixed(2)}`, note: balanceCardNote, valueClass: netBalance < -0.009 ? 'negative' : netBalance > 0.009 ? 'positive' : '' },
            { icon: '✓', color: 'green', label: mode === 'friend' ? 'Shared Settled' : 'Group Settled', value: `${settledCount} of ${expenses.length}`, note: `${unsettledCount} still open` },
          ].map((stat, i) => (
            <article key={i} className="workspace-stat-card">
              <div className={`workspace-stat-icon workspace-stat-icon-${stat.color}`}>{stat.icon}</div>
              <div>
                <span className="workspace-stat-label">{stat.label}</span>
                <strong className={`workspace-stat-value${stat.valueClass ? ' ' + stat.valueClass : ''}`}>{stat.value}</strong>
                <span className="workspace-stat-note">{stat.note}</span>
              </div>
            </article>
          ))}
        </div>

        <div className="workspace-insight-grid">
          <section className="workspace-panel workspace-panel-wide">
            <div className="workspace-panel-head"><h3>Spending Overview</h3><span className="workspace-panel-badge">All time</span></div>
            <div className="workspace-chart-card">
              <div className="workspace-donut" style={{ background: payerTotals.length ? `conic-gradient(${payerTotals.map((e, i, arr) => { const s = arr.slice(0, i).reduce((x, y) => x + y.total, 0); const end = s + e.total; return `${getCategoryColor(i)} ${totalSpent ? (s / totalSpent) * 100 : 0}% ${totalSpent ? (end / totalSpent) * 100 : 0}%` }).join(', ')})` : '#1d1c33' }}>
                <div className="workspace-donut-center"><strong>{getCurrencySymbol(defaultCurrency)}{convertINR(totalSpent, defaultCurrency).toFixed(2)}</strong><span>Total</span></div>
              </div>
              <div className="workspace-legend">
                {payerTotals.length === 0 ? <div className="muted">No spending data yet.</div>
                  : payerTotals.map((e, i) => (
                    <div key={e.id} className="workspace-legend-item">
                      <span className="workspace-legend-dot" style={{ background: getCategoryColor(i) }} />
                      <div><strong>{e.name}</strong><span>{getCurrencySymbol(defaultCurrency)}{convertINR(e.total, defaultCurrency).toFixed(2)} ({totalSpent ? ((e.total / totalSpent) * 100).toFixed(1) : '0.0'}%)</span></div>
                    </div>
                  ))}
              </div>
            </div>
          </section>

          <section className="workspace-panel">
            <div className="workspace-panel-head"><h3>Settlement Summary</h3></div>
            <div className="workspace-settlement-card">
              <p className="workspace-settlement-eyebrow">{scopeLabel}</p>
              <strong className={`workspace-settlement-amount ${netBalance < -0.009 ? 'negative' : netBalance > 0.009 ? 'positive' : ''}`}>{balanceDescriptor}</strong>
              <div className="workspace-settlement-flow">
                <div className="workspace-avatar-badge">{getInitials(currentUserName)}</div>
                <div className="workspace-settlement-line"><span>{topSettlement ? (topSettlement.amount > 0 ? 'is owed by' : 'owes') : 'settled with'}</span></div>
                <div className="workspace-avatar-badge workspace-avatar-badge-secondary">{topSettlement ? topSettlement.initials : (focusParticipant ? getInitials(focusParticipant.name) : 'GR')}</div>
              </div>
              {!selectedCanSettle && <span className="workspace-helper-text">Select an expense you owe to settle it from here.</span>}
              {participantBalances.length > 0 && (
                <div className="workspace-balance-stack">
                  {participantBalances.slice(0, 3).map(e => (
                    <div key={e.id} className="workspace-balance-row">
                      <span>{e.name}</span>
                      <strong className={e.amount >= 0 ? 'positive' : 'negative'}>{e.amount >= 0 ? '+' : '-'}{getCurrencySymbol(defaultCurrency)}{convertINR(Math.abs(e.amount), defaultCurrency).toFixed(2)}</strong>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="workspace-panel">
            <div className="workspace-panel-head"><h3>Top Categories</h3><span className="workspace-panel-badge">All time</span></div>
            <div className="workspace-chart-card workspace-chart-card-compact">
              <div className="workspace-donut workspace-donut-small" style={{ background: categoryTotals.length ? `conic-gradient(${categoryTotals.map((e, i, arr) => { const s = arr.slice(0, i).reduce((x, y) => x + y.total, 0); const end = s + e.total; return `${getCategoryColor(i)} ${totalSpent ? (s / totalSpent) * 100 : 0}% ${totalSpent ? (end / totalSpent) * 100 : 0}%` }).join(', ')})` : '#1d1c33' }}>
                <div className="workspace-donut-center"><strong>{categoryTotals.length}</strong><span>Types</span></div>
              </div>
              <div className="workspace-legend">
                {categoryTotals.length === 0 ? <div className="muted">No categories yet.</div>
                  : categoryTotals.slice(0, 5).map((e, i) => (
                    <div key={e.label} className="workspace-legend-item">
                      <span className="workspace-legend-dot" style={{ background: getCategoryColor(i) }} />
                      <div><strong>{e.label}</strong><span>{getCurrencySymbol(defaultCurrency)}{convertINR(e.total, defaultCurrency).toFixed(2)} ({totalSpent ? ((e.total / totalSpent) * 100).toFixed(1) : '0.0'}%)</span></div>
                    </div>
                  ))}
              </div>
            </div>
          </section>
        </div>

        <section className="workspace-panel workspace-table-panel">
          <div className="workspace-toolbar">
            <div className="workspace-toolbar-filters">
              <input type="text" value={workspaceExpenseSearch} onChange={e => setWorkspaceExpenseSearch(e.target.value)} placeholder="Search expenses..." />
              <select value={workspaceExpenseStatusFilter} onChange={e => setWorkspaceExpenseStatusFilter(e.target.value as 'ALL' | 'SETTLED' | 'UNSETTLED')}>
                <option value="ALL">All expenses</option><option value="UNSETTLED">Unsettled</option><option value="SETTLED">Settled</option>
              </select>
              <select value={workspaceExpenseDateFilter} onChange={e => setWorkspaceExpenseDateFilter(e.target.value as 'ALL' | '7_DAYS' | '30_DAYS' | '90_DAYS')}>
                <option value="ALL">All dates</option><option value="7_DAYS">Last 7 days</option><option value="30_DAYS">Last 30 days</option><option value="90_DAYS">Last 90 days</option>
              </select>
            </div>
            <button type="button" className="workspace-primary-btn" onClick={onAddExpense}>+ Add Expense</button>
          </div>
          {filteredExpenses.length === 0 ? (
            <div className="expenses-empty-state workspace-empty-state"><strong>{emptyTitle}</strong><span>{emptyBody}</span></div>
          ) : (
            <div className="workspace-table-wrap">
              <table className="workspace-table">
                <thead><tr><th>Expense</th><th>Amount</th><th>Paid By</th><th>{mode === 'friend' ? 'Balance' : 'You Owe'}</th><th>Status</th></tr></thead>
                <tbody>
                  {visibleExpenses.map((expense, index) => {
                    const isSelected = selectedWorkspaceExpense?.id === expense.id
                    const youOwe = expense.payerId !== currentUserId && (expense.participantIds || []).includes(currentUserId) && !expense.settledByUser?.[currentUserId]
                    const owedByOthers = expense.payerId === currentUserId && expense.expenseStatus !== 'Settled'
                    const statusLabel = expense.expenseStatus || 'Unsettled'
                    return (
                      <tr key={expense.id} className={isSelected ? 'workspace-table-row workspace-table-row-active' : 'workspace-table-row'} onClick={() => setExpenseDetailView(expense)}>
                        <td>
                          <div className="workspace-expense-cell">
                            <div className="workspace-expense-icon" style={{ background: getCategoryColor(index) }}>{getExpenseCategory(expense).charAt(0)}</div>
                            <div><strong>{expense.description}</strong><span>{expense.createdAt ? new Date(expense.createdAt).toLocaleDateString() : 'No date'} · {shareLabel(expense)}</span></div>
                          </div>
                        </td>
                        <td><strong>{getCurrencySymbol(defaultCurrency)}{convertINR(expense.amount, defaultCurrency).toFixed(2)}</strong><span>{expense.currency}</span></td>
                        <td>{payerName(expense.payerId)}</td>
                        <td>
                          {youOwe && <strong className="negative">-{getCurrencySymbol(defaultCurrency)}{convertINR(userShare(expense), defaultCurrency).toFixed(2)}</strong>}
                          {owedByOthers && <strong className="positive">+{getCurrencySymbol(defaultCurrency)}{convertINR(othersOweTotal(expense), defaultCurrency).toFixed(2)}</strong>}
                          {!youOwe && !owedByOthers && <span>-</span>}
                        </td>
                        <td><span className={statusLabel === 'Settled' ? 'workspace-status-pill workspace-status-pill-settled' : 'workspace-status-pill workspace-status-pill-unsettled'}>{statusLabel}</span></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
          {filteredExpenses.length > workspaceExpensesPage * WORKSPACE_EXPENSES_PAGE_SIZE && (
            <div style={{ textAlign: 'left', marginTop: '1rem' }}>
              <button type="button" onClick={() => setWorkspaceExpensesPage(p => p + 1)}>Load more</button>
            </div>
          )}
        </section>
      </section>
    )
  }

  // ── Unauthenticated ───────────────────────────────────────────────────────

  if (!isAuthenticated) {
    return (
      <div className={`app ${theme === 'light' ? 'light-mode' : ''}`}>
        <header className="app-header">
          <div className="header-left">
            <button className="theme-toggle" onClick={() => setTheme(p => p === 'dark' ? 'light' : 'dark')} aria-label="Toggle theme">🌙</button>
            <h1>Finwise</h1>
          </div>
        </header>
        <AuthPage
          theme={theme}
          onToggleTheme={() => setTheme(p => p === 'dark' ? 'light' : 'dark')}
          signupName={signupName} signupEmail={signupEmail} signupPassword={signupPassword}
          setSignupName={setSignupName} setSignupEmail={setSignupEmail} setSignupPassword={setSignupPassword}
          signupError={signupError}
          signupLoading={signupLoading}
          loginEmail={loginEmail} loginPassword={loginPassword}
          setLoginEmail={setLoginEmail} setLoginPassword={setLoginPassword}
          loginError={loginError}
          loginLoading={loginLoading}
          onSignupSubmit={handleSignup}
          onLoginSubmit={handleLogin}
        />
      </div>
    )
  }

  // ── Authenticated shell ───────────────────────────────────────────────────

  return (
    <div className={`app ${theme === 'light' ? 'light-mode' : ''}`}>
      <header className="app-header">
        <div className="header-left" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="theme-toggle" onClick={() => setTheme(p => p === 'dark' ? 'light' : 'dark')} aria-label="Toggle theme">🌙</button>
          <h1 style={{ margin: 0 }}>Finwise</h1>
        </div>
        <div className="header-center">
          {['Groups', 'Friends', 'Activity'].includes(activeTab) && !groupDetailView && !friendDetailView && (
            <input type="text" className="search-input"
              placeholder={`Search ${activeTab}`}
              value={activeTab === 'Groups' ? groupSearch : activeTab === 'Friends' ? friendSearch : activitySearch}
              onChange={e => {
                if (activeTab === 'Groups') setGroupSearch(e.target.value)
                else if (activeTab === 'Friends') setFriendSearch(e.target.value)
                else setActivitySearch(e.target.value)
              }}
            />
          )}
        </div>
        <div className="header-right">
          <button onClick={handleShowNotifications} aria-label="Notifications">
            🔔{unreadNotifications.length > 0 && <span style={{ marginLeft: 6, color: '#d92d20', fontWeight: 700 }}>{unreadNotifications.length}</span>}
          </button>
          <button onClick={() => { localStorage.removeItem('authToken'); localStorage.removeItem('currentUserId'); setAuthToken(null); setCurrentUserId('') }}>Log out</button>
        </div>
      </header>

      {/* Notification modal */}
      {showNotifications && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="panel" style={{ minWidth: 320, maxWidth: 400 }}>
            <h2>Notifications</h2>
            {loadingNotifications ? <div>Loading...</div>
              : notificationError ? <div className="error-text">{notificationError}</div>
              : unreadNotifications.length === 0 && readNotifications.length === 0 ? <div>No notifications available.</div>
              : (
                <div style={{ maxHeight: 360, overflowY: 'auto' }}>
                  {unreadNotifications.length > 0 && (
                    <>
                      <div style={{ fontWeight: 700, marginBottom: 8 }}>Unread</div>
                      <ul className="card-list" style={{ marginBottom: 12 }}>
                        {unreadNotifications.map((n, i) => (
                          <li key={n.id ?? `${n.type}-${i}`} className="card" style={{ marginBottom: 12, borderLeft: '4px solid #2563eb', background: '#eef4ff' }}>
                            <strong>{n.type === 'OWED' ? 'You are owed' : 'You owe'}</strong><br />{n.message}<br />
                            <span className="muted">{(n.lastSent || n.createdAt) ? new Date((n.lastSent || n.createdAt) as string).toLocaleString() : 'Recently'}</span>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                  {readNotifications.length > 0 && (
                    <>
                      <div style={{ fontWeight: 700, marginBottom: 8 }}>Read</div>
                      <ul className="card-list" style={{ marginBottom: 12 }}>
                        {readNotifications.map((n, i) => (
                          <li key={n.id ?? `${n.type}-${i}`} className="card" style={{ marginBottom: 12, opacity: 0.85 }}>
                            <strong>{n.type === 'OWED' ? 'You are owed' : 'You owe'}</strong><br />{n.message}<br />
                            <span className="muted">{(n.lastSent || n.createdAt) ? new Date((n.lastSent || n.createdAt) as string).toLocaleString() : 'Recently'}</span>
                          </li>
                        ))}
                      </ul>
                      {hasMoreReadNotifications && (
                        <button className="icon-btn" onClick={handleLoadMoreReadNotifications} disabled={loadingMoreReadNotifications}>
                          {loadingMoreReadNotifications ? 'Loading...' : 'Load more'}
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
            <button className="icon-btn" style={{ marginTop: 16 }} onClick={() => setShowNotifications(false)}>Close</button>
          </div>
        </div>
      )}

      <div className="layout">
        <aside className="sidebar">
          <section className="panel sidebar-nav-panel">
            <p className="sidebar-nav-label">Navigation</p>
            <nav className="sidebar-tabs">
              {(['Home', 'Groups', 'Expenses', 'Friends', 'Activity', 'Account'] as const).map(tab => (
                <button key={tab} className={activeTab === tab ? 'sidebar-tab sidebar-tab-active' : 'sidebar-tab'}
                  onClick={() => { setActiveTab(tab); setGroupDetailView(null); setFriendDetailView(null); setExpenseDetailView(null) }}>
                  <span className="sidebar-tab-icon" aria-hidden="true">{getSidebarIcon(tab)}</span>
                  <span>{tab}</span>
                </button>
              ))}
            </nav>
          </section>
        </aside>

        <main className="main">
          {activeTab === 'Home' && currentUser && (
            <DashboardPage
              currentUser={currentUser}
              greeting={greeting}
              dashboardDateLabel={dashboardDateLabel}
              dashboardPeriod={dashboardPeriod}
              setDashboardPeriod={setDashboardPeriod}
              dashboardPeriodMeta={dashboardPeriodMeta}
              dashboardLoading={dashboardLoading}
              dashboardError={dashboardError}
              dashboardSummary={dashboardSummary}
              defaultCurrency={defaultCurrency}
              convertINR={convertINR}
              dashboardActionFriends={dashboardActionFriends}
              dashboardFriendBalances={dashboardFriendBalances}
              dashboardAnalytics={dashboardAnalytics}
              dashboardBudgetAmount={dashboardBudgetAmount}
              dashboardBudgetProgress={dashboardBudgetProgress}
              dashboardBudgetRemaining={dashboardBudgetRemaining}
              dashboardMixMode={dashboardMixMode}
              setDashboardMixMode={setDashboardMixMode}
              expenseMix={expenseMix}
              dashboardCategoryMix={dashboardCategoryMix}
              recentDashboardActivities={recentDashboardActivities}
              getCurrencySymbol={getCurrencySymbol}
              getCategoryColor={getCategoryColor}
              authedFetch={authedFetch}
              API_BASE={API_BASE}
              currentUserId={currentUserId}
              fetchFriendBalances={fetchFriendBalances}
              fetchDashboardSummary={fetchDashboardSummary}
              fetchActivities={fetchActivities}
            />
          )}

          {activeTab === 'Friends' && (
            <FriendsPage
              currentFriends={currentFriends}
              friendInvitations={friendInvitations}
              pendingInvitations={pendingInvitations}
              friendBalances={friendBalances}
              users={users}
              currentUser={currentUser}
              currentUserId={currentUserId}
              defaultCurrency={defaultCurrency}
              convertINR={convertINR}
              getCurrencySymbol={getCurrencySymbol}
              friendSearch={friendSearch}
              setFriendSearch={setFriendSearch}
              friendAddError={friendAddError}
              friendAddSuccess={friendAddSuccess}
              friendNameToAdd={friendNameToAdd}
              setFriendNameToAdd={setFriendNameToAdd}
              friendEmailToAdd={friendEmailToAdd}
              setFriendEmailToAdd={setFriendEmailToAdd}
              editingFriend={editingFriend}
              editFriendName={editFriendName}
              setEditFriendName={setEditFriendName}
              editFriendEmail={editFriendEmail}
              setEditFriendEmail={setEditFriendEmail}
              handleAddFriend={handleAddFriend}
              handleAcceptFriendInvitation={handleAcceptFriendInvitation}
              handleDeclineFriendInvitation={handleDeclineFriendInvitation}
              handleUpdateFriend={handleUpdateFriend}
              startEditFriend={startEditFriend}
              handleRemoveFriend={handleRemoveFriend}
              handleRemindFriend={handleRemindFriend}
              setFriendDetailView={setFriendDetailView}
              setExpenseDetailView={setExpenseDetailView}
              expenseWorkspacePool={expenseWorkspacePool}
              isExpenseUnsettledForCurrentUser={isExpenseUnsettledForCurrentUser}
              renderWorkspaceDashboard={renderWorkspaceDashboard}
              resetExpenseForm={resetExpenseForm}
              setEditingExpense={setEditingExpense}
              setIsFriendExpense={setIsFriendExpense}
              setIsGroupExpense={setIsGroupExpense}
              setSelectedFriendId={setSelectedFriendId}
              setShowExpenseModal={setShowExpenseModal}
              friendDetailView={friendDetailView}
              setEditingFriend={setEditingFriend}
            />
          )}

          {activeTab === 'Groups' && (
            <GroupsPage
              sortedGroups={sortedGroups}
              groupOverview={groupOverview}
              showCreateGroupPanel={showCreateGroupPanel}
              setShowCreateGroupPanel={setShowCreateGroupPanel}
              groupName={groupName}
              setGroupName={setGroupName}
              currentFriends={currentFriends}
              groupMemberIds={groupMemberIds}
              toggleGroupMember={toggleGroupMember}
              handleCreateGroup={handleCreateGroup}
              editingGroup={editingGroup}
              editGroupName={editGroupName}
              setEditGroupName={setEditGroupName}
              editGroupMemberIds={editGroupMemberIds}
              handleUpdateGroup={handleUpdateGroup}
              toggleEditGroupMember={toggleEditGroupMember}
              startEditGroup={startEditGroup}
              handleDeleteGroup={handleDeleteGroup}
              groupInvitations={groupInvitations}
              handleAcceptGroupInvitation={handleAcceptGroupInvitation}
              handleDeclineGroupInvitation={handleDeclineGroupInvitation}
              users={users}
              setGroupDetailView={setGroupDetailView}
              setExpenseDetailView={setExpenseDetailView}
              renderWorkspaceDashboard={renderWorkspaceDashboard}
              resetExpenseForm={resetExpenseForm}
              setEditingExpense={setEditingExpense}
              setIsGroupExpense={setIsGroupExpense}
              setIsFriendExpense={setIsFriendExpense}
              setSelectedGroupId={setSelectedGroupId}
              setShowExpenseModal={setShowExpenseModal}
              groupDetailView={groupDetailView}
              groups={groups}
              defaultCurrency={defaultCurrency}
              convertINR={convertINR}
              getCurrencySymbol={getCurrencySymbol}
              setEditingGroup={setEditingGroup}
              setEditGroupMemberIds={setEditGroupMemberIds}
              groupExpenses={groupExpenses}
              fetchGroupExpenses={fetchGroupExpenses}
            />
          )}

          {activeTab === 'Expenses' && (
            <ExpensesPage
              expenseStats={expenseStats}
              expensePageTitle={expensePageTitle}
              expenseFilterTabs={expenseFilterTabs}
              expenseViewFilter={expenseViewFilter}
              setExpenseViewFilter={setExpenseViewFilter}
              filteredExpenseFeed={filteredExpenseFeed}
              expensesPage={expensesPage}
              EXPENSES_PAGE_SIZE={EXPENSES_PAGE_SIZE}
              expenseDetailView={expenseDetailView}
              expenseChats={expenseChats}
              expenseChatInputs={expenseChatInputs}
              setExpenseChatInputs={setExpenseChatInputs}
              editLogDisplayCount={editLogDisplayCount}
              setEditLogDisplayCount={setEditLogDisplayCount}
              currentUserId={currentUserId}
              currentUserName={currentUserName}
              users={users}
              groups={groups}
              defaultCurrency={defaultCurrency}
              convertINR={convertINR}
              getCurrencySymbol={getCurrencySymbol}
              setExpenseDetailView={setExpenseDetailView}
              setExpensesPage={setExpensesPage}
              handleSettleUp={handleSettleUp}
              startEditExpense={startEditExpense}
              setShowExpenseModal={setShowExpenseModal}
              handleDeleteExpense={handleDeleteExpense}
              handleFlagExpense={handleFlagExpense}
              handleUnflagExpense={handleUnflagExpense}
              handleSendExpenseChatMessage={handleSendExpenseChatMessage}
              shareLabel={shareLabel}
              userShare={userShare}
              othersOweTotal={othersOweTotal}
              getExpenseCategory={getExpenseCategory}
              payerName={payerName}
              resetExpenseForm={resetExpenseForm}
              setEditingExpense={setEditingExpense}
              expenseDescription={expenseDescription}
              expenseTag={expenseTag}
              setExpenseDescription={setExpenseDescription}
              setExpenseTag={setExpenseTag}
              expenseAmount={expenseAmount}
              setExpenseAmount={setExpenseAmount}
              expenseCurrency={expenseCurrency}
              setExpenseCurrency={setExpenseCurrency}
              isRecurringExpense={isRecurringExpense}
              setIsRecurringExpense={setIsRecurringExpense}
              recurrenceStartDate={recurrenceStartDate}
              setRecurrenceStartDate={setRecurrenceStartDate}
              recurrenceType={recurrenceType}
              setRecurrenceType={setRecurrenceType}
              recurrenceInterval={recurrenceInterval}
              setRecurrenceInterval={setRecurrenceInterval}
              recurrenceEndDate={recurrenceEndDate}
              setRecurrenceEndDate={setRecurrenceEndDate}
              isGroupExpense={isGroupExpense}
              setIsGroupExpense={setIsGroupExpense}
              isFriendExpense={isFriendExpense}
              setIsFriendExpense={setIsFriendExpense}
              selectedFriendId={selectedFriendId}
              setSelectedFriendId={setSelectedFriendId}
              expensePayerId={expensePayerId}
              setExpensePayerId={setExpensePayerId}
              selectedGroupId={selectedGroupId}
              setSelectedGroupId={setSelectedGroupId}
              splitMode={splitMode}
              setSplitMode={setSplitMode}
              customSplits={customSplits}
              setCustomSplits={setCustomSplits}
              currentFriends={currentFriends}
              filteredGroups={filteredGroups}
              editingExpense={editingExpense}
              expenseEditLogs={expenseEditLogs}
              showExpenseModal={showExpenseModal}
              setShowExpenseModalState={setShowExpenseModal}
              handleSaveExpense={handleSaveExpense}
              remainingAmount={remainingAmount}
              remainingPercentage={remainingPercentage}
              expenseImageUrl={expenseImageUrl}
              setExpenseImageUrl={setExpenseImageUrl}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'Activity' && (
            <ActivityPage
              activityStats={activityStats}
              activityFilterTabs={activityFilterTabs}
              activityFilter={activityFilter}
              setActivityFilter={setActivityFilter}
              activitySortOrder={activitySortOrder}
              setActivitySortOrder={setActivitySortOrder}
              activityGroups={activityGroups}
              activityFilterLoading={activityFilterLoading}
              activityHasMore={activityHasMore}
              activityPage={activityPage}
              setActivityPage={setActivityPage}
              fetchActivities={fetchActivities}
              currentUserId={currentUserId}
              getActivityTone={getActivityTone}
              getActivityCategory={getActivityCategory}
              getActivityBadge={getActivityBadge}
              formatRelativeTime={formatRelativeTime}
            />
          )}

          {activeTab === 'Account' && currentUser && (
            <AccountPage
              currentUser={currentUser}
              defaultCurrency={defaultCurrency}
              setDefaultCurrency={setDefaultCurrency}
              convertINR={convertINR}
              getCurrencySymbol={getCurrencySymbol}
              selectedBudgetPeriod={selectedBudgetPeriod}
              selectedBudgetMeta={selectedBudgetMeta}
              budgetInput={budgetInput}
              setBudgetInput={setBudgetInput}
              setSelectedBudgetPeriod={setSelectedBudgetPeriod}
              budgetSummaryCurrency={budgetSummaryCurrency}
              setBudgetSummaryCurrency={setBudgetSummaryCurrency}
              budgetAmount={budgetAmount}
              budgetRemaining={budgetRemaining}
              budgetProgress={budgetProgress}
              spentForSelectedPeriod={spentForSelectedPeriod}
              handleSaveBudget={handleSaveBudget}
              settlementRemindersEnabled={settlementRemindersEnabled}
              reminderDelayDays={reminderDelayDays}
              handleToggleSettlementReminders={handleToggleSettlementReminders}
              handleReminderDelayChange={handleReminderDelayChange}
              defaultSplitMethod={defaultSplitMethod}
              setDefaultSplitMethod={setDefaultSplitMethod}
              accountThemePreference={accountThemePreference}
              setAccountThemePreference={setAccountThemePreference}
              setTheme={setTheme}
              twoFactorEnabled={twoFactorEnabled}
              setTwoFactorEnabled={setTwoFactorEnabled}
              openPasswordModal={openPasswordModal}
              openEditProfileModal={openEditProfileModal}
              sessionItems={sessionItems}
              handleExport={handleExport}
              getInitials={getInitials}
              handleToggleEmailNotifications={handleToggleEmailNotifications}
              totalPaid={totalPaid}
              totalReceived={totalReceived}
              netSummary={netSummary}
              settlementRate={settlementRate}
              avgSettlementDays={avgSettlementDays}
              memberSince={memberSince}
              showPasswordModal={showPasswordModal}
              closePasswordModal={closePasswordModal}
              currentPassword={currentPassword}
              setCurrentPassword={setCurrentPassword}
              newPassword={newPassword}
              setNewPassword={setNewPassword}
              confirmNewPassword={confirmNewPassword}
              setConfirmNewPassword={setConfirmNewPassword}
              passwordChangeError={passwordChangeError}
              passwordChangeSuccess={passwordChangeSuccess}
              passwordChangeLoading={passwordChangeLoading}
              handleChangePassword={handleChangePassword}
              showEditProfileModal={showEditProfileModal}
              closeEditProfileModal={closeEditProfileModal}
              editProfileName={editProfileName}
              setEditProfileName={setEditProfileName}
              profilePreviewName={editProfileName.trim() || currentUser?.name || 'You'}
              profilePreviewInitials={getInitials(editProfileName || currentUser?.name || 'You')}
              editProfileError={editProfileError}
              editProfileSuccess={editProfileSuccess}
              editProfileLoading={editProfileLoading}
              handleEditProfileSubmit={handleEditProfileSubmit}
            />
          )}
        </main>
      </div>

      {/* FABs */}
      {(groupDetailView || expenseDetailView) && (
        <button className="fab fab-chat" title="Open group chat" onClick={() => { if (groupDetailView) setQuickChatGroupId(groupDetailView); setShowQuickGroupChat(true) }}>💬</button>
      )}
      <button
        className="fab"
        title="Add expense"
        onClick={() => {
          setActiveTab('Expenses')
          setGroupDetailView(null)
          setFriendDetailView(null)
          setExpenseDetailView(null)
          resetExpenseForm()
          setEditingExpense(null)
          setShowExpenseModal(true)
        }}
      >
        ＋
      </button>

      {/* Quick group chat modal */}
      {showQuickGroupChat && (groupDetailView || expenseDetailView) && (
        <div className="modal-overlay" onClick={() => setShowQuickGroupChat(false)}>
          <div className="modal quick-chat-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>Group chat</h2><button className="modal-close" onClick={() => setShowQuickGroupChat(false)}>✕</button></div>
            {groupDetailView ? (
              <div className="quick-chat-group-label">
                <span className="field-label">Current group</span>
                <strong>{groups.find(g => g.id === groupDetailView)?.name || 'Group'}</strong>
              </div>
            ) : (
              <div className="form-vertical">
                <label className="field-label">Select group</label>
                <select value={quickChatGroupId} onChange={e => setQuickChatGroupId(e.target.value)}>
                  {groups.filter(g => (g.memberIds || []).includes(currentUserId)).map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
            )}
            <div className="quick-chat-messages">
              {quickChatGroupId && (groupChats[quickChatGroupId] || []).length === 0 && <div className="muted">No messages yet.</div>}
              {!quickChatGroupId && <div className="muted">No groups available for chat.</div>}
              {quickChatGroupId && (groupChats[quickChatGroupId] || []).map((msg, i) => (
                <div key={i} className="quick-chat-message">
                  <span className={msg.user === currentUserName ? 'expense-chat-user expense-chat-user-self' : 'expense-chat-user'}>{msg.user}</span>
                  <span>{msg.message}</span>
                  <div className="muted" style={{ fontSize: '0.7rem' }}>{new Date(msg.timestamp).toLocaleTimeString()}</div>
                </div>
              ))}
            </div>
            <div className="quick-chat-composer">
              <input type="text" value={groupChatInputs[quickChatGroupId] || ''}
                onChange={e => setGroupChatInputs(prev => ({ ...prev, [quickChatGroupId]: e.target.value }))}
                placeholder="Type a message..."
                onKeyDown={e => { if (e.key === 'Enter' && quickChatGroupId) handleSendGroupChatMessage(quickChatGroupId) }}
                disabled={!quickChatGroupId}
              />
              <button type="button" onClick={() => quickChatGroupId && handleSendGroupChatMessage(quickChatGroupId)} disabled={!quickChatGroupId || !(groupChatInputs[quickChatGroupId]?.trim())}>Send</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
