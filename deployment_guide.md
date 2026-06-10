# 🌐 Full-Stack Deployment Guide

This guide describes how to host the **Book Store AngularJS** application fully on free hosting platforms:
1. **Database** → MongoDB Atlas (Free Cloud Database)
2. **Backend Server** → Render (Free Web Service)
3. **Frontend Client** → Vercel or Netlify (Free Frontend Hosting)

---

## 1️⃣ Set up the Cloud Database (MongoDB Atlas)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and sign up for a free account.
2. Create a new project, then click **Create a Cluster** (Select the **M0 Free** tier).
3. In **Security Quickstart**:
   - Set up a **Username** and **Password** (save these!).
   - In the **IP Access List**, add `0.0.0.0/0` (allows connections from Render/hosting providers).
4. Go to the Database Deployment dashboard, click **Connect** → **Drivers**.
5. Copy your connection string. It will look like this:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxx.mongodb.net/?retryWrites=true&w=majority
   ```
   *Replace `<username>` and `<password>` with the credentials you created.*

---

## 2️⃣ Deploy the Backend Server (Render)

1. Sign up/Log in to [Render](https://render.com).
2. Click **New** → **Web Service**.
3. Connect your GitHub repository: `Book-Store-AngularJS`.
4. Configure the Web Service settings:
   - **Name**: `book-store-backend`
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node app.js`
5. Click **Advanced** to add Environment Variables:
   - Add `NODE_ENV` = `production`
   - Add `MONGODB_URI` = *(Paste your MongoDB Atlas connection string here)*
6. Click **Create Web Service**.
7. Once successfully deployed, Render will provide a URL (e.g., `https://book-store-backend.onrender.com`). **Copy this URL**.

---

## 3️⃣ Seed the Cloud Database (Optional)

To load initial book data into your MongoDB Atlas cloud database:
1. Open a terminal on your local machine in the `server` directory.
2. Run the seed command using your MongoDB Atlas URI:
   ```sh
   # On Windows powershell/cmd:
   $env:MONGODB_URI="your_mongodb_atlas_connection_string"
   node utilities/seed.js # Or run the seed script locally pointing to the Atlas URI
   ```
   *(Alternatively, you can import the `server/books.json` file directly into your MongoDB Atlas collection named `books` using the MongoDB Atlas web dashboard or MongoDB Compass).*

---

## 4️⃣ Update the Frontend Client with your Backend URL

1. Open [client/src/environments/environment.prod.ts](file:///d:/BACKUP/projects/PHP%20project/Book-Store-AngularJS/client/src/environments/environment.prod.ts).
2. Change the `apiUrl` value to match your Render backend URL (e.g. `https://book-store-backend.onrender.com`):
   ```typescript
   export const environment = {
     production: true,
     apiUrl: 'https://book-store-backend.onrender.com' // <-- Update this
   };
   ```
3. Commit and push this change to GitHub:
   ```sh
   git add client/src/environments/environment.prod.ts
   git commit -m "Update production API URL"
   git push origin main
   ```

---

## 5️⃣ Deploy the Frontend Client (Vercel or Netlify)

### Option A: Vercel (Recommended)
1. Go to [Vercel](https://vercel.com) and log in with GitHub.
2. Click **Add New** → **Project**.
3. Import your `Book-Store-AngularJS` repository.
4. Configure the Project:
   - **Framework Preset**: `Angular`
   - **Root Directory**: `client`
5. Click **Deploy**. Vercel will automatically build the project using Angular CLI and serve it!

### Option B: Netlify
1. Go to [Netlify](https://www.netlify.com) and log in with GitHub.
2. Click **Add new site** → **Import an existing project**.
3. Select GitHub and choose your repository.
4. Configure the settings:
   - **Base directory**: `client`
   - **Build command**: `npm run build --prod` (or `ng build --prod`)
   - **Publish directory**: `client/dist` (or `client/dist/client`)
5. Click **Deploy site**.
