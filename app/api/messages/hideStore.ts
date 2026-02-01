type HiddenMap = Map<string, Set<string>>; // userId -> set of messageIds

const hidden: HiddenMap = new Map();

export function hideForUser(userId: string, messageId: string) {
  if (!hidden.has(userId)) hidden.set(userId, new Set());
  hidden.get(userId)!.add(messageId);
}

export function isHiddenForUser(userId: string, messageId: string) {
  return hidden.has(userId) && hidden.get(userId)!.has(messageId);
}

export function unhideForUser(userId: string, messageId: string) {
  if (!hidden.has(userId)) return;
  hidden.get(userId)!.delete(messageId);
}

export function listHiddenForUser(userId: string) {
  return Array.from(hidden.get(userId) || []);
}
