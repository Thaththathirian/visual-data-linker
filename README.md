# Visual Data Linker

## Environment Modes
- Default mode loads data from Google Drive when `VITE_INTELLIPARTS_SOURCE=drive`.
- Server mode is enabled by adding `VITE_INTELLIPARTS_SOURCE=server` in your `.env`.
- `VITE_DEV_INTELLIPARTS_BASE_URL` or `VITE_PROD_INTELLIPARTS_BASE_URL` must point to the host that serves the `IntelliParts` directory.
- When these variables are missing the app falls back to Google Drive.

```bash
# .env example for local server testing
VITE_INTELLIPARTS_SOURCE=server
VITE_DEV_INTELLIPARTS_BASE_URL=http://localhost:4173
```

## Server Folder Layout
- Assets are fetched from `<base-url>/IntelliParts`.
- Product data must live inside `IntelliParts/Products/<folder-name>/`.
- Each folder should contain a CSV, JSON, and image file that share the folder name.
- Fallback names (`coordinates.json`, `data.csv`, `thumbnail.png`) still work but use the shared name to keep everything in sync.

```
IntelliParts/
  Products/
    10/
      10.json        # coordinates for folder "10"
      10.csv         # matching table data
      10.png         # primary image (jpg/jpeg/webp/gif also accepted)
```

## Coordinate File Naming
- The coordinates JSON must use `<folder-name>.json` (for example `10.json`).
- Optional variants like `<folder-name>-coordinates.json` are also checked, but matching the folder name is recommended.
- CSV should be `<folder-name>.csv` and the image should be `<folder-name>.(png|jpg|jpeg|webp|gif)`.
- Machine images continue to load from `IntelliParts/Machine Images` and are not affected by the new prefix logic.

## Switching Back to Drive
- Remove or set `VITE_INTELLIPARTS_SOURCE=drive` to return to the Google Drive integration.
- No other folder changes are required when reverting to drive mode.

