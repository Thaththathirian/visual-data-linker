# Visual Data Linker - Folder Explorer

This application provides a breadcrumb-like folder navigation system for browsing interactive diagrams and their associated data files.

## Features

### Folder Explorer
- **Breadcrumb Navigation**: Navigate through nested folder structures using "/" separators
- **Thumbnail View**: Folders containing complete data (JSON, CSV, PNG) display thumbnails
- **Interactive Diagrams**: Click on thumbnails to open the coordinated view
- **Folder Structure**: Browse intermediate folders that contain subfolders
- **Back Navigation**: Easy navigation back to parent folders

### Data Structure
The application expects the following file structure in the `/data` folder:

```
/data/
├── folders.json                    # List of available folders
├── Folder_Name/
│   ├── DiagramName.json           # Interactive coordinates
│   ├── DiagramName.csv            # Part data
│   └── DiagramName.png             # Diagram image
└── Nested_Folder/
    └── Sub_Folder/
        ├── DiagramName.json
        ├── DiagramName.csv
        └── DiagramName.png
```

### File Requirements
For a folder to show thumbnails and be interactive:
- **JSON file**: Contains `imageName` and `coordinates` array
- **CSV file**: Contains part data (matching filename)
- **PNG file**: Diagram image (matching filename)

### Navigation
- **Home**: View all available diagrams
- **Browse Folders**: Navigate through folder structure
- **Breadcrumbs**: Click any part of the path to navigate directly
- **Back Button**: Return to parent folder

### Usage
1. Click "Browse Folders" on the home page
2. Navigate through folders using the breadcrumb or folder cards
3. Click on thumbnails to open interactive diagrams
4. Use the back button or breadcrumbs to navigate

## Development

The folder explorer is built with:
- React with TypeScript
- React Router for navigation
- Tailwind CSS for styling
- Shadcn/ui components
