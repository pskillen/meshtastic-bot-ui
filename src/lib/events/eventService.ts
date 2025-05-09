// Event service for handling application-wide events
// This helps decouple components by allowing them to communicate through events

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EventCallback = (...args: any[]) => void;

// Define event types
export enum EventType {
  AUTH_ERROR = 'auth_error',
  // Add more event types as needed
}

class EventService {
  private listeners: Map<EventType, EventCallback[]> = new Map();

  // Subscribe to an event
  subscribe(event: EventType, callback: EventCallback): () => void {
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

  // Emit an event
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  emit(event: EventType, ...args: any[]): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => callback(...args));
    }
  }
}

// Create a singleton instance
export const eventService = new EventService();
