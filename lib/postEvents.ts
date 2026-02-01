type PostEvent = {
  type: 'created' | 'updated' | 'deleted' | 'reaction';
  payload: any;
};

const listeners: Set<(ev: PostEvent) => void> = new Set();

export function subscribeToPostEvents(fn: (ev: PostEvent) => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function publishPostEvent(ev: PostEvent) {
  for (const l of Array.from(listeners)) {
    try {
      l(ev);
    } catch (err) {
      console.error('postEvents listener error', err);
    }
  }
}

export default {
  subscribe: subscribeToPostEvents,
  publish: publishPostEvent,
};
