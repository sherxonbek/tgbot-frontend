import { describe, it, expect, beforeEach, vi } from 'vitest'
import { messageQueue } from './messageQueue'

// localStorage jsdom'da mavjud — har test oldidan tozalaymiz
beforeEach(() => {
  localStorage.clear()
  messageQueue.stop()
  vi.restoreAllMocks()
})

// Fake socket — socket.timeout(5000).emit('send_message', msg, cb) shaklini taqlid qiladi
function createFakeSocket({ fail = false, notPartner = false } = {}) {
  const emitted = []
  const socket = {
    connected: true,
    emitted,
    on: vi.fn(),
    off: vi.fn(),
    timeout: vi.fn(() => ({
      emit: (event, msg, cb) => {
        emitted.push(msg)
        setTimeout(() => {
          if (notPartner) cb(null, { success: false, error: 'not_partner' })
          else if (fail) cb(new Error('timeout'), null)
          else cb(null, { success: true })
        }, 5)
      },
    })),
  }
  return socket
}

const tick = () => new Promise((r) => setTimeout(r, 20))

describe('MessageQueue retry bug', () => {
  it('persists incremented retry count in localStorage on failure', async () => {
    const socket = createFakeSocket({ fail: true })
    messageQueue.start(socket)
    messageQueue.enqueue({ text: 'salom', recipientTgId: '111' })

    await tick() // flush ack qaytsin

    // 🔴 RETRY-FIX: retry soni localStorage'ga yozilishi kerak (ilgari yozilmasdi)
    const pending = messageQueue.getPending()
    expect(pending).toHaveLength(1)
    expect(pending[0]._retries).toBe(1)
    expect(pending[0]._id).toBeDefined()
  })

  it('drops the message after maxRetries attempts', async () => {
    const socket = createFakeSocket({ fail: true })
    messageQueue.start(socket)
    messageQueue.enqueue({ text: 'salom', recipientTgId: '111' })

    // maxRetries marta muvaffaqiyatsiz urinish
    for (let i = 0; i < messageQueue.maxRetries + 1; i++) {
      messageQueue.flush()
      await tick()
    }

    // maxRetries dan oshgan xabar queue'dan o'chirilishi kerak
    expect(messageQueue.getPending()).toHaveLength(0)
  })

  it('does not send duplicates when flush is called concurrently', async () => {
    const socket = createFakeSocket({ fail: true })
    messageQueue.start(socket)
    messageQueue.enqueue({ text: 'salom', recipientTgId: '111' })

    // Birinchi flush ishlayotgan paytda yana chaqirish — dublikat bo'lmasligi kerak
    messageQueue.flush()
    messageQueue.flush()
    messageQueue.flush()
    await tick()

    // Bitta xabar bor edi — atigi 1 marta yuborilishi kerak
    expect(socket.emitted.length).toBe(1)
  })

  it('removes message from queue on success', async () => {
    const socket = createFakeSocket()
    messageQueue.start(socket)
    messageQueue.enqueue({ text: 'salom', recipientTgId: '111' })

    await tick()

    expect(messageQueue.getPending()).toHaveLength(0)
  })

  it('removes message immediately on not_partner (permanent error)', async () => {
    const socket = createFakeSocket({ notPartner: true })
    messageQueue.start(socket)
    messageQueue.enqueue({ text: 'salom', recipientTgId: '111' })

    await tick()

    expect(messageQueue.getPending()).toHaveLength(0)
  })

  it('clears expired messages (>24h old)', async () => {
    const socket = createFakeSocket()
    messageQueue.start(socket)
    messageQueue.enqueue({ text: 'eski', recipientTgId: '111' })

    // Xabarni 25 soat eski qilib qo'yamiz
    const stale = messageQueue.getPending().map((m) => ({
      ...m,
      _createdAt: Date.now() - 25 * 60 * 60 * 1000,
    }))
    localStorage.setItem('pending_messages', JSON.stringify(stale))

    messageQueue.flush()
    await tick()

    expect(messageQueue.getPending()).toHaveLength(0)
  })
})
