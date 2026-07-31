import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SearchTimer } from './SearchTimer'
import { setSfxEnabled } from '../utils/sfx'

vi.mock('../utils/sfx', () => ({
  sfx: { tick: vi.fn(), tickUrgent: vi.fn(), match: vi.fn(), timeout: vi.fn(), cancel: vi.fn(), warm: vi.fn() },
  isSfxEnabled: vi.fn(() => true),
  setSfxEnabled: vi.fn(),
}))

describe('SearchTimer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the elapsed seconds', () => {
    render(<SearchTimer elapsed={12} total={60} />)
    expect(screen.getByText('12')).toBeInTheDocument()
    expect(screen.getByText('soniya')).toBeInTheDocument()
  })

  it('shows normal searching text below 80%', () => {
    render(<SearchTimer elapsed={5} total={60} />)
    expect(screen.getByText('Juft qidirilmoqda…')).toBeInTheDocument()
  })

  it('shows urgent text at 80%+', () => {
    render(<SearchTimer elapsed={50} total={60} />)
    expect(screen.getByText('Tez orada juft topiladi…')).toBeInTheDocument()
  })

  it('toggles mute and disables sfx', () => {
    render(<SearchTimer elapsed={5} total={60} />)
    const btn = screen.getByRole('button', { name: /ovozni o'chirish/i })
    fireEvent.click(btn)
    expect(setSfxEnabled).toHaveBeenCalledWith(false)
  })
})
