import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { UserAvatar } from './Avatar'

describe('UserAvatar', () => {
  it('shows initials when no avatar is provided', () => {
    render(<UserAvatar name="John Doe" avatar="" />)
    expect(screen.getByText('JD')).toBeInTheDocument()
  })

  it('shows ? for empty name', () => {
    render(<UserAvatar name="" avatar="" />)
    expect(screen.getByText('?')).toBeInTheDocument()
  })

  it('renders the image element when an avatar URL is given', () => {
    render(<UserAvatar name="Ali" avatar="https://example.com/avatar.jpg" />)
    const img = screen.getByRole('img')
    expect(img).toHaveAttribute('src', 'https://example.com/avatar.jpg')
    expect(img).toHaveAttribute('alt', 'Ali')
  })

  it('applies size and border props', () => {
    const { container } = render(<UserAvatar name="Ali" avatar="" size={60} border={false} />)
    const el = container.firstChild
    expect(el).toHaveStyle({ width: '60px', height: '60px' })
    // border: false → borderStyle none (border-width shorthand `medium` bo'lib normalizatsiyalanadi)
    expect(el).toHaveStyle({ borderStyle: 'none' })
  })
})
