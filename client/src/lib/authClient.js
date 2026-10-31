import { createAuthClient } from 'better-auth/react'
import { API_BASE, authHeader, forgetToken } from './api'

// The browser side of Better Auth. It calls /api/auth/* on our server and gives us:
//   authClient.signUp.email({ name, email, password })   authClient.signIn.email({ email, password })
//   authClient.signOut()                                 authClient.useSession()  <- React hook: who is signed in?
//
// The site and the API are on two different domains, so the session cookie is a third-party cookie
// and browsers may block it. The server's `bearer` plugin also answers with a `set-auth-token` header;
// we keep that token in localStorage and send it as `Authorization: Bearer ...` on every request.
export const authClient = createAuthClient({
  // In development API_BASE is empty: the browser calls this same address and Vite forwards /api to the server.
  baseURL: API_BASE || window.location.origin,
  fetchOptions: {
    credentials: 'include',
    onRequest: (ctx) => {
      const token = authHeader().Authorization
      if (token) ctx.headers.set('Authorization', token)
    },
    onSuccess: (ctx) => {
      try {
        const token = ctx.response.headers.get('set-auth-token')
        if (token) localStorage.setItem('gb_token', token)
        // A successful sign-out invalidates the token on the server too; forget it locally.
        if (ctx.response.url?.includes('/sign-out')) forgetToken()
      } catch {
        // storage can be blocked (private mode); the cookie may still keep us signed in
      }
    },
    onError: (ctx) => {
      // An expired token makes the auth endpoint answer 401; keeping it would make every retry fail.
      if (ctx.response?.status === 401) forgetToken()
    },
  },
})
