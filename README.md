# Visual Data Linker

A dynamic folder explorer with interactive coordinate data visualization.

## Features

### 🗂️ Dynamic Folder Explorer
- **Breadcrumb Navigation**: Navigate through nested folders with responsive breadcrumb navigation
- **No Static Configuration**: Dynamically reads folder structure without requiring `folders.json`
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **File Type Detection**: Automatically detects and categorizes JSON, CSV, and image files

### 🎯 Interactive Coordinate Data
- **Smart Detection**: Automatically detects folders containing coordinate data (JSON + CSV + PNG)
- **Interactive Images**: Click on coordinate points to view part details
- **Data Tables**: View structured CSV data in organized tables
- **File Management**: Browse and manage all file types with visual indicators

### 📱 Responsive UI
- **No Text Clipping**: All text is properly handled with truncation and tooltips
- **Mobile-Friendly**: Optimized for touch devices and small screens
- **Modern Design**: Clean, intuitive interface with smooth transitions

## How It Works

1. **Folder Navigation**: Click on folders to navigate deeper into the structure
2. **Breadcrumb Navigation**: Use breadcrumbs to quickly jump to any parent folder
3. **Coordinate Detection**: When a folder contains JSON, CSV, and PNG files, it automatically opens the coordinate viewer
4. **Interactive Viewing**: Click on numbered points on images to see part details
5. **Data Tables**: Switch between interactive image and data table views

## File Structure Support

The application supports the following file structure:
```
public/data/
├── Bag Closer Machines-20250901T104737Z-1-001/
│   ├── Bag Closer Machines/
│   │   ├── Revo DA/
│   │   │   ├── Bushing & Oil Parts/
│   │   │   ├── Feed Driving and Thread Cutter/
│   │   │   └── ...
│   │   ├── Revo R-18HD/
│   │   │   ├── 9.Pressure Foot Lifter Mechanism.json
│   │   │   ├── 9.Pressure Foot Lifter Mechanism.csv
│   │   │   ├── 9.Pressure Foot Lifter Mechanism.png
│   │   │   └── ...
│   │   └── ...
│   └── ...
└── ...
```

## Coordinate Data Format

JSON files should contain coordinate data in this format:
```json
{
  "imageName": "9. Pressure Foot Lifter Mechanism",
  "coordinates": [
    {
      "id": "1",
      "x": 120,
      "y": 180,
      "partNumber": "PRESS-001",
      "description": "Pressure Foot"
    }
  ]
}
```

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Technologies Used

- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **Shadcn/ui** for UI components
- **React Router** for navigation
