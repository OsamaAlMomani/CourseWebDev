import { useEffect, useRef, useState } from 'react'
import { authClient } from '../../lib/authClient'
import { useShop } from '../../context/ShopContext'
import Button from '../../shared/Button'
import { useSkin } from '../../context/SkinContext'
import { voices } from '../../data/themes'

const inputCls = 'skin-input min-h-12 w-full px-3 py-2.5 text-base'

// Better Auth's messages are accurate but written for developers. These are the ones a shopper can act on.
function friendlyAuthError(error, signup) {
  const message = String(error?.message ?? '')
  if (/already exists/i.test(message)) return 'That email already has an account. Try signing in instead.'
  if (/invalid email or password/i.test(message)) return 'That email and password do not match. Please try again.'
  if (/password/i.test(message) && /(short|8)/i.test(message)) return 'Please choose a password with at least 8 characters.'
  if (/email/i.test(message) && /(invalid|valid)/i.test(message)) return 'That email address does not look right.'
  if (/too many/i.test(message)) return 'Too many attempts. Please wait a minute and try again.'
  if (signup) return message || 'We could not create your account. Please try again.'
  return message || 'We could not sign you in. Please check your email and password.'
}

// Sign in / create account, in a native <dialog> (the browser handles focus trapping and the Escape key for us).
// The real work is done by Better Auth: authClient.signIn.email / signUp.email talk to /api/auth/* on the server,
// the server sets the session cookie AND returns a bearer token, and authClient.useSession() updates the whole UI.
export default function AuthDialog() {
  const { authMode, openAuth, closeAuth, notify } = useShop()
  const ref = useRef(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const signup = authMode === 'signup'
  const icon = (voices[useSkin()] ?? voices.home).icon

  // open / close the <dialog> element whenever authMode changes
  useEffect(() => {
    const dialog = ref.current
    if (authMode && !dialog.open) dialog.showModal()
    if (!authMode && dialog.open) dialog.close()
    setError('')
    setBusy(false)
  }, [authMode])

  async function handleSubmit(e) {
    e.preventDefault()
    const form = Object.fromEntries(new FormData(e.currentTarget))
    const name = String(form.name ?? '').trim()
    const email = String(form.email ?? '').trim().toLowerCase()
    const password = String(form.password ?? '')

    if (signup && password !== String(form.confirm ?? '')) {
      setError('The two passwords are not the same.')
      return
    }

    setBusy(true)
    setError('')
    try {
      // Better Auth returns { data, error } instead of throwing (but a network failure still throws).
      const result = signup
        ? await authClient.signUp.email({ name, email, password })
        : await authClient.signIn.email({ email, password })

      if (result?.error) {
        setError(friendlyAuthError(result.error, signup))
        return
      }
      notify(signup ? 'Welcome to GlobalBooks!' : 'Welcome back!')
      closeAuth()
    } catch {
      setError('We could not reach the server. Check your connection and try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <dialog
      ref={ref}
      onClose={closeAuth}
      onClick={(e) => e.target === ref.current && closeAuth()} // click on the dark backdrop closes it
      aria-labelledby="auth-title"
      className="popup skin-card m-auto w-[min(440px,calc(100vw-2rem))] overflow-hidden p-0 backdrop:bg-ink/60"
    >
      {/* a stripe of the shelf's colours along the top */}
      <div aria-hidden="true" className="h-3 bg-skin-pop" />
      <form onSubmit={handleSubmit} className="grid gap-4 p-6 sm:p-8">
        <p className="text-5xl" aria-hidden="true">{icon}</p>
        <h2 id="auth-title" className="font-skin text-4xl font-extrabold tracking-[-0.03em]">
          {signup ? 'Create your account' : 'Welcome back'}
        </h2>
        <p className="text-skin-muted">
          {signup ? 'Save books, fill a cart and track your orders.' : 'Sign in to use your cart, wishlist and orders.'}
        </p>

        {signup && (
          <label className="grid gap-1 font-medium">
            Your name
            <input name="name" required autoComplete="name" autoFocus className={inputCls} />
          </label>
        )}
        <label className="grid gap-1 font-medium">
          Email
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            inputMode="email"
            autoFocus={!signup}
            className={inputCls}
          />
        </label>
        <label className="grid gap-1 font-medium">
          Password {signup && <span className="text-sm font-normal text-skin-muted">(at least 8 characters)</span>}
          <input
            type="password"
            name="password"
            required
            minLength={8}
            autoComplete={signup ? 'new-password' : 'current-password'}
            className={inputCls}
          />
        </label>
        {signup && (
          <label className="grid gap-1 font-medium">
            Password again
            <input
              type="password"
              name="confirm"
              required
              minLength={8}
              autoComplete="new-password"
              className={inputCls}
            />
          </label>
        )}

        <p role="alert" aria-live="polite" className="min-h-6 font-medium text-skin-danger">{error}</p>

        <Button as="button" type="submit" variant="skin" large disabled={busy}>
          {busy ? 'One moment…' : signup ? 'Create account' : 'Sign in'}
        </Button>
        <p className="text-center">
          {signup ? 'Already have an account? ' : 'New here? '}
          <button type="button" onClick={() => openAuth(signup ? 'signin' : 'signup')} className="font-bold text-skin-link underline">
            {signup ? 'Sign in' : 'Create an account'}
          </button>
        </p>
        <button type="button" onClick={closeAuth} className="mx-auto text-sm text-skin-muted underline">
          Close
        </button>
      </form>
    </dialog>
  )
}
