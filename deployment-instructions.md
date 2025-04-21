
# Deployment Instructions

To deploy this application on Netlify:

1. **Prepare your XLSX/CSV files:**
   - Make sure all your XLSX/CSV files from `src/data/tables/` are copied to the `public/tables/` directory before building.
   - You can manually copy these files or add a step in your build process.

2. **Netlify Deploy Settings:**
   - Build command: `npm run build`
   - Publish directory: `dist`

3. **Environment Variables:**
   - No special environment variables are needed for this application.

## Troubleshooting

If you see 404 errors for XLSX files:
- Check that the files exist in the `public/tables/` directory
- Verify that the paths in your code are correct
- If needed, enable Netlify's debug mode to inspect server responses

