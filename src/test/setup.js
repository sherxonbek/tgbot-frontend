import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// Har testdan keyin DOM tozalash (RTL auto-cleanup globals:siz ishlamaydi)
afterEach(() => {
  cleanup()
})
