# Stripe Integration Test Plan

This document outlines the manual testing procedures for verifying the Stripe payment and subscription lifecycle in the GymBot platform.

## 📋 Prerequisites

1.  **Environment Variables**: Ensure `fitbot-api/.env` contains valid Stripe test keys:
    *   `STRIPE_SECRET_KEY` (sk_test_...)
    *   `STRIPE_PUBLISHABLE_KEY` (pk_test_...)
    *   `STRIPE_PRICE_ID` (from Stripe Dashboard)
2.  **Stripe CLI**: Installed on your machine ([Download here](https://docs.stripe.com/stripe-cli)).
3.  **Local Services**: Both the API and Admin Portal must be running (`npm run dev`).

---

## 🛠️ Step 1: Webhook Tunneling (Local Machine)

Since Stripe cannot reach your `localhost` directly, you must use the Stripe CLI to forward events.

1.  Open a dedicated terminal.
2.  Log in: `stripe login`
3.  Start forwarding:
    ```bash
    stripe listen --forward-to localhost:3000/api/stripe/webhook
    ```
4.  **Important**: Copy the `webhook signing secret` (starts with `whsec_`) provided in the terminal.
5.  Update your `fitbot-api/.env` file:
    ```env
    STRIPE_WEBHOOK_SECRET="whsec_xxxxxx"
    ```
6.  Restart the backend API.

---

## 💳 Step 2: Full Checkout Lifecycle

1.  **Navigate**: Open `http://localhost:3001` in your browser.
2.  **Login/Register**: Access the Admin Dashboard.
3.  **Subscription Tab**: Click the "Subscription" link in the sidebar.
4.  **Initiate Checkout**: Click the **"Start Subscription"** or **"Upgrade"** button.
    *   *Verification*: You should be redirected to `checkout.stripe.com`.
5.  **Complete Payment**:
    *   **Card**: `4242 4242 4242 4242`
    *   **Expiry**: Any future date (e.g., `12/30`)
    *   **CVC**: `123`
6.  **Redirect Check**: After payment, you should be redirected back to `http://localhost:3001/dashboard/billing/success`.
    *   *Verification*: Ensure the success page displays correctly.

---

## 🔍 Step 3: Data & Feature Verification

1.  **Dashboard Status**: Return to the Subscription tab.
    *   *Verification*: Status should now show **"Active"**.
2.  **Database Check**: (Optional) Check the `User` table in the database to ensure `subscriptionStatus` is "active".
3.  **Feature Gating**:
    *   Open the Chat Widget preview.
    *   Send a message.
    *   *Verification*: The message should process without the "Subscription Required" lock.
4.  **Webhook Logs**: Check the `stripe listen` terminal.
    *   *Verification*: You should see `checkout.session.completed` (200 OK) and `customer.subscription.created` (200 OK).

---

## 🚫 Step 4: Cancellation & Failure (Optional)

1.  **Cancel Checkout**: Initiate checkout again but click the "Back" button on the Stripe page.
    *   *Verification*: You should be redirected to `http://localhost:3001/dashboard/billing/cancel`.
2.  **Failed Webhook**: Send a mock failed event via CLI:
    ```bash
    stripe trigger customer.subscription.deleted
    ```
    *   *Verification*: Ensure the user's status in the app updates to "canceled" or "inactive".

---

## 🚀 Post-Integration TODOs

### 1. Guardrail Visibility & Environment Testing
- [ ] **Verify Production Behavior**: Build the application (`npm run build`) and run the preview (`npm run preview`) to confirm that "Guardrail Settings (Internal Only)" are hidden for all users in production.
- [ ] **Logic Audit**: Re-verify visibility. *Clarification*: The goal is to ensure that in a "Staff/Dev" environment, we can see these toggles, but a pro-customer in production doesn't get distracted by them.
- [ ] **Test AND vs OR logic**: Currently, we are using an "AND" condition in the requested refinement to ensure they only appear in `DEV` **AND** for `non-subscribers`.

### 2. Stripe Customer Portal ("Manage Billing")
- [x] **Backend Endpoint**: Implement a `POST /stripe/create-portal-session` in `stripe.service.ts` that uses `this.stripe.billingPortal.sessions.create`.
- [x] **Link Dashboard**: Connect the "Manage Billing" button in `BillingSettings.tsx` to this new endpoint to allow users to manage their own subscriptions (cancel, update card, etc.).

### 3. Subscription State Edge Cases
- [ ] **Testing Webhook Retries**: Simulate a server outage and verify Stripe's automatic webhook retry logic.
- [ ] **Trial Expiration**: Verify that the widget correctly flips to "blocked" mode when a subscription status changes to `past_due` or `unpaid`.
