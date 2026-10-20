import { useState } from 'react'
import { themes } from '../data/themes'
import AudienceHero from './AudienceHero'
import Points from './Points'
import KidsCategories from './KidsCategories'
import Shelf from './Shelf'
import OtherShelves from './OtherShelves'

// One reader group's page. Everything in it takes its look from that group's theme.
// `category` lives here because two things change it: the big tiles (Kids Corner only) and the chips inside the shelf.
export default function AudiencePage({ group }) {
  const theme = themes[group.id]
  const [category, setCategory] = useState('all')

  // a tile was clicked: pick the section, then glide down to the books
  function pick(id) {
    setCategory(id)
    document.getElementById('shelf')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <>
      <AudienceHero group={group} theme={theme} />
      <Points group={group} theme={theme} />
      {group.world === 'kids' && <KidsCategories group={group} onPick={pick} />}
      <Shelf group={group} theme={theme} category={category} onCategory={setCategory} />
      <OtherShelves current={group.id} />
    </>
  )
}
