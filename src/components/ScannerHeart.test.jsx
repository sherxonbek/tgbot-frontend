import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { ScannerHeart } from './ScannerHeart'

describe('ScannerHeart', () => {
  it('renders without crashing', () => {
    const { container } = render(<ScannerHeart />)
    expect(container.firstChild).not.toBeNull()
  })
})
