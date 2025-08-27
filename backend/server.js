const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for production
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [
        'https://your-netlify-app.netlify.app',
        'https://your-custom-domain.com',
        'http://localhost:5173' // For development
      ]
    : 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());

// Google Drive API configuration
const GOOGLE_DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID || "YOUR_NEW_FOLDER_ID_HERE";

// Initialize Google Drive API
const drive = google.drive({
  version: 'v3',
  auth: process.env.GOOGLE_API_KEY
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    folderId: GOOGLE_DRIVE_FOLDER_ID 
  });
});

// API endpoint to get folder structure
app.get('/api/folders', async (req, res) => {
  try {
    console.log('Fetching folder structure from Google Drive...');
    
    // List all files in the specified folder
    const response = await drive.files.list({
      q: `'${GOOGLE_DRIVE_FOLDER_ID}' in parents and trashed=false`,
      fields: 'files(id, name, mimeType, parents)',
      orderBy: 'name'
    });

    const files = response.data.files || [];
    console.log(`Found ${files.length} files in Google Drive folder`);

    // Group files by folder
    const folders = {};
    
    for (const file of files) {
      if (file.mimeType === 'application/vnd.google-apps.folder') {
        // This is a folder
        folders[file.name] = {
          id: file.id,
          name: file.name,
          files: []
        };
      }
    }

    // Now get files within each folder
    for (const folderName in folders) {
      const folder = folders[folderName];
      
      try {
        const folderFiles = await drive.files.list({
          q: `'${folder.id}' in parents and trashed=false`,
          fields: 'files(id, name, mimeType)',
          orderBy: 'name'
        });

        folder.files = folderFiles.data.files || [];
        console.log(`Folder "${folderName}" contains ${folder.files.length} files`);
      } catch (err) {
        console.error(`Error fetching files for folder "${folderName}":`, err);
        folder.files = [];
      }
    }

    res.json({ folders: Object.values(folders) });
  } catch (error) {
    console.error('Error fetching folder structure:', error);
    res.status(500).json({ 
      error: 'Failed to fetch folder structure',
      details: error.message 
    });
  }
});

// API endpoint to get file content
app.get('/api/file/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    
    const response = await drive.files.get({
      fileId: fileId,
      alt: 'media'
    });

    res.set('Content-Type', 'text/plain');
    res.send(response.data);
  } catch (error) {
    console.error('Error fetching file content:', error);
    res.status(500).json({ 
      error: 'Failed to fetch file content',
      details: error.message 
    });
  }
});

// API endpoint to get file metadata
app.get('/api/file/:fileId/metadata', async (req, res) => {
  try {
    const { fileId } = req.params;
    
    const response = await drive.files.get({
      fileId: fileId,
      fields: 'id, name, mimeType, size, modifiedTime'
    });

    res.json(response.data);
  } catch (error) {
    console.error('Error fetching file metadata:', error);
    res.status(500).json({ 
      error: 'Failed to fetch file metadata',
      details: error.message 
    });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Visual Data Linker Backend API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      folders: '/api/folders',
      file: '/api/file/:fileId',
      metadata: '/api/file/:fileId/metadata'
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(`📁 Google Drive folder ID: ${GOOGLE_DRIVE_FOLDER_ID}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('✅ Make sure to set GOOGLE_API_KEY environment variable');
});
