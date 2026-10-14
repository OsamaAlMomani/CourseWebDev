import { groups } from '../data/books'
import Container from './Container'

const support = [
  { href: '#contact', label: 'Shipping and returns' },
  { href: '#contact', label: 'Track an order' },
  { href: 'mailto:hello@globalbooks.example', label: 'hello@globalbooks.example' },
]

const linkCls = 'inline-flex min-h-9 items-center hover:text-white'

export default function Footer() {
  return (
    <footer className="bg-ink pt-16 pb-[calc(5rem_+_env(safe-area-inset-bottom,0px))] text-[#a9a6cf]">
      <Container className="mb-7 grid grid-cols-[minmax(0,1fr)] gap-7 sm:grid-cols-[2fr_1fr_1fr]">
        <div>
          <h3 className="mb-3 font-display text-3xl font-extrabold text-white">Global<span className="text-sun">Books</span></h3>
          <p>Your worldwide bookstore. Stories and knowledge across borders.</p>
        </div>
        <div>
          <h3 className="mb-2.5 font-bold text-white">Shop</h3>
          <ul>
            {groups.map((g) => (
              <li key={g.id} className="mb-0.5">
                <a href={`#/${g.id}`} className={linkCls}>{g.title}</a>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="mb-2.5 font-bold text-white">Support</h3>
          <ul>
            {support.map((s) => (
              <li key={s.label} className="mb-0.5">
                <a href={s.href} className={linkCls}>{s.label}</a>
              </li>
            ))}
          </ul>
        </div>
      </Container>
      <Container as="p" className="border-t border-white/10 pt-5 text-center text-[0.85rem]">
        &copy; 2026 GlobalBooks. All rights reserved.
      </Container>
    </footer>
  )
}
