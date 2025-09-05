# Google Drive Setup Guide

## Overview
The Visual Data Linker now supports automatic file detection in Google Drive folders with **exact folder name matching**. You can create folders anywhere in your Google Drive structure, and the system will automatically find them by exact name and display all PNG, CSV, and JSON files.

## CSV Structure

Your `index.csv` file should use the new structure with separate columns for product information:

```csv
brand,model,category,type,product_path,product_name,product_description,relative_products
Swastik,BC-2000,Bag Closer Machines,Industrial,1. Miscellaneous Cover,Miscellaneous Cover,Essential cover components for bag closer machine assembly,"[2. Miscellaneous Cover and Base Parts, 2A. Miscellaneous Bushing, 3. Thread Eyelet Parts]"
Swastik,BC-3000,Bag Closer Machines,Industrial,2. Miscellaneous Cover and Base Parts,Miscellaneous Cover and Base Parts,Complete cover and base parts set for industrial bag closer,"[1. Miscellaneous Cover, 2A. Miscellaneous Bushing]"
Swastik,SM-1000,Sewing Machines,Industrial,4. Looper and Thread Eyelet Parts,Looper and Thread Eyelet Parts,Advanced looper mechanism with thread eyelet system,"[5. Main Driving Shaft Mechanism, 6. Needle Bar Mechanism]"
```

## Google Drive Folder Structure

### Flexible Folder Placement
You can create folders **anywhere** in your Google Drive structure. The system will find them by exact name:

```
Your Google Drive/
├── Products/
│   ├── Bag Closer Machines BC-2000/
│   │   ├── thumbnail.png
│   │   ├── data.csv
│   │   └── coordinates.json
│   └── Sewing Machine SM-1000/
│       ├── thumbnail.png
│       ├── data.csv
│       └── coordinates.json
├── Equipment/
│   └── Industrial Needles AC-100/
│       ├── thumbnail.png
│       ├── data.csv
│       └── coordinates.json
└── Other Folders/
    └── Any Deep Structure/
        └── Bag Closer Machines BC-3000/
            ├── thumbnail.png
            ├── data.csv
            └── coordinates.json
```

### Key Features:
- **Exact Name Matching**: System finds folders by exact name anywhere in Google Drive
- **Numbers Supported**: Folder names can contain numbers (e.g., "BC-2000", "SM-1000")
- **Flexible Structure**: Folders can be nested at any depth
- **Product Path**: Use exact folder names in CSV `product_path` column
- **Product Information**: Separate columns for `product_name` and `product_description`
- **Related Parts**: Multiple related products specified in `relative_products` column (bracket notation)

## File Naming Convention

### Required Files in Each Folder:
1. **thumbnail.png** - Main product image (preferred name)
2. **data.csv** - Product data/parts list (preferred name)
3. **coordinates.json** - Interactive coordinates data (preferred name)

### Automatic File Detection:
The system will automatically detect files even if they don't follow the exact naming convention:

- **Images**: `thumbnail.png`, `product-name.png`, or any `.png/.jpg/.jpeg/.webp/.gif` file
- **CSV**: `data.csv` or any `.csv` file
- **JSON**: `coordinates.json` or any `.json` file

## Example: Product Folder Structure

If your `index.csv` has:
```csv
brand,model,category,type,product_path,product_name,product_description,relative_product
Swastik,BC-2000,Bag Closer Machines,Industrial,1. Miscellaneous Cover,Miscellaneous Cover,Essential cover components for bag closer machine assembly,2. Miscellaneous Cover and Base Parts, 2A. Miscellaneous Bushing
Swastik,BC-3000,Bag Closer Machines,Industrial,2. Miscellaneous Cover and Base Parts,Miscellaneous Cover and Base Parts,Complete cover and base parts set for industrial bag closer,1. Miscellaneous Cover, 2A. Miscellaneous Bushing
```

Then create folders named exactly:
- **"1. Miscellaneous Cover"**
- **"2. Miscellaneous Cover and Base Parts"**

These folders can be placed **anywhere** in your Google Drive structure. The system will find them automatically.

Inside each folder, place:
- `thumbnail.png` - Image of the product
- `data.csv` - Parts list with columns like: number, name, description, partNumber
- `coordinates.json` - Interactive coordinates for the image

### Related Products:
Products specified in the `relative_product` column (comma-separated) will be shown as related parts. This creates a network of connected products.

## CSV File Structure (data.csv)

Each product folder should contain a `data.csv` file with this structure:

```csv
number,name,description,partNumber
1,Main Body,Main machine body assembly,BC-2000-001
2,Drive Motor,Electric drive motor,BC-2000-002
3,Control Panel,Electronic control panel,BC-2000-003
4,Conveyor Belt,Product conveyor belt,BC-2000-004
```

## JSON File Structure (coordinates.json)

Each product folder should contain a `coordinates.json` file with this structure:

```json
{
  "imageName": "Automatic Bag Closer BC-2000",
  "coordinates": [
    {
      "id": "1",
      "x": 150,
      "y": 200,
      "partNumber": "BC-2000-001",
      "description": "Main Body"
    },
    {
      "id": "2", 
      "x": 300,
      "y": 150,
      "partNumber": "BC-2000-002",
      "description": "Drive Motor"
    }
  ]
}
```

## Environment Variables

Make sure to set these environment variables in your `.env` file:

```env
VITE_DRIVE_ROOT_FOLDER_ID=your_google_drive_root_folder_id
VITE_DRIVE_API_KEY=your_google_drive_api_key
VITE_USE_GOOGLE_DRIVE=true
```

## How It Works

1. **Index CSV**: The system reads your `index.csv` file to get the list of products and their folder names
2. **Exact Folder Search**: Searches recursively through your entire Google Drive to find folders with exact names
3. **File Detection**: Inside each found folder, it automatically detects and displays:
   - **All Image files** (PNG, JPG, JPEG, WEBP, GIF)
   - **All CSV files** (prefers `data.csv`)
   - **All JSON files** (prefers `coordinates.json`)
4. **Related Parts**: All products sharing the same folder name are automatically shown as related parts
5. **Display**: The system displays the product with interactive features based on all detected files

## Benefits

- **Simple Setup**: Just create folders with exact names from your CSV
- **Flexible Placement**: Folders can be anywhere in your Google Drive structure
- **Numbers Supported**: Folder names can contain numbers and special characters
- **Flexible Naming**: Files can have different names, system will auto-detect all files
- **Automatic Related Parts**: Products in the same folder are automatically linked
- **Automatic Updates**: Add new products by just adding rows to your CSV and creating folders
- **No Manual Path Management**: System handles all file path resolution automatically
- **Complete File Display**: Shows all PNG, CSV, and JSON files from each folder

## Troubleshooting

1. **Folder Not Found**: 
   - Ensure folder name in Google Drive exactly matches the `product_path` column in CSV
   - Example: CSV has `1. Miscellaneous Cover` → Google Drive folder should be named exactly the same
   - Check that the folder exists somewhere in your Google Drive structure
2. **Files Not Loading**: Check that required files (PNG, CSV, JSON) exist in the folder
3. **Permission Issues**: Ensure your Google Drive API has access to the root folder
4. **File Format Issues**: Ensure CSV and JSON files follow the required structure
5. **Related Parts Not Showing**: Make sure `relative_products` column contains bracket notation with comma-separated product paths

## Example Complete Setup

1. **Create Google Drive Folders** (can be anywhere in your Drive):
   - `1. Miscellaneous Cover/`
   - `2. Miscellaneous Cover and Base Parts/`
   - `2A. Miscellaneous Bushing/`

2. **Add files to each folder**:
   - `thumbnail.png` (product image)
   - `data.csv` (parts list)
   - `coordinates.json` (interactive data)

3. **Update your `index.csv`**:
   ```csv
brand,model,category,type,product_path,product_name,product_description,relative_products
Swastik,BC-2000,Bag Closer Machines,Industrial,1. Miscellaneous Cover,Miscellaneous Cover,Essential cover components for bag closer machine assembly,"[2. Miscellaneous Cover and Base Parts, 2A. Miscellaneous Bushing]"
Swastik,BC-3000,Bag Closer Machines,Industrial,2. Miscellaneous Cover and Base Parts,Miscellaneous Cover and Base Parts,Complete cover and base parts set for industrial bag closer,"[1. Miscellaneous Cover, 2A. Miscellaneous Bushing]"
Swastik,BC-1500,Bag Closer Machines,Portable,2A. Miscellaneous Bushing,Miscellaneous Bushing,High-quality bushing components for smooth operation,"[1. Miscellaneous Cover, 2. Miscellaneous Cover and Base Parts]"
```

4. **Set environment variables**
5. **Deploy and test!**

The system will automatically find your folders by exact name and display all files with full interactive functionality. Related products will be shown based on the `relative_products` column.
