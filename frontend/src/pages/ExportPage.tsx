/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react'
export type ExportPageProps = Record<string, any>

const EXPORT_TYPES = [
  {
    key: 'pdf',
    icon: (
      <svg viewBox="0 0 48 48" width="48" height="48" fill="none">
        <rect width="48" height="48" rx="12" fill="rgba(108,92,231,0.18)"/>
        <path d="M14 12h14l8 8v16a2 2 0 0 1-2 2H14a2 2 0 0 1-2-2V14a2 2 0 0 1 2-2z"
          stroke="#a78bfa" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        <polyline points="28 12 28 20 36 20"
          stroke="#a78bfa" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        <line x1="18" y1="26" x2="30" y2="26"
          stroke="#a78bfa" strokeWidth="1.8" strokeLinecap="round"/>
        <line x1="18" y1="30" x2="26" y2="30"
          stroke="#a78bfa" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ),
    title: 'Export PDF Report',
    desc: 'Generate a PDF report of your expenses, summary and activity.',
    features: ['Expense summary', 'Financial overview', 'Activity timeline'],
    btnLabel: 'Export PDF',
    btnClass: 'ep-btn-purple',
    accentColor: '#a78bfa',
    bgColor: 'rgba(108,92,231,0.06)',
    borderColor: 'rgba(108,92,231,0.18)',
  },
  {
    key: 'excel',
    icon: (
      <svg viewBox="0 0 48 48" width="48" height="48" fill="none">
        <rect width="48" height="48" rx="12" fill="rgba(52,211,153,0.15)"/>
        <path d="M14 12h14l8 8v16a2 2 0 0 1-2 2H14a2 2 0 0 1-2-2V14a2 2 0 0 1 2-2z"
          stroke="#34d399" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        <polyline points="28 12 28 20 36 20"
          stroke="#34d399" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M19 24l5 6 5-6M24 30v-8"
          stroke="#34d399" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: 'Export Excel File',
    desc: 'Download your data in Excel format for further analysis.',
    features: ['All transactions', 'Category breakdown', 'Detailed records'],
    btnLabel: 'Export Excel',
    btnClass: 'ep-btn-green',
    accentColor: '#34d399',
    bgColor: 'rgba(52,211,153,0.05)',
    borderColor: 'rgba(52,211,153,0.18)',
  },
  {
    key: 'word',
    icon: (
      <svg viewBox="0 0 48 48" width="48" height="48" fill="none">
        <rect width="48" height="48" rx="12" fill="rgba(59,130,246,0.15)"/>
        <path d="M14 12h14l8 8v16a2 2 0 0 1-2 2H14a2 2 0 0 1-2-2V14a2 2 0 0 1 2-2z"
          stroke="#60a5fa" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        <polyline points="28 12 28 20 36 20"
          stroke="#60a5fa" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        <line x1="18" y1="26" x2="30" y2="26"
          stroke="#60a5fa" strokeWidth="1.8" strokeLinecap="round"/>
        <line x1="18" y1="30" x2="24" y2="30"
          stroke="#60a5fa" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ),
    title: 'Export Word Document',
    desc: 'Get a formatted Word document with your full expense report.',
    features: ['Full expense report', 'Group summaries', 'Settlement history'],
    btnLabel: 'Export Word',
    btnClass: 'ep-btn-blue',
    accentColor: '#60a5fa',
    bgColor: 'rgba(59,130,246,0.05)',
    borderColor: 'rgba(59,130,246,0.18)',
  },
]

export default function ExportPage(props: ExportPageProps) {
  const { handleExport, handleGenerateInsights } = props
  const [period, setPeriod] = useState<string>('all')
  const [isGenerating, setIsGenerating] = useState(false)
  const [insights, setInsights] = useState<string[]>([])
  const [insightError, setInsightError] = useState('')

  useEffect(() => {
    setInsights([])
    setInsightError('')
  }, [period])

  async function generateInsights() {
    setIsGenerating(true)
    setInsightError('')
    try {
      const generated = await handleGenerateInsights(period)
      setInsights(Array.isArray(generated) ? generated : [])
    } catch (error) {
      setInsightError(error instanceof Error ? error.message : 'Failed to generate insights. Please try again.')
      setInsights([])
    } finally {
      setIsGenerating(false)
    }
  }

  const lightbulbIcon = (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18h6" />
      <path d="M10 22h4" />
      <path d="M12 2a7 7 0 0 0-4 12c.7.6 1.2 1.5 1.4 2.4h5.2c.2-.9.7-1.8 1.4-2.4A7 7 0 0 0 12 2Z" />
    </svg>
  )

  return (
    <div className="ep-shell">

      {/* ── Page header ── */}
      <div className="ep-page-head">
        <h2 className="ep-title">Export Data</h2>
        <p className="ep-sub">Choose what you want to export</p>
      </div>

      {/* ── Period Selector ── */}
      <div className="ep-controls">
        <label htmlFor="exportPeriod" className="ep-label">Select Time Period:</label>
        <select 
          id="exportPeriod" 
          className="ep-select" 
          value={period} 
          onChange={(e) => setPeriod(e.target.value)}
        >
          <option value="today">Today</option>
          <option value="this_week">This Week</option>
          <option value="this_month">This Month</option>
          <option value="this_quarter">This Quarter</option>
          <option value="this_year">This Year</option>
          <option value="all">All Time</option>
        </select>
      </div>

      {/* ── Export cards grid ── */}
      <div className="ep-cards-grid">
        {EXPORT_TYPES.map(t => (
          <section
            key={t.key}
            className="ep-card"
            style={{
              '--ep-border': t.borderColor,
              '--ep-bg': t.bgColor,
              '--ep-accent': t.accentColor,
            } as any}
          >
            <div className="ep-card-icon">{t.icon}</div>
            <h3 className="ep-card-title">{t.title}</h3>
            <p className="ep-card-desc">{t.desc}</p>
            <ul className="ep-feature-list">
              {t.features.map(f => (
                <li key={f} className="ep-feature-item">
                  <span className="ep-feat-dot" style={{ background: t.accentColor }} />
                  {f}
                </li>
              ))}
            </ul>
            <button
              type="button"
              className={`ep-export-btn ${t.btnClass}`}
              onClick={() => handleExport(t.key as 'pdf' | 'word' | 'excel', period)}
            >
              {t.btnLabel}
            </button>
          </section>
        ))}
      </div>

      <section className="ep-ai-card" aria-label="AI Financial Insights">
        <div className="ep-ai-header">
          <div className="ep-ai-icon">
            <svg viewBox="0 0 48 48" width="48" height="48" fill="none">
              <rect width="48" height="48" rx="12" fill="rgba(108,92,231,0.14)"/>
              <path d="M24 10c-3.9 0-7 3.1-7 7 0 2.6 1.4 4.9 3.5 6.1V26h7v-2.9c2.1-1.2 3.5-3.5 3.5-6.1 0-3.9-3.1-7-7-7Z" stroke="#a78bfa" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M20 29h8M21 33h6" stroke="#a78bfa" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="ep-ai-copy">
            <div className="ep-ai-title-row">
              <h3 className="ep-ai-title">AI Financial Insights</h3>
              <span className="ep-ai-badge">BETA</span>
            </div>
            <p className="ep-ai-desc">Get personalized insights about your spending patterns and financial health.</p>
          </div>
        </div>

        <div className="ep-ai-body">
          <button
            type="button"
            className="ep-ai-btn"
            onClick={generateInsights}
            disabled={isGenerating}
          >
            {isGenerating ? 'Generating...' : 'Generate Insights'}
          </button>

          <div className="ep-ai-results" aria-live="polite">
            {isGenerating ? (
              <div className="ep-ai-loading">Analyzing your financial data...</div>
            ) : insightError ? (
              <div className="ep-ai-error">{insightError}</div>
            ) : insights.length > 0 ? (
              <>
                <div className="ep-ai-results-title">Your Insights</div>
                <ul className="ep-ai-list">
                  {insights.map((item, index) => (
                    <li key={`${item}-${index}`} className="ep-ai-item">
                      <span className="ep-ai-item-icon">{lightbulbIcon}</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <div className="ep-ai-placeholder">Generate insights for the selected time period.</div>
            )}
          </div>
        </div>
      </section>

      {/* ── Info footer ── */}
      <section className="ep-info-card">
        <div className="ep-info-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
            strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
            <circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/>
          </svg>
        </div>
        <div className="ep-info-copy">
          <strong>Your data is secure</strong>
          <p>All exports are generated on-demand and are not stored. Files are downloaded directly to your device.</p>
        </div>
      </section>

      <style>{`
        .ep-shell { display: flex; flex-direction: column; gap: 1.1rem; }

        .ep-page-head { padding: 0.25rem 0 0.5rem; }
        .ep-title { margin: 0 0 0.3rem; font-size: 1.45rem; font-weight: 700; color: #fff; letter-spacing: -0.02em; }
        .ep-sub { margin: 0; font-size: 0.86rem; color: rgba(255,255,255,0.5); }

        .ep-controls { display: flex; align-items: center; gap: 0.8rem; margin-bottom: 0.5rem; }
        .ep-label { font-size: 0.9rem; font-weight: 600; color: rgba(255,255,255,0.8); }
        .ep-select { 
          background: rgba(255,255,255,0.06); 
          border: 1px solid rgba(255,255,255,0.15); 
          color: #fff; 
          border-radius: 8px; 
          padding: 0.4rem 0.8rem; 
          font-size: 0.9rem; 
          outline: none; 
        }
        .ep-select:focus { border-color: #a78bfa; }
        .ep-select option { background: #121122; color: #fff; }

        .ep-cards-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 1rem;
        }

        .ep-ai-card {
          background: linear-gradient(180deg, rgba(117, 95, 255, 0.10) 0%, rgba(18, 17, 34, 0.98) 100%);
          border: 1px solid rgba(167, 139, 250, 0.24);
          border-radius: 16px;
          padding: 1.35rem 1.4rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          box-shadow: 0 10px 28px rgba(108, 92, 231, 0.08);
        }

        .ep-ai-header {
          display: flex;
          align-items: flex-start;
          gap: 0.9rem;
        }

        .ep-ai-copy {
          flex: 1;
          min-width: 0;
        }

        .ep-ai-title-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
          margin-bottom: 0.2rem;
        }

        .ep-ai-title {
          margin: 0;
          font-size: 1rem;
          font-weight: 700;
          color: #fff;
        }

        .ep-ai-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0.16rem 0.45rem;
          border-radius: 999px;
          font-size: 0.64rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: #8b5cf6;
          background: rgba(167, 139, 250, 0.14);
          border: 1px solid rgba(167, 139, 250, 0.22);
        }

        .ep-ai-desc {
          margin: 0;
          font-size: 0.83rem;
          color: rgba(255,255,255,0.58);
          line-height: 1.55;
        }

        .ep-ai-body {
          display: grid;
          grid-template-columns: 220px minmax(0, 1fr);
          gap: 1rem;
          align-items: start;
        }

        .ep-ai-btn {
          width: 100%;
          padding: 0.85rem 1rem;
          border-radius: 12px;
          border: none;
          font-size: 0.93rem;
          font-weight: 700;
          cursor: pointer;
          color: #fff;
          background: linear-gradient(90deg, #5c4de0, #8b5cf6);
          box-shadow: 0 10px 18px rgba(108,92,231,0.28);
          transition: transform 0.15s ease, opacity 0.15s ease;
          align-self: start;
        }
        .ep-ai-btn:hover:not(:disabled) { transform: translateY(-1px); opacity: 0.96; }
        .ep-ai-btn:disabled { cursor: not-allowed; opacity: 0.7; }

        .ep-ai-results {
          min-height: 84px;
          padding: 0.1rem 0.05rem;
        }

        .ep-ai-results-title {
          font-size: 0.93rem;
          font-weight: 700;
          color: #fff;
          margin-bottom: 0.65rem;
        }

        .ep-ai-loading,
        .ep-ai-placeholder {
          font-size: 0.85rem;
          color: rgba(255,255,255,0.62);
          line-height: 1.55;
        }

        .ep-ai-error {
          font-size: 0.85rem;
          color: #ffb4b4;
          line-height: 1.55;
        }

        .ep-ai-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 0.62rem;
        }

        .ep-ai-item {
          display: flex;
          gap: 0.6rem;
          align-items: flex-start;
          color: rgba(255,255,255,0.86);
          font-size: 0.85rem;
          line-height: 1.55;
        }

        .ep-ai-item-icon {
          color: #c8b1ff;
          flex-shrink: 0;
          margin-top: 0.05rem;
        }

        .ep-card {
          background: linear-gradient(180deg,rgba(25,24,42,0.98) 0%,rgba(18,17,34,0.98) 100%);
          border: 1px solid var(--ep-border, rgba(255,255,255,0.08));
          border-radius: 16px;
          padding: 1.6rem 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.8rem;
          transition: transform 0.18s ease, box-shadow 0.18s ease;
        }
        .ep-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 14px 30px rgba(0,0,0,0.3);
        }

        .ep-card-icon { flex-shrink: 0; }

        .ep-card-title {
          margin: 0;
          font-size: 1rem;
          font-weight: 700;
          color: #fff;
        }
        .ep-card-desc {
          margin: 0;
          font-size: 0.82rem;
          color: rgba(255,255,255,0.5);
          line-height: 1.55;
        }

        .ep-feature-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          flex: 1;
        }
        .ep-feature-item {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          font-size: 0.82rem;
          color: rgba(255,255,255,0.62);
        }
        .ep-feat-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .ep-export-btn {
          width: 100%;
          padding: 0.72em 1em;
          border-radius: 10px;
          border: none;
          font-size: 0.9rem;
          font-weight: 700;
          cursor: pointer;
          transition: opacity 0.15s, transform 0.15s;
          margin-top: 0.25rem;
        }
        .ep-export-btn:hover { opacity: 0.88; transform: translateY(-1px); }
        .ep-btn-purple {
          background: linear-gradient(90deg,#5c4de0,#6c5ce7);
          color: #fff;
          box-shadow: 0 4px 14px rgba(108,92,231,0.35);
        }
        .ep-btn-green {
          background: linear-gradient(90deg,#059669,#10b981);
          color: #fff;
          box-shadow: 0 4px 14px rgba(16,185,129,0.3);
        }
        .ep-btn-blue {
          background: linear-gradient(90deg,#1d4ed8,#3b82f6);
          color: #fff;
          box-shadow: 0 4px 14px rgba(59,130,246,0.3);
        }

        /* Info card */
        .ep-info-card {
          display: flex;
          align-items: flex-start;
          gap: 0.9rem;
          padding: 1rem 1.25rem;
          border-radius: 14px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
        }
        .ep-info-icon {
          width: 36px; height: 36px; border-radius: 10px;
          background: rgba(108,92,231,0.15);
          color: #c8b1ff;
          display: inline-flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .ep-info-copy { display: flex; flex-direction: column; gap: 0.2rem; }
        .ep-info-copy strong { font-size: 0.88rem; color: #fff; font-weight: 600; }
        .ep-info-copy p { margin: 0; font-size: 0.8rem; color: rgba(255,255,255,0.48); line-height: 1.5; }

        /* ── Light mode ── */
        .app.light-mode .ep-title { color: var(--text-light,#2f2050); }
        .app.light-mode .ep-sub { color: rgba(47,32,80,0.54); }
        .app.light-mode .ep-label { color: var(--text-light,#2f2050); }
        .app.light-mode .ep-select { 
          background: #fff; 
          border-color: rgba(47,32,80,0.15); 
          color: var(--text-light,#2f2050); 
        }
        .app.light-mode .ep-select option { background: #fff; color: var(--text-light,#2f2050); }
        .app.light-mode .ep-card {
          background: #fff;
          box-shadow: 0 4px 14px rgba(108,92,231,0.07);
        }
        .app.light-mode .ep-card-title { color: var(--text-light,#2f2050); }
        .app.light-mode .ep-card-desc { color: rgba(47,32,80,0.56); }
        .app.light-mode .ep-feature-item { color: rgba(47,32,80,0.64); }
        .app.light-mode .ep-info-card {
          background: rgba(108,92,231,0.04);
          border-color: rgba(108,92,231,0.1);
        }
        .app.light-mode .ep-info-copy strong { color: var(--text-light,#2f2050); }
        .app.light-mode .ep-info-copy p { color: rgba(47,32,80,0.52); }

        @media (max-width: 900px) {
          .ep-cards-grid { grid-template-columns: 1fr; }
          .ep-ai-body { grid-template-columns: 1fr; }
        }
        @media (max-width: 640px) {
          .ep-title { font-size: 1.2rem; }
        }
      `}</style>
    </div>
  )
}