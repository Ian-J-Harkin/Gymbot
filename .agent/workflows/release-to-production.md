---
description: Steps for deploying GymBot to production
---

# GymBot Release Workflow

This document outlines the critical steps required when moving GymBot from a development environment to a production server.

## 1. Environment Variables (.env)
- [ ] **Create Production .env**: Do not copy your local `.env`. Create a fresh one on the server.
- [ ] **DATABASE_URL**: Update to point to your hosted database (e.g., AWS RDS, Supabase, Azure SQL).
    - *Note*: Ensure the connection string includes `sslmode=require` if mandated by your provider.
- [ ] **JWT_SECRET**: Generate a **strong, random string** (at least 32 chars). Do NOT use "superSecretKey123".
- [ ] **STRIPE_SECRET_KEY**: Switch to your **Live Mode** secret key (`sk_live_...`).
- [ ] **STRIPE_PUBLISHABLE_KEY**: Switch to your **Live Mode** publishable key (`pk_live_...`) in the frontend build.
- [ ] **STRIPE_WEBHOOK_SECRET**: Add a new webhook endpoint in the Stripe Dashboard for your production URL and use that signing secret (`whsec_...`).
- [ ] **STRIPE_RETURN_URL**: Update to your actual domain (e.g., `https://app.gymbot.ai/billing/portal-return`).
- [ ] **CORS_ORIGINS**: (See below)

## 2. API Security & CORS (Critical)
- [ ] **Update `main.ts`**:
    - Locate the `app.enableCors` block.
    - Remove `localhost` entries.
    - Add your actual production domains.
    ```typescript
    app.enableCors({
      origin: [
        'https://app.gymbot.ai',      // Your Admin Dashboard
        'https://gymbot.ai',          // Your Landing Page
        'https://client-site.com'     // If you host the widget for specific clients
      ],
      // ...
    });
    ```
- [ ] **Widget Origins**: If the widget is embedded on client sites, you may need a strategy for dynamic origin validation or allowing `*` for the specific widget endpoints (while keeping the admin API locked down).

## 3. Database Migration
- [ ] **Run Migrations**: Execute `npx prisma migrate deploy` on the production server to apply the schema.
    - *Do not* use `migrate dev` in production.

## 4. Frontend Build
- [ ] **Build Admin**: Run `npm run build` in `fitbot-admin`.
- [ ] **Serve Static Files**: Ensure your web server (Nginx, Vercel, Netlify) is pointing to the `dist` folder.
- [ ] **SPA Routing**: Configure your web server to redirect 404s to `index.html` so React Router works.

## 5. Stripe Dashboard
- [ ] **Enable Customer Portal**: Go to Stripe Settings > Customer Portal.
- [ ] **Configure Branding**: Upload your logo and set your brand colors so the portal matches GymBot.
- [ ] **Enable Payment Methods**: Turn on the card types you want to accept (e.g., Link, Apple Pay, Google Pay).

## 6. Verification
- [ ] **Test Signup**: Create a real account.
- [ ] **Test Subscription**: Use a real card (and refund yourself immediately) to verify the flow.
- [ ] **Test Portal**: Ensure the "Return to GymBot" link in the portal takes you back to the correct production URL.
