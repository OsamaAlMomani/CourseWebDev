// One small helper for talking to our server. Every component uses this instead of calling fetch() directly.
//   const books = await api('/books?group=kids')
//   await api('/cart', { method: 'POST', body: { bookId: 'moon-bakery', quantity: 2 } })
//
// In development the browser only talks to localhost:5173 and Vite forwards /api to the Express server.
// In production it talks to the API host directly. Either way the login token travels in a header
// (see authClient.js), because cookies do not cross two different sites in most browsers.
const fallbackApi = 'https://book-store-db-o3h2.onrender.com'
export const API_BASE = (import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '' : fallbackApi)).replace(/\/$/, '')

// The login token is kept by authClient.js; send it so the server knows who we are.
export const authHeader = () => {
  try {
    const t = localStorage.getItem('gb_token')
    return t ? { Authorization: `Bearer ${t}` } : {}
  } catch {
    return {}
  }
}

export const forgetToken = () => {
  try {
    localStorage.removeItem('gb_token')
  } catch {
    // private mode / storage blocked: nothing to forget
  }
}

export async function api(path, { method = 'GET', body, signal } = {}) {
  let res
  try {
    res = await fetch(`${API_BASE}/api${path}`, {
      method,
      signal,
      credentials: 'include', // also send the session cookie when both live on the same site
      headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...authHeader() },
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch (err) {
    if (err?.name === 'AbortError') throw err
    throw new Error('We could not reach the shop. Check your connection and try again.')
  }

  const data = await res.json().catch(() => null)
  if (!res.ok) {
    // A 401 means the saved token is no longer valid. Drop it so the next sign-in starts clean.
    if (res.status === 401) forgetToken()
    const error = new Error(data?.error ?? `Something went wrong (${res.status}). Please try again.`)
    error.status = res.status
    throw error
  }
  return data
}
