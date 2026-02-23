# FitBot Deployment Guide: Production

This guide outlines the official strategy for deploying the FitBot ecosystem (API, Admin Dashboard, and Widget) using free-tier cloud services with zero infrastructure management.

---

## 1. Database: Neon (PostgreSQL)

Neon is a serverless PostgreSQL database that sleeps when inactive, making it ideal for free-tier hosting.

1.  **Create a Project**: Sign up at [Neon.tech](https://neon.tech) and create a new project.
2.  **Get Connection Strings**: You will need both the standard connection string and the unpooled connection string (required for Prisma migrations).
    *   `DATABASE_URL`: The pooled connection string.
    *   `DATABASE_URL_UNPOOLED`: The direct unpooled connection string.
3.  **Local Sync**: The application uses Prisma migrations. During the initial deployment, Render will automatically run `npx prisma migrate deploy` to build your tables in Neon.

---

## 2. Backend API: Render

Render hosts the NestJS API. The infrastructure is defined as code in the `render.yaml` file located in the root directory.

1.  **Create Account & Link GitHub**: Sign up at [Render.com](https://render.com) (using your GitHub account is the easiest and recommended method).
2.  **Grant Repository Access**: During signup or when creating your first service, Render will ask for permission to view your GitHub repositories. You can limit this access specifically to the `Gymbot` repository if you prefer.
3.  **Deploy Blueprint**: Once logged in, click **New > Blueprint** in the Render dashboard and select your `Gymbot` repository.
4.  **Automatic Configuration**: Render will automatically detect the `render.yaml` file in the root of the repo. It will set up the Node environment, build commands, and start commands without you having to click anything manually.
5.  **Environment Variables**: Render will ask you to fill in the missing environment variables before it can deploy. Grab these from your `.env.cloud` file:
    *   `DATABASE_URL`: (From Neon)
    *   `DATABASE_URL_UNPOOLED`: (From Neon)
    *   `JWT_SECRET`: (Random 32+ character string)
    *   `ENCRYPTION_KEY`: (Exactly 32 characters)
    *   `IV_SECRET`: (Exactly 16 characters)
6.  **Deploy**: Click deploy. Render will connect to Neon, run the migrations, and provide a live URL (e.g., `https://gymbot-api.onrender.com`).
7.  **Webhook Setup (For CD)**: Once deployed, go to the service's "Settings" page in Render, scroll down to "Deploy Hook", copy the URL, and add it as a GitHub Repository Secret named `RENDER_DEPLOY_HOOK` so GitHub Actions can trigger future updates automatically.

---

## 3. Frontend Dashboard & Demos: Vercel

Vercel provides fast, globally distributed hosting for the React Admin Dashboard (`fitbot-admin`) and demo sites, fully integrated natively with Next.js and Vite.

1.  **Create Vercel Project**: Log into Vercel and import your GitHub repository.
2.  **Configuration**: You will need to set up two separate Vercel projects pointing to the same repository:
    *   **FitBot Admin Dashboard**: Set the Root Directory to `fitbot-admin`. Vercel will automatically detect Vite.
    *   **React Demo Site**: Set the Root Directory to `demos/fitbot-react-demo`.
3.  **Environment Variables**: In each Vercel project's settings, add:
    *   `VITE_FITBOT_API_URL`: Your deployed Render URL (e.g., `https://gymbot-api.onrender.com/api`).
    *   *Note: Ensure you include the `/api` suffix as configured in the NestJS global prefix.*
4.  **Automated Deployments**: With GitHub Actions configured (`.github/workflows/cd.yml`), Vercel deployments will occur automatically via the `amondnet/vercel-action` whenever code is pushed to `main`.

## Appendix: Legacy Alternatives

*   **Azure Static Web Apps (Frontend)**: Previously used for frontends. Replaced by Vercel for better React/Next.js ecosystem support.
*   **Netlify (Frontend)**: Optional alternative to Vercel.
*   **Railway (Backend)**: Previously used for the API. Replaced by Render due to native `render.yaml` Infrastructure-as-Code support.
*   **Supabase (Database)**: An alternative to Neon; follows the exact same connection string logic.

---

## Future Enhancements: Full Infrastructure as Code (IaC)

While the current deployment strategy relies on GitHub Actions (`cd.yml`) executing Vercel CLI deployments and Render webhooks, future iterations of GymBot may require fully reproducible environments (e.g., spinning up separate white-labeled instances for different clients).

When that scaling need arises, the architecture will evolve to use **Terraform**. This will involve:
1. Creating an `/infrastructure` directory in the root repository.
2. Writing declarative `.tf` scripts to automatically provision the Vercel projects and Render services.
3. Managing the deployment tokens natively via Terraform state.
