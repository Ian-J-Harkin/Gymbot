<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FitBot Integration Test</title>
    <style>
        body { font-family: sans-serif; padding: 2rem; max-width: 800px; margin: 0 auto; line-height: 1.6; }
        .card { border: 1px solid #ddd; padding: 1.5rem; border-radius: 8px; margin-bottom: 1rem; }
        code { background: #f4f4f4; padding: 0.2rem 0.4rem; border-radius: 4px; }
    </style>
</head>
<body>
    <h1>FitBot Integration Test (PHP Environment)</h1>
    
    <div class="card">
        <h2>Widget Status</h2>
        <p>The FitBot widget should appear in the bottom right corner.</p>
        <p>It is being loaded from: <code>/widget-dist/gymbot.min.js</code></p>
    </div>

    <div class="card">
        <h2>Configuration</h2>
        <p><strong>API Key:</strong> <code>test-api-key-integration</code></p>
        <p><strong>PHP Version:</strong> <?php echo phpversion(); ?></p>
    </div>

    <!-- 
      Simulate the embedding of the widget.
      In a real scenario, this would be injected by the WordPress plugin or added manually.
    -->
    <script>
        window.FITBOT_API_KEY = 'test-api-key-integration';
    </script>
    <script 
        src="/widget-dist/gymbot.min.js"
        async
    ></script>

</body>
</html>
