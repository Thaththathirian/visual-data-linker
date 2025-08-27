const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.get('/api/folders', (req, res) => {
  console.log('API called!');
  res.json({
    folders: [
      {
        id: "test_folder",
        name: "Test Folder",
        files: [
          { id: "test_json", name: "test.json", mimeType: "application/json" }
        ]
      }
    ]
  });
});

app.get('/api/file/:fileId', (req, res) => {
  const { fileId } = req.params;
  console.log('File requested:', fileId);
  
  if (fileId === 'test_json') {
    res.json({
      imageName: "Test-Image",
      coordinates: [
        { number: "1", x: 100, y: 100, partNumber: "TEST123" }
      ]
    });
  } else {
    res.status(404).json({ error: 'File not found' });
  }
});

app.listen(PORT, () => {
  console.log('Basic test server running on port 3001');
  console.log('Test the API at: http://localhost:3001/api/folders');
});
