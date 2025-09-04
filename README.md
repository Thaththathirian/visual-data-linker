# Visual Data Linker - Amazon-like Interface

A modern, Amazon-inspired interface for browsing and exploring visual data with interactive diagrams and coordinate data. The application reads category and product information from a CSV file stored in Google Drive, making it easy for non-technical users to manage content.

## Features

### 🛍️ Amazon-like Shopping Experience
- **Left Sidebar**: Collapsible category navigation with main categories and subcategories
- **Product Grid**: Thumbnail-based product display with hover effects and smooth transitions
- **Breadcrumb Navigation**: Clear path indication for easy navigation
- **Responsive Design**: Works seamlessly on desktop and mobile devices

### 📁 Dynamic Content Management
- **CSV-driven**: All categories and products are defined in a single `index.csv` file
- **Google Drive Integration**: Automatically reads from your Google Drive root folder
- **Real-time Updates**: Changes to the CSV file are reflected immediately
- **No Code Required**: Non-technical users can easily add new items

### 🖼️ Interactive Visual Data
- **Coordinate System**: Click on image areas to view detailed part information
- **Related Data Display**: Shows related thumbnails below coordinate information
- **Responsive Layout**: Maintains the Amazon-like sidebar and breadcrumbs on all pages

## Quick Start

### 1. Setup Google Drive Integration
1. Upload the `index.csv` file to your Google Drive root folder
2. Get your Google Drive API key and file IDs
3. Configure environment variables (see setup guide below)

### 2. Configure Environment Variables
Create a `.env` file with:
```env
VITE_DRIVE_API_KEY=your_google_drive_api_key
VITE_DRIVE_ROOT_FOLDER_ID=your_root_folder_id
VITE_INDEX_FILE_ID=your_index_csv_file_id
```

### 3. Run the Application
```bash
npm install
npm run dev
```

## CSV File Structure

The `index.csv` file serves as your master catalog:

```csv
category,subcategory,file_name,file_type,thumbnail_path,coordinates_path,data_path,description
REVO R-18HD & R-18HS,Miscellaneous Cover,1. Miscellaneous Cover,folder,path/to/thumbnail.png,path/to/coordinates.json,path/to/data.csv,Description here
```

### Required Columns:
- **category**: Main category name
- **subcategory**: Subcategory name  
- **file_name**: Display name for the item
- **file_type**: Type of file (folder, image, document)
- **thumbnail_path**: Path to thumbnail image
- **coordinates_path**: Path to coordinates JSON file
- **data_path**: Path to data CSV file
- **description**: Brief description of the item

## Adding New Content

### For Non-Technical Users:
1. Open the `index.csv` file in Google Drive
2. Add new rows following the column structure
3. Save the file
4. New items appear automatically in the interface

### For Developers:
- Use the thumbnail generator utility to create optimized thumbnails
- Follow the existing coordinate and data file formats
- Ensure all file paths are accessible

## Architecture

### Components
- **CategorySidebar**: Left navigation with collapsible categories
- **ProductGrid**: Main content area with thumbnail grid
- **AmazonHome**: Main page with sidebar and product display
- **ImageDetail**: Enhanced coordinate view with sidebar

### Utilities
- **indexReader**: Reads and parses CSV data from Google Drive
- **thumbnailGenerator**: Creates and manages image thumbnails
- **googleDrive**: Handles Google Drive API interactions

## File Organization

```
src/
├── components/
│   ├── Sidebar/           # Category navigation
│   ├── ProductGrid/       # Product thumbnail grid
│   └── ui/               # Reusable UI components
├── pages/
│   ├── AmazonHome.tsx    # Main Amazon-like interface
│   └── ImageDetail.tsx   # Enhanced coordinate view
├── utils/
│   ├── indexReader.ts    # CSV parsing and category management
│   ├── thumbnailGenerator.ts # Image thumbnail utilities
│   └── googleDrive.ts    # Google Drive API integration
└── types/
    └── index.ts          # TypeScript type definitions
```

## Customization

### Styling
- Uses Tailwind CSS for consistent, responsive design
- Custom CSS utilities for line clamping and special effects
- Easy to modify colors, spacing, and layout

### Layout
- Sidebar width: 256px (w-64)
- Responsive grid: 1-5 columns based on screen size
- Consistent spacing and shadows throughout

### Adding New Features
- Extend the CSV structure with new columns
- Add new utility functions for data processing
- Create new UI components following the existing pattern

## Troubleshooting

### Common Issues
1. **API Key Errors**: Check your Google Drive API configuration
2. **File Not Found**: Verify file IDs in environment variables
3. **CSV Parse Errors**: Ensure proper CSV format and headers
4. **Image Loading**: Check thumbnail file paths and permissions

### Debug Mode
- Check browser console for detailed error messages
- Verify Google Drive API responses
- Test CSV parsing with sample data

## Contributing

1. Follow the existing code structure and patterns
2. Use TypeScript for type safety
3. Maintain responsive design principles
4. Test on multiple screen sizes
5. Update documentation for new features

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For setup assistance and troubleshooting, refer to the `GOOGLE_DRIVE_SETUP.md` file included in this project.
