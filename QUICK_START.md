# Quick Start Guide - Manual File ID Approach

## Current Status
✅ **Frontend is ready** - The app is configured to use manual file IDs
❌ **Backend server issues** - We had trouble starting the backend server
✅ **Manual approach works** - You can use this approach without a backend

## What You Need to Do

### Step 1: Get File IDs from Google Drive
1. Open your Google Drive folder: https://drive.google.com/drive/folders/1aMYBHHbnZX-ijd0-8b8VSnrZkFmtTC77
2. For each file you want to use:
   - Right-click on the file
   - Select "Get link" or "Share"
   - Copy the file ID from the URL (the part after `/d/` and before `/view`)

### Step 2: Update Configuration
Edit the file `src/config/googleDriveConfig.ts` and replace the placeholder IDs:

```typescript
export const GOOGLE_DRIVE_CONFIG: GoogleDriveConfig = {
  folderId: "1aMYBHHbnZX-ijd0-8b8VSnrZkFmtTC77",
  folders: {
    "Miscellaneous Cover": {
      jsonId: "ACTUAL_JSON_FILE_ID_HERE",  // Replace this
      csvId: "ACTUAL_CSV_FILE_ID_HERE",    // Replace this
      imageId: "ACTUAL_PNG_FILE_ID_HERE"   // Replace this
    },
    // Add more folders as needed...
  }
};
```

### Step 3: Test the App
```bash
npm run dev
```

## Helper Tools

### File ID Extractor
Open `get-file-ids.html` in your browser to help extract file IDs from Google Drive URLs.

### Example File IDs
Here's how to find file IDs:
- URL: `https://drive.google.com/file/d/1ABC123DEF456/view`
- File ID: `1ABC123DEF456`

## Troubleshooting

### If you get CORS errors:
- This is expected for Google Drive files
- The manual approach should work around this

### If files don't load:
- Check that file IDs are correct
- Make sure files are publicly accessible
- Verify file names match the expected format

## Next Steps

Once you have the file IDs:
1. Update `src/config/googleDriveConfig.ts`
2. Run `npm run dev`
3. Test the app

The app will automatically load the files from Google Drive using the file IDs you provide.
