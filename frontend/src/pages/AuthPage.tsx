import React, { useState } from 'react'

export type AuthPageProps = {
  theme: 'dark' | 'light'
  onToggleTheme: () => void
  signupName: string
  signupEmail: string
  signupPassword: string
  signupLoading?: boolean
  setSignupName: (value: string) => void
  setSignupEmail: (value: string) => void
  setSignupPassword: (value: string) => void
  signupError: string
  loginEmail: string
  loginPassword: string
  loginLoading?: boolean
  setLoginEmail: (value: string) => void
  setLoginPassword: (value: string) => void
  loginError: string
  onSignupSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void>
  onLoginSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void>
}

const features = [
  {
    bg: 'rgba(108,92,231,0.22)',
    color: '#c8b1ff',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
        strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
        <path d="M9 12l2 2 4-4"/>
      </svg>
    ),
    title: 'Smart Tracking',
    desc: 'Track every expense in real time',
  },
  {
    bg: 'rgba(52,211,153,0.18)',
    color: '#8be0cb',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
        strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    title: 'Group Balances',
    desc: 'See who owes what, instantly',
  },
  {
    bg: 'rgba(245,158,11,0.18)',
    color: '#ffd27e',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
        strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
    title: 'Secure & Private',
    desc: 'Your data is encrypted and always protected',
  },
]

export default function AuthPage({
  signupName, signupEmail, signupPassword, signupLoading = false,
  setSignupName, setSignupEmail, setSignupPassword, signupError,
  loginEmail, loginPassword, loginLoading = false,
  setLoginEmail, setLoginPassword, loginError,
  onSignupSubmit, onLoginSubmit,
}: AuthPageProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [showPw, setShowPw] = useState(false)

  return (
    <div className="aw-root">

      {/* ── TOP BAR ── */}
      {/* ── BODY ── */}
      <div className="aw-body">

        {/* LEFT: Brand panel */}
        <div className="aw-brand">
          <div className="aw-brand-inner">
            <div className="aw-headline-block">
              <h1 className="aw-headline">
                Split smarter.<br/>
                <span className="aw-headline-accent">Settle faster.</span>
              </h1>
              <p className="aw-brand-desc">
                Track shared expenses, manage group balances, and keep friendships intact — all in one place.
              </p>
            </div>

            <div className="aw-feature-list">
              {features.map(f => (
                <div key={f.title} className="aw-feature-row">
                  <span className="aw-feature-icon" style={{ background: f.bg, color: f.color }}>
                    {f.icon}
                  </span>
                  <div className="aw-feature-copy">
                    <strong>{f.title}</strong>
                    <span>{f.desc}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Wallet illustration */}
            <div className="aw-illustration">
              <div className="aw-illus-orb" />
              <div className="aw-wallet-scene">
                <div className="aw-wallet-body">
                  <div className="aw-wallet-card-slot" />
                  <div className="aw-wallet-dot" />
                </div>
                <div className="aw-wallet-card aw-wallet-card-1" />
                <div className="aw-wallet-card aw-wallet-card-2" />
                <div className="aw-plant-pot">
                  <div className="aw-plant-stem" />
                  <div className="aw-plant-leaf aw-plant-leaf-l" />
                  <div className="aw-plant-leaf aw-plant-leaf-r" />
                  <div className="aw-plant-leaf aw-plant-leaf-c" />
                  <div className="aw-pot-body" />
                </div>
                <div className="aw-coin aw-coin-1" />
                <div className="aw-coin aw-coin-2" />
                <div className="aw-coin aw-coin-3" />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Form card */}
        <div className="aw-form-side">
          <div className="aw-card">
            {mode === 'login' ? (
              <>
                <div className="aw-card-head">
                  <h2>Welcome back</h2>
                  <p>Log in to continue to Finwise</p>
                </div>
                <form onSubmit={onLoginSubmit} className="aw-form">
                  <div className="aw-field">
                    <label className="aw-label">Email address</label>
                    <div className="aw-input-wrap">
                      <span className="aw-input-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
                          strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                          <rect x="2" y="4" width="20" height="16" rx="2"/>
                          <path d="m22 7-10 7L2 7"/>
                        </svg>
                      </span>
                      <input
                        type="email"
                        className="aw-input"
                        placeholder="youremail@gmail.com"
                        value={loginEmail}
                        onChange={e => setLoginEmail(e.target.value)}
                        required
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  <div className="aw-field">
                    <label className="aw-label">Password</label>
                    <div className="aw-input-wrap">
                      <span className="aw-input-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
                          strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                          <rect x="3" y="11" width="18" height="11" rx="2"/>
                          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                        </svg>
                      </span>
                      <input
                        type={showPw ? 'text' : 'password'}
                        className="aw-input aw-input-pw"
                        placeholder="••••••••••"
                        value={loginPassword}
                        onChange={e => setLoginPassword(e.target.value)}
                        required
                        autoComplete="current-password"
                      />
                      <button type="button" className="aw-pw-eye" onClick={() => setShowPw(p => !p)} tabIndex={-1}>
                        {showPw
                          ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                          : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        }
                      </button>
                    </div>
                  </div>

                  <div className="aw-remember-row">
                    <label className="aw-remember-label">
                      <input type="checkbox" className="aw-checkbox" />
                      <span>Remember me</span>
                    </label>
                    <button type="button" className="aw-forgot">Forgot password?</button>
                  </div>

                  {loginError && (
                    <div className="aw-error">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      {loginError}
                    </div>
                  )}

                  <button type="submit" className="aw-submit" disabled={loginLoading}>
                    {loginLoading
                      ? <span className="aw-loading"><span className="aw-spinner"/>Logging in…</span>
                      : 'Log in to Finwise'}
                  </button>

                  <div className="aw-or-row"><span/><p>or continue with</p><span/></div>

                  <div className="aw-social-row">
                    <button type="button" className="aw-social-btn">
                      <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                      Google
                    </button>
                    <button type="button" className="aw-social-btn">
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                      </svg>
                      Apple
                    </button>
                  </div>

                  <p className="aw-switch-hint">
                    New to Finwise?{' '}
                    <button type="button" className="aw-switch-link" onClick={() => { setMode('signup'); setShowPw(false) }}>
                      Create one free
                    </button>
                  </p>
                </form>
              </>
            ) : (
              <>
                <div className="aw-card-head">
                  <h2>Create your account</h2>
                  <p>Get started with your financial journey</p>
                </div>
                <form onSubmit={onSignupSubmit} className="aw-form">
                  <div className="aw-field">
                    <label className="aw-label">Full name</label>
                    <div className="aw-input-wrap">
                      <span className="aw-input-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
                          strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                          <circle cx="12" cy="7" r="4"/>
                        </svg>
                      </span>
                      <input
                        type="text"
                        className="aw-input"
                        placeholder="Enter your full name"
                        value={signupName}
                        onChange={e => setSignupName(e.target.value)}
                        required
                        autoComplete="name"
                      />
                    </div>
                  </div>

                  <div className="aw-field">
                    <label className="aw-label">Email address</label>
                    <div className="aw-input-wrap">
                      <span className="aw-input-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
                          strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                          <rect x="2" y="4" width="20" height="16" rx="2"/>
                          <path d="m22 7-10 7L2 7"/>
                        </svg>
                      </span>
                      <input
                        type="email"
                        className="aw-input"
                        placeholder="youremail@gmail.com"
                        value={signupEmail}
                        onChange={e => setSignupEmail(e.target.value)}
                        required
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  <div className="aw-field">
                    <label className="aw-label">Password</label>
                    <div className="aw-input-wrap">
                      <span className="aw-input-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
                          strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                          <rect x="3" y="11" width="18" height="11" rx="2"/>
                          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                        </svg>
                      </span>
                      <input
                        type={showPw ? 'text' : 'password'}
                        className="aw-input aw-input-pw"
                        placeholder="Create a strong password"
                        value={signupPassword}
                        onChange={e => setSignupPassword(e.target.value)}
                        required
                        autoComplete="new-password"
                        minLength={6}
                      />
                      <button type="button" className="aw-pw-eye" onClick={() => setShowPw(p => !p)} tabIndex={-1}>
                        {showPw
                          ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                          : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        }
                      </button>
                    </div>
                  </div>

                  {signupError && (
                    <div className="aw-error">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      {signupError}
                    </div>
                  )}

                  <button type="submit" className="aw-submit" disabled={signupLoading}>
                    {signupLoading
                      ? <span className="aw-loading"><span className="aw-spinner"/>Creating account…</span>
                      : 'Create account'}
                  </button>

                  <p className="aw-switch-hint">
                    Already have an account?{' '}
                    <button type="button" className="aw-switch-link" onClick={() => { setMode('login'); setShowPw(false) }}>
                      Log in
                    </button>
                  </p>
                </form>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div className="aw-footer">
        <div className="aw-footer-left">
          <span className="aw-footer-logomark">F</span>
          © 2026 Finwise. All rights reserved.
        </div>
        <div className="aw-footer-links">
          <button type="button" className="aw-footer-link">Privacy Policy</button>
          <button type="button" className="aw-footer-link">Terms of Service</button>
        </div>
      </div>

      <style>{`
        /* ── Root shell ── */
        .aw-root {
          display: flex;
          flex-direction: column;
          min-height: calc(100vh - 60px);
          background: #0f0e1f;
        }

        /* ── Topbar ── */
        .aw-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.9rem 2rem;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          background: rgba(15,14,31,0.9);
          backdrop-filter: blur(8px);
        }
        .aw-topbar-logo {
          display: flex;
          align-items: center;
          gap: 0.55rem;
        }
        .aw-topbar-logomark {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          background: linear-gradient(135deg, #6c5ce7 0%, #8be0cb 100%);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 1rem;
          font-weight: 800;
          color: #fff;
          flex-shrink: 0;
        }
        .aw-topbar-name {
          font-size: 1.1rem;
          font-weight: 700;
          color: #fff;
          letter-spacing: -0.01em;
        }
        .aw-topbar-secure {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          font-size: 0.82rem;
          color: rgba(255,255,255,0.5);
        }

        /* ── Body split ── */
        .aw-body {
          flex: 1;
          display: flex;
          overflow: hidden;
        }

        /* ── LEFT brand ── */
        .aw-brand {
          flex: 0 0 48%;
          background:
            radial-gradient(ellipse at 30% 15%, rgba(108,92,231,0.4) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 90%, rgba(108,92,231,0.18) 0%, transparent 40%),
            linear-gradient(170deg, #0d0c20 0%, #131230 55%, #09091a 100%);
          display: flex;
          overflow: hidden;
          position: relative;
        }
        .aw-brand-inner {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          gap: 2.2rem;
          padding: 2.8rem 3rem;
          width: 100%;
        }

        /* Headline */
        .aw-headline-block { display: flex; flex-direction: column; gap: 0.8rem; }
        .aw-headline {
          margin: 0;
          font-size: clamp(1.9rem, 3vw, 2.6rem);
          font-weight: 800;
          line-height: 1.18;
          letter-spacing: -0.03em;
          color: #fff;
        }
        .aw-headline-accent {
          display: block;
          background: linear-gradient(90deg, #7c6dff 0%, #6c5ce7 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .aw-brand-desc {
          margin: 0;
          font-size: 0.94rem;
          line-height: 1.65;
          color: rgba(255,255,255,0.58);
          max-width: 340px;
        }

        /* Features */
        .aw-feature-list { display: flex; flex-direction: column; gap: 1.1rem; }
        .aw-feature-row {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
        }
        .aw-feature-icon {
          width: 44px;
          height: 44px;
          border-radius: 13px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .aw-feature-copy { display: flex; flex-direction: column; gap: 0.15rem; }
        .aw-feature-copy strong {
          font-size: 0.95rem;
          font-weight: 700;
          color: #fff;
        }
        .aw-feature-copy span {
          font-size: 0.82rem;
          color: rgba(255,255,255,0.55);
          line-height: 1.4;
        }

        /* Illustration */
        .aw-illustration {
          position: relative;
          margin-top: auto;
          height: 160px;
        }
        .aw-illus-orb {
          position: absolute;
          width: 260px;
          height: 260px;
          border-radius: 50%;
          background: rgba(108,92,231,0.18);
          filter: blur(50px);
          bottom: -80px;
          left: -40px;
          pointer-events: none;
        }
        .aw-wallet-scene {
          position: absolute;
          bottom: 0;
          left: 20px;
          width: 220px;
          height: 140px;
        }
        .aw-wallet-body {
          position: absolute;
          bottom: 20px;
          left: 0;
          width: 130px;
          height: 100px;
          border-radius: 18px;
          background: linear-gradient(135deg, #3b34a0 0%, #221e6e 100%);
          box-shadow: 0 16px 36px rgba(59,52,160,0.45);
          display: flex;
          align-items: flex-end;
          padding: 12px 14px;
        }
        .aw-wallet-card-slot {
          width: 40px;
          height: 6px;
          border-radius: 3px;
          background: rgba(255,255,255,0.18);
        }
        .aw-wallet-dot {
          position: absolute;
          top: 16px;
          right: 14px;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: rgba(255,255,255,0.12);
        }
        .aw-wallet-card {
          position: absolute;
          width: 90px;
          height: 58px;
          border-radius: 10px;
        }
        .aw-wallet-card-1 {
          background: linear-gradient(135deg, #5547c8 0%, #7b6ee8 100%);
          top: 10px;
          left: 70px;
          transform: rotate(10deg);
          opacity: 0.9;
          box-shadow: 0 8px 20px rgba(85,71,200,0.4);
        }
        .aw-wallet-card-2 {
          background: linear-gradient(135deg, #4a3da8 0%, #6855d8 100%);
          top: 0;
          left: 100px;
          transform: rotate(18deg);
          opacity: 0.65;
        }
        .aw-plant-pot {
          position: absolute;
          bottom: 10px;
          left: 140px;
          width: 60px;
        }
        .aw-pot-body {
          width: 44px;
          height: 34px;
          border-radius: 4px 4px 8px 8px;
          background: linear-gradient(170deg, #e8e0ff 0%, #c8b8ff 100%);
          margin: 0 auto;
        }
        .aw-plant-stem {
          width: 3px;
          height: 24px;
          background: #4a9a6a;
          margin: 0 auto;
          border-radius: 2px;
        }
        .aw-plant-leaf {
          position: absolute;
          width: 22px;
          height: 32px;
          border-radius: 50% 50% 50% 0;
          background: linear-gradient(135deg, #5abf85 0%, #3d9e6a 100%);
        }
        .aw-plant-leaf-l {
          top: -20px;
          left: 6px;
          transform: rotate(-30deg);
        }
        .aw-plant-leaf-r {
          top: -20px;
          right: 6px;
          transform: rotate(60deg) scaleX(-1);
        }
        .aw-plant-leaf-c {
          top: -32px;
          left: 50%;
          transform: translateX(-50%) rotate(15deg);
          opacity: 0.85;
        }
        .aw-coin {
          position: absolute;
          border-radius: 50%;
          background: linear-gradient(135deg, #ffd27e 0%, #f4a93d 100%);
          box-shadow: 0 3px 8px rgba(244,169,61,0.5);
        }
        .aw-coin-1 { width: 32px; height: 32px; bottom: 6px; left: 100px; }
        .aw-coin-2 { width: 22px; height: 22px; bottom: 0; left: 118px; opacity: 0.85; }
        .aw-coin-3 { width: 16px; height: 16px; bottom: 10px; left: 90px; opacity: 0.7; }

        /* ── RIGHT form side ── */
        .aw-form-side {
          flex: 1;
          background: #0f0e1f;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem 2.5rem;
          overflow-y: auto;
        }
        .aw-card {
          width: 100%;
          max-width: 420px;
          background: linear-gradient(180deg, rgba(25,24,42,0.98) 0%, rgba(18,17,34,0.98) 100%);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          padding: 2rem 2.1rem;
          box-shadow: 0 20px 50px rgba(0,0,0,0.4);
        }
        .aw-card-head { margin-bottom: 1.5rem; }
        .aw-card-head h2 {
          margin: 0 0 0.3rem;
          font-size: 1.4rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: #fff;
        }
        .aw-card-head p {
          margin: 0;
          font-size: 0.86rem;
          color: rgba(255,255,255,0.5);
        }

        /* Form */
        .aw-form { display: flex; flex-direction: column; gap: 1.05rem; }
        .aw-field { display: flex; flex-direction: column; gap: 0.42rem; }
        .aw-label {
          font-size: 0.8rem;
          font-weight: 600;
          color: rgba(255,255,255,0.7);
        }
        .aw-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }
        .aw-input-icon {
          position: absolute;
          left: 0.82rem;
          color: rgba(255,255,255,0.28);
          display: inline-flex;
          align-items: center;
          pointer-events: none;
          z-index: 1;
        }
        .aw-input {
          width: 100%;
          padding: 0.7em 0.9em 0.7em 2.5em;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.09);
          background: rgba(255,255,255,0.04);
          color: #fff;
          font-size: 0.92rem;
          box-sizing: border-box;
          transition: border-color 0.18s, box-shadow 0.18s, background 0.18s;
        }
        .aw-input-pw { padding-right: 2.8em; }
        .aw-input::placeholder { color: rgba(255,255,255,0.24); }
        .aw-input:focus {
          outline: none;
          border-color: rgba(108,92,231,0.6);
          background: rgba(108,92,231,0.06);
          box-shadow: 0 0 0 3px rgba(108,92,231,0.15);
        }
        .aw-pw-eye {
          position: absolute;
          right: 0.82rem;
          background: none;
          border: none;
          color: rgba(255,255,255,0.32);
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          padding: 0;
          z-index: 1;
          transition: color 0.15s;
        }
        .aw-pw-eye:hover { color: rgba(255,255,255,0.65); }

        /* Remember / forgot row */
        .aw-remember-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
        }
        .aw-remember-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.84rem;
          color: rgba(255,255,255,0.62);
          cursor: pointer;
        }
        .aw-checkbox {
          width: 16px;
          height: 16px;
          accent-color: #6c5ce7;
          cursor: pointer;
          flex-shrink: 0;
        }
        .aw-forgot {
          background: none;
          border: none;
          color: #7c6dff;
          font-size: 0.84rem;
          font-weight: 500;
          cursor: pointer;
          padding: 0;
          transition: color 0.15s;
        }
        .aw-forgot:hover { color: #a89fff; }

        /* Error */
        .aw-error {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.65rem 0.85rem;
          border-radius: 10px;
          background: rgba(255,107,107,0.1);
          border: 1px solid rgba(255,107,107,0.2);
          color: #ff8a8a;
          font-size: 0.83rem;
        }

        /* Submit */
        .aw-submit {
          width: 100%;
          padding: 0.82em 1em;
          border-radius: 10px;
          border: none;
          background: linear-gradient(90deg, #5c4de0 0%, #6c5ce7 100%);
          color: #fff;
          font-size: 0.96rem;
          font-weight: 700;
          cursor: pointer;
          letter-spacing: 0.01em;
          box-shadow: 0 6px 18px rgba(108,92,231,0.38);
          transition: opacity 0.18s, transform 0.15s, box-shadow 0.18s;
          margin-top: 0.15rem;
        }
        .aw-submit:hover:not(:disabled) {
          opacity: 0.9;
          transform: translateY(-1px);
          box-shadow: 0 10px 24px rgba(108,92,231,0.46);
        }
        .aw-submit:disabled { opacity: 0.52; cursor: not-allowed; }
        .aw-loading { display: inline-flex; align-items: center; gap: 0.55rem; }
        .aw-spinner {
          width: 15px; height: 15px;
          border: 2px solid rgba(255,255,255,0.28);
          border-top-color: #fff;
          border-radius: 50%;
          animation: aw-spin 0.7s linear infinite;
          display: inline-block;
        }
        @keyframes aw-spin { to { transform: rotate(360deg); } }

        /* Or / social */
        .aw-or-row {
          display: flex;
          align-items: center;
          gap: 0.85rem;
        }
        .aw-or-row span {
          flex: 1;
          height: 1px;
          background: rgba(255,255,255,0.07);
          display: block;
        }
        .aw-or-row p {
          margin: 0;
          font-size: 0.78rem;
          color: rgba(255,255,255,0.36);
          white-space: nowrap;
        }
        .aw-social-row { display: flex; gap: 0.75rem; }
        .aw-social-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.55rem;
          padding: 0.65em 1em;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.04);
          color: rgba(255,255,255,0.82);
          font-size: 0.88rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.18s, border-color 0.18s;
        }
        .aw-social-btn:hover {
          background: rgba(255,255,255,0.08);
          border-color: rgba(255,255,255,0.16);
        }

        /* Switch hint */
        .aw-switch-hint {
          text-align: center;
          font-size: 0.85rem;
          color: rgba(255,255,255,0.44);
          margin: 0;
        }
        .aw-switch-link {
          background: none;
          border: none;
          color: #7c6dff;
          font-size: inherit;
          font-weight: 600;
          cursor: pointer;
          padding: 0;
          transition: color 0.15s;
        }
        .aw-switch-link:hover { color: #a89fff; }

        /* ── Footer ── */
        .aw-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.9rem 2rem;
          border-top: 1px solid rgba(255,255,255,0.05);
          background: rgba(15,14,31,0.9);
        }
        .aw-footer-left {
          display: flex;
          align-items: center;
          gap: 0.55rem;
          font-size: 0.78rem;
          color: rgba(255,255,255,0.4);
        }
        .aw-footer-logomark {
          width: 22px;
          height: 22px;
          border-radius: 6px;
          background: linear-gradient(135deg, #6c5ce7 0%, #8be0cb 100%);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 0.7rem;
          font-weight: 800;
          color: #fff;
        }
        .aw-footer-links { display: flex; gap: 1.25rem; }
        .aw-footer-link {
          background: none;
          border: none;
          font-size: 0.78rem;
          color: rgba(255,255,255,0.4);
          cursor: pointer;
          padding: 0;
          transition: color 0.15s;
        }
        .aw-footer-link:hover { color: rgba(255,255,255,0.7); }

        /* ── Light mode ── */
        .app.light-mode .aw-root { background: #f4f2ff; }
        .app.light-mode .aw-topbar {
          background: rgba(244,242,255,0.9);
          border-bottom-color: rgba(108,92,231,0.1);
        }
        .app.light-mode .aw-topbar-name { color: var(--text-light, #2f2050); }
        .app.light-mode .aw-topbar-secure { color: rgba(47,32,80,0.5); }
        .app.light-mode .aw-brand {
          background:
            radial-gradient(ellipse at 30% 15%, rgba(108,92,231,0.38) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 90%, rgba(108,92,231,0.16) 0%, transparent 40%),
            linear-gradient(170deg, #1a183d 0%, #211f55 55%, #110f35 100%);
        }
        .app.light-mode .aw-form-side { background: #f4f2ff; }
        .app.light-mode .aw-card {
          background: #fff;
          border-color: rgba(108,92,231,0.12);
          box-shadow: 0 12px 36px rgba(108,92,231,0.1);
        }
        .app.light-mode .aw-card-head h2 { color: var(--text-light, #2f2050); }
        .app.light-mode .aw-card-head p { color: rgba(47,32,80,0.54); }
        .app.light-mode .aw-label { color: rgba(47,32,80,0.74); }
        .app.light-mode .aw-input {
          background: #f7f4ff;
          border-color: rgba(108,92,231,0.16);
          color: var(--text-light, #2f2050);
        }
        .app.light-mode .aw-input::placeholder { color: rgba(47,32,80,0.28); }
        .app.light-mode .aw-input:focus {
          border-color: rgba(108,92,231,0.5);
          background: rgba(108,92,231,0.03);
          box-shadow: 0 0 0 3px rgba(108,92,231,0.1);
        }
        .app.light-mode .aw-input-icon { color: rgba(47,32,80,0.3); }
        .app.light-mode .aw-pw-eye { color: rgba(47,32,80,0.3); }
        .app.light-mode .aw-pw-eye:hover { color: rgba(47,32,80,0.65); }
        .app.light-mode .aw-remember-label { color: rgba(47,32,80,0.64); }
        .app.light-mode .aw-or-row p { color: rgba(47,32,80,0.36); }
        .app.light-mode .aw-or-row span { background: rgba(108,92,231,0.1); }
        .app.light-mode .aw-social-btn {
          background: #f7f4ff;
          border-color: rgba(108,92,231,0.14);
          color: rgba(47,32,80,0.78);
        }
        .app.light-mode .aw-social-btn:hover {
          background: rgba(108,92,231,0.06);
          border-color: rgba(108,92,231,0.22);
        }
        .app.light-mode .aw-switch-hint { color: rgba(47,32,80,0.48); }
        .app.light-mode .aw-footer {
          background: rgba(244,242,255,0.9);
          border-top-color: rgba(108,92,231,0.08);
        }
        .app.light-mode .aw-footer-left,
        .app.light-mode .aw-footer-link { color: rgba(47,32,80,0.44); }
        .app.light-mode .aw-footer-link:hover { color: rgba(47,32,80,0.72); }

        /* ── Responsive ── */
        @media (max-width: 900px) {
          .aw-body { flex-direction: column; }
          .aw-brand { flex: none; min-height: 300px; }
          .aw-illustration { display: none; }
          .aw-brand-inner { gap: 1.5rem; padding: 2rem 1.75rem; }
          .aw-form-side { padding: 2rem 1.25rem; }
        }
        @media (max-width: 480px) {
          .aw-card { padding: 1.5rem 1.25rem; }
          .aw-social-row { flex-direction: column; }
          .aw-topbar, .aw-footer { padding: 0.75rem 1.25rem; }
        }
      `}</style>
    </div>
  )
}
