const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS
app.use(cors());
app.use(express.json());

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Mock Google Drive folder structure
const mockFolders = [
  {
    id: "folder_1",
    name: "Miscellaneous Cover",
    files: [
      { id: "json_1", name: "MiscellaneousCover.json", mimeType: "application/json" },
      { id: "csv_1", name: "MiscellaneousCover.csv", mimeType: "text/csv" },
      { id: "png_1", name: "MiscellaneousCover.png", mimeType: "image/png" }
    ]
  },
  {
    id: "folder_2", 
    name: "Thread Eyelet Parts",
    files: [
      { id: "json_2", name: "ThreadEyeletParts.json", mimeType: "application/json" },
      { id: "csv_2", name: "ThreadEyeletParts.csv", mimeType: "text/csv" },
      { id: "png_2", name: "ThreadEyeletParts.png", mimeType: "image/png" }
    ]
  },
  {
    id: "folder_3",
    name: "Needle Bar Mechanism", 
    files: [
      { id: "json_3", name: "NeedleBarMechanism.json", mimeType: "application/json" },
      { id: "csv_3", name: "NeedleBarMechanism.csv", mimeType: "text/csv" },
      { id: "png_3", name: "NeedleBarMechanism.png", mimeType: "image/png" }
    ]
  }
];

// Mock file contents
const mockFileContents = {
  "json_1": JSON.stringify({
    imageName: "Miscellaneous-Cover",
    coordinates: [
      { number: "1", x: 100, y: 100, partNumber: "ABC123" },
      { number: "2", x: 200, y: 150, partNumber: "DEF456" }
    ]
  }),
  "json_2": JSON.stringify({
    imageName: "Thread-Eyelet-Parts",
    coordinates: [
      { number: "1", x: 120, y: 120, partNumber: "XYZ789" },
      { number: "2", x: 220, y: 170, partNumber: "GHI012" }
    ]
  }),
  "json_3": JSON.stringify({
    imageName: "Needle-Bar-Mechanism",
    coordinates: [
      { number: "1", x: 140, y: 140, partNumber: "JKL345" },
      { number: "2", x: 240, y: 190, partNumber: "MNO678" }
    ]
  }),
  "csv_1": "Number,Part Number,Description\n1,ABC123,Miscellaneous Cover Part 1\n2,DEF456,Miscellaneous Cover Part 2",
  "csv_2": "Number,Part Number,Description\n1,XYZ789,Thread Eyelet Part 1\n2,GHI012,Thread Eyelet Part 2", 
  "csv_3": "Number,Part Number,Description\n1,JKL345,Needle Bar Part 1\n2,MNO678,Needle Bar Part 2"
};

// API endpoint to get folder structure
app.get('/api/folders', async (req, res) => {
  try {
    console.log('Returning mock folder structure...');
    res.json({ folders: mockFolders });
  } catch (error) {
    console.error('Error returning folder structure:', error);
    res.status(500).json({ 
      error: 'Failed to return folder structure',
      details: error.message 
    });
  }
});

// API endpoint to get file content
app.get('/api/file/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    
    if (mockFileContents[fileId]) {
      res.set('Content-Type', 'text/plain');
      res.send(mockFileContents[fileId]);
    } else {
      res.status(404).json({ error: 'File not found' });
    }
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
    
    // Find the file in our mock data
    let fileMetadata = null;
    for (const folder of mockFolders) {
      const file = folder.files.find(f => f.id === fileId);
      if (file) {
        fileMetadata = file;
        break;
      }
    }
    
    if (fileMetadata) {
      res.json(fileMetadata);
    } else {
      res.status(404).json({ error: 'File not found' });
    }
  } catch (error) {
    console.error('Error fetching file metadata:', error);
    res.status(500).json({ 
      error: 'Failed to fetch file metadata',
      details: error.message 
    });
  }
});

// Serve the React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
  console.log('This server uses mock data - no Google API key required');
  console.log('Available endpoints:');
  console.log('  GET /api/folders - Get folder structure');
  console.log('  GET /api/file/:fileId - Get file content');
  console.log('  GET /api/file/:fileId/metadata - Get file metadata');
});
