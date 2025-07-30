import { saveSession } from '../../lib/storage';

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

  const { mac_address, zone_id } = req.body;

  if (!mac_address || !zone_id) {
    return res.status(400).json({ error: 'MAC address and zone ID are required' });
  }

  const timestamp = getSynchronizedUtcTime().toISOString();
  const sessionId = `${mac_address}_${timestamp}`;

  const sessionData = {
    mac_address,
    zone_id,
    start_timestamp: timestamp,
    end_timestamp: null
  };

  // Save to file storage
  const saved = saveSession(sessionId, sessionData);
  
  if (!saved) {
    return res.status(500).json({ error: 'Failed to save session' });
  }

  res.status(200).json({
    session_id: sessionId,
    start_timestamp: timestamp,
    zone_id
  });
}