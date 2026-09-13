import { Component } from 'react'
import RouteError from './RouteError.jsx'
export default class ErrorBoundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch(error) { console.error('Application render error', error) }
  render() { return this.state.failed ? <RouteError /> : this.props.children }
}
