import React from 'react'

export type AuthPageProps = {
  theme: 'dark' | 'light'
  onToggleTheme: () => void
  signupName: string
  signupEmail: string
  signupPassword: string
  setSignupName: (value: string) => void
  setSignupEmail: (value: string) => void
  setSignupPassword: (value: string) => void
  signupError: string
  loginEmail: string
  loginPassword: string
  setLoginEmail: (value: string) => void
  setLoginPassword: (value: string) => void
  loginError: string
  onSignupSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void>
  onLoginSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void>
}

export default function AuthPage({
  theme,
  onToggleTheme,
  signupName,
  signupEmail,
  signupPassword,
  setSignupName,
  setSignupEmail,
  setSignupPassword,
  signupError,
  loginEmail,
  loginPassword,
  setLoginEmail,
  setLoginPassword,
  loginError,
  onSignupSubmit,
  onLoginSubmit,
}: AuthPageProps) {
  return (
    <div className={`app ${theme === 'light' ? 'light-mode' : ''}`}>
      <header className="app-header">
        <div className="header-left">
          <button className="theme-toggle" onClick={onToggleTheme} aria-label="Toggle theme" title="Toggle theme">🌙</button>
          <h1>Finwise</h1>
        </div>
      </header>
      <div className="auth-layout">
        <div className="panel auth-panel">
          <h2>Sign up</h2>
          <form
            onSubmit={onSignupSubmit}
            className="form-vertical"
          >
            <input
              type="text"
              placeholder="Name"
              value={signupName}
              onChange={(event) => setSignupName(event.target.value)}
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={signupEmail}
              onChange={(event) => setSignupEmail(event.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={signupPassword}
              onChange={(event) => setSignupPassword(event.target.value)}
              required
            />
            {signupError && <p className="signup-error">{signupError}</p>}
            <button type="submit">Create account</button>
          </form>
        </div>
        <div className="panel auth-panel">
          <h2>Log in</h2>
          <form
            onSubmit={onLoginSubmit}
            className="form-vertical"
          >
            <input
              type="email"
              placeholder="Email"
              value={loginEmail}
              onChange={(event) => setLoginEmail(event.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={loginPassword}
              onChange={(event) => setLoginPassword(event.target.value)}
              required
            />
            {loginError && <p className="error-text">{loginError}</p>}
            <button type="submit">Log in</button>
          </form>
        </div>
      </div>
    </div>
  )
}
