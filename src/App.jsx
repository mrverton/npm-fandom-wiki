import { Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import CharacterList from './pages/CharacterList'
import CharacterProfile from './pages/CharacterProfile'
import Timeline from './pages/Timeline'
import Arcs from './pages/Arcs'
import { useTelegram } from './hooks/useTelegram'

export default function App() {
  useTelegram()

  return (
    <div className="bg-scan-overlay">
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/characters" element={<CharacterList />} />
        <Route path="/characters/:slug" element={<CharacterProfile />} />
        <Route path="/timeline" element={<Timeline />} />
        <Route path="/arcs" element={<Arcs />} />
      </Routes>
    </div>
  )
}
