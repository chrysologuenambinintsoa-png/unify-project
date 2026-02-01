// Simple in-process post event bus shared by server.js and Next handlers
const listeners = new Set();

function subscribeToPostEvents(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function publishPostEvent(ev) {
  for (const l of Array.from(listeners)) {
    try {
      l(ev);
    } catch (err) {
      console.error('postEvents listener error', err);
    }
  }
}

module.exports = {
  subscribeToPostEvents,
  publishPostEvent,
};
