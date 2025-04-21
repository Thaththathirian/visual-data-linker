
# Deployment Instructions

To deploy this application on Netlify:

1. **Prepare your XLSX/CSV files:**
   - **IMPORTANT:** Make sure all your XLSX/CSV files from `src/data/tables/` are copied to the `public/tables/` directory before building.
   - You must manually copy these files before deployment.
   - Example: Copy `src/data/tables/frame-assembly-1.xlsx` to `public/tables/frame-assembly-1.xlsx`

2. **Netlify Deploy Settings:**
   - Build command: `npm run build`
   - Publish directory: `dist`
   - **Create the `/tables` directory**: In Netlify's deploy settings, add this build command at the beginning:
     ```
     mkdir -p public/tables && cp -r src/data/tables/* public/tables/ && npm run build
     ```

3. **If you're deploying from the Netlify UI:**
   - Before uploading your build files, make sure to copy the XLSX files to the `public/tables/` directory.

4. **Content Structure Check**:
   - After deployment, your site structure should include:
     - `/tables/frame-assembly-1.xlsx`
     - `/tables/page-1-circle.csv` (if used)
     - `/tables/sewing-machine-x200.csv` (if used)

## Troubleshooting

If you see 404 errors for XLSX files:
- Verify that the XLSX/CSV files exist in the `public/tables/` directory before building
- Check that the paths in your code match the deployed structure
- In Netlify's deploy logs, confirm the files were correctly copied
- Try adding a simple text file in the same directory to verify path accessibility
