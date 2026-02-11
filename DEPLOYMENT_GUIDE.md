# FitBot Deployment Guide: Production & CI/CD

This guide outlines how to deploy the FitBot ecosystem using free-tier services.

---

## 1. Backend & Database (`fitbot-api`)

### Database: Neon / Supabase
1.  **Create a Project**: Sign up at [Neon.tech](https://neon.tech) or [Supabase.com](https://supabase.com).
2.  **Get Connection String**: Copy the "External" or "Pooling" PostgreSQL connection string.
3.  **Local Sync**: Run `npx prisma migrate deploy` locally with the production URL once to sync the schema.

### Backend Host: Render / Railway
1.  **Connect Repo**: Point Render/Railway to your GitHub repository.
2.  **Root Directory**: Set to `fitbot-api`.
3.  **Build Command**: `npm install && npm run build`.
4.  **Start Command**: `npm run start:prod`.
5.  **Environment Variables**:
    *   `DATABASE_URL`: (From Neon/Supabase)
    *   `JWT_SECRET`: (Random 32+ char string)
    *   `ENCRYPTION_KEY`: (32 characters)
    *   `IV_SECRET`: (16 characters)

---

## 2. Azure Free Hosting (Alternative)

### Admin Dashboard & Widget: Azure Static Web Apps
1.  **Create Static Web App**: In Azure Portal, search for "Static Web Apps".
2.  **Source**: GitHub. Choose your repo and branch.
3.  **Build Presets**: 
    *   **App Location**: `/fitbot-admin` (or `/fitbot-widget`)
    *   **Output Location**: `dist`
4.  **Scaling**: Select the **Free F1** tier.

### Backend: Azure App Service (Free F1)
1.  **Create Web App**: Select "Node.js 20".
2.  **Deployment**: GitHub Actions (Azure will generate the `.yml` for you).
3.  **Configuration**: Add your environment variables (`DATABASE_URL`, etc.) in the **Settings > Configuration** blade.

---

## 3. Frontends (`fitbot-admin` & `fitbot-widget`)

### Admin Dashboard: Netlify
1.  **Add New Site**: Import from GitHub.
2.  **Base Directory**: `fitbot-admin`.
3.  **Build Command**: `npm run build`.
4.  **Publish Directory**: `dist`.
5.  **Variables**: 
    *   `VITE_API_URL`: Your deployed Render URL (e.g., `https://fitbot-api.onrender.com/api`).

### Widget (CDN): Netlify / GitHub Pages
The widget needs to be hosted as a single static JS file accessible via a public URL.
1.  **Option A (Netlify)**: Create a separate Netlify site for `fitbot-widget`.
2.  **Public URL**: Once deployed, your integration script will look like: 
    `<script src="https://your-widget-site.netlify.app/gymbot.min.js" ...></script>`.

---

## 3. GitHub Actions (CI/CD)

The workflow is located at `.github/workflows/ci-cd.yml`. To enable automated deployments:
1.  **Add Secrets** to GitHub:
    *   `NETLIFY_AUTH_TOKEN`: Your Netlify personal access token.
    *   `NETLIFY_SITE_ID_ADMIN`: The API ID for your Admin Dashboard site.
    *   `VITE_API_URL`: The production API endpoint.
2.  **Observe**: Every push to `main` will now run tests and build all components.
