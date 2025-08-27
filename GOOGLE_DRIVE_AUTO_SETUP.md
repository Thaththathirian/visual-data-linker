# Google Drive Auto-Discovery Setup

This app now automatically discovers folders and files from your Google Drive without requiring manual file ID configuration.

## How It Works

1. **Backend Server**: A Node.js server acts as a proxy to Google Drive API
2. **Auto-Discovery**: The server automatically discovers all folders in your Google Drive
3. **File Validation**: Only folders with all 3 required files (JSON, CSV, PNG) are displayed
4. **Real Data**: No mock data - only real files from your Google Drive

## Setup Instructions

### 1. Install Server Dependencies

```bash
# Copy the server package.json
cp server-package.json package-server.json

# Install server dependencies
npm install --prefix ./server
```

### 2. Set Up Google Drive API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google Drive API
4. Create credentials (API Key)
5. Set the API key as environment variable:

```bash
export GOOGLE_API_KEY="your_google_api_key_here"
```

### 3. Start the Backend Server

```bash
# Start the server
node server.js
```

The server will run on `http://localhost:3001`

### 4. Start the Frontend App

```bash
# In a new terminal
npm run dev
```

The app will run on `http://localhost:5173`

## Google Drive Folder Structure

Your Google Drive folder should have this structure:

```
Google Drive Folder (ID: 1aMYBHHbnZX-ijd0-8b8VSnrZkFmtTC77)
├── Miscellaneous Cover/
│   ├── MiscellaneousCover.json
│   ├── MiscellaneousCover.csv
│   └── MiscellaneousCover.png
├── Thread Eyelet Parts/
│   ├── ThreadEyeletParts.json
│   ├── ThreadEyeletParts.csv
│   └── ThreadEyeletParts.png
└── ... (other folders)
```

## File Requirements

Each folder must contain exactly 3 files:
- **JSON file**: `FolderName.json` - Contains image metadata and coordinates
- **CSV file**: `FolderName.csv` - Contains parts list data  
- **PNG file**: `FolderName.png` - The diagram image

## Features

- ✅ **Auto-Discovery**: Automatically finds all folders in your Google Drive
- ✅ **File Validation**: Only shows folders with all required files
- ✅ **Real Data**: No mock data - loads actual files from Google Drive
- ✅ **Caching**: Efficient caching for better performance
- ✅ **Error Handling**: Clear error messages for missing files

## Troubleshooting

### Server Issues
1. **API Key Error**: Make sure `GOOGLE_API_KEY` environment variable is set
2. **Port Already in Use**: Change the port in `server.js` (line 8)
3. **CORS Errors**: The server includes CORS headers, but check browser console

### Google Drive Issues
1. **No Folders Found**: Ensure the folder ID is correct in `server.js`
2. **Permission Errors**: Make sure the Google Drive folder is accessible
3. **Missing Files**: Check that each folder has exactly 3 files with correct names

### Frontend Issues
1. **Connection Error**: Make sure the backend server is running on port 3001
2. **No Data**: Check browser console for API errors
3. **Cache Issues**: Use the "Scan Folders" button to refresh data

## API Endpoints

The backend server provides these endpoints:

- `GET /api/folders` - Get all folders and their files
- `GET /api/file/:fileId` - Get file content
- `GET /api/file/:fileId/metadata` - Get file metadata

## Development

To modify the server:

1. Edit `server.js` to change API behavior
2. Restart the server: `node server.js`
3. The frontend will automatically use the updated API

## Production Deployment

For production:

1. Deploy the server to a hosting service (Heroku, Vercel, etc.)
2. Update the API_BASE_URL in `src/utils/googleDriveAutoLoader.ts`
3. Set environment variables on your hosting platform
4. Build and deploy the frontend

## Security Notes

- The Google API key should be kept secure
- Consider using service account authentication for production
- The server acts as a proxy, so all requests go through it
