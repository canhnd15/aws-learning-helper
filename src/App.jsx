import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Layout from './components/Layout'
import CreateNote from './pages/CreateNote'
import Pools from './pages/Pools'
import Manage from './pages/Manage'
import Mindmap from './pages/Mindmap'

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1e293b',
            color: '#e2e8f0',
            border: '1px solid #334155',
          },
        }}
      />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<CreateNote />} />
          <Route path="pools" element={<Pools />} />
          <Route path="manage" element={<Manage />} />
          <Route path="mindmap" element={<Mindmap />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
