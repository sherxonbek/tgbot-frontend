import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PlanBadge } from './PlanBadge'

describe('PlanBadge', () => {
  it('renders VIP badge for VIP plan', () => {
    render(<PlanBadge plan="VIP" />)
    expect(screen.getByText('VIP')).toBeInTheDocument()
  })

  it('renders Free badge for Free plan', () => {
    render(<PlanBadge plan="Free" />)
    expect(screen.getByText('Free')).toBeInTheDocument()
  })

  it('renders Free badge for unknown plans', () => {
    render(<PlanBadge plan="Banned" />)
    expect(screen.getByText('Free')).toBeInTheDocument()
  })
})
