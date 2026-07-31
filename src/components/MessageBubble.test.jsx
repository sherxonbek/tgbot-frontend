import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import MessageBubble from './MessageBubble'

describe('MessageBubble', () => {
  it('renders a text message with time', () => {
    render(<MessageBubble isMe message={{ type: 'text', text: 'Salom', time: '12:00', read: false }} />)
    expect(screen.getByText('Salom')).toBeInTheDocument()
    expect(screen.getByText('12:00')).toBeInTheDocument()
  })

  it('renders an image message with caption', () => {
    render(<MessageBubble isMe={false} message={{ type: 'image', mediaUrl: 'https://example.com/i.jpg', text: 'Rasm', time: '12:00' }} />)
    expect(screen.getByAltText('Shared image')).toHaveAttribute('src', 'https://example.com/i.jpg')
    expect(screen.getByText('Rasm')).toBeInTheDocument()
  })

  it('renders a voice message with a play button', () => {
    render(<MessageBubble isMe message={{ type: 'voice', mediaUrl: 'https://example.com/v.mp3', time: '12:00' }} />)
    expect(screen.getByRole('button')).toBeInTheDocument()
    expect(screen.getByText('0:00')).toBeInTheDocument()
  })

  it('shows a check icon for read messages (sent by me)', () => {
    const { container } = render(
      <MessageBubble isMe message={{ type: 'text', text: 'ok', time: '12:00', read: true, delivered: 'delivered' }} />
    )
    // CheckCheck icon — svg element mavjud
    expect(container.querySelectorAll('svg').length).toBeGreaterThan(0)
  })
})
