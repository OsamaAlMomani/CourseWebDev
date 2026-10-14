// All the books live here, one object each. Cards, the marquee, the
// "Which book?" dropdown and the book of the month are all built from this array.
// `id` doubles as the cover file name: public/assets/covers/<id>.svg

export const books = [
  // Kids
  { id: 'moon-bakery', title: 'The Moon Bakery', author: 'T. Alvarez', detail: 'Ages 3-6', blurb: 'A baker, a very sleepy moon and the night they swap jobs.', price: 11.5, group: 'kids', isNew: true },
  { id: 'little-atlas', title: 'Little Atlas of Everything', author: 'P. Moreau', detail: 'Ages 4-7', blurb: 'A picture book tour of oceans, mountains and very small countries.', price: 12.99, group: 'kids' },
  { id: 'mango-season', title: 'Mango Season', author: 'N. Perera', detail: 'Ages 6-9', blurb: 'Two cousins, one tree and a very long summer in Colombo.', price: 11.5, group: 'kids' },
  { id: 'captain-pebble', title: "Captain Pebble's Big Dive", author: 'R. Lindgren', detail: 'Ages 7-10', blurb: 'A tiny submarine, a huge reef and a mystery with fins.', price: 13.25, group: 'kids' },

  // Teens
  { id: 'glass-orbit', title: 'Glass Orbit', author: 'K. Mbeki', detail: 'Ages 13+', blurb: 'Four teenagers on a failing space station and one working radio.', price: 14.99, group: 'teens', isNew: true },
  { id: 'lighthouse', title: 'The Last Lighthouse Club', author: 'H. Nakamura', detail: 'Ages 12+', blurb: 'A summer club, a locked tower and a secret the town buried.', price: 13.5, group: 'teens' },
  { id: 'static', title: 'Static', author: 'J. Okoye', detail: 'Ages 14+', blurb: "She can hear everyone's messages. Then she hears her own.", price: 15.25, group: 'teens' },
  { id: 'roll-initiative', title: 'Roll for Initiative', author: 'S. Duarte', detail: 'Ages 12+', blurb: 'A tabletop group, a new kid and a campaign that gets real.', price: 12.75, group: 'teens' },

  // Adults
  { id: 'global-novel', title: 'The Global Novel', author: 'A. Writer', detail: 'Fiction', blurb: 'A family saga that follows one recipe across four continents.', price: 19.99, group: 'adults' },
  { id: 'across-borders', title: 'Across Borders', author: 'B. Author', detail: 'Non-fiction', blurb: 'Reporting from twelve border crossings and the people who use them daily.', price: 17.5, group: 'adults' },
  { id: 'cartographer', title: "The Cartographer's Daughter", author: 'E. Ruiz', detail: 'Fiction', blurb: "A girl inherits her father's unfinished map and sets out to finish it.", price: 15.99, group: 'adults' },
  { id: 'salt-road', title: 'The Salt Road', author: 'L. Okafor', detail: 'History', blurb: 'How one mineral crossed the Sahara and shaped half a continent.', price: 18.25, group: 'adults' },

  // Students
  { id: 'stats-curious', title: 'Statistics for the Curious', author: 'R. Haddad', detail: 'Academic', blurb: 'Probability and inference, with worked examples.', price: 39, group: 'students' },
  { id: 'systems-fast', title: 'Thinking in Systems, Fast', author: 'J. Weber', detail: 'Study guide', blurb: 'A short guide to feedback loops in work, cities and daily life.', price: 22, group: 'students' },

  // Scientists
  { id: 'deep-blue', title: 'Deep Blue', author: 'S. Lindqvist', detail: 'Science', blurb: "A marine biologist's year on a North Atlantic research ship.", price: 21.5, group: 'scientists' },
  { id: 'learning-machines', title: 'Learning Machines', author: 'D. Innovator', detail: 'Academic', blurb: 'Machine learning from first principles, no hype.', price: 42, group: 'scientists', isNew: true },
]

// The five reader groups. Each one gets its own page (see themes.js for how each page looks).
// In `headline`, the bit between *stars* gets the accent colour.
export const groups = [
  {
    id: 'kids', title: 'Kids', homeLine: 'Little readers, ages 3 to 10',
    kicker: 'Ages 3 to 10', headline: 'Stories that are *all yours!*',
    intro: "Big pictures, funny friends and adventures from the moon to the deep blue reef. Pick one and let's read!",
    cta: 'Show me the books', shelfTitle: 'Pick a story', shelfNote: 'Picture books and first stories, ages 3 to 10.',
    points: [
      { title: 'Big, bright pictures', text: 'Made for pointing at and giggling over.' },
      { title: 'Read-aloud friendly', text: 'Short, fun stories for bedtime or any time.' },
      { title: 'Grown-up approved', text: 'Fair prices and 30-day returns.' },
    ],
  },
  {
    id: 'teens', title: 'Teens', homeLine: 'Ages 12 and up. No talking down.',
    kicker: 'Ages 12+', headline: 'Real stories. *Real stakes.*',
    intro: 'No talking down. Space stations, secrets and campaigns that actually get you.',
    cta: 'See the books', shelfTitle: 'The good stuff', shelfNote: 'Stories with bigger stakes, ages 12 and up.',
    points: [
      { title: 'No talking down', text: "Stories that treat you like the reader you are." },
      { title: 'Stories with stakes', text: 'Failing stations, buried secrets, campaigns that get real.' },
      { title: 'Shipped worldwide', text: 'Tracked to your door in 180+ countries.' },
    ],
  },
  {
    id: 'adults', title: 'Adults', homeLine: 'Fiction, history and big ideas',
    kicker: 'Fiction · History · Ideas', headline: 'Time for a *good read.*',
    intro: 'Considered fiction, history and reportage, chosen for readers who like to take their time.',
    cta: 'Browse the shelf', shelfTitle: 'The shelf', shelfNote: 'Novels, history and big ideas for the long evening.',
    points: [
      { title: 'Considered picks', text: 'Fiction, history and reportage worth your evening.' },
      { title: 'Take your time', text: '30 days to return anything, no questions.' },
      { title: 'Delivered anywhere', text: 'Tracked shipping to 180+ countries.' },
    ],
  },
  {
    id: 'students', title: 'Students', homeLine: 'Study guides and textbooks',
    kicker: 'Study guides & textbooks', headline: 'Study smarter, *not longer.*',
    intro: 'Clear study guides and readable academic texts for lectures, exams and everything in between.',
    cta: 'Find my study guide', shelfTitle: 'Study shelf', shelfNote: 'Study guides and academic reads that are actually readable.',
    points: [
      { title: 'Plain language', text: 'Guides and texts that are actually readable.' },
      { title: 'Worked examples', text: "Because reading about it isn't the same as doing it." },
      { title: 'Fair prices', text: 'No surprise fees, easy returns.' },
    ],
  },
  {
    id: 'scientists', title: 'Scientists', homeLine: 'Research reads and first principles',
    kicker: 'Reading list', headline: 'Rigour, *without the hype.*',
    intro: 'Field notes and first principles, written by people who do the work, for people who do the work.',
    cta: 'View the reading list', shelfTitle: 'The reading list', shelfNote: 'Science and machine learning, from the field to first principles.',
    points: [
      { title: 'Rigour over hype', text: 'First principles and careful claims.' },
      { title: 'Written from the field', text: 'Whole research years, not summaries.' },
      { title: 'Tracked worldwide', text: 'Shipped to 180+ countries.' },
    ],
  },
]

// Options for the price filter. A book passes if min <= price <= max.
export const priceFilters = [
  { id: 'any', label: 'Any price', min: 0, max: Infinity },
  { id: 'under-15', label: 'Under $15', min: 0, max: 14.99 },
  { id: '15-25', label: '$15 to $25', min: 15, max: 25 },
  { id: 'over-25', label: 'Over $25', min: 25.01, max: Infinity },
]

export const formatPrice = (price) => `$${price.toFixed(2)}`

export const orderLink = (title, copies = 1) => {
  const subject = copies > 1 ? `Order: ${title} (x${copies})` : `Order: ${title}`
  return `mailto:hello@globalbooks.example?subject=${encodeURIComponent(subject)}`
}
