// ============================================================================
// eventEmitter.js — Pub/Sub factory (Observer Pattern core)
// ============================================================================

export function createEventEmitter() {
  // TODO (1): create the private listeners store here.
  const listeners = {};

  function on(eventName, listener) {
    // TODO (2):
    if (typeof listener !== 'function') {
      throw new TypeError(`Listener for event "${eventName}" must be a function`);
    }
    
    if (!listeners[eventName]) {
      listeners[eventName] = [];
    }
    listeners[eventName].push(listener);
  }

  function off(eventName, listener) {
    // TODO (3):
    if (!listeners[eventName]) {
      return;
    }
    
    // Filter into a new array to avoid mutating during emit
    listeners[eventName] = listeners[eventName].filter(
      existingListener => existingListener !== listener
    );
    
    // Clean up empty arrays
    if (listeners[eventName].length === 0) {
      delete listeners[eventName];
    }
  }

  function emit(eventName, payload) {
    // TODO (4):
    if (!listeners[eventName]) {
      return;
    }
    
    // Copy array to avoid issues if listeners modify the array
    const handlers = [...listeners[eventName]];
    
    for (const handler of handlers) {
      try {
        handler(payload);
      } catch (error) {
        console.error(`Error in listener for event "${eventName}":`, error);
      }
    }
  }

  return Object.freeze({ on, off, emit });
}