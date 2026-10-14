import Container from './Container'
import Button from './Button'

export default function Newsletter() {
  return (
    <section className="bg-blue py-16 md:py-20 text-white">
      <Container className="grid grid-cols-[minmax(0,1fr)] gap-5 sm:grid-cols-2 sm:items-center">
        <div>
          <h2 className="font-display text-[clamp(2.2rem,8vw,4rem)] leading-[0.95] font-extrabold tracking-[-0.03em]">
            Get a book deal every Friday
          </h2>
          <p className="mt-3 text-lg opacity-90">One email a week. Unsubscribe whenever you like.</p>
        </div>
        <form
          action="mailto:hello@globalbooks.example"
          method="post"
          encType="text/plain"
          className="flex max-w-[520px] gap-2 rounded-full bg-white p-2"
        >
          <input
            type="email"
            name="subscribe"
            required
            placeholder="Email address"
            aria-label="Email address"
            autoComplete="email"
            inputMode="email"
            className="min-w-0 flex-1 bg-transparent px-4 text-lg text-ink outline-none"
          />
          <Button as="button" type="submit" large>
            Subscribe
          </Button>
        </form>
      </Container>
    </section>
  )
}
