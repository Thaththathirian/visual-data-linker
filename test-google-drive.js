const { google } = require('googleapis');

// Test Google Drive API access
async function testGoogleDriveAccess() {
  try {
    console.log('Testing Google Drive API access...');
    
    // Check if API key is set
    if (!process.env.GOOGLE_API_KEY) {
      console.error('❌ GOOGLE_API_KEY environment variable is not set');
      console.log('Please set it with: export GOOGLE_API_KEY="your_api_key_here"');
      return;
    }
    
    console.log('✅ API key found');
    
    // Initialize Google Drive API
    const drive = google.drive({
      version: 'v3',
      auth: process.env.GOOGLE_API_KEY
    });
    
    const GOOGLE_DRIVE_FOLDER_ID = "1aMYBHHbnZX-ijd0-8b8VSnrZkFmtTC77";
    
    console.log(`Testing access to folder: ${GOOGLE_DRIVE_FOLDER_ID}`);
    
    // Try to list files in the folder
    const response = await drive.files.list({
      q: `'${GOOGLE_DRIVE_FOLDER_ID}' in parents and trashed=false`,
      fields: 'files(id, name, mimeType)',
      maxResults: 10
    });
    
    const files = response.data.files || [];
    console.log(`✅ Successfully accessed Google Drive folder`);
    console.log(`Found ${files.length} files/folders:`);
    
    files.forEach(file => {
      const type = file.mimeType === 'application/vnd.google-apps.folder' ? '📁' : '📄';
      console.log(`  ${type} ${file.name} (${file.id})`);
    });
    
    if (files.length === 0) {
      console.log('⚠️  No files found in the folder. This might be due to:');
      console.log('   - Folder is empty');
      console.log('   - Permission issues');
      console.log('   - Incorrect folder ID');
    }
    
  } catch (error) {
    console.error('❌ Error accessing Google Drive API:', error.message);
    
    if (error.code === 403) {
      console.log('This might be due to:');
      console.log('  - API key is invalid');
      console.log('  - Google Drive API is not enabled');
      console.log('  - Folder permissions are restricted');
    }
  }
}

// Run the test
testGoogleDriveAccess();
