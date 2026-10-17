import { useState } from 'react'
import Container from './Container'
import Button from './Button'

const isValid = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())

export default function Newsletter() {
  // what's typed in the box right now
  const [email, setEmail] = useState('')
  // 'idle' = nothing yet, 'error' = bad email, 'done' = signed up
  const [status, setStatus] = useState('idle')

  // runs on every keystroke. Also clears the old error as soon as they start fixing it
  function handleChange(e) {
    setEmail(e.target.value)
    if (status !== 'idle') setStatus('idle')
  }

  // runs when they click out of the box. Only complains if they actually typed something
  function handleBlur() {
    if (email.trim() && !isValid(email)) setStatus('error')
  }

  function handleSubmit(e) {
    // stop the browser from doing its own submit, we handle it here
    e.preventDefault()

    if (!isValid(email)) {
      setStatus('error')
      return
    }

    // no backend yet, so this is where a fetch() to one would go
    setStatus('done')
    setEmail('')
  }

  return (
    <section className="bg-blue py-16 md:py-20 text-white">
      <Container className="grid grid-cols-[minmax(0,1fr)] gap-5 sm:grid-cols-2 sm:items-center">
        <div>
          <h2 className="font-display text-[clamp(2.2rem,8vw,4rem)] leading-[0.95] font-extrabold tracking-[-0.03em]">
            Get a book deal every Friday
          </h2>
          <p className="mt-3 text-lg opacity-90">One email a week. Unsubscribe whenever you like.</p>
        </div>
        <div>
          <form
            onSubmit={handleSubmit}
            noValidate
            className="flex max-w-[520px] gap-2 rounded-full bg-white p-2"
          >
            <input
              type="email"
              name="subscribe"
              value={email}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Email address"
              aria-label="Email address"
              aria-invalid={status === 'error'}
              aria-describedby="newsletter-msg"
              autoComplete="email"
              inputMode="email"
              className="min-w-0 flex-1 bg-transparent px-4 text-lg text-ink outline-none"
            />
            <Button as="button" type="submit" large>
              Subscribe
            </Button>
          </form>

          {/* one spot for feedback, so screen readers hear it too */}
          <p id="newsletter-msg" role="status" aria-live="polite" className="mt-3 min-h-6 px-4 text-base font-medium">
            {status === 'error' && 'That email doesn\u2019t look right. Mind checking it?'}
            {status === 'done' && 'You\u2019re in! Your first deals land this Friday.'}
          </p>
        </div>
      </Container>
    </section>
  )
}
