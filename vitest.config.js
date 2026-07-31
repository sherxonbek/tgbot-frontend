import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Vitest uchun alohida konfig — build/taillwind'ga ta'sir qilmaydi.
// Component testlari jsdom muhitida ishlaydi; setup fayli jest-dom matcher'larini yuklaydi.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: false,
    setupFiles: ['./src/test/setup.js'],
    include: ['src/**/*.test.{js,jsx}'],
  },
})
