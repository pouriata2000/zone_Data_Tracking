import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function AdminDashboard() {
  const [serverFiles, setServerFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);

  // Simple password protection (use proper auth in production)
  const handleLogin = () => {
    if (password === 'admin123') { // Change this password!
      setAuthenticated(true);
      loadServerFiles();
    } else {
      alert('Invalid password');
    }
  };

  const loadServerFiles = async () => {
    try {
      const response = await fetch('/api/list-server-files');
      const data = await response.json();
      setServerFiles(data.files || []);
    } catch (error) {
      console.error('Error loading files:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadServerFile = async (filename) => {
    try {
      const response = await fetch(`/api/get-server-file?filename=${encodeURIComponent(filename)}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        alert('Failed to download file');
      }
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download file');
    }
  };

  if (!authenticated) {
    return (
      <>
        <Head>
          <title>Admin Dashboard - Login</title>
        </Head>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          flexDirection: 'column',
          gap: '20px'
        }}>
          <h1>Admin Dashboard</h1>
          <div>
            <input
              type="password"
              placeholder="Enter admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              style={{ padding: '10px', marginRight: '10px' }}
            />
            <button onClick={handleLogin} style={{ padding: '10px 20px' }}>
              Login
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Admin Dashboard - Server Files</title>
      </Head>
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        <h1>Admin Dashboard - Server Saved Files</h1>
        
        <div style={{ marginBottom: '20px' }}>
          <button 
            onClick={loadServerFiles}
            style={{ 
              padding: '10px 20px', 
              backgroundColor: '#007bff', 
              color: 'white', 
              border: 'none', 
              borderRadius: '5px',
              cursor: 'pointer',
              marginRight: '10px'
            }}
          >
            Refresh Files
          </button>
          <a 
            href="/" 
            style={{ 
              padding: '10px 20px', 
              backgroundColor: '#28a745', 
              color: 'white', 
              textDecoration: 'none',
              borderRadius: '5px'
            }}
          >
            Back to Tracker
          </a>
        </div>
        
        {loading ? (
          <p>Loading server files...</p>
        ) : (
          <div>
            <p>Total files: {serverFiles.length}</p>
            
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f5f5f5' }}>
                  <th style={{ border: '1px solid #ddd', padding: '10px' }}>Filename</th>
                  <th style={{ border: '1px solid #ddd', padding: '10px' }}>MAC Address</th>
                  <th style={{ border: '1px solid #ddd', padding: '10px' }}>Zone</th>
                  <th style={{ border: '1px solid #ddd', padding: '10px' }}>Size</th>
                  <th style={{ border: '1px solid #ddd', padding: '10px' }}>Created</th>
                  <th style={{ border: '1px solid #ddd', padding: '10px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {serverFiles.map((file, index) => (
                  <tr key={index}>
                    <td style={{ border: '1px solid #ddd', padding: '10px', fontSize: '12px' }}>
                      {file.filename}
                    </td>
                    <td style={{ border: '1px solid #ddd', padding: '10px' }}>
                      {file.mac_address || 'Unknown'}
                    </td>
                    <td style={{ border: '1px solid #ddd', padding: '10px' }}>
                      {file.zone_id ? `Zone ${file.zone_id}` : 'Unknown'}
                    </td>
                    <td style={{ border: '1px solid #ddd', padding: '10px' }}>
                      {file.size_kb} KB
                    </td>
                    <td style={{ border: '1px solid #ddd', padding: '10px' }}>
                      {new Date(file.created).toLocaleString()}
                    </td>
                    <td style={{ border: '1px solid #ddd', padding: '10px' }}>
                      <button
                        onClick={() => downloadServerFile(file.filename)}
                        style={{ 
                          padding: '5px 10px', 
                          backgroundColor: '#007bff', 
                          color: 'white', 
                          border: 'none', 
                          borderRadius: '3px',
                          cursor: 'pointer'
                        }}
                      >
                        Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {serverFiles.length === 0 && (
              <p style={{ textAlign: 'center', marginTop: '40px', color: '#666' }}>
                No files saved to server yet. Use "Save to Server" button after stopping recordings.
              </p>
            )}
          </div>
        )}
        
        <div style={{ marginTop: '40px', textAlign: 'center' }}>
          <button 
            onClick={() => setAuthenticated(false)}
            style={{ 
              padding: '10px 20px', 
              backgroundColor: '#dc3545', 
              color: 'white', 
              border: 'none', 
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </div>
      </div>
    </>
  );
}