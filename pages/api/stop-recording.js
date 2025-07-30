import { getSession, saveSession } from '../../lib/storage';

// Get synchronized UTC time
function getSynchronizedUtcTime() {
  const timeOffsetSeconds = parseFloat(process.env.TIME_OFFSET_SECONDS || '40');
  const utcTime = new Date();
  const synchronizedTime = new Date(utcTime.getTime() + (timeOffsetSeconds * 1000));
  return synchronizedTime;
}

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { session_id } = req.body;

  if (!session_id) {
    return res.status(400).json({ error: 'Session ID is required' });
  }

  // Get session from file storage
  const sessionData = getSession(session_id);
  
  if (!sessionData) {
    return res.status(400).json({ error: 'Invalid session ID' });
  }

  const endTimestamp = getSynchronizedUtcTime().toISOString();
  sessionData.end_timestamp = endTimestamp;
  
  // Save updated session
  const saved = saveSession(session_id, sessionData);
  
  if (!saved) {
    return res.status(500).json({ error: 'Failed to update session' });
  }

  res.status(200).json({
    session_id,
    end_timestamp: endTimestamp,
    session_data: sessionData
  });
}