# 🔧 Custom Google Drive Folder Setup

## 🎯 Using Your Own Google Drive Folder

You can use **any Google Drive folder** where you have **edit access**. Here's how:

## 📋 Prerequisites

1. **Google Drive Folder Access**: You need edit access to the folder
2. **Google API Key**: Same setup as before
3. **Folder Structure**: Your folders should contain JSON, CSV, and image files

## 🛠️ Setup Steps

### Step 1: Get Your Folder ID

1. **Open your Google Drive folder** in the browser
2. **Copy the folder ID** from the URL:
   ```
   https://drive.google.com/drive/folders/YOUR_FOLDER_ID_HERE
   ```
   The folder ID is the long string after `/folders/`

### Step 2: Set Environment Variables

**Windows (Command Prompt):**
```cmd
set GOOGLE_API_KEY=your_api_key_here
set GOOGLE_DRIVE_FOLDER_ID=your_folder_id_here
```

**Windows (PowerShell):**
```powershell
$env:GOOGLE_API_KEY="your_api_key_here"
$env:GOOGLE_DRIVE_FOLDER_ID="your_folder_id_here"
```

**Linux/Mac:**
```bash
export GOOGLE_API_KEY="your_api_key_here"
export GOOGLE_DRIVE_FOLDER_ID="your_folder_id_here"
```

### Step 3: Start the Application

```bash
# Start backend server
node server.js

# Start frontend (in another terminal)
npm run dev
```

## 📁 Required Folder Structure

Your Google Drive folder should contain subfolders with this structure:

```
📁 Your Main Folder (ID: your_folder_id_here)
├── 📁 Subfolder 1
│   ├── 📄 any-name.json     (coordinates data)
│   ├── 📄 any-name.csv      (part information)
│   └── 🖼️ any-name.png      (or .jpg, .jpeg, .webp, .gif)
├── 📁 Subfolder 2
│   ├── 📄 any-name.json
│   ├── 📄 any-name.csv
│   └── 🖼️ any-name.png
└── 📁 Subfolder 3
    ├── 📄 any-name.json
    ├── 📄 any-name.csv
    └── 🖼️ any-name.png
```

## 🔍 How It Works

1. **Server reads your folder ID** from environment variable
2. **Scans all subfolders** in your Google Drive folder
3. **Automatically discovers** JSON, CSV, and image files
4. **No hardcoded values** - works with any file names

## 🚨 Troubleshooting

### Permission Errors
```
❌ Error: 403 Forbidden
```
**Solution:** Ensure you have edit access to the folder

### Folder Not Found
```
❌ Error: 404 Not Found
```
**Solution:** Check your folder ID is correct

### No Files Found
```
❌ No folders detected
```
**Solution:** Ensure your folder contains subfolders with the required files

## 🔄 Switching Between Folders

To switch to a different folder:

1. **Stop the server** (Ctrl+C)
2. **Update environment variable**:
   ```bash
   export GOOGLE_DRIVE_FOLDER_ID="new_folder_id_here"
   ```
3. **Restart the server**:
   ```bash
   node server.js
   ```

## 📝 Example Setup

```bash
# Set your API key
export GOOGLE_API_KEY="AIzaSyC..."

# Set your folder ID
export GOOGLE_DRIVE_FOLDER_ID="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"

# Start the application
node server.js
```

## ✅ Benefits

- **Use any folder** you have access to
- **No code changes** required
- **Easy to switch** between different folders
- **Secure** - uses your own API key and permissions
- **Dynamic** - automatically discovers all content

## 🎯 Next Steps

1. **Get your folder ID** from Google Drive
2. **Set environment variables**
3. **Start the application**
4. **Add your data folders** to Google Drive
5. **Enjoy automatic discovery!**
