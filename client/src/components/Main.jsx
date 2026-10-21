import { useEffect, useRef } from 'react'
import { useCatalog } from '../context/CatalogContext'
import Home from './Home'
import AccountPage from './AccountPage'
import AudiencePage from './AudiencePage'
import Contact from './Contact'
import MotionLab from './MotionLab'

// The router outlet: shows the home page, or the page for whichever group is in the address.
export default function Main({ route }) {
  const { groups } = useCatalog()
  const group = groups.find((g) => g.id === route) // undefined means home
  const isAccount = route === 'account'
  const isLab = route === 'motion-lab'

  // when the page changes: back to the top, and a title that matches
  const first = useRef(true)
  useEffect(() => {
    document.title = isLab ? 'Motion lab | GlobalBooks' : isAccount ? 'My account | GlobalBooks' : group ? `${group.title} | GlobalBooks` : 'GlobalBooks | Books for every reader'
    if (first.current) {
      first.current = false // don't jump on first load, someone might have opened #contact
      return
    }
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [group, isAccount, isLab])

  return (
    <main id="main">
      {/* key makes React start a fresh page (and a fresh filter) when you switch groups */}
      {isLab ? <MotionLab /> : isAccount ? <AccountPage /> : group ? <AudiencePage key={group.id} group={group} /> : <Home />}
      {!isLab && <Contact />}
    </main>
  )
}
