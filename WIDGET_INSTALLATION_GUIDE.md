# FitBot Widget Installation & Testing Guide

This guide explains how to install the FitBot chat widget on any website and how to verify it is working correctly.

## 1. Installation

To add FitBot to your website, copy and paste the following script tag into your website's HTML, ideally just before the closing `</body>` tag.

```html
<!-- FitBot Chat Widget -->
<script 
  src="https://cdn.fitbot.ai/gymbot.min.js" 
  data-api-key="YOUR_UNIQUE_API_KEY"
  async>
</script>
<!-- End FitBot Chat Widget -->
```

### Manual Configuration (Optional)
If you prefer to set the API key via JavaScript rather than a data attribute, you can use:

```html
<script>
  window.FITBOT_API_KEY = 'YOUR_UNIQUE_API_KEY';
</script>
<script src="https://cdn.fitbot.ai/gymbot.min.js" async></script>
```

### 1a. WordPress Installation
If you use WordPress, you can use our dedicated plugin:
1.  Download or copy the `fitbot-wordpress-plugin` folder to your local machine.
2.  Upload the folder to your WordPress `/wp-content/plugins/` directory.
3.  Activate the "FitBot Chat Widget" plugin through the 'Plugins' menu in WordPress.
4.  Navigate to **Settings > FitBot** and paste your API Key.
5.  The widget will automatically appear on all pages of your site.

---

## 2. Sensible Default Settings

If you haven't customized your widget in the FitBot Admin Dashboard yet, the following defaults will be applied:

*   **Primary Color**: `#2563EB` (vibrant blue)
*   **Initial Greeting**: "Hi! I'm FitBot, your gym assistant. How can I help you today?"
*   **Ollama Model** (if self-hosting): `llama3`
*   **AI Provider**: OpenAI (Default)

---

## 3. Testing Your Installation

Once the script is added, follow these steps to ensure everything is working:

### Step 1: Verification of Appearance
- Open your website in a browser.
- Look for the floating blue chat icon in the bottom-right corner.
- **Troubleshooting**: If it doesn't appear, check the browser console (F12) for any error messages related to the API key or "Failed to load resource".

### Step 2: Configuration Check
- Click the icon to open the chat window.
- Verify the header color matches your gym's branding (if you changed it in the dashboard).

### Step 3: Message Test
- Type a simple question like "What are your hours?"
- You should see the response stream in real-time.

### Step 4: Explanation Layer Test (New Feature)
- Once the AI responds, look for a small link saying **"Why did I say this?"** at the bottom of the chat bubble.
- Click it to see the "reasoning" behind the answer (Provider, Model, Latency). This helps you audit the AI's performance.

---

## 4. Troubleshooting Common Issues

| Issue | Likely Cause | Solution |
| :--- | :--- | :--- |
| **Widget doesn't appear** | Invalid or missing API Key | Ensure `data-api-key` is correctly copied from your dashboard. |
| **"Error: Connection Failed"** | API Key disabled or CORS issue | Verify your domain is whitelisted in the FitBot Admin Portal. |
| **Slow responses** | LLM Provider latency | Check your AI Provider status (OpenAI/OpenRouter) or local Ollama connection. |

---

## 5. Support
Need help? Contact our support team at `support@fitbot.ai` or visit the [Admin Dashboard](https://admin.fitbot.ai).
