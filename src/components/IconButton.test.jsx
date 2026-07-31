import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { IconButton } from './IconButton'

describe('IconButton', () => {
  it('renders children', () => {
    render(<IconButton>X</IconButton>)
    expect(screen.getByRole('button')).toHaveTextContent('X')
  })

  it('merges base and extra className', () => {
    render(<IconButton className="icon-btn-back">X</IconButton>)
    const btn = screen.getByRole('button')
    expect(btn).toHaveClass('icon-btn')
    expect(btn).toHaveClass('icon-btn-back')
  })

  it('fires onClick and forwards props', () => {
    const onClick = vi.fn()
    render(<IconButton onClick={onClick} aria-label="Orqaga">X</IconButton>)
    const btn = screen.getByRole('button', { name: 'Orqaga' })
    fireEvent.click(btn)
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
