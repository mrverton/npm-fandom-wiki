import { CharactersProvider } from '../context/CharactersContext.jsx'
import { AdminProvider } from '../context/AdminContext.jsx'
import { TelegramProvider } from '../context/TelegramContext.jsx'
export default function Providers({ children }) {
  return <TelegramProvider><AdminProvider><CharactersProvider>{children}</CharactersProvider></AdminProvider></TelegramProvider>
}
