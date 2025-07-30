import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { filename } = req.query;

  if (!filename) {
    return res.status(400).json({ error: 'Filename is required' });
  }

  // Security: Only allow CSV files and prevent directory traversal
  if (!filename.endsWith('.csv') || filename.includes('..') || filename.includes('/')) {
    return res.status(400).json({ error: 'Invalid filename' });
  }

  try {
    const downloadDir = path.join(process.cwd(), 'server-downloads');
    const filePath = path.join(downloadDir, filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Read file content
    const fileContent = fs.readFileSync(filePath, 'utf8');

    // Set headers for download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(fileContent);

  } catch (error) {
    console.error('Download file error:', error);
    res.status(500).json({ error: 'Failed to download file' });
  }
}