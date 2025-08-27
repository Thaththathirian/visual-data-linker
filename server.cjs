require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS
app.use(cors());
app.use(express.json());

// Serve static files from the dist directory (optional)
app.use(express.static(path.join(__dirname, 'dist')));

// Google Drive API configuration
const GOOGLE_DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID || '1aMYBHHbnZX-ijd0-8b8VSnrZkFmtTC77';

// Initialize Google Drive API auth
let authClient;
const svcEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const svcKey = (process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || '').replace(/\\n/g, '\n');

if (svcEmail && svcKey) {
  // Service Account (no OAuth popup). Ensure the Drive folder is shared with this service account email as Viewer.
  authClient = new google.auth.JWT({
    email: svcEmail,
    key: svcKey,
    scopes: ['https://www.googleapis.com/auth/drive.readonly']
  });
  console.log('Using Service Account authentication');
} else if (process.env.GOOGLE_API_KEY) {
  // API Key (limited: cannot list private folders). Works only if files are publicly accessible.
  authClient = process.env.GOOGLE_API_KEY;
  console.log('Using API Key authentication');
} else {
  console.warn('No auth configured. Set GOOGLE_SERVICE_ACCOUNT_EMAIL/GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY or GOOGLE_API_KEY');
}

const drive = google.drive({ version: 'v3', auth: authClient });

// Recursive function to find all folders with required files
async function findValidFoldersRecursively(parentFolderId, parentPath = '') {
  const results = [];
  
  try {
    // Get all items in the current folder
    const response = await drive.files.list({
      q: `'${parentFolderId}' in parents and trashed=false`,
      fields: 'files(id,name,mimeType)',
      orderBy: 'name'
    });

    const items = response.data.files || [];
    const folders = items.filter(f => f.mimeType === 'application/vnd.google-apps.folder');
    const files = items.filter(f => f.mimeType !== 'application/vnd.google-apps.folder');
    
    console.log(`📁 Folder "${parentPath || 'Root'}" contains: ${folders.length} subfolders, ${files.length} files`);
    if (folders.length > 0) {
      console.log(`   Subfolders: ${folders.map(f => f.name).join(', ')}`);
    }

    // Check if current folder has required files
    const jsons = files.filter(x => x.name.toLowerCase().endsWith('.json'));
    const csvs = files.filter(x => x.name.toLowerCase().endsWith('.csv'));
    const pngs = files.filter(x => x.name.toLowerCase().match(/\.(png|jpg|jpeg|webp|gif)$/));

    if (jsons.length === 1 && csvs.length === 1 && pngs.length === 1) {
      const folderName = parentPath || 'Root';
      console.log(`✅ Found valid folder: "${folderName}" with required files`);
      results.push({
        id: parentFolderId,
        name: folderName,
        files: [jsons[0], csvs[0], pngs[0]]
      });
    }

    // Recursively search subfolders
    for (const folder of folders) {
      const subPath = parentPath ? `${parentPath} > ${folder.name}` : folder.name;
      console.log(`🔍 Searching subfolder: "${subPath}"`);
      const subResults = await findValidFoldersRecursively(folder.id, subPath);
      results.push(...subResults);
    }

  } catch (error) {
    console.error(`Error searching folder ${parentFolderId}:`, error.message);
  }

  return results;
}

// Recursive function to search for folders with required files
async function searchFoldersRecursively(folderId, folderPath = '') {
  const results = [];
  
  try {
    // Get all items in the current folder
    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed=false`,
      fields: 'files(id,name,mimeType)',
      orderBy: 'name'
    });

    const items = response.data.files || [];
    const folders = items.filter(f => f.mimeType === 'application/vnd.google-apps.folder');
    const files = items.filter(f => f.mimeType !== 'application/vnd.google-apps.folder');

    // Check if current folder has required files
    const jsons = files.filter(x => x.name.toLowerCase().endsWith('.json'));
    const csvs = files.filter(x => x.name.toLowerCase().endsWith('.csv'));
    const pngs = files.filter(x => x.name.toLowerCase().match(/\.(png|jpg|jpeg|webp|gif)$/));

    console.log(`📁 "${folderPath || 'Root'}" contains: ${folders.length} subfolders, ${files.length} files`);
    console.log(`   Files: ${jsons.length} JSON, ${csvs.length} CSV, ${pngs.length} images`);

    // If current folder has exactly one of each required type, add it to results
    if (jsons.length === 1 && csvs.length === 1 && pngs.length === 1) {
      console.log(`✅ Found valid folder: "${folderPath || 'Root'}" with required files`);
      results.push({
        id: folderId,
        name: folderPath || 'Root',
        files: [jsons[0], csvs[0], pngs[0]]
      });
    }

    // Recursively search all subfolders
    for (const subfolder of folders) {
      const subfolderPath = folderPath ? `${folderPath} > ${subfolder.name}` : subfolder.name;
      console.log(`🔍 Searching subfolder: "${subfolderPath}"`);
      const subResults = await searchFoldersRecursively(subfolder.id, subfolderPath);
      results.push(...subResults);
    }

  } catch (error) {
    console.error(`Error searching folder "${folderPath}":`, error.message);
  }

  return results;
}

// API endpoint to get folder structure (recursive search)
app.get('/api/folders', async (req, res) => {
  try {
    console.log('Searching Google Drive recursively for folders with required files...');

    // Ensure SA is authorized (helps surface clearer errors)
    if (authClient && typeof authClient.authorize === 'function') {
      await authClient.authorize();
    }

    // Start recursive search from the root folder
    const results = await searchFoldersRecursively(GOOGLE_DRIVE_FOLDER_ID);

    console.log(`Found ${results.length} valid folders with required files`);
    res.json({ folders: results });
  } catch (error) {
    // Improve logging for faster diagnosis
    const message = error && error.message ? error.message : String(error);
    const responseData = error && error.response && error.response.data ? error.response.data : undefined;
    console.error('Error in /api/folders:', message);
    if (responseData) {
      console.error('Drive API response:', responseData);
    }
    res.status(500).json({
      error: 'Failed to fetch folder structure',
      details: message,
      drive: responseData || null
    });
  }
});

// File content proxy
app.get('/api/file/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const response = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'stream' });
    response.data
      .on('error', () => res.status(500).end())
      .pipe(res);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch file', details: error.message });
  }
});

// Optional: metadata
app.get('/api/file/:fileId/metadata', async (req, res) => {
  try {
    const { fileId } = req.params;
    const meta = await drive.files.get({ fileId, fields: 'id,name,mimeType,size,modifiedTime' });
    res.json(meta.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch metadata', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Folder ID:', GOOGLE_DRIVE_FOLDER_ID);
});


