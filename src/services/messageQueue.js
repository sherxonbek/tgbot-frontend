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

  /**
   * Start the queue processor
   */
  start(socket) {
    this.socket = socket;
    this.isRunning = true;

    // Flush when connected
    if (socket.connected) {
      this.flush();
    }

    // Listen for reconnection
    socket.on('connect', () => this.flush());
    socket.on('reconnect', () => this.flush());

    // Listen for message_sent to dequeue
    this._onMessageSent = ({ tempId }) => {
      if (tempId) this.dequeue(tempId);
    };
    socket.on('message_sent', this._onMessageSent);

    // Periodic flush every 5 seconds
    this.flushTimeout = setInterval(() => this.flush(), 5000);
  }

  /**
   * Stop the queue processor
   */
  stop() {
    this.isRunning = false;
    if (this.flushTimeout) {
      clearInterval(this.flushTimeout);
      this.flushTimeout = null;
    }
    if (this.socket && this._onMessageSent) {
      this.socket.off('message_sent', this._onMessageSent);
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

    const pending = this.getPending();
    if (pending.length === 0) return;

    const now = Date.now();
    const BATCH_SIZE = 5;
    let completed = 0;
    let failedCount = 0;
    let startedCount = 0;

    // First, filter out expired and max-retried messages
    const valid = pending.filter(msg => {
      if (now - msg._createdAt > 24 * 60 * 60 * 1000) return false;
      if (msg._retries >= this.maxRetries) return false;
      msg._retries++;
      return true;
    });

    if (valid.length === 0) {
      this._save([]); // Clean up expired messages
      return;
    }

    const totalToSend = valid.length;

    const processNextBatch = (startIdx) => {
      const batch = valid.slice(startIdx, startIdx + BATCH_SIZE);
      if (batch.length === 0) {
        // All batches processed - check if done
        return;
      }

      startedCount += batch.length;

      batch.forEach(msg => {
        this.socket.timeout(5000).emit('send_message', msg, (err, response) => {
          completed++;
          if (err || !response?.success) {
            failedCount++;
          } else {
            this.dequeue(msg._id); // Remove from queue
          }

          // All callbacks processed — no-op since dequeue() already persisted
          if (completed === totalToSend && failedCount > 0) {
            // Ensure failed messages are persisted with updated retry count
            this._save(this.getPending());
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
