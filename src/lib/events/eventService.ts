// Event service for handling application-wide events
// This helps decouple components by allowing them to communicate through events

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EventCallback = (...args: any[]) => void;

import { AuthEventType } from '@/lib/auth/authService';
import { WebSocketEventType } from '@/lib/websocket/websocketService';

// Define app-wide event types
export type AppEventType = AuthEventType | WebSocketEventType;

class EventService {
  private listeners: Map<AppEventType, EventCallback[]> = new Map();

  // Subscribe to an event
  subscribe(event: AppEventType, callback: EventCallback): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }

    this.listeners.get(event)!.push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index !== -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  unsubscribe(event: AppEventType, callback: EventCallback): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index !== -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  // Emit an event
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  emit(event: AppEventType, ...args: any[]): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => callback(...args));
    }
  }
}

// Create a singleton instance
export const eventService = new EventService();
