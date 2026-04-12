import { NavLink, Outlet } from 'react-router-dom'

export default function Layout() {
  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <NavLink to="/" className="logo">
            AWS SAA-C03 Helper
          </NavLink>
          <nav className="nav">
            <NavLink to="/" end className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              Create Note
            </NavLink>
            <NavLink to="/pools" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              Knowledge Pools
            </NavLink>
            <NavLink to="/mindmap" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              Mindmap
            </NavLink>
            <NavLink to="/manage" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              Manage
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}
