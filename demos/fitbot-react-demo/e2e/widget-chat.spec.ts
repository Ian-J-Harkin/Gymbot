import { test, expect } from '@playwright/test';

test.describe('FitBot Widget End-to-End Flow', () => {

    test('Widget renders, opens, and processes an AI chat message', async ({ page }) => {
        // 1. Navigate to the Vite demo site
        await page.goto('/');

        // 2. Verify the DOM loaded and the widget root is injected
        const widgetRoot = page.locator('#fitbot-widget-root');
        await expect(widgetRoot).toBeAttached();

        // 3. Find and click the Floating Action Button (FAB) to open the chat
        const fabButton = page.locator('button.fitbot-launcher');
        await expect(fabButton).toBeVisible();
        await fabButton.click();

        // 4. Verify the chat window opened
        const chatWindow = page.locator('.fitbot-chat-window');
        await expect(chatWindow).toBeVisible();

        // 5. Verify the welcome message is displayed
        const welcomeBubble = page.locator('.fitbot-bubble').first();
        await expect(welcomeBubble).toBeVisible();
        await expect(welcomeBubble).toContainText(/FitBot/i);

        // 6. Type a query into the input field
        const chatInput = page.locator('input.fitbot-input');
        await expect(chatInput).toBeVisible();

        // We ask a specific question that the seeded RAG data ("gym data") knows the answer to
        const testQuery = "What are the gym hours?";
        await chatInput.fill(testQuery);

        // 7. Click the Send button
        const sendButton = page.locator('button:has(svg.lucide-send)'); // The button with the send icon
        await sendButton.click();

        // 8. Verify the user's message appears in the chat
        const userMessage = page.locator('.fitbot-message.user').filter({ hasText: testQuery });
        await expect(userMessage).toBeVisible();

        // 9. Wait for the AI's response bubble to stream in
        // This requires waiting for the network roundtrip to the NestJS API and the LLM
        // We target the assistant bubble that appears *after* the user's message
        const aiResponse = page.locator('.fitbot-message.assistant .fitbot-bubble').nth(1);

        // We increase the timeout here specifically because the LLM (even Ollama) takes a few seconds to respond
        await expect(aiResponse).toBeVisible({ timeout: 15000 });

        // 10. Verify the response contains relevant text (e.g., "6am", "hours", etc.)
        // We use a broader regex instead of exact text since LLM output varies slightly
        await expect(aiResponse).toContainText(/pm|am|hours|open/i);
    });

});
