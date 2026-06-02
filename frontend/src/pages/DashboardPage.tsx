/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useRef } from 'react'

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

  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Draw spending trend line chart on canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !dashboardAnalytics?.buckets?.length) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const W = canvas.offsetWidth
    const H = canvas.offsetHeight
    canvas.width = W * dpr
    canvas.height = H * dpr
    ctx.scale(dpr, dpr)

    const buckets: { label: string; total: number }[] = dashboardAnalytics.buckets
    const max = Math.max(...buckets.map(b => b.total), 1)
    const padL = 44, padR = 16, padT = 16, padB = 28
    const chartW = W - padL - padR
    const chartH = H - padT - padB

    // Grid lines & y-labels
    ctx.font = '10px DM Sans, sans-serif'
    ctx.fillStyle = 'rgba(255,255,255,0.35)'
    ctx.textAlign = 'right'
    const steps = 5
    for (let i = 0; i <= steps; i++) {
      const y = padT + chartH - (i / steps) * chartH
      const val = Math.round((i / steps) * max)
      const label = val >= 1000 ? `₹${(val / 1000).toFixed(0)}K` : `₹${val}`
      ctx.fillText(label, padL - 6, y + 3)
      ctx.beginPath()
      ctx.strokeStyle = 'rgba(255,255,255,0.06)'
      ctx.lineWidth = 1
      ctx.moveTo(padL, y)
      ctx.lineTo(W - padR, y)
      ctx.stroke()
    }

    // Points
    const pts = buckets.map((b, i) => ({
      x: padL + (i / Math.max(buckets.length - 1, 1)) * chartW,
      y: padT + chartH - (b.total / max) * chartH,
    }))

    // Fill gradient under line
    const grad = ctx.createLinearGradient(0, padT, 0, padT + chartH)
    grad.addColorStop(0, 'rgba(108,92,231,0.28)')
    grad.addColorStop(1, 'rgba(108,92,231,0.01)')
    ctx.beginPath()
    ctx.moveTo(pts[0].x, padT + chartH)
    pts.forEach(p => ctx.lineTo(p.x, p.y))
    ctx.lineTo(pts[pts.length - 1].x, padT + chartH)
    ctx.closePath()
    ctx.fillStyle = grad
    ctx.fill()

    // Line
    ctx.beginPath()
    pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)))
    ctx.strokeStyle = '#6c5ce7'
    ctx.lineWidth = 2.5
    ctx.lineJoin = 'round'
    ctx.stroke()

    // Dot at peak
    const peakIdx = buckets.reduce((best, b, i) => (b.total > buckets[best].total ? i : best), 0)
    const peak = pts[peakIdx]
    ctx.beginPath()
    ctx.arc(peak.x, peak.y, 5, 0, Math.PI * 2)
    ctx.fillStyle = '#6c5ce7'
    ctx.fill()
    ctx.beginPath()
    ctx.arc(peak.x, peak.y, 3, 0, Math.PI * 2)
    ctx.fillStyle = '#fff'
    ctx.fill()

    // X labels (show max 8)
    ctx.textAlign = 'center'
    ctx.fillStyle = 'rgba(255,255,255,0.35)'
    const step = Math.ceil(buckets.length / 8)
    buckets.forEach((b, i) => {
      if (i % step === 0 || i === buckets.length - 1) {
        ctx.fillText(b.label, pts[i].x, H - 4)
      }
    })
  }, [dashboardAnalytics])

  const sym = getCurrencySymbol(defaultCurrency)
  const fmt = (n: number) => `${sym}${convertINR(n, defaultCurrency).toFixed(2)}`

  const getInitials = (name: string) =>
    name.split(' ').filter(Boolean).slice(0, 2).map((p: string) => p[0]?.toUpperCase()).join('')

  const now = new Date()
  const monthYear = now.toLocaleString('default', { month: 'long', year: 'numeric' })

  // Donut SVG helper
  function DonutChart({ pct, color, bg, size = 120, stroke = 14 }: {
    pct: number; color: string; bg: string; size?: number; stroke?: number
  }) {
    const r = (size - stroke) / 2
    const circ = 2 * Math.PI * r
    const dash = (pct / 100) * circ
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={bg} strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={stroke}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
        />
      </svg>
    )
  }

  // Category donut
  const catTotal = dashboardCategoryMix?.total || 0
  const catTotals: { label: string; total: number }[] = dashboardCategoryMix?.totals || []

  const periodOptions = [
    { value: 'DAILY', label: 'Daily' },
    { value: 'WEEKLY', label: 'Weekly' },
    { value: 'MONTHLY', label: 'Monthly' },
    { value: 'QUARTERLY', label: 'Quarterly' },
    { value: 'YEARLY', label: 'Yearly' },
  ]

  return (
    <div className="dv2-shell">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

        .dv2-shell {
          font-family: 'DM Sans', sans-serif;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          padding-bottom: 2rem;
        }

        /* ── Hero ── */
        .dv2-hero {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1rem;
          flex-wrap: wrap;
        }
        .dv2-hero-text {}
        .dv2-eyebrow {
          font-size: 0.78rem;
          color: rgba(255,255,255,0.45);
          margin: 0 0 0.3rem;
          letter-spacing: 0.04em;
        }
        .dv2-hero-title {
          margin: 0 0 0.25rem;
          font-size: 1.65rem;
          font-weight: 700;
          color: #fff;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .dv2-hero-sub {
          margin: 0;
          font-size: 0.88rem;
          color: rgba(255,255,255,0.5);
        }
        .dv2-hero-sub span {
          color: #6c5ce7;
          font-weight: 600;
        }

        .dv2-period-select {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.85rem;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.05);
          color: #fff;
          font-size: 0.88rem;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          outline: none;
        }
        .dv2-period-select:focus {
          border-color: rgba(108,92,231,0.5);
        }
        .dv2-period-wrap {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.45rem 0.8rem;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.05);
        }
        .dv2-period-wrap svg { color: rgba(255,255,255,0.5); }
        .dv2-period-wrap select {
          background: transparent;
          border: none;
          color: #fff;
          font-size: 0.88rem;
          font-family: 'DM Sans', sans-serif;
          outline: none;
          cursor: pointer;
        }
        .dv2-period-wrap select option { background: #1b1b2e; }

        /* ── Stat cards ── */
        .dv2-stats {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 1rem;
        }
        .dv2-stat {
          background: #1e1e30;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 16px;
          padding: 1.1rem 1.2rem;
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
          transition: transform 0.18s, box-shadow 0.18s;
        }
        .dv2-stat:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 28px rgba(0,0,0,0.3);
        }
        .dv2-stat-label {
          font-size: 0.82rem;
          color: rgba(255,255,255,0.5);
          font-weight: 500;
        }
        .dv2-stat-value {
          font-size: 1.65rem;
          font-weight: 700;
          font-family: 'DM Mono', monospace;
          line-height: 1.1;
        }
        .dv2-stat-value.red { color: #ff5c5c; }
        .dv2-stat-value.green { color: #2dcc8e; }
        .dv2-stat-value.purple { color: #6c5ce7; }
        .dv2-stat-value.white { color: #fff; }
        .dv2-stat-note {
          font-size: 0.78rem;
          color: rgba(255,255,255,0.4);
        }

        /* ── Charts row ── */
        .dv2-charts-row {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 1rem;
        }
        .dv2-card {
          background: #1e1e30;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 16px;
          padding: 1.2rem;
        }
        .dv2-card-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1rem;
        }
        .dv2-card-title {
          font-size: 0.95rem;
          font-weight: 600;
          color: #fff;
          margin: 0;
        }
        .dv2-card-badge {
          font-size: 0.78rem;
          color: rgba(255,255,255,0.45);
          display: flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.3rem 0.65rem;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px;
          background: rgba(255,255,255,0.03);
          cursor: pointer;
        }

        /* Chart canvas container */
        .dv2-chart-wrap {
          position: relative;
          height: 200px;
          margin-top: 0.5rem;
        }
        .dv2-chart-wrap canvas {
          width: 100%;
          height: 100%;
          display: block;
        }
        .dv2-chart-overlay {
          position: absolute;
          bottom: 28px;
          right: 0;
          text-align: right;
        }
        .dv2-chart-overlay-label {
          font-size: 0.72rem;
          color: rgba(255,255,255,0.4);
        }
        .dv2-chart-overlay-val {
          font-size: 1.4rem;
          font-weight: 700;
          font-family: 'DM Mono', monospace;
          color: #fff;
        }

        /* Expense breakdown donut */
        .dv2-breakdown-body {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1.5rem;
          flex-direction: column;
        }
        .dv2-donut-wrap {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .dv2-donut-center {
          position: absolute;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        .dv2-donut-pct {
          font-size: 1.35rem;
          font-weight: 700;
          color: #fff;
          font-family: 'DM Mono', monospace;
          line-height: 1;
        }
        .dv2-donut-sub {
          font-size: 0.68rem;
          color: rgba(255,255,255,0.45);
          margin-top: 2px;
        }
        .dv2-legend {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }
        .dv2-legend-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.83rem;
        }
        .dv2-legend-left {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: rgba(255,255,255,0.75);
        }
        .dv2-legend-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .dv2-legend-val {
          font-weight: 600;
          color: #fff;
          font-family: 'DM Mono', monospace;
          font-size: 0.82rem;
        }
        .dv2-budget-bar {
          margin-top: 0.75rem;
          font-size: 0.78rem;
          color: rgba(255,255,255,0.45);
          text-align: center;
        }

        /* ── Bottom 3-col grid ── */
        .dv2-bottom-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 1rem;
        }
        .dv2-bottom-card {
          background: #1e1e30;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 16px;
          padding: 1.1rem 1.2rem;
        }
        .dv2-bottom-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.9rem;
        }
        .dv2-bottom-title {
          font-size: 0.9rem;
          font-weight: 600;
          color: #fff;
          margin: 0;
        }
        .dv2-view-all {
          font-size: 0.78rem;
          color: #6c5ce7;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          font-family: inherit;
        }

        /* Friend balance rows */
        .dv2-friend-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.5rem 0;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .dv2-friend-row:last-child { border-bottom: none; }
        .dv2-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 700;
          color: #fff;
          flex-shrink: 0;
        }
        .dv2-friend-meta {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.1rem;
        }
        .dv2-friend-name {
          font-size: 0.88rem;
          font-weight: 600;
          color: #fff;
        }
        .dv2-friend-status {
          font-size: 0.75rem;
          color: rgba(255,255,255,0.45);
        }

        /* Action required */
        .dv2-empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 1.5rem 0;
          text-align: center;
        }
        .dv2-empty-icon {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          border: 1.5px solid rgba(255,255,255,0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(255,255,255,0.3);
        }
        .dv2-empty-text {
          font-size: 0.82rem;
          color: rgba(255,255,255,0.4);
          line-height: 1.5;
        }

        .dv2-action-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          padding: 0.5rem 0;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .dv2-action-row:last-child { border-bottom: none; }
        .dv2-settle-btn {
          padding: 0.3em 0.85em;
          border-radius: 8px;
          border: none;
          background: #6c5ce7;
          color: #fff;
          font-size: 0.78rem;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
          transition: background 0.15s, transform 0.12s;
          white-space: nowrap;
        }
        .dv2-settle-btn:hover { background: #5b4bd6; transform: translateY(-1px); }

        /* Activity rows */
        .dv2-activity-row {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          padding: 0.5rem 0;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .dv2-activity-row:last-child { border-bottom: none; }
        .dv2-activity-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #6c5ce7;
          margin-top: 5px;
          flex-shrink: 0;
        }
        .dv2-activity-text {
          font-size: 0.83rem;
          color: rgba(255,255,255,0.78);
          line-height: 1.45;
          flex: 1;
        }
        .dv2-activity-time {
          font-size: 0.72rem;
          color: rgba(255,255,255,0.35);
          white-space: nowrap;
          margin-top: 2px;
        }

        /* ── Goal banner ── */
        .dv2-goal-banner {
          background: linear-gradient(110deg, #1a1835 0%, #1e1e30 50%, #1a1835 100%);
          border: 1px solid rgba(108,92,231,0.25);
          border-radius: 16px;
          padding: 1.4rem 1.6rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1.5rem;
          position: relative;
          overflow: hidden;
        }
        .dv2-goal-banner::before {
          content: '';
          position: absolute;
          top: -40px;
          right: 160px;
          width: 160px;
          height: 160px;
          border-radius: 50%;
          background: rgba(108,92,231,0.1);
          pointer-events: none;
        }
        .dv2-goal-icon-wrap {
          width: 52px;
          height: 52px;
          border-radius: 14px;
          background: rgba(108,92,231,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          font-size: 1.5rem;
        }
        .dv2-goal-copy {
          flex: 1;
        }
        .dv2-goal-title {
          font-size: 1rem;
          font-weight: 700;
          color: #fff;
          margin: 0 0 0.25rem;
        }
        .dv2-goal-sub {
          font-size: 0.83rem;
          color: rgba(255,255,255,0.5);
          margin: 0;
        }
        .dv2-goal-btn {
          padding: 0.6em 1.4em;
          border-radius: 10px;
          border: none;
          background: #6c5ce7;
          color: #fff;
          font-size: 0.88rem;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
          transition: background 0.15s, transform 0.12s, box-shadow 0.15s;
          white-space: nowrap;
          box-shadow: 0 4px 16px rgba(108,92,231,0.4);
        }
        .dv2-goal-btn:hover { background: #5b4bd6; transform: translateY(-1px); box-shadow: 0 8px 20px rgba(108,92,231,0.5); }
        .dv2-goal-illustration {
          font-size: 3.5rem;
          line-height: 1;
          opacity: 0.9;
          flex-shrink: 0;
        }

        /* ── Footer info row ── */
        .dv2-footer-row {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 1rem;
        }
        .dv2-footer-card {
          background: #1e1e30;
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 14px;
          padding: 0.9rem 1rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .dv2-footer-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: rgba(108,92,231,0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: #a29bfe;
        }
        .dv2-footer-copy {}
        .dv2-footer-title {
          font-size: 0.82rem;
          font-weight: 600;
          color: rgba(255,255,255,0.8);
          margin: 0 0 0.1rem;
        }
        .dv2-footer-sub {
          font-size: 0.75rem;
          color: #6c5ce7;
          margin: 0;
          cursor: pointer;
        }
        .dv2-footer-sub.muted {
          color: rgba(255,255,255,0.38);
          cursor: default;
        }

        /* Light mode overrides */
        .app.light-mode .dv2-stat,
        .app.light-mode .dv2-card,
        .app.light-mode .dv2-bottom-card,
        .app.light-mode .dv2-footer-card {
          background: #fff;
          border-color: rgba(108,92,231,0.12);
          box-shadow: 0 2px 12px rgba(108,92,231,0.06);
        }
        .app.light-mode .dv2-hero-title,
        .app.light-mode .dv2-card-title,
        .app.light-mode .dv2-bottom-title,
        .app.light-mode .dv2-stat-value.white,
        .app.light-mode .dv2-friend-name,
        .app.light-mode .dv2-goal-title,
        .app.light-mode .dv2-donut-pct,
        .app.light-mode .dv2-legend-val,
        .app.light-mode .dv2-activity-text,
        .app.light-mode .dv2-chart-overlay-val {
          color: #1a1040;
        }
        .app.light-mode .dv2-eyebrow,
        .app.light-mode .dv2-hero-sub,
        .app.light-mode .dv2-stat-label,
        .app.light-mode .dv2-stat-note,
        .app.light-mode .dv2-card-badge,
        .app.light-mode .dv2-friend-status,
        .app.light-mode .dv2-empty-text,
        .app.light-mode .dv2-activity-time,
        .app.light-mode .dv2-goal-sub,
        .app.light-mode .dv2-budget-bar,
        .app.light-mode .dv2-donut-sub,
        .app.light-mode .dv2-legend-left,
        .app.light-mode .dv2-chart-overlay-label {
          color: rgba(47,32,80,0.55);
        }
        .app.light-mode .dv2-goal-banner {
          background: linear-gradient(110deg, #f4f0ff 0%, #ede8ff 50%, #f4f0ff 100%);
          border-color: rgba(108,92,231,0.2);
        }
        .app.light-mode .dv2-footer-card {
          background: #f7f4ff;
        }
        .app.light-mode .dv2-footer-title { color: #2f2050; }
        .app.light-mode .dv2-friend-row,
        .app.light-mode .dv2-action-row,
        .app.light-mode .dv2-activity-row {
          border-color: rgba(108,92,231,0.08);
        }

        @media (max-width: 1100px) {
          .dv2-stats { grid-template-columns: repeat(2, 1fr); }
          .dv2-charts-row { grid-template-columns: 1fr; }
          .dv2-bottom-grid { grid-template-columns: 1fr; }
          .dv2-footer-row { grid-template-columns: 1fr; }
        }
        @media (max-width: 640px) {
          .dv2-stats { grid-template-columns: 1fr 1fr; }
          .dv2-stat-value { font-size: 1.3rem; }
          .dv2-goal-illustration { display: none; }
        }
      `}</style>

      {/* ── Hero ── */}
      <div className="dv2-hero">
        <div className="dv2-hero-text">
          <p className="dv2-eyebrow">Finwise / Dashboard</p>
          <h2 className="dv2-hero-title">
            {greeting}, {currentUser.name} 👋
          </h2>
          <p className="dv2-hero-sub">
            Here's your financial overview for <span>{monthYear}</span>
          </p>
        </div>
        <div className="dv2-period-wrap">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
          </svg>
          <select
            value={dashboardPeriod}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setDashboardPeriod(e.target.value)}
          >
            {periodOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {dashboardLoading ? (
        <div className="dv2-card" style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
          Loading dashboard…
        </div>
      ) : dashboardError ? (
        <div className="dv2-card" style={{ padding: '2rem', textAlign: 'center', color: '#ff5c5c' }}>
          {dashboardError}
        </div>
      ) : dashboardSummary ? (
        <>
          {/* ── Stat cards ── */}
          <div className="dv2-stats">
            <div className="dv2-stat">
              <span className="dv2-stat-label">You owe</span>
              <strong className="dv2-stat-value red">{fmt(dashboardSummary.totalUserOwes)}</strong>
              <span className="dv2-stat-note">{dashboardActionFriends.length} settlement due</span>
            </div>
            <div className="dv2-stat">
              <span className="dv2-stat-label">Incoming</span>
              <strong className="dv2-stat-value green">{fmt(dashboardSummary.totalOwedToUser)}</strong>
              <span className="dv2-stat-note">
                {dashboardFriendBalances.filter((f: any) => f.balance > 0).length} incoming balance
              </span>
            </div>
            <div className="dv2-stat">
              <span className="dv2-stat-label">Total spent</span>
              <strong className="dv2-stat-value white">{fmt(dashboardAnalytics.spent)}</strong>
              <span className="dv2-stat-note">
                {dashboardBudgetAmount > 0
                  ? `${dashboardBudgetProgress.toFixed(0)}% of ${dashboardPeriodMeta.titleLabel.toLowerCase()} budget`
                  : `No ${dashboardPeriodMeta.titleLabel.toLowerCase()} budget set`}
              </span>
            </div>
            <div className="dv2-stat">
              <span className="dv2-stat-label">{dashboardPeriodMeta.titleLabel} budget</span>
              <strong className={`dv2-stat-value ${dashboardBudgetRemaining >= 0 ? 'purple' : 'red'}`}>
                {fmt(dashboardBudgetAmount || 0)}
              </strong>
              <span className="dv2-stat-note">
                {dashboardBudgetAmount > 0
                  ? `of ${fmt(dashboardBudgetAmount)} for ${dashboardAnalytics.periodMeta.label}`
                  : `Set in Account`}
              </span>
            </div>
          </div>

          {/* ── Charts ── */}
          <div className="dv2-charts-row">
            {/* Spending trend */}
            <div className="dv2-card">
              <div className="dv2-card-head">
                <h3 className="dv2-card-title">Spending trend</h3>
                <span className="dv2-card-badge">
                  {dashboardAnalytics.trendSubLabel}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
                </span>
              </div>
              <div className="dv2-chart-wrap">
                <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
                <div className="dv2-chart-overlay">
                  <div className="dv2-chart-overlay-label">Total spent</div>
                  <div className="dv2-chart-overlay-val">{fmt(dashboardAnalytics.spent)}</div>
                </div>
              </div>
            </div>

            {/* Expense breakdown */}
            <div className="dv2-card">
              <div className="dv2-card-head">
                <h3 className="dv2-card-title">Expense breakdown</h3>
              </div>
              <div className="dv2-breakdown-body">
                <div
                  className="dv2-donut-wrap"
                  style={{ cursor: 'pointer' }}
                  onClick={() => setDashboardMixMode((m: string) => m === 'TYPE' ? 'CATEGORY' : 'TYPE')}
                  title="Click to toggle"
                >
                  {dashboardMixMode === 'TYPE' ? (
                    <DonutChart
                      pct={expenseMix.total > 0 ? expenseMix.personalPct : 0}
                      color="#6c5ce7"
                      bg="rgba(139,224,203,0.4)"
                      size={140}
                      stroke={18}
                    />
                  ) : (
                    // Multi-segment SVG for categories
                    (() => {
                      const size = 140, stroke = 18
                      const r = (size - stroke) / 2
                      const circ = 2 * Math.PI * r
                      let cursor = 0
                      const colors = ['#6c5ce7', '#2dcc8e', '#f4a93d', '#e17055', '#74b9ff', '#fd79a8']
                      return (
                        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
                          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
                          {catTotal > 0 ? catTotals.slice(0, 6).map((cat, i) => {
                            const pct = (cat.total / catTotal) * 100
                            const dash = (pct / 100) * circ
                            const offset = circ - cursor * circ / 100
                            cursor += pct
                            return (
                              <circle
                                key={cat.label}
                                cx={size / 2} cy={size / 2} r={r}
                                fill="none"
                                stroke={colors[i % colors.length]}
                                strokeWidth={stroke}
                                strokeDasharray={`${dash} ${circ - dash}`}
                                strokeDashoffset={offset}
                                strokeLinecap="butt"
                              />
                            )
                          }) : (
                            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={stroke} />
                          )}
                        </svg>
                      )
                    })()
                  )}
                  <div className="dv2-donut-center">
                    <div className="dv2-donut-pct">
                      {dashboardMixMode === 'TYPE'
                        ? `${expenseMix.total > 0 ? Math.round(expenseMix.personalPct) : 0}%`
                        : `${catTotals.length}`}
                    </div>
                    <div className="dv2-donut-sub">
                      {dashboardMixMode === 'TYPE' ? 'of budget' : 'categories'}
                    </div>
                  </div>
                </div>

                <div className="dv2-legend">
                  {dashboardMixMode === 'TYPE' ? (
                    <>
                      <div className="dv2-legend-row">
                        <div className="dv2-legend-left">
                          <div className="dv2-legend-dot" style={{ background: '#6c5ce7' }} />
                          Personal
                        </div>
                        <div className="dv2-legend-val">{fmt(expenseMix.personal)}</div>
                      </div>
                      <div className="dv2-legend-row">
                        <div className="dv2-legend-left">
                          <div className="dv2-legend-dot" style={{ background: '#2dcc8e' }} />
                          Group share
                        </div>
                        <div className="dv2-legend-val">{fmt(expenseMix.group)}</div>
                      </div>
                    </>
                  ) : catTotals.slice(0, 4).map((cat, i) => {
                    const colors = ['#6c5ce7', '#2dcc8e', '#f4a93d', '#e17055']
                    return (
                      <div key={cat.label} className="dv2-legend-row">
                        <div className="dv2-legend-left">
                          <div className="dv2-legend-dot" style={{ background: colors[i % colors.length] }} />
                          {cat.label}
                        </div>
                        <div className="dv2-legend-val">{fmt(cat.total)}</div>
                      </div>
                    )
                  })}
                </div>

                <div className="dv2-budget-bar">
                  {dashboardBudgetAmount > 0
                    ? `${dashboardBudgetProgress.toFixed(0)}% of budget used`
                    : '0% of budget used'}
                </div>
              </div>
            </div>
          </div>

          {/* ── Bottom 3-col ── */}
          <div className="dv2-bottom-grid">
            {/* Friend balances */}
            <div className="dv2-bottom-card">
              <div className="dv2-bottom-head">
                <h4 className="dv2-bottom-title">Friend balances</h4>
                <button className="dv2-view-all">View all</button>
              </div>
              {dashboardFriendBalances.length === 0 ? (
                <div className="dv2-empty-state">
                  <div className="dv2-empty-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  </div>
                  <div className="dv2-empty-text">No friend balances yet.</div>
                </div>
              ) : (
                dashboardFriendBalances.slice(0, 4).map((f: any) => (
                  <div key={f.id} className="dv2-friend-row">
                    <div className="dv2-avatar">{getInitials(f.name)}</div>
                    <div className="dv2-friend-meta">
                      <div className="dv2-friend-name">{f.name}</div>
                      <div className="dv2-friend-status">
                        {f.balance > 0
                          ? <span style={{ color: '#2dcc8e' }}>owes you {fmt(f.balance)}</span>
                          : f.balance < 0
                          ? <span style={{ color: '#ff5c5c' }}>you owe {fmt(Math.abs(f.balance))}</span>
                          : <span>settled</span>}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Action required */}
            <div className="dv2-bottom-card">
              <div className="dv2-bottom-head">
                <h4 className="dv2-bottom-title">Action required</h4>
                <button className="dv2-view-all">View all</button>
              </div>
              {dashboardActionFriends.length === 0 ? (
                <div className="dv2-empty-state">
                  <div className="dv2-empty-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  </div>
                  <div className="dv2-empty-text">No action needed<br />right now.</div>
                </div>
              ) : (
                dashboardActionFriends.slice(0, 3).map((f: any) => (
                  <div key={f.id} className="dv2-action-row">
                    <div className="dv2-friend-meta">
                      <div className="dv2-friend-name" style={{ fontSize: '0.86rem' }}>Settle with {f.name}</div>
                      <div className="dv2-friend-status">Outstanding balance</div>
                    </div>
                    <button
                      className="dv2-settle-btn"
                      onClick={async () => {
                        await authedFetch(`${API_BASE}/expenses/settle-with-friend?userId=${currentUserId}&friendId=${f.id}`, { method: 'POST' })
                        await fetchFriendBalances()
                        await fetchDashboardSummary()
                        await fetchActivities(currentUserId)
                      }}
                    >
                      Settle
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Recent activity */}
            <div className="dv2-bottom-card">
              <div className="dv2-bottom-head">
                <h4 className="dv2-bottom-title">Recent activity</h4>
                <button className="dv2-view-all">View all</button>
              </div>
              {recentDashboardActivities.length === 0 ? (
                <div className="dv2-empty-state">
                  <div className="dv2-empty-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  </div>
                  <div className="dv2-empty-text">No recent activity<br />yet.</div>
                </div>
              ) : (
                recentDashboardActivities.map((a: any) => (
                  <div key={a.id} className="dv2-activity-row">
                    <div className="dv2-activity-dot" />
                    <div className="dv2-activity-text">{a.description}</div>
                    <div className="dv2-activity-time">
                      {new Date(a.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ── Goal banner ── */}
          <div className="dv2-goal-banner">
            <div className="dv2-goal-icon-wrap">🎯</div>
            <div className="dv2-goal-copy">
              <h3 className="dv2-goal-title">Set a goal, achieve more</h3>
              <p className="dv2-goal-sub">Create financial goals and track your progress</p>
            </div>
            <button className="dv2-goal-btn">Create goal</button>
            <div className="dv2-goal-illustration">🌱</div>
          </div>

          {/* ── Footer info row ── */}
          <div className="dv2-footer-row">
            <div className="dv2-footer-card">
              <div className="dv2-footer-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg>
              </div>
              <div className="dv2-footer-copy">
                <p className="dv2-footer-title">Need help?</p>
                <p className="dv2-footer-sub">Contact support</p>
              </div>
            </div>
            <div className="dv2-footer-card">
              <div className="dv2-footer-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <div className="dv2-footer-copy">
                <p className="dv2-footer-title">Secure &amp; private</p>
                <p className="dv2-footer-sub muted">Your data is encrypted and protected</p>
              </div>
            </div>
            <div className="dv2-footer-card">
              <div className="dv2-footer-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </div>
              <div className="dv2-footer-copy">
                <p className="dv2-footer-title">Last updated</p>
                <p className="dv2-footer-sub muted">{dashboardDateLabel}</p>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="dv2-card" style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.45)' }}>
          No summary available.
        </div>
      )}
    </div>
  )
}
