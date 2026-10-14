import { priceFilters } from '../data/books'

// Also controlled: Shelf owns `selected`, this just shows it and reports clicks.
export default function PriceFilter({ selected, onChange, shown, total, theme }) {
  return (
    <div className="mb-8 flex flex-wrap items-center gap-2 md:mb-12">
      <span className={`mr-2 text-2xl font-extrabold md:text-3xl ${theme.filterLabel}`}>Filter by price</span>
      <div role="group" aria-label="Filter books by price" className="flex flex-wrap gap-2">
        {priceFilters.map((f) => (
          <button
            key={f.id}
            type="button"
            aria-pressed={selected === f.id}
            onClick={() => onChange(f.id)}
            className={`min-h-12 rounded-full border-[3px] px-6 text-lg font-bold transition hover:-translate-y-0.5 ${
              selected === f.id ? theme.filterOn : theme.filterOff
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
      <p aria-live="polite" className={`text-base sm:ml-auto ${theme.filterCount}`}>
        Showing {shown} of {total} books
      </p>
    </div>
  )
}
