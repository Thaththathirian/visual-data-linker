# 🚀 Dynamic Google Drive Setup Guide

## ✅ What's New - Completely Dynamic System!

Your system is now **100% dynamic** with **zero hardcoded values**:

- ❌ **No hardcoded folder names**
- ❌ **No hardcoded file names** 
- ❌ **No hardcoded file IDs**
- ✅ **Automatic folder discovery**
- ✅ **Automatic file detection**
- ✅ **Supports any file names**
- ✅ **Real-time updates**

## 🛠️ Setup Instructions

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

## 🎯 How It Works Now

### Before (Hardcoded - BAD):
```typescript
// ❌ Hardcoded folder names
const knownFolders = [
  "Miscellaneous Cover",
  "Thread Eyelet Parts",
  // ... manual list
];

// ❌ Hardcoded file IDs
folders: {
  "Miscellaneous Cover": {
    jsonId: "YOUR_JSON_FILE_ID_HERE",
    csvId: "YOUR_CSV_FILE_ID_HERE",
    imageId: "YOUR_PNG_FILE_ID_HERE"
  }
}
```

### After (Dynamic - GOOD):
```typescript
// ✅ Automatically discovers ALL folders
const folders = await discoverGoogleDriveStructure();

// ✅ Automatically finds files by extension
const jsonFile = folder.files.find(f => f.name.toLowerCase().endsWith('.json'));
const csvFile = folder.files.find(f => f.name.toLowerCase().endsWith('.csv'));
const imageFile = folder.files.find(f => f.mimeType.startsWith('image/'));
```

## 🔄 Dynamic Features

### 1. **Automatic Folder Discovery**
- Scans Google Drive folder for ALL subfolders
- No need to manually add new folders
- Works with any folder structure

### 2. **Automatic File Detection**
- Finds JSON files by `.json` extension
- Finds CSV files by `.csv` extension  
- Finds images by MIME type or extension (PNG, JPG, JPEG, WEBP, GIF)
- **Works with any file names!**

### 3. **Real-time Updates**
- 5-minute cache for performance
- Automatically detects new files
- No manual configuration needed

### 4. **Flexible File Support**
- **Any JSON file** with coordinates data
- **Any CSV file** with part information
- **Any image file** (PNG, JPG, JPEG, WEBP, GIF)

## 📁 File Structure Requirements

Your Google Drive folders just need these file types (any names):

```
📁 Your Folder Name/
├── 📄 any-name.json     (coordinates data)
├── 📄 any-name.csv      (part information)  
└── 🖼️ any-name.png      (or .jpg, .jpeg, .webp, .gif)
```

## 🎉 Benefits

1. **Zero Maintenance** - Add new folders/files, they appear automatically
2. **No Configuration** - No need to update code when adding data
3. **Flexible Naming** - Files can have any names
4. **Real-time** - Changes in Google Drive appear immediately
5. **Scalable** - Works with 1 folder or 1000 folders

## 🚨 Troubleshooting

### Backend Not Running
```
❌ Error: Failed to discover Google Drive folder structure
```
**Solution:** Start the backend server with `node server.js`

### API Key Issues
```
❌ Error: 403 Forbidden
```
**Solution:** Check your Google API key and enable Google Drive API

### No Files Found
```
❌ Folder "X" missing required files
```
**Solution:** Ensure each folder has JSON, CSV, and image files

## 🔧 Advanced Configuration

### Custom File Extensions
Edit `src/utils/googleDriveDynamicLoader.ts` to support more file types:

```typescript
// Add more image formats
const imageFile = folder.files.find(f => 
  f.mimeType.startsWith('image/') || 
  f.name.toLowerCase().match(/\.(png|jpg|jpeg|webp|gif|bmp|tiff)$/)
);

// Add more data formats
const dataFile = folder.files.find(f => 
  f.name.toLowerCase().endsWith('.json') ||
  f.name.toLowerCase().endsWith('.xml') ||
  f.name.toLowerCase().endsWith('.yaml')
);
```

### Cache Duration
Change cache timeout in `src/utils/googleDriveDynamicLoader.ts`:

```typescript
const CACHE_TIMEOUT = 10 * 60 * 1000; // 10 minutes instead of 5
```

## 🎯 Migration Complete!

Your system is now **completely dynamic** and will automatically adapt to any changes in your Google Drive structure. No more hardcoded values, no more manual updates!
