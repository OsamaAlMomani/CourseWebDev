import Container from './Container'

const perks = [
  { title: 'Global shipping', text: '180+ countries, tracked' },
  { title: 'Fair prices', text: 'No surprise fees' },
  { title: 'Easy returns', text: '30 days, no questions' },
  { title: 'Secure ordering', text: 'GDPR ready' },
]

export default function Perks() {
  return (
    <section aria-label="Why GlobalBooks" className="bg-coral text-white">
      <Container className="flex gap-10 overflow-x-auto py-7 [scrollbar-width:none] md:grid md:grid-cols-4 md:gap-6 md:overflow-visible md:py-10 [&::-webkit-scrollbar]:hidden">
        {perks.map((p) => (
          <div key={p.title} className="flex shrink-0 flex-col md:shrink">
            <strong className="font-display text-2xl leading-tight font-extrabold md:text-3xl">{p.title}</strong>
            <span className="text-base text-white/90 md:text-lg">{p.text}</span>
          </div>
        ))}
      </Container>
    </section>
  )
}
