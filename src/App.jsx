import useRoute from './lib/useRoute'
import Header from './components/Header'
import Main from './components/Main'
import Footer from './components/Footer'
import ChatFab from './components/ChatFab'

export default function App() {
  // which page are we on? (the part after #/ in the address)
  const route = useRoute()

  return (
    <>
      <a
        href="#main"
        className="absolute -left-[999px] top-0 z-[200] bg-sun px-4 py-2.5 text-ink focus:left-0"
      >
        Skip to content
      </a>
      <Header route={route} />
      <Main route={route} />
      <Footer />
      <ChatFab />
    </>
  )
}
