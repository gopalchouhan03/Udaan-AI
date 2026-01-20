// Very small pub/sub event bus for intra-app notifications
const listeners = new Map();

export function subscribe(event, cb) {
  if (!listeners.has(event)) listeners.set(event, new Set());
  listeners.get(event).add(cb);
  return () => listeners.get(event).delete(cb);
}

export function publish(event, payload) {
  const set = listeners.get(event);
  if (!set) return;
  for (const cb of Array.from(set)) {
    try { cb(payload); } catch (err) { console.error('eventBus handler error', err); }
  }
}

export default { subscribe, publish };
