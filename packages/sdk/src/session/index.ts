import { getState, setState } from '../core/state';

const SESSION_KEY = 'ms_session_id';
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

interface StoredSession {
  id: string;
  lastActivity: number;
}

function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function readSession(): StoredSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredSession;
  } catch {
    return null;
  }
}

function writeSession(session: StoredSession): void {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    // ignore in environments where sessionStorage is unavailable
  }
}

export function initSession(): string {
  const stored = readSession();
  if (stored && Date.now() - stored.lastActivity < SESSION_TIMEOUT_MS) {
    const updated = { ...stored, lastActivity: Date.now() };
    writeSession(updated);
    setState({ sessionId: stored.id });
    return stored.id;
  }

  const id = generateId();
  writeSession({ id, lastActivity: Date.now() });
  setState({ sessionId: id });
  return id;
}

export function getSessionId(): string {
  const { sessionId } = getState();
  return sessionId ?? initSession();
}

export function setUser(user: { id?: string; email?: string; username?: string }): void {
  if (user.id) setState({ userId: user.id });
}

export function clearUser(): void {
  setState({ userId: null });
}
