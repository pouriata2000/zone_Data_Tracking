import { getSession, deleteSession } from '../../lib/storage';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { session_id } = req.query;

  if (!session_id) {
    return res.status(400).json({ error: 'Session ID is required' });
  }

  // Get session from file storage
  const sessionData = getSession(session_id);
  
  if (!sessionData) {
    return res.status(404).json({ error: 'Session not found' });
  }

  // Calculate duration
  let duration = 'Recording in progress';
  if (sessionData.end_timestamp) {
    const startTime = new Date(sessionData.start_timestamp);
    const endTime = new Date(sessionData.end_timestamp);
    duration = ((endTime - startTime) / 1000).toFixed(2);
  }

  // Create CSV content
  const csvHeader = 'MAC Address,Zone ID,Start Timestamp,End Timestamp,Duration (seconds)\n';
  const csvRow = `${sessionData.mac_address},${sessionData.zone_id},${sessionData.start_timestamp},${sessionData.end_timestamp || 'Not finished'},${duration}\n`;
  const csvContent = csvHeader + csvRow;

  // Create filename with MAC address and end timestamp
  let filename;
  if (sessionData.end_timestamp) {
    // Format end timestamp for filename (remove invalid characters)
    const endTime = new Date(sessionData.end_timestamp);
    const formattedEndTime = endTime.toISOString()
      .replace(/[:.]/g, '-')  // Replace colons and dots with dashes
      .replace('T', '_')      // Replace T with underscore
      .slice(0, -5);          // Remove milliseconds and Z
    
    filename = `zone_tracking_${sessionData.mac_address}_zone${sessionData.zone_id}_${formattedEndTime}.csv`;
  } else {
    // If no end timestamp, use current time
    const now = new Date();
    const formattedNow = now.toISOString()
      .replace(/[:.]/g, '-')
      .replace('T', '_')
      .slice(0, -5);
    
    filename = `zone_tracking_${sessionData.mac_address}_zone${sessionData.zone_id}_${formattedNow}_INCOMPLETE.csv`;
  }
  
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  
  // Clean up the session after download (optional)
  // deleteSession(session_id);
  
  res.status(200).send(csvContent);
}