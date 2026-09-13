import React from 'react'
import ReactDOM from 'react-dom/client'
import { createHashRouter, RouterProvider } from 'react-router-dom'
import { routes } from './app/routes.jsx'
import Providers from './app/providers.jsx'
import ErrorBoundary from './app/ErrorBoundary.jsx'
import './index.css'

const router = createHashRouter(routes)
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode><ErrorBoundary><Providers><RouterProvider router={router} /></Providers></ErrorBoundary></React.StrictMode>,
)
