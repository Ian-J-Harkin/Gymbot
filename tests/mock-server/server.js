const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Mock Config Endpoint
app.get('/api/widget/config', (req, res) => {
    console.log('Received config request with key:', req.headers['x-api-key']);
    res.json({
        widgetColor: '#2563EB', // Standard FitBot Blue
        greetingMessage: 'Hello from the Integration Test Backend! Ask me anything.',
        requireSubscription: false
    });
});

// Mock Chat Endpoint (SSE Streaming)
app.post('/api/widget/chat', (req, res) => {
    console.log('Received chat message:', req.body.message);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const responseText = "This response is coming from the mock server inside Docker. Your integration is working perfectly!";
    const chunks = responseText.split(' ');

    let i = 0;
    const interval = setInterval(() => {
        if (i < chunks.length) {
            const chunk = chunks[i] + ' ';
            res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
            i++;
        } else {
            // Send explanation object at the end
            res.write(`data: ${JSON.stringify({ explanation: { provider: 'mock-provider', model: 'mock-model', latency: 10 } })}\n\n`);

            res.write('data: [DONE]\n\n');
            clearInterval(interval);
            res.end();
        }
    }, 100); // Send a word every 100ms
});

const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Mock API running on port ${PORT}`);
});
