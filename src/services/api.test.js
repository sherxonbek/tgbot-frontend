import { describe, it, expect } from 'vitest'
import { resolveAvatarUrl } from './api'

const API_BASE = import.meta.env.VITE_API_URL || 'https://tgbot-backend-r3ei.onrender.com'

describe('resolveAvatarUrl (XSS hardening)', () => {
  it('returns empty string for empty/missing input', () => {
    expect(resolveAvatarUrl('')).toBe('')
    expect(resolveAvatarUrl(null)).toBe('')
    expect(resolveAvatarUrl(undefined)).toBe('')
  })

  it('returns http(s) URLs as-is', () => {
    expect(resolveAvatarUrl('https://res.cloudinary.com/abc.jpg')).toBe('https://res.cloudinary.com/abc.jpg')
    expect(resolveAvatarUrl('http://example.com/a.png')).toBe('http://example.com/a.png')
  })

  it('resolves relative paths against API_BASE', () => {
    expect(resolveAvatarUrl('/uploads/avatar.jpg')).toBe(`${API_BASE}/uploads/avatar.jpg`)
  })

  it('blocks dangerous URL schemes (XSS)', () => {
    expect(resolveAvatarUrl('javascript:alert(1)')).toBe('')
    expect(resolveAvatarUrl('data:text/html;base64,PHNjcmlwdD4=')).toBe('')
    expect(resolveAvatarUrl('vbscript:msgbox(1)')).toBe('')
  })

  it('allows img-safe data:image URLs (settings avatar preview)', () => {
    expect(resolveAvatarUrl('data:image/png;base64,iVBORw0KGgo=')).toBe('data:image/png;base64,iVBORw0KGgo=')
    expect(resolveAvatarUrl('data:image/jpeg;base64,/9j/4AAQ==')).toBe('data:image/jpeg;base64,/9j/4AAQ==')
  })

  it('blocks non-string input', () => {
    expect(resolveAvatarUrl(123)).toBe('')
    expect(resolveAvatarUrl({ url: 'x' })).toBe('')
  })
})
