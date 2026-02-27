# WordPress Deployment Guide

This document outlines how to install the custom FitBot Theme and Plugin onto a live WordPress site (such as `jabberdocky.com`).

---

## 1. Installing the Custom Theme

The custom theme provides the dark-mode layout that perfectly matches the React demo.

1. **Locate the Theme File**: In your local project directory, find the `demos/fitbot-wp-theme.zip` file. (If it does not exist, run `Compress-Archive -Path "demos\fitbot-wp-theme" -DestinationPath "demos\fitbot-wp-theme.zip"` in PowerShell).
2. **Upload to WordPress**:
   - Log into your WordPress Admin Dashboard (e.g., `jabberdocky.com/wp-admin`).
   - Navigate to **Appearance > Themes**.
   - Click the **Add New Theme** button at the top.
   - Click **Upload Theme**.
   - Choose the `fitbot-wp-theme.zip` file and click **Install Now**.
3. **Activate**: Once installed, click the **Activate** button to make it the active theme.

*(Note: Because this is a barebones, bespoke theme designed specifically for the FitBot demo, your homepage and other pages will immediately switch to the new layout without needing a page builder like Elementor).*

---

## 2. Installing the Chatbot Plugin

The plugin injects the actual `gymbot.min.js` script onto your pages so the floating widget appears.

1. **Locate the Plugin File**: In your local project directory, find the `fitbot-wordpress-plugin.zip` file.
2. **Upload to WordPress**:
   - Navigate to **Plugins > Add New Plugin** in the WordPress sidebar.
   - Click **Upload Plugin** at the top.
   - Choose the `fitbot-wordpress-plugin.zip` file and click **Install Now**.
3. **Activate**: Click **Activate Plugin**.

---

## 3. Configuring the Chatbot

1. After activating the plugin, a new **FitBot Setup** menu item will appear in the left-hand sidebar of your WordPress admin panel. Click it.
2. You will see three fields. Fill them out as follows:
   - **API Key**: Enter the API key generated for your gym in the FitBot Admin panel (e.g., the key shown on your dashboard).
   - **API URL**: Enter the URL of your deployed FitBot backend (e.g., `https://gymbot-api.onrender.com/api` or your local development URL `http://localhost:3000/api` if testing locally via ngrok).
   - **Frontend Script URL**: Enter the URL where the raw `gymbot.min.js` file is hosted (e.g., `https://gymbot-demo.vercel.app/gymbot.min.js`).
3. Click **Save Changes**.

The floating chatbot widget will now instantly appear on the bottom right of all your WordPress pages!
