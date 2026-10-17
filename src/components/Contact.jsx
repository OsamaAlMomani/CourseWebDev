import { useState } from 'react'
import { books } from '../data/books'
import Container from './Container'
import Button from './Button'

const channels = [
  { href: 'https://wa.me/491234567890?text=Hi%20GlobalBooks%2C%20I%20need%20help%20with%3A%20', name: 'WhatsApp', text: 'Fastest. Opens a chat with your message started.' },
  { href: 'mailto:hello@globalbooks.example', name: 'Email', text: 'Best for orders and longer questions.' },
  { href: 'tel:+491234567890', name: 'Call', text: 'Monday to Friday, 9:00 to 17:00 (CET)' },
]

const topics = [
  { id: 'pick', label: 'Help me pick a book' },
  { id: 'order', label: 'Place or bulk order' },
  { id: 'track', label: 'Track or change an order' },
  { id: 'help', label: 'Shipping or returns' },
  { id: 'other', label: 'Something else' },
]

const inputCls = 'min-h-11 w-full rounded-[10px] border border-line bg-paper px-3 py-2.5 text-base text-ink'

// one label + input pair. `show` decides whether it's on screen. I use `hidden`
// instead of not rendering it, so whatever someone already typed isn't lost
// if they flip between topics.
function Field({ label, wide = false, show = true, children }) {
  return (
    <label className={`${show ? 'grid' : 'hidden'} min-w-0 gap-1 text-[0.95rem] font-medium ${wide ? 'sm:col-span-full' : ''}`}>
      {label}
      {children}
    </label>
  )
}

export default function Contact() {
  // which "what do you need?" option is picked ('' = nothing yet)
  const [topic, setTopic] = useState('')
  // flips to true once they hit send, so we can say thanks
  const [sent, setSent] = useState(false)
  const is = (...ids) => ids.includes(topic)

  return (
    <section id="contact" className="contact-timeline bg-ink-soft py-16 text-white md:py-28">
      <Container className="grid grid-cols-[minmax(0,1fr)] gap-8 md:grid-cols-[1fr_1.25fr] md:items-start md:gap-12">
        <div>
          <h2 className="font-display text-[clamp(2.6rem,10vw,5rem)] leading-[0.92] font-extrabold tracking-[-0.04em] md:text-[clamp(2.4rem,5vw,4.5rem)]">
            Talk to a real person
          </h2>
          <p className="mt-4 max-w-[44ch] text-xl text-[#c9c6ee]">
            Tell us what you need and we&apos;ll ask only what matters for that. Most replies arrive within one
            business day.
          </p>
          <ul className="mt-5 grid gap-2.5">
            {channels.map((c) => (
              <li key={c.name}>
                <a
                  href={c.href}
                  className="flex min-h-11 flex-col justify-center rounded-[10px] border border-white/20 bg-white/10 px-4 py-3"
                >
                  <strong className="font-display text-2xl text-sun">{c.name}</strong>
                  <span className="text-base text-[#c9c6ee]">{c.text}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <form
          action="mailto:hello@globalbooks.example?subject=GlobalBooks%20request"
          method="post"
          encType="text/plain"
          onSubmit={() => setSent(true)}
          className="rounded-[32px] bg-white p-6 text-ink sm:p-6"
        >
          <fieldset className="mb-5 grid min-w-0 gap-2 sm:grid-cols-2">
            <legend className="mb-2 font-extrabold">1. What do you need?</legend>
            {topics.map((t) => (
              <label key={t.id} className="relative block">
                <input
                  type="radio"
                  name="topic"
                  value={t.label}
                  required
                  checked={topic === t.id}
                  onChange={() => {
                    setTopic(t.id)
                    setSent(false)
                  }}
                  className="peer absolute size-px opacity-0"
                />
                <span className="flex min-h-11 cursor-pointer items-center rounded-[10px] border-2 border-line px-4 py-1 font-medium peer-checked:border-sun peer-checked:bg-sun peer-checked:font-bold peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-blue">
                  {t.label}
                </span>
              </label>
            ))}
          </fieldset>

          {/* nothing below shows up until a topic is picked */}
          <p className={`${topic ? 'block' : 'hidden'} mb-3 font-extrabold`}>2. A few details</p>
          <div className={`${topic ? 'grid' : 'hidden'} gap-3 sm:grid-cols-2`}>
            <Field label="Your name">
              <input name="name" required autoComplete="name" className={inputCls} />
            </Field>
            <Field label="Email">
              <input type="email" name="email" required autoComplete="email" inputMode="email" className={inputCls} />
            </Field>

            <Field label="Who is it for?" show={is('pick')}>
              <select name="reader" className={inputCls}>
                <option value="">Choose</option>
                <option>A child (3 to 10)</option>
                <option>A teen (12+)</option>
                <option>An adult</option>
                <option>A student</option>
                <option>A scientist or researcher</option>
              </select>
            </Field>
            <Field label="Budget per book" show={is('pick')}>
              <select name="budget" className={inputCls}>
                <option value="">Any</option>
                <option>Under $15</option>
                <option>$15 to $25</option>
                <option>$25 to $40</option>
                <option>Over $40</option>
              </select>
            </Field>
            <Field label="What do they enjoy?" wide show={is('pick')}>
              <textarea name="interests" rows={3} placeholder="Space, animals, mysteries, history..." className={`${inputCls} resize-y`} />
            </Field>

            <Field label="Which book?" wide show={is('order')}>
              <select name="book" className={inputCls}>
                <option value="">Choose a book</option>
                {books.map((b) => (
                  <option key={b.id}>{b.title}</option>
                ))}
              </select>
            </Field>
            <Field label="Copies" show={is('order')}>
              <input type="number" name="copies" min="1" inputMode="numeric" placeholder="1" className={inputCls} />
            </Field>
            <Field label="Country" show={is('order', 'help')}>
              <input name="country" autoComplete="country-name" className={inputCls} />
            </Field>
            <Field label="Order number" show={is('track', 'help')}>
              <input name="order_number" autoComplete="off" className={inputCls} />
            </Field>

            <Field label="Anything else we should know?" wide>
              <textarea name="message" rows={3} className={`${inputCls} resize-y`} />
            </Field>
          </div>

          <input type="hidden" name="source" value="GlobalBooks website" />
          <Button as="button" type="submit" variant="primary" large className={`${topic ? 'inline-flex' : 'hidden'} mt-4 w-full`}>
            Send to GlobalBooks
          </Button>
          {/* no preventDefault here, the browser still opens the email like before */}
          {sent && (
            <p role="status" className="mt-3 text-center font-medium">
              Thanks! Your email app should open with the message ready to send.
            </p>
          )}
        </form>
      </Container>
    </section>
  )
}
