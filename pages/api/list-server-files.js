import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const downloadDir = path.join(process.cwd(), 'server-downloads');
    
    // Check if directory exists
    if (!fs.existsSync(downloadDir)) {
      return res.status(200).json({ files: [], total: 0 });
    }

    // Read all CSV files
    const files = fs.readdirSync(downloadDir)
      .filter(file => file.endsWith('.csv'))
      .map(filename => {
        const filePath = path.join(downloadDir, filename);
        const stats = fs.statSync(filePath);
        
        return {
          filename,
          file_path: filePath,
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime,
          size_kb: Math.round(stats.size / 1024 * 100) / 100
        };
      })
      .sort((a, b) => new Date(b.created) - new Date(a.created)); // Newest first

    // Read log file if it exists
    const logFile = path.join(downloadDir, 'download_log.json');
    let logs = [];
    
    if (fs.existsSync(logFile)) {
      try {
        const logData = fs.readFileSync(logFile, 'utf8');
        logs = JSON.parse(logData);
      } catch (error) {
        console.warn('Could not read log file:', error);
      }
    }

    // Merge file info with log data
    const filesWithDetails = files.map(file => {
      const log = logs.find(l => l.filename === file.filename);
      return {
        ...file,
        mac_address: log?.mac_address,
        zone_id: log?.zone_id,
        session_id: log?.session_id,
        saved_at: log?.saved_at
      };
    });

    res.status(200).json({
      files: filesWithDetails,
      total: filesWithDetails.length,
      total_size_kb: Math.round(filesWithDetails.reduce((sum, f) => sum + f.size, 0) / 1024 * 100) / 100
    });

  } catch (error) {
    console.error('List files error:', error);
    res.status(500).json({ error: 'Failed to list server files' });
  }
}