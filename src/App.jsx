import { Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import CharacterList from './pages/CharacterList'
import CharacterProfile from './pages/CharacterProfile'
import Timeline from './pages/Timeline'
import Arcs from './pages/Arcs'
import AdminPanel from './pages/AdminPanel'
import AdminCharacterForm from './pages/AdminCharacterForm'
import AdminRoute from './components/AdminRoute'
import { useTelegram } from './hooks/useTelegram'
import { CharactersProvider } from './context/CharactersContext'

export default function App() {
  useTelegram()

  return (
    <CharactersProvider>
      <div className="bg-scan-overlay">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/characters" element={<CharacterList />} />
          <Route path="/characters/:slug" element={<CharacterProfile />} />
          <Route path="/timeline" element={<Timeline />} />
          <Route path="/arcs" element={<Arcs />} />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminPanel />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/new"
            element={
              <AdminRoute>
                <AdminCharacterForm />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/edit/:slug"
            element={
              <AdminRoute>
                <AdminCharacterForm />
              </AdminRoute>
            }
          />
        </Routes>
      </div>
    </CharactersProvider>
  )
}
