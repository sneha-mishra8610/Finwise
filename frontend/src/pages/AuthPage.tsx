import React from 'react'

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

export default function AuthPage({
  signupName,
  signupEmail,
  signupPassword,
  signupLoading = false,
  setSignupName,
  setSignupEmail,
  setSignupPassword,
  signupError,
  loginEmail,
  loginPassword,
  loginLoading = false,
  setLoginEmail,
  setLoginPassword,
  loginError,
  onSignupSubmit,
  onLoginSubmit,
}: AuthPageProps) {
  return (
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
          <button type="submit" disabled={signupLoading}>
            {signupLoading ? 'Creating...' : 'Create account'}
          </button>
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
          <button type="submit" disabled={loginLoading}>
            {loginLoading ? 'Logging in...' : 'Log in'}
          </button>
        </form>
      </div>
    </div>
  )
}
