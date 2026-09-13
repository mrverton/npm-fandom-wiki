import BottomNav from './BottomNav'
import ConstellationBackground from './ConstellationBackground'
import ResourceNotice from './common/ResourceNotice'

export default function Layout({ children, header = null, noPadding = false }) {
  return (
    <div className="app-shell relative flex flex-col bg-base-950">
      <ConstellationBackground />
      <div className="relative z-10 flex flex-col flex-1">
        {header}
        <main id="main-content" className={`page-content flex-1 max-w-lg w-full mx-auto ${noPadding ? '' : 'px-4 pt-4'}`}>
          <div className={noPadding ? 'px-4 pt-4' : ''}><ResourceNotice /></div>
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  )
}
