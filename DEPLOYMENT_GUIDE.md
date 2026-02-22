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

1.  **Connect Repo**: Log into [Render.com](https://render.com), click **New > Blueprint**, and connect your GitHub repository.
2.  **Automatic Configuration**: Render will read `render.yaml` and configure the Node environment, build commands, and start commands automatically.
3.  **Environment Variables**: Render will prompt you to provide the required secrets. Joi validation ensures the app will not boot if these are missing:
    *   `DATABASE_URL`: (From Neon)
    *   `DATABASE_URL_UNPOOLED`: (From Neon)
    *   `JWT_SECRET`: (Random 32+ character string)
    *   `ENCRYPTION_KEY`: (Exactly 32 characters)
    *   `IV_SECRET`: (Exactly 16 characters)
4.  **Deploy**: Click deploy. Render will connect to Neon, run the migrations, and provide a live URL (e.g., `https://gymbot-api.onrender.com`).

---

## 3. Frontend Dashboard: Azure Static Web Apps

Azure Static Web Apps (SWA) provides fast, globally distributed hosting for the React Admin Dashboard (`fitbot-admin`).

1.  **Create Static Web App**: In the [Azure Portal](https://portal.azure.com), search for "Static Web Apps" and create a new one.
2.  **Source**: Select GitHub, choose your repository and the `main` branch.
3.  **Build Details**:
    *   **Build Presets**: React
    *   **App Location**: `/packages/fitbot-admin` (or `/demos/fitbot-react-demo`)
    *   **Api Location**: Keep blank (we are using Render for the API).
    *   **Output Location**: `dist`
4.  **Routing**: The repository includes `staticwebapp.config.json` which tells Azure how to handle React Router fallback navigation natively.
5.  **Environment Variables**: Once the app is created, go to **Settings > Configuration** in the Azure portal and add:
    *   `VITE_FITBOT_API_URL`: Your deployed Render URL (e.g., `https://gymbot-api.onrender.com/api`).
    *   *Note: Ensure you include the `/api` suffix as configured in the NestJS global prefix.*

---

## Appendix: Legacy Alternatives

*   **Netlify (Frontend)**: Previously used for frontends. Replaced by Azure SWA for better enterprise scaling.
*   **Railway (Backend)**: Previously used for the API. Replaced by Render due to native `render.yaml` Infrastructure-as-Code support.
*   **Supabase (Database)**: An alternative to Neon; follows the exact same connection string logic.

---

## Future Enhancements: Full Infrastructure as Code (IaC)

While the current deployment strategy relies on a one-time setup via the Azure Portal (which then automatically generates the GitHub Actions CI/CD pipeline), future iterations of GymBot may require fully reproducible environments (e.g., spinning up separate white-labeled instances for different clients).

When that scaling need arises, the architecture will evolve to use **Terraform** or Azure **Bicep**. This will involve:
1. Creating an `/infrastructure` directory in the root repository.
2. Writing declarative `.tf` or `.bicep` scripts to automatically provision the Azure Static Web Apps and resource groups without touching the Azure Portal.
3. Managing the OAuth handshake and deployment tokens via automated GitHub Secrets injection.
