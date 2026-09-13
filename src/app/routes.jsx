import App from './App.jsx'
import Dashboard from '../pages/Dashboard.jsx'
import CharacterList from '../pages/CharacterList.jsx'
import CharacterProfile from '../pages/CharacterProfile.jsx'
import Timeline from '../pages/Timeline.jsx'
import Arcs from '../pages/Arcs.jsx'
import AdminPanel from '../pages/AdminPanel.jsx'
import AdminCharacterForm from '../pages/AdminCharacterForm.jsx'
import AdminRoute from '../components/AdminRoute.jsx'
import NotFound from '../pages/NotFound.jsx'
import RouteError from './RouteError.jsx'

export const routes = [{
  element: <App />, errorElement: <RouteError />,
  children: [
    { index: true, element: <Dashboard /> },
    { path: 'characters', element: <CharacterList /> },
    { path: 'characters/:slug', element: <CharacterProfile /> },
    { path: 'timeline', element: <Timeline /> },
    { path: 'arcs', element: <Arcs /> },
    { path: 'admin', element: <AdminRoute><AdminPanel /></AdminRoute> },
    { path: 'admin/new', element: <AdminRoute><AdminCharacterForm /></AdminRoute> },
    { path: 'admin/edit/:slug', element: <AdminRoute><AdminCharacterForm /></AdminRoute> },
    { path: '*', element: <NotFound /> },
  ],
}]
