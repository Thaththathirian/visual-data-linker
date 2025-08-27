# 🚀 Netlify Deployment Guide

## 🎯 Overview

Netlify is a **static hosting platform**, so you need to deploy your backend separately. Here are the best solutions:

## 📋 Deployment Options

### **Option 1: Railway + Netlify (Recommended)**

#### **Backend Deployment (Railway)**

1. **Create Railway Account**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub

2. **Deploy Backend**
   ```bash
   # Clone your repo
   git clone your-repo-url
   cd your-repo
   
   # Create backend directory
   mkdir backend
   mv server.js backend/
   mv package.json backend/
   
   # Create Railway config
   echo '{"build": {"builder": "nixpacks"}}' > backend/railway.json
   ```

3. **Set Environment Variables in Railway**
   ```
   GOOGLE_API_KEY=your_google_api_key
   GOOGLE_DRIVE_FOLDER_ID=your_folder_id
   NODE_ENV=production
   ```

4. **Deploy to Railway**
   - Connect your GitHub repo to Railway
   - Set root directory to `backend`
   - Deploy

5. **Get Backend URL**
   - Railway will give you a URL like: `https://your-app.railway.app`

#### **Frontend Deployment (Netlify)**

1. **Update Environment Variables**
   Create `.env.production` in your project root:
   ```env
   VITE_API_BASE_URL=https://your-app.railway.app/api
   ```

2. **Build Frontend**
   ```bash
   npm run build
   ```

3. **Deploy to Netlify**
   - Connect your GitHub repo to Netlify
   - Set build command: `npm run build`
   - Set publish directory: `dist`
   - Deploy

### **Option 2: Render + Netlify**

#### **Backend Deployment (Render)**

1. **Create Render Account**
   - Go to [render.com](https://render.com)
   - Sign up with GitHub

2. **Create Web Service**
   - Connect your GitHub repo
   - Set root directory to `backend`
   - Set build command: `npm install`
   - Set start command: `node server.js`

3. **Set Environment Variables**
   ```
   GOOGLE_API_KEY=your_google_api_key
   GOOGLE_DRIVE_FOLDER_ID=your_folder_id
   NODE_ENV=production
   ```

4. **Deploy**
   - Render will give you a URL like: `https://your-app.onrender.com`

### **Option 3: Vercel Functions (Alternative)**

#### **Serverless Functions**

1. **Create API Routes**
   Create `api/folders.js`:
   ```javascript
   const { google } = require('googleapis');

   export default async function handler(req, res) {
     if (req.method !== 'GET') {
       return res.status(405).json({ error: 'Method not allowed' });
     }

     const drive = google.drive({
       version: 'v3',
       auth: process.env.GOOGLE_API_KEY
     });

     try {
       const response = await drive.files.list({
         q: `'${process.env.GOOGLE_DRIVE_FOLDER_ID}' in parents and trashed=false`,
         fields: 'files(id, name, mimeType, parents)',
         orderBy: 'name'
       });

       // Process folders and files...
       res.json({ folders: [] });
     } catch (error) {
       res.status(500).json({ error: error.message });
     }
   }
   ```

2. **Deploy to Vercel**
   - Connect your repo to Vercel
   - Set environment variables
   - Deploy

## 🛠️ Step-by-Step Railway + Netlify Setup

### **Step 1: Prepare Backend**

1. **Create backend directory structure:**
   ```
   your-project/
   ├── backend/
   │   ├── server.js
   │   ├── package.json
   │   └── railway.json
   ├── src/
   ├── public/
   └── package.json
   ```

2. **Update backend/package.json:**
   ```json
   {
     "name": "visual-data-linker-backend",
     "version": "1.0.0",
     "main": "server.js",
     "scripts": {
       "start": "node server.js"
     },
     "dependencies": {
       "express": "^4.18.2",
       "cors": "^2.8.5",
       "googleapis": "^118.0.0"
     }
   }
   ```

3. **Create backend/railway.json:**
   ```json
   {
     "build": {
       "builder": "nixpacks"
     }
   }
   ```

### **Step 2: Deploy Backend to Railway**

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

2. **Deploy on Railway:**
   - Go to [railway.app](https://railway.app)
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repo
   - Set root directory to `backend`
   - Add environment variables:
     ```
     GOOGLE_API_KEY=your_api_key
     GOOGLE_DRIVE_FOLDER_ID=your_folder_id
     NODE_ENV=production
     ```

3. **Get Backend URL:**
   - Railway will provide a URL like: `https://your-app.railway.app`
   - Copy this URL

### **Step 3: Deploy Frontend to Netlify**

1. **Create .env.production:**
   ```env
   VITE_API_BASE_URL=https://your-app.railway.app/api
   ```

2. **Build Frontend:**
   ```bash
   npm run build
   ```

3. **Deploy to Netlify:**
   - Go to [netlify.com](https://netlify.com)
   - Click "New site from Git"
   - Connect your GitHub repo
   - Set build settings:
     - Build command: `npm run build`
     - Publish directory: `dist`
   - Deploy

## 🔧 Environment Variables

### **Railway (Backend)**
```
GOOGLE_API_KEY=your_google_api_key
GOOGLE_DRIVE_FOLDER_ID=your_folder_id
NODE_ENV=production
```

### **Netlify (Frontend)**
```
VITE_API_BASE_URL=https://your-backend-url.railway.app/api
```

## 🚨 Troubleshooting

### **CORS Errors**
```
❌ Access to fetch at 'https://backend-url' from origin 'https://netlify-url' has been blocked by CORS policy
```

**Solution:** Update CORS configuration in `server.js`:
```javascript
app.use(cors({
  origin: ['https://your-netlify-app.netlify.app'],
  credentials: true
}));
```

### **API Not Found**
```
❌ Failed to fetch folder structure: 404
```

**Solution:** Check your backend URL in `VITE_API_BASE_URL`

### **Environment Variables Not Working**
```
❌ GOOGLE_API_KEY is not set
```

**Solution:** Ensure environment variables are set in Railway dashboard

## 📊 Cost Comparison

| Platform | Backend | Frontend | Cost |
|----------|---------|----------|------|
| Railway + Netlify | Railway | Netlify | $5-20/month |
| Render + Netlify | Render | Netlify | $7-25/month |
| Vercel | Vercel Functions | Vercel | $20/month |
| Heroku + Netlify | Heroku | Netlify | $7-25/month |

## 🎯 Recommended Setup

**For Production:**
1. **Backend:** Railway (reliable, good free tier)
2. **Frontend:** Netlify (fast, great CDN)
3. **Database:** None needed (uses Google Drive)

**For Development:**
1. **Backend:** Local (`node server.js`)
2. **Frontend:** Local (`npm run dev`)

## ✅ Benefits of This Setup

- **Scalable:** Can handle thousands of users
- **Cost-effective:** Free tiers available
- **Fast:** Global CDN for frontend
- **Reliable:** Separate backend and frontend
- **Secure:** Environment variables for secrets
- **Easy updates:** Automatic deployments from Git

## 🚀 Quick Deploy Commands

```bash
# 1. Prepare backend
mkdir backend
mv server.js backend/
mv package.json backend/

# 2. Create railway.json
echo '{"build": {"builder": "nixpacks"}}' > backend/railway.json

# 3. Push to GitHub
git add .
git commit -m "Prepare for deployment"
git push origin main

# 4. Deploy backend to Railway (via web interface)
# 5. Deploy frontend to Netlify (via web interface)
```

Your app will be live at your Netlify URL! 🎉
