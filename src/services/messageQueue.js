/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Offline Message Queue
 *
 * Xabarlarni localStorage ga buffer qiladi va socket ulanganda avtomatik
 * yuboradi. Agar serverga yetib bormasa (ACK kelmasa), qayta urinadi.
 *
 * Usage:
 *   import { messageQueue } from './messageQueue';
 *   messageQueue.enqueue({ text, recipientTgId, ... });
 *   messageQueue.start(socket);
 *   messageQueue.stop();
 * ═══════════════════════════════════════════════════════════════════════════
 */

const STORAGE_KEY = 'pending_messages';

class MessageQueue {
  constructor() {
    this.socket = null;
    this.isRunning = false;
    this.isFlushing = false; // 🔴 RETRY-FIX: concurrent flush guard
    this.flushTimeout = null;
    this.maxRetries = 5;
    this.retryDelay = 2000; // 2 seconds between retries
  }

  /**
   * Get all pending messages from localStorage
   */
  getPending() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch {
      return [];
    }
  }

  /**
   * Save pending messages to localStorage
   */
  _save(messages) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch (e) {
      // localStorage might be full — remove oldest messages
      if (e.name === 'QuotaExceededError') {
        const trimmed = messages.slice(-50); // Keep only last 50
        localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
      }
    }
  }

  /**
   * Add a message to the queue
   */
  enqueue(message) {
    const pending = this.getPending();
    pending.push({
      ...message,
      _id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      _retries: 0,
      _createdAt: Date.now(),
    });
    this._save(pending);

    // Try to send immediately if socket is connected
    if (this.socket?.connected) {
      this.flush();
    }
  }

  /**
   * Remove a message from the queue by tempId
   */
  dequeue(tempId) {
    const pending = this.getPending().filter(m => m._id !== tempId);
    this._save(pending);
  }

  // 🔴 LISTENER-LEAK-FIX: start() socket.js da HAR bir 'connect' event'da chaqiriladi
  // (va connectSocket() da ham). Avval har chaqiruvda yangi anonim `connect`/`reconnect`
  // listener qo'shilardi — qayta ulanishlar soni bilan listenerlar to'planib ketar, har
  // connect'da N marta flush() ishlar, xotira o'sib borardi. Endi handlerlar bir marta
  // nomlangan holda ro'yxatdan o'tadi (off bilan olib tashlash mumkin) — dublikat yo'q.
  _bindHandlers(socket) {
    if (this._handlersBound) return;
    this._handlersBound = true;

    this._onConnect = () => this.flush();
    this._onReconnect = () => this.flush();
    this._onMessageSent = ({ tempId }) => {
      if (tempId) this.dequeue(tempId);
    };

    socket.on('connect', this._onConnect);
    socket.on('reconnect', this._onReconnect);
    socket.on('message_sent', this._onMessageSent);
  }

  /**
   * Start the queue processor
   */
  start(socket) {
    this.socket = socket;
    this.isRunning = true;
    this.isFlushing = false; // 🔴 RETRY-FIX: eski stuck flush holatini tozalash
    this._bindHandlers(socket);

    // Flush when connected
    if (socket.connected) {
      this.flush();
    }

    // Periodic flush every 5 seconds
    if (!this.flushTimeout) {
      this.flushTimeout = setInterval(() => this.flush(), 5000);
    }
  }

  /**
   * Stop the queue processor
   */
  stop() {
    this.isRunning = false;
    this.isFlushing = false; // 🔴 RETRY-FIX
    if (this.flushTimeout) {
      clearInterval(this.flushTimeout);
      this.flushTimeout = null;
    }
    if (this.socket && this._handlersBound) {
      this.socket.off('connect', this._onConnect);
      this.socket.off('reconnect', this._onReconnect);
      this.socket.off('message_sent', this._onMessageSent);
      this._handlersBound = false;
    }
    this.socket = null;
  }

  /**
   * Flush all pending messages
   * Sends messages with timeout ACK — if no response, keeps in queue.
   * Batches in groups of 5 to avoid flooding the server.
   */
  flush() {
    if (!this.socket?.connected || !this.isRunning) return;
    // 🔴 RETRY-FIX: flush allaqachon ishlayotgan bo'lsa, qayta chaqirmaymiz.
    // (5s interval + connect/reconnect event + enqueue() bir vaqtda flush
    //  chaqirishi mumkin — guard bo'lmasa bir xil xabarlar DUBLIKAT yuboriladi.)
    if (this.isFlushing) return;

    const pending = this.getPending();
    if (pending.length === 0) return;

    const now = Date.now();
    const BATCH_SIZE = 5;
    let completed = 0;

    // Expired va max-retried xabarlarni filtrlaymiz; qolganlarining retry
    // hisoblagichini oshiramiz.
    const valid = pending.filter(msg => {
      if (now - msg._createdAt > 24 * 60 * 60 * 1000) return false;
      if (msg._retries >= this.maxRetries) return false;
      msg._retries++;
      return true;
    });

    // 🔴 RETRY-FIX: incrementlangan retry sonini DARHOL saqlaymiz. Ilgari
    // `msg._retries++` faqat xotirada bajarilar, `_save` esa localStorage'dan
    // QAYTA o'qir edi (eski qiymatlar) — natijada retry hisoblagichi hech qachon
    // o'smas, xabarlar 24 soatgacha abadiy qayta yuborilar, maxRetries=5 esa
    // umuman ishlamas edi.
    this._save(valid);

    if (valid.length === 0) return; // Hammasi expired/max-retried — tozalandi
    this.isFlushing = true;
    const totalToSend = valid.length;

    const processNextBatch = (startIdx) => {
      const batch = valid.slice(startIdx, startIdx + BATCH_SIZE);
      if (batch.length === 0) {
        // Barcha batchlar yuborildi — guard'ni bo'shatamiz
        this.isFlushing = false;
        return;
      }

      batch.forEach(msg => {
        this.socket.timeout(5000).emit('send_message', msg, (err, response) => {
          completed++;
          // Doimiy xato — chat tugagan (partner yo'q): qayta urinish ma'nosiz
          if (response?.error === 'not_partner') {
            this.dequeue(msg._id);
          } else if (err || !response?.success) {
            // Muvaffaqiyatsiz — queue'da qoladi (retry soni allaqachon saqlangan)
          } else {
            this.dequeue(msg._id); // Muvaffaqiyatli — queue'dan o'chirish
          }

          // Barcha ACK'lar qaytdi — guard'ni bo'shatamiz
          if (completed === totalToSend) {
            this.isFlushing = false;
          }
        });
      });

      // Next batch after 200ms delay
      if (startIdx + BATCH_SIZE < totalToSend) {
        setTimeout(() => processNextBatch(startIdx + BATCH_SIZE), 200);
      }
    };

    // Start processing first batch
    processNextBatch(0);
  }

  /**
   * Get count of pending messages
   */
  get pendingCount() {
    return this.getPending().length;
  }
}

// Singleton
export const messageQueue = new MessageQueue();
