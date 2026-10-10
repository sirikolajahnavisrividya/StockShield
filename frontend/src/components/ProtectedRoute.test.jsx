import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

const auth = { session: null, loading: false }
vi.mock('../context/AuthContext', () => ({ useAuth: () => auth }))
import ProtectedRoute from './ProtectedRoute'

const tree = () => render(
  <MemoryRouter initialEntries={['/app']}><Routes>
    <Route path="/login" element={<div>LOGIN PAGE</div>} />
    <Route path="/app" element={<ProtectedRoute><div>SECRET</div></ProtectedRoute>} />
  </Routes></MemoryRouter>)

describe('ProtectedRoute', () => {
  it('redirects unauthenticated users to login', () => { tree(); expect(screen.queryByText('SECRET')).toBeNull(); expect(screen.getByText('LOGIN PAGE')).toBeTruthy() })
  it('renders content for signed-in users', () => { auth.session = { user: { id: '1' } }; tree(); expect(screen.getByText('SECRET')).toBeTruthy() })
})
