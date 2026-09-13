export default function RouteError() {
  return <main className="mx-auto max-w-lg p-8 text-slate-200"><h1 className="font-display text-2xl">Не удалось открыть страницу</h1><p className="my-4">Попробуйте перезагрузить приложение.</p><a className="text-qzero underline" href="#/" onClick={() => window.location.reload()}>Вернуться на главную</a></main>
}
