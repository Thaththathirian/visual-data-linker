# Google Drive Integration Setup Guide

## Quick Setup (Recommended)

### Step 1: Get Google API Key
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable "Google Drive API"
4. Go to "Credentials" → "Create Credentials" → "API Key"
5. Copy your API key

### Step 2: Set Environment Variable
**Windows (Command Prompt):**
```cmd
set GOOGLE_API_KEY=your_api_key_here
```

**Windows (PowerShell):**
```powershell
$env:GOOGLE_API_KEY="your_api_key_here"
```

**Linux/Mac:**
```bash
export GOOGLE_API_KEY="your_api_key_here"
```

### Step 3: Start Backend Server
```bash
node server.js
```
Server will run on http://localhost:3001

### Step 4: Start Frontend
```bash
npm run dev
```
App will run on http://localhost:5173

## Alternative: Manual File IDs (No Backend)

If you don't want to use a backend, you can manually configure file IDs:

### Step 1: Get File IDs
1. Open your Google Drive folder: https://drive.google.com/drive/folders/1aMYBHHbnZX-ijd0-8b8VSnrZkFmtTC77
2. For each file, right-click → "Get link"
3. Copy the file ID from the URL (the part after `/d/` and before `/view`)

### Step 2: Configure File IDs
Edit `src/config/googleDriveConfig.ts`:

```typescript
export const GOOGLE_DRIVE_CONFIG: GoogleDriveConfig = {
  folderId: "1aMYBHHbnZX-ijd0-8b8VSnrZkFmtTC77",
  folders: {
    "Miscellaneous Cover": {
      jsonId: "YOUR_JSON_FILE_ID_HERE",
      csvId: "YOUR_CSV_FILE_ID_HERE", 
      imageId: "YOUR_IMAGE_FILE_ID_HERE"
    },
    // Add more folders...
  }
};
```

### Step 3: Switch to Manual Loader
Change imports in components to use `googleDriveLoader` instead of `googleDriveAutoLoader`.

## Troubleshooting

### CORS Errors
- Use the backend solution (Option 1)
- Frontend-only access is blocked by Google Drive security

### API Key Issues
- Make sure the API key is correct
- Enable Google Drive API in Google Cloud Console
- Check that the folder is accessible

### File Not Found
- Verify file IDs are correct
- Ensure files are in the right folders
- Check file permissions in Google Drive
