import { themes } from '../data/themes'
import AudienceHero from './AudienceHero'
import Points from './Points'
import Shelf from './Shelf'
import OtherShelves from './OtherShelves'

// One reader group's page. Everything in it takes its look from that group's theme.
export default function AudiencePage({ group }) {
  const theme = themes[group.id]
  return (
    <>
      <AudienceHero group={group} theme={theme} />
      <Points group={group} theme={theme} />
      <Shelf group={group} theme={theme} />
      <OtherShelves current={group.id} />
    </>
  )
}
