// Get synchronized UTC time
function getSynchronizedUtcTime() {
    const timeOffsetSeconds = parseFloat(process.env.TIME_OFFSET_SECONDS || '40');
    const utcTime = new Date();
    const synchronizedTime = new Date(utcTime.getTime() + (timeOffsetSeconds * 1000));
    return synchronizedTime;
  }
  
  export default function handler(req, res) {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  
    const syncTime = getSynchronizedUtcTime();
    
    res.status(200).json({
      utc_time: syncTime.toISOString(),
      timestamp: syncTime.getTime() / 1000,
      offset_applied: parseFloat(process.env.TIME_OFFSET_SECONDS || '40')
    });
  }