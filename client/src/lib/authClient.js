import { createAuthClient } from 'better-auth/react'
import { API_BASE, authHeader } from './api'

// The browser side of Better Auth. It calls /api/auth/* on our server and gives us:
//   authClient.signUp.email({ name, email, password })   authClient.signIn.email({ email, password })
//   authClient.signOut()                                 authClient.useSession()  <- React hook: who is signed in?
// useSession() asks the server "is this cookie a valid session?" on page load, which is why you stay signed in after a refresh.
export const authClient = createAuthClient({
  baseURL: API_BASE,
  fetchOptions: {
    credentials: 'include',
    // send the saved token with every auth request
    onRequest: (ctx) => {
      const h = authHeader().Authorization
      if (h) ctx.headers.set('Authorization', h)
    },
    // save the token the server gives us on sign-in / sign-up, forget it on sign-out
    onSuccess: (ctx) => {
      try {
        const t = ctx.response.headers.get('set-auth-token')
        if (t) localStorage.setItem('gb_token', t)
        if (ctx.response.url?.endsWith('/sign-out')) localStorage.removeItem('gb_token')
      } catch {}
    },
  },
})
