import fs from 'fs';
import path from 'path';

// Create a temporary directory for session storage
const STORAGE_DIR = path.join(process.cwd(), '.sessions');
const STORAGE_FILE = path.join(STORAGE_DIR, 'sessions.json');

// Ensure storage directory exists
function ensureStorageDir() {
  if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
  }
}

// Read all sessions from file
export function getAllSessions() {
  try {
    ensureStorageDir();
    if (!fs.existsSync(STORAGE_FILE)) {
      return {};
    }
    const data = fs.readFileSync(STORAGE_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading sessions:', error);
    return {};
  }
}

// Save all sessions to file
export function saveAllSessions(sessions) {
  try {
    ensureStorageDir();
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(sessions, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving sessions:', error);
    return false;
  }
}

// Get a specific session
export function getSession(sessionId) {
  const sessions = getAllSessions();
  return sessions[sessionId] || null;
}

// Save a specific session
export function saveSession(sessionId, sessionData) {
  const sessions = getAllSessions();
  sessions[sessionId] = sessionData;
  return saveAllSessions(sessions);
}

// Delete a specific session
export function deleteSession(sessionId) {
  const sessions = getAllSessions();
  delete sessions[sessionId];
  return saveAllSessions(sessions);
}