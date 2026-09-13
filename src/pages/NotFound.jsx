import { Link } from 'react-router-dom'
import Layout from '../components/Layout.jsx'
import { TopBar } from '../components/TopBar.jsx'
import AsyncState from '../components/common/AsyncState.jsx'
export default function NotFound() {
  return <Layout header={<TopBar title="Сигнал не найден" showBack />}><AsyncState title="Такой страницы нет"><Link to="/characters" className="text-qzero underline">Открыть каталог персонажей</Link></AsyncState></Layout>
}
