import { getSession } from '../../lib/storage';
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { session_id } = req.body;

  if (!session_id) {
    return res.status(400).json({ error: 'Session ID is required' });
  }

  try {
    // Get session from storage
    const sessionData = await getSession(session_id);
    
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
      const endTime = new Date(sessionData.end_timestamp);
      const formattedEndTime = endTime.toISOString()
        .replace(/[:.]/g, '-')
        .replace('T', '_')
        .slice(0, -5);
      
      filename = `zone_tracking_${sessionData.mac_address}_zone${sessionData.zone_id}_${formattedEndTime}.csv`;
    } else {
      const now = new Date();
      const formattedNow = now.toISOString()
        .replace(/[:.]/g, '-')
        .replace('T', '_')
        .slice(0, -5);
      
      filename = `zone_tracking_${sessionData.mac_address}_zone${sessionData.zone_id}_${formattedNow}_INCOMPLETE.csv`;
    }

    // Create downloads directory if it doesn't exist
    const downloadDir = path.join(process.cwd(), 'server-downloads');
    if (!fs.existsSync(downloadDir)) {
      fs.mkdirSync(downloadDir, { recursive: true });
    }

    // Save file to server
    const filePath = path.join(downloadDir, filename);
    fs.writeFileSync(filePath, csvContent, 'utf8');

    // Log the save action
    const logEntry = {
      session_id,
      filename,
      file_path: filePath,
      mac_address: sessionData.mac_address,
      zone_id: sessionData.zone_id,
      saved_at: new Date().toISOString(),
      file_size: Buffer.byteLength(csvContent, 'utf8')
    };

    // Save log entry
    const logFile = path.join(downloadDir, 'download_log.json');
    let existingLogs = [];
    
    if (fs.existsSync(logFile)) {
      try {
        const logData = fs.readFileSync(logFile, 'utf8');
        existingLogs = JSON.parse(logData);
      } catch (error) {
        console.warn('Could not read existing log file:', error);
      }
    }
    
    existingLogs.push(logEntry);
    fs.writeFileSync(logFile, JSON.stringify(existingLogs, null, 2));

    res.status(200).json({
      success: true,
      message: 'File saved to server successfully',
      filename,
      file_path: filePath,
      file_size: Buffer.byteLength(csvContent, 'utf8')
    });

  } catch (error) {
    console.error('Server save error:', error);
    res.status(500).json({ error: 'Failed to save file to server' });
  }
}