import BottomNav from './BottomNav'
import ConstellationBackground from './ConstellationBackground'

export default function Layout({ children, header = null, noPadding = false }) {
  return (
    <div className="relative min-h-screen flex flex-col bg-base-950 overflow-hidden">
      <ConstellationBackground />
      <div className="relative z-10 flex flex-col flex-1">
        {header}
        <main className={`flex-1 max-w-lg w-full mx-auto ${noPadding ? '' : 'px-4 pt-4'} pb-24`}>
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  )
}
