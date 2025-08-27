# Google Drive Integration Setup

This app has been modified to load data from Google Drive instead of local files. Here's how to set it up:

## Current Status

The app is now configured to work with Google Drive, but you need to provide the actual file IDs for the files in your Google Drive folder.

## Setup Instructions

### 1. Google Drive Folder Structure

Your Google Drive folder should have the following structure:
```
Google Drive Folder (ID: 1aMYBHHbnZX-ijd0-8b8VSnrZkFmtTC77)
├── Miscellaneous Cover/
│   ├── MiscellaneousCover.json
│   ├── MiscellaneousCover.csv
│   └── MiscellaneousCover.png
├── Miscellaneous Cover and Base Parts/
│   ├── MiscellaneousCoverandBaseParts.json
│   ├── MiscellaneousCoverandBaseParts.csv
│   └── MiscellaneousCoverandBaseParts.png
├── Thread Eyelet Parts/
│   ├── ThreadEyeletParts.json
│   ├── ThreadEyeletParts.csv
│   └── ThreadEyeletParts.png
└── ... (other folders)
```

### 2. Getting File IDs

For each file in your Google Drive folders, you need to get the file ID:

1. Right-click on the file in Google Drive
2. Select "Get link"
3. The link will look like: `https://drive.google.com/file/d/FILE_ID_HERE/view`
4. Copy the `FILE_ID_HERE` part

### 3. Updating Configuration

Edit the file `src/config/googleDriveConfig.ts` and replace the placeholder values with actual file IDs:

```typescript
export const GOOGLE_DRIVE_CONFIG: GoogleDriveConfig = {
  folderId: "1aMYBHHbnZX-ijd0-8b8VSnrZkFmtTC77",
  folders: {
    "Miscellaneous Cover": {
      jsonId: "ACTUAL_JSON_FILE_ID_HERE",
      csvId: "ACTUAL_CSV_FILE_ID_HERE",
      imageId: "ACTUAL_IMAGE_FILE_ID_HERE"
    },
    // ... update all other folders
  }
};
```

### 4. File Sharing Settings

Make sure all files in your Google Drive folder are set to "Anyone with the link can view" so the app can access them.

### 5. Testing

After updating the file IDs:

1. Run the app: `npm run dev`
2. The app should now load data from Google Drive
3. Check the browser console for any errors

## Current Implementation

The app currently uses a mock implementation that returns sample data when file IDs are not provided. This allows you to test the UI while setting up the actual Google Drive integration.

## File Requirements

Each folder must contain exactly 3 files:
- **JSON file**: Contains image metadata and coordinate data
- **CSV file**: Contains parts list data
- **PNG file**: The diagram image

If any of these files are missing, the folder will not be displayed in the app.

## Troubleshooting

1. **Files not loading**: Check that file IDs are correct and files are publicly accessible
2. **CORS errors**: Make sure files are set to public viewing
3. **Missing folders**: Verify folder names match exactly in the configuration

## Future Enhancements

For a production environment, consider:
1. Using Google Drive API with proper authentication
2. Creating a backend service to handle file access
3. Implementing automatic folder discovery
4. Adding file caching for better performance
